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
  body('scheduledDate').isISO8601().withMessage('Valid scheduled date is required'),
  body('inspectionType').optional().isIn(['WDO', 'TERMITE', 'PEST', 'MOISTURE', 'STRUCTURAL', 'PREVENTIVE']),
  body('inspectorId').optional().isString(),
  body('leadId').optional().isString(),
];

const updateInspectionValidation = [
  body('scheduledDate').optional().isISO8601(),
  body('completedDate').optional().isISO8601(),
  body('status').optional().isIn(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED']),
  body('inspectionType').optional().isIn(['WDO', 'TERMITE', 'PEST', 'MOISTURE', 'STRUCTURAL', 'PREVENTIVE']),
  body('findings').optional().trim(),
  body('recommendations').optional().trim(),
  body('cost').optional().isFloat({ min: 0 }),
  body('inspectorId').optional().isString(),
];

// Get all inspections with filtering and pagination
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED']),
  query('inspectionType').optional().isIn(['WDO', 'TERMITE', 'PEST', 'MOISTURE', 'STRUCTURAL', 'PREVENTIVE']),
  query('inspectorId').optional().isString(),
  query('propertyId').optional().isString(),
  query('leadId').optional().isString(),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
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
    
    if (req.query.status) where.status = req.query.status;
    if (req.query.inspectionType) where.inspectionType = req.query.inspectionType;
    if (req.query.inspectorId) where.inspectorId = req.query.inspectorId;
    if (req.query.propertyId) where.propertyId = req.query.propertyId;
    if (req.query.leadId) where.leadId = req.query.leadId;
    
    // Date range filter
    if (req.query.dateFrom || req.query.dateTo) {
      where.scheduledDate = {};
      if (req.query.dateFrom) where.scheduledDate.gte = new Date(req.query.dateFrom as string);
      if (req.query.dateTo) where.scheduledDate.lte = new Date(req.query.dateTo as string);
    }

    // If user is inspector, only show their inspections
    if (req.user!.role === 'INSPECTOR') {
      where.inspectorId = req.user!.id;
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
          lead: {
            select: {
              id: true,
              contactName: true,
              contactEmail: true,
              status: true,
              priority: true,
            },
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
        lead: {
          select: {
            id: true,
            contactName: true,
            contactEmail: true,
            contactPhone: true,
            status: true,
            priority: true,
            notes: true,
          },
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
      inspectionType = 'WDO',
      inspectorId,
      leadId,
    } = req.body;

    // Verify property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw createError('Property not found', 404);
    }

    // Verify lead exists if provided
    if (leadId) {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
      });

      if (!lead) {
        throw createError('Lead not found', 404);
      }

      if (lead.propertyId !== propertyId) {
        throw createError('Lead does not belong to the specified property', 400);
      }
    }

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
        leadId,
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
        lead: {
          select: {
            id: true,
            contactName: true,
            contactEmail: true,
            status: true,
          },
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

    // Auto-set completed date when status changes to COMPLETED
    if (req.body.status === 'COMPLETED' && !req.body.completedDate) {
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
        lead: {
          select: {
            id: true,
            contactName: true,
            contactEmail: true,
            status: true,
          },
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
      scheduledInspections,
      completedInspections,
      inProgressInspections,
      inspectionsByType,
      inspectionsByStatus,
      upcomingInspections,
      revenueThisMonth,
    ] = await Promise.all([
      prisma.inspection.count(),
      prisma.inspection.count({ where: { status: 'SCHEDULED' } }),
      prisma.inspection.count({ where: { status: 'COMPLETED' } }),
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
          status: 'SCHEDULED',
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
          scheduledInspections,
          completedInspections,
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