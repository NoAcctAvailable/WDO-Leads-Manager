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
const createLeadValidation = [
  body('propertyId').notEmpty().withMessage('Property ID is required'),
  body('contactName').notEmpty().trim().withMessage('Contact name is required'),
  body('contactEmail').optional().isEmail().normalizeEmail(),
  body('contactPhone').optional().trim(),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  body('status').optional().isIn(['NEW', 'CONTACTED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'LOST', 'CANCELLED']),
  body('source').optional().trim(),
  body('notes').optional().trim(),
  body('followUpDate').optional().isISO8601(),
  body('estimatedValue').optional().isFloat({ min: 0 }),
];

// Get all leads
router.get('/', async (req: any, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (req.query.status) where.status = req.query.status;
    if (req.query.priority) where.priority = req.query.priority;
    if (req.query.assignedToId) where.assignedToId = req.query.assignedToId;
    
    if (req.query.search) {
      const search = req.query.search as string;
      where.OR = [
        { contactName: { contains: search, mode: 'insensitive' } },
        { contactEmail: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    // If user is not admin/manager, only show their assigned leads
    if (!['ADMIN', 'MANAGER'].includes(req.user.role)) {
      where.assignedToId = req.user.id;
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
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
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      prisma.lead.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        leads,
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

// Create new lead
router.post('/', createLeadValidation, async (req: any, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      propertyId,
      contactName,
      contactEmail,
      contactPhone,
      priority = 'MEDIUM',
      status = 'NEW',
      source,
      notes,
      followUpDate,
      estimatedValue,
      assignedToId,
    } = req.body;

    const lead = await prisma.lead.create({
      data: {
        propertyId,
        contactName,
        contactEmail,
        contactPhone,
        priority,
        status,
        source,
        notes,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        estimatedValue,
        createdById: req.user.id,
        assignedToId: assignedToId || req.user.id,
      },
      include: {
        property: true,
        createdBy: true,
        assignedTo: true,
      },
    });

    res.status(201).json({
      success: true,
      data: { lead },
      message: 'Lead created successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Get lead statistics
router.get('/stats/overview', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [
      totalLeads,
      leadsByStatus,
      leadsByPriority,
      leadsWithInspections,
      recentLeads,
      totalEstimatedValue,
    ] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.lead.groupBy({
        by: ['priority'],
        _count: { priority: true },
      }),
      prisma.lead.count({
        where: {
          inspections: {
            some: {},
          },
        },
      }),
      prisma.lead.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          property: {
            select: { address: true, city: true },
          },
          assignedTo: {
            select: { firstName: true, lastName: true },
          },
        },
      }),
      prisma.lead.aggregate({
        _sum: { estimatedValue: true },
        where: { estimatedValue: { not: null } },
      }),
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalLeads,
          leadsWithInspections,
          totalEstimatedValue: totalEstimatedValue._sum.estimatedValue || 0,
        },
        statusDistribution: leadsByStatus,
        priorityDistribution: leadsByPriority,
        recentLeads,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router; 