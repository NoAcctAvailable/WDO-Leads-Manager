import { Router, Response, NextFunction } from 'express';
import { body, query, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { createError } from '../middleware/errorHandler';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Apply authentication to all routes
router.use(authenticate);

// Validation rules
const createInspectionValidation = [
  body('propertyId').notEmpty().withMessage('Property ID is required'),
  body('scheduledDate').notEmpty().isISO8601().toDate().withMessage('Valid scheduled date is required'),
  body('inspectionType').optional().isIn(['FULL_INSPECTION', 'LIMITED_INSPECTION', 'RE_INSPECTION', 'EXCLUSION']),
  body('status').optional().isIn(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED']),
  body('completedDate').optional().isISO8601().toDate(),
  body('findings').optional().trim(),
  body('recommendations').optional().trim(),
  body('cost').optional().isFloat({ min: 0 }),
  body('reportPath').optional().trim(),
  body('photos').optional().isArray(),
];

const updateInspectionValidation = [
  body('scheduledDate').optional().isISO8601(),
  body('completedDate').optional().isISO8601(),
  body('status').optional().isIn(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED']),
  body('inspectionType').optional().isIn(['FULL_INSPECTION', 'LIMITED_INSPECTION', 'RE_INSPECTION', 'EXCLUSION']),
  body('findings').optional().trim(),
  body('recommendations').optional().trim(),
  body('cost').optional().isFloat({ min: 0 }),
  body('inspectorId').optional().isString(),
];

// Get all inspections with filtering and pagination
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('propertyId').optional().isString(),
  query('inspectorId').optional().isString(),
  query('status').optional().isIn(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED']),
  query('inspectionType').optional().isIn(['FULL_INSPECTION', 'LIMITED_INSPECTION', 'RE_INSPECTION', 'EXCLUSION']),
  query('scheduledAfter').optional().isISO8601().toDate(),
  query('scheduledBefore').optional().isISO8601().toDate(),
  query('completedAfter').optional().isISO8601().toDate(),
  query('completedBefore').optional().isISO8601().toDate(),
], async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: any = {};
    
    // Role-based filtering: Inspectors can only see their own inspections
    if (req.user!.role === 'INSPECTOR') {
      where.inspectorId = req.user!.id;
    }
    
    if (req.query.propertyId) where.propertyId = req.query.propertyId;
    if (req.query.inspectorId) where.inspectorId = req.query.inspectorId;
    if (req.query.status) where.status = req.query.status;
    if (req.query.inspectionType) where.inspectionType = req.query.inspectionType;
    
    if (req.query.scheduledAfter || req.query.scheduledBefore) {
      where.scheduledDate = {};
      if (req.query.scheduledAfter) where.scheduledDate.gte = new Date(req.query.scheduledAfter as string);
      if (req.query.scheduledBefore) where.scheduledDate.lte = new Date(req.query.scheduledBefore as string);
    }
    
    if (req.query.completedAfter || req.query.completedBefore) {
      where.completedDate = {};
      if (req.query.completedAfter) where.completedDate.gte = new Date(req.query.completedAfter as string);
      if (req.query.completedBefore) where.completedDate.lte = new Date(req.query.completedBefore as string);
    }

    const [inspections, total] = await Promise.all([
      prisma.inspection.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledDate: 'desc' },
        include: {
          property: {
            select: {
              id: true,
              address: true,
              city: true,
              state: true,
              zipCode: true,
            },
          },
          inspector: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          calls: {
            where: req.user!.role === 'INSPECTOR' ? { madeById: req.user!.id } : undefined,
            select: {
              id: true,
              callType: true,
              purpose: true,
              contactName: true,
              outcome: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      prisma.inspection.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        inspections,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get inspection by ID
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const inspection = await prisma.inspection.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            address: true,
            city: true,
            state: true,
            zipCode: true,
            propertyType: true,
            description: true,
          },
        },
        inspector: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        calls: {
          where: req.user!.role === 'INSPECTOR' ? { madeById: req.user!.id } : undefined,
          select: {
            id: true,
            callType: true,
            purpose: true,
            contactName: true,
            outcome: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!inspection) {
      throw createError('Inspection not found', 404);
    }

    // Check permissions - inspectors can only view their own inspections
    if (req.user!.role === 'INSPECTOR' && inspection.inspectorId !== req.user!.id) {
      throw createError('Access denied', 403);
    }

    res.json({
      success: true,
      data: { inspection },
    });
  } catch (error) {
    next(error);
  }
});

// Create new inspection
router.post('/', createInspectionValidation, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      propertyId,
      scheduledDate,
      inspectionType = 'FULL_INSPECTION',
      inspectorId,
    } = req.body;

    // Verify property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw createError('Property not found', 404);
    }

    // Property verification is sufficient for inspections

    // Determine inspector
    let finalInspectorId = inspectorId;
    
    if (!finalInspectorId) {
      // If no inspector specified, assign to current user if they're an inspector
      if (req.user!.role === 'INSPECTOR') {
        finalInspectorId = req.user!.id;
      } else {
        throw createError('Inspector ID is required', 400);
      }
    }

    // Verify inspector exists and has appropriate role
    const inspector = await prisma.user.findUnique({
      where: { id: finalInspectorId },
    });

    if (!inspector || !inspector.active) {
      throw createError('Inspector not found or inactive', 404);
    }

    if (!['ADMIN', 'MANAGER', 'INSPECTOR'].includes(inspector.role)) {
      throw createError('Assigned user must be an admin, manager, or inspector', 400);
    }

    const inspection = await prisma.inspection.create({
      data: {
        propertyId,
        scheduledDate: new Date(scheduledDate),
        inspectionType,
        inspectorId: finalInspectorId,
      },
      include: {
        property: {
          select: {
            id: true,
            address: true,
            city: true,
            state: true,
            zipCode: true,
            propertyType: true,
          },
        },
        inspector: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        calls: {
          select: {
            id: true,
            callType: true,
            purpose: true,
            contactName: true,
            outcome: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    res.status(201).json({
      success: true,
      data: { inspection },
      message: 'Inspection created successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Update inspection
router.put('/:id', updateInspectionValidation, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;

    // Get current inspection to check permissions
    const existingInspection = await prisma.inspection.findUnique({
      where: { id },
    });

    if (!existingInspection) {
      throw createError('Inspection not found', 404);
    }

    // Check permissions
    if (req.user!.role === 'INSPECTOR' && existingInspection.inspectorId !== req.user!.id) {
      throw createError('Access denied', 403);
    }

    const updateData: any = {};
    
    // Build update data
    const allowedFields = [
      'scheduledDate', 'completedDate', 'status', 'inspectionType', 
      'findings', 'recommendations', 'cost'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'scheduledDate' || field === 'completedDate') {
          updateData[field] = new Date(req.body[field]);
        } else {
          updateData[field] = req.body[field];
        }
      }
    });

    // Only admins and managers can change inspector assignment
    if (req.body.inspectorId && ['ADMIN', 'MANAGER'].includes(req.user!.role)) {
      // Verify the inspector exists and has appropriate role
      const inspector = await prisma.user.findUnique({
        where: { id: req.body.inspectorId },
      });

      if (!inspector || !inspector.active) {
        throw createError('Inspector not found or inactive', 404);
      }

      if (!['ADMIN', 'MANAGER', 'INSPECTOR'].includes(inspector.role)) {
        throw createError('Assigned user must be an admin, manager, or inspector', 400);
      }

      updateData.inspectorId = req.body.inspectorId;
    }

    // Auto-set completed date when status changes to SOLD
    if (req.body.status === 'SOLD' && !req.body.completedDate) {
      updateData.completedDate = new Date();
    }

    const inspection = await prisma.inspection.update({
      where: { id },
      data: updateData,
      include: {
        property: {
          select: {
            id: true,
            address: true,
            city: true,
            state: true,
            zipCode: true,
            propertyType: true,
          },
        },
        inspector: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        calls: {
          select: {
            id: true,
            callType: true,
            purpose: true,
            contactName: true,
            outcome: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    res.json({
      success: true,
      data: { inspection },
      message: 'Inspection updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Delete inspection
router.delete('/:id', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const inspection = await prisma.inspection.findUnique({
      where: { id },
    });

    if (!inspection) {
      throw createError('Inspection not found', 404);
    }

    await prisma.inspection.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Inspection deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Get inspection statistics
router.get('/stats/overview', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [
      totalInspections,
      uncontactedInspections,
      soldInspections,
      inProgressInspections,
      inspectionsByType,
      inspectionsByStatus,
      upcomingInspections,
      revenueThisMonth,
    ] = await Promise.all([
      prisma.inspection.count(),
      prisma.inspection.count({ where: { status: 'UNCONTACTED' } }),
      prisma.inspection.count({ where: { status: 'SOLD' } }),
      prisma.inspection.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.inspection.groupBy({
        by: ['inspectionType'],
        _count: { inspectionType: true },
      }),
      prisma.inspection.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.inspection.findMany({
        where: {
          scheduledDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
          },
          status: 'UNCONTACTED',
        },
        take: 10,
        orderBy: { scheduledDate: 'asc' },
        include: {
          property: {
            select: { address: true, city: true },
          },
          inspector: {
            select: { firstName: true, lastName: true },
          },
        },
      }),
      prisma.inspection.aggregate({
        where: {
          completedDate: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
          cost: { not: null },
        },
        _sum: { cost: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalInspections,
          uncontactedInspections,
          soldInspections,
          inProgressInspections,
          revenueThisMonth: revenueThisMonth._sum.cost || 0,
        },
        typeDistribution: inspectionsByType,
        statusDistribution: inspectionsByStatus,
        upcomingInspections,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router; 