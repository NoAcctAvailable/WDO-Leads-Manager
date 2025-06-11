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
const createCallValidation = [
  body('propertyId').notEmpty().withMessage('Property ID is required'),
  body('inspectionId').optional().isString(),
  body('leadId').optional().isString(),
  body('callType').optional().isIn(['INBOUND', 'OUTBOUND']),
  body('purpose').optional().isIn([
    'INITIAL_CONTACT', 'FOLLOW_UP', 'SCHEDULING', 'CONFIRMATION', 'RESCHEDULING',
    'REPORT_DELIVERY', 'PAYMENT', 'COMPLAINT', 'GENERAL_INQUIRY', 'REMINDER'
  ]),
  body('contactName').notEmpty().trim().withMessage('Contact name is required'),
  body('contactPhone').optional().trim(),
  body('duration').optional().isInt({ min: 0 }),
  body('notes').optional().trim(),
  body('outcome').optional().isIn([
    'ANSWERED', 'NO_ANSWER', 'VOICEMAIL', 'BUSY', 'WRONG_NUMBER',
    'SCHEDULED', 'COMPLETED', 'DECLINED', 'CALLBACK_REQUESTED'
  ]),
  body('followUpDate').optional().isISO8601().toDate(),
  body('reminderDate').optional().isISO8601().toDate(),
  body('completed').optional().isBoolean(),
];

const updateCallValidation = [
  body('callType').optional().isIn(['INBOUND', 'OUTBOUND']),
  body('purpose').optional().isIn([
    'INITIAL_CONTACT', 'FOLLOW_UP', 'SCHEDULING', 'CONFIRMATION', 'RESCHEDULING',
    'REPORT_DELIVERY', 'PAYMENT', 'COMPLAINT', 'GENERAL_INQUIRY', 'REMINDER'
  ]),
  body('contactName').optional().notEmpty().trim(),
  body('contactPhone').optional().trim(),
  body('duration').optional().isInt({ min: 0 }),
  body('notes').optional().trim(),
  body('outcome').optional().isIn([
    'ANSWERED', 'NO_ANSWER', 'VOICEMAIL', 'BUSY', 'WRONG_NUMBER',
    'SCHEDULED', 'COMPLETED', 'DECLINED', 'CALLBACK_REQUESTED'
  ]),
  body('followUpDate').optional().isISO8601().toDate(),
  body('reminderDate').optional().isISO8601().toDate(),
  body('completed').optional().isBoolean(),
];

// Get all calls with filtering and pagination
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('propertyId').optional().isString(),
  query('inspectionId').optional().isString(),
  query('leadId').optional().isString(),
  query('callType').optional().isIn(['INBOUND', 'OUTBOUND']),
  query('purpose').optional().isString(),
  query('outcome').optional().isString(),
  query('completed').optional().isBoolean(),
  query('hasReminder').optional().isBoolean(),
  query('overdue').optional().isBoolean(),
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
    
    if (req.query.propertyId) where.propertyId = req.query.propertyId;
    if (req.query.inspectionId) where.inspectionId = req.query.inspectionId;
    if (req.query.leadId) where.leadId = req.query.leadId;
    if (req.query.callType) where.callType = req.query.callType;
    if (req.query.purpose) where.purpose = req.query.purpose;
    if (req.query.outcome) where.outcome = req.query.outcome;
    if (req.query.completed !== undefined) where.completed = req.query.completed === 'true';
    
    if (req.query.hasReminder === 'true') {
      where.reminderDate = { not: null };
    }
    
    if (req.query.overdue === 'true') {
      where.reminderDate = { lte: new Date() };
      where.completed = false;
    }

    const [calls, total] = await Promise.all([
      prisma.call.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
          inspection: {
            select: {
              id: true,
              scheduledDate: true,
              inspectionType: true,
              status: true,
            },
          },
          lead: {
            select: {
              id: true,
              contactName: true,
              contactEmail: true,
              contactPhone: true,
              status: true,
            },
          },
          madeBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      prisma.call.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        calls,
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

// Get call by ID
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const call = await prisma.call.findUnique({
      where: { id },
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
        inspection: {
          select: {
            id: true,
            scheduledDate: true,
            inspectionType: true,
            status: true,
          },
        },
        lead: {
          select: {
            id: true,
            contactName: true,
            contactEmail: true,
            contactPhone: true,
            status: true,
          },
        },
        madeBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!call) {
      throw createError('Call not found', 404);
    }

    res.json({
      success: true,
      data: { call },
    });
  } catch (error) {
    next(error);
  }
});

// Create new call
router.post('/', createCallValidation, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      propertyId,
      inspectionId,
      leadId,
      callType = 'OUTBOUND',
      purpose = 'FOLLOW_UP',
      contactName,
      contactPhone,
      duration,
      notes,
      outcome = 'NO_ANSWER',
      followUpDate,
      reminderDate,
      completed = true,
    } = req.body;

    const call = await prisma.call.create({
      data: {
        propertyId,
        inspectionId,
        leadId,
        madeById: req.user!.id,
        callType,
        purpose,
        contactName,
        contactPhone,
        duration,
        notes,
        outcome,
        followUpDate,
        reminderDate,
        completed,
      },
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
        inspection: {
          select: {
            id: true,
            scheduledDate: true,
            inspectionType: true,
            status: true,
          },
        },
        lead: {
          select: {
            id: true,
            contactName: true,
            contactEmail: true,
            contactPhone: true,
            status: true,
          },
        },
        madeBy: {
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
      data: { call },
      message: 'Call logged successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Update call
router.put('/:id', updateCallValidation, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;

    // Check if call exists
    const existingCall = await prisma.call.findUnique({
      where: { id },
    });

    if (!existingCall) {
      throw createError('Call not found', 404);
    }

    // Check permissions (only creator, admin, or manager can update)
    if (!['ADMIN', 'MANAGER'].includes(req.user!.role) && 
        existingCall.madeById !== req.user!.id) {
      throw createError('Access denied', 403);
    }

    const updateData: any = {};
    const allowedFields = [
      'callType', 'purpose', 'contactName', 'contactPhone', 'duration',
      'notes', 'outcome', 'followUpDate', 'reminderDate', 'completed'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const call = await prisma.call.update({
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
          },
        },
        inspection: {
          select: {
            id: true,
            scheduledDate: true,
            inspectionType: true,
            status: true,
          },
        },
        lead: {
          select: {
            id: true,
            contactName: true,
            contactEmail: true,
            contactPhone: true,
            status: true,
          },
        },
        madeBy: {
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
      data: { call },
      message: 'Call updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Delete call
router.delete('/:id', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const call = await prisma.call.findUnique({
      where: { id },
    });

    if (!call) {
      throw createError('Call not found', 404);
    }

    await prisma.call.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Call deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Get upcoming reminders
router.get('/reminders/upcoming', [
  query('days').optional().isInt({ min: 1, max: 30 }),
], async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const calls = await prisma.call.findMany({
      where: {
        reminderDate: {
          lte: endDate,
          gte: new Date(),
        },
        completed: false,
      },
      orderBy: { reminderDate: 'asc' },
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
        inspection: {
          select: {
            id: true,
            scheduledDate: true,
            inspectionType: true,
            status: true,
          },
        },
        lead: {
          select: {
            id: true,
            contactName: true,
            contactEmail: true,
            contactPhone: true,
            status: true,
          },
        },
        madeBy: {
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
      data: { calls },
    });
  } catch (error) {
    next(error);
  }
});

// Get overdue reminders
router.get('/reminders/overdue', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const calls = await prisma.call.findMany({
      where: {
        reminderDate: {
          lt: new Date(),
        },
        completed: false,
      },
      orderBy: { reminderDate: 'asc' },
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
        inspection: {
          select: {
            id: true,
            scheduledDate: true,
            inspectionType: true,
            status: true,
          },
        },
        lead: {
          select: {
            id: true,
            contactName: true,
            contactEmail: true,
            contactPhone: true,
            status: true,
          },
        },
        madeBy: {
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
      data: { calls },
    });
  } catch (error) {
    next(error);
  }
});

// Get call statistics
router.get('/stats/overview', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [
      totalCalls,
      callsByOutcome,
      callsByPurpose,
      upcomingReminders,
      overdueReminders,
      recentCalls,
    ] = await Promise.all([
      prisma.call.count(),
      prisma.call.groupBy({
        by: ['outcome'],
        _count: { outcome: true },
      }),
      prisma.call.groupBy({
        by: ['purpose'],
        _count: { purpose: true },
      }),
      prisma.call.count({
        where: {
          reminderDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
          },
          completed: false,
        },
      }),
      prisma.call.count({
        where: {
          reminderDate: {
            lt: new Date(),
          },
          completed: false,
        },
      }),
      prisma.call.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          property: {
            select: {
              address: true,
              city: true,
              state: true,
            },
          },
          madeBy: {
            select: { firstName: true, lastName: true },
          },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalCalls,
          upcomingReminders,
          overdueReminders,
        },
        outcomeDistribution: callsByOutcome,
        purposeDistribution: callsByPurpose,
        recentCalls,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router; 