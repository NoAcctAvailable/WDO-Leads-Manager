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
const createPropertyValidation = [
  body('address').notEmpty().trim().withMessage('Address is required'),
  body('city').notEmpty().trim().withMessage('City is required'),
  body('state').notEmpty().trim().withMessage('State is required'),
  body('zipCode').notEmpty().trim().withMessage('ZIP code is required'),
  body('propertyType').optional().isIn(['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'MIXED_USE']),
  body('description').optional().trim(),
  body('notes').optional().trim(),
];

const updatePropertyValidation = [
  body('address').optional().notEmpty().trim(),
  body('city').optional().notEmpty().trim(),
  body('state').optional().notEmpty().trim(),
  body('zipCode').optional().notEmpty().trim(),
  body('propertyType').optional().isIn(['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'MIXED_USE']),
  body('description').optional().trim(),
  body('notes').optional().trim(),
];

// Get all properties with filtering and pagination
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('propertyType').optional().isIn(['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'MIXED_USE']),
  query('search').optional().trim(),
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
    
    if (req.query.propertyType) {
      where.propertyType = req.query.propertyType;
    }
    
    if (req.query.search) {
      const search = req.query.search as string;
      where.OR = [
        { address: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { state: { contains: search, mode: 'insensitive' } },
        { zipCode: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              leads: true,
              inspections: true,
            },
          },
        },
      }),
      prisma.property.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        properties,
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

// Get property by ID
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        leads: {
          select: {
            id: true,
            contactName: true,
            contactEmail: true,
            contactPhone: true,
            status: true,
            priority: true,
            createdAt: true,
            assignedTo: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        inspections: {
          select: {
            id: true,
            scheduledDate: true,
            completedDate: true,
            status: true,
            inspectionType: true,
            cost: true,
            inspector: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { scheduledDate: 'desc' },
        },
        calls: {
          select: {
            id: true,
            callType: true,
            purpose: true,
            contactName: true,
            contactPhone: true,
            duration: true,
            notes: true,
            outcome: true,
            followUpDate: true,
            reminderDate: true,
            completed: true,
            createdAt: true,
            madeBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!property) {
      throw createError('Property not found', 404);
    }

    res.json({
      success: true,
      data: { property },
    });
  } catch (error) {
    next(error);
  }
});

// Create new property
router.post('/', createPropertyValidation, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      address,
      city,
      state,
      zipCode,
      propertyType = 'RESIDENTIAL',
      description,
      notes,
    } = req.body;

    const property = await prisma.property.create({
      data: {
        address,
        city,
        state,
        zipCode,
        propertyType,
        description,
        notes,
        createdById: req.user!.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: { property },
      message: 'Property created successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Update property
router.put('/:id', updatePropertyValidation, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;

    // Check if property exists
    const existingProperty = await prisma.property.findUnique({
      where: { id },
    });

    if (!existingProperty) {
      throw createError('Property not found', 404);
    }

    // Check permissions (only creator, admin, or manager can update)
    if (!['ADMIN', 'MANAGER'].includes(req.user!.role) && 
        existingProperty.createdById !== req.user!.id) {
      throw createError('Access denied', 403);
    }

    const updateData: any = {};
    const allowedFields = [
      'address', 'city', 'state', 'zipCode', 'propertyType', 'description', 'notes'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const property = await prisma.property.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: { property },
      message: 'Property updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Delete property
router.delete('/:id', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            leads: true,
            inspections: true,
          },
        },
      },
    });

    if (!property) {
      throw createError('Property not found', 404);
    }

    // Check if property has associated leads or inspections
    if (property._count.leads > 0 || property._count.inspections > 0) {
      throw createError('Cannot delete property with associated leads or inspections', 400);
    }

    await prisma.property.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Property deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Get property statistics
router.get('/stats/overview', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [
      totalProperties,
      propertiesByType,
      propertiesWithLeads,
      propertiesWithInspections,
      recentProperties,
    ] = await Promise.all([
      prisma.property.count(),
      prisma.property.groupBy({
        by: ['propertyType'],
        _count: { propertyType: true },
      }),
      prisma.property.count({
        where: {
          leads: {
            some: {},
          },
        },
      }),
      prisma.property.count({
        where: {
          inspections: {
            some: {},
          },
        },
      }),
      prisma.property.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: { firstName: true, lastName: true },
          },
          _count: {
            select: {
              leads: true,
              inspections: true,
            },
          },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalProperties,
          propertiesWithLeads,
          propertiesWithInspections,
        },
        typeDistribution: propertiesByType,
        recentProperties,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router; 