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
const createContactValidation = [
  body('propertyId').notEmpty().withMessage('Property ID is required'),
  body('name').notEmpty().trim().withMessage('Contact name is required'),
  body('phone').optional().trim(),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('role').optional().trim(),
  body('isPrimary').optional().isBoolean(),
  body('notes').optional().trim(),
];

const updateContactValidation = [
  body('name').optional().notEmpty().trim(),
  body('phone').optional().trim(),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('role').optional().trim(),
  body('isPrimary').optional().isBoolean(),
  body('notes').optional().trim(),
];

// Get all contacts for a property
router.get('/property/:propertyId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { propertyId } = req.params;

    // Check if property exists and user has access
    const whereCondition: any = { id: propertyId };
    
    // Role-based access: Inspectors can only access properties with their inspections
    if (req.user!.role === 'INSPECTOR') {
      whereCondition.inspections = {
        some: {
          inspectorId: req.user!.id,
        },
      };
    }

    const property = await prisma.property.findFirst({
      where: whereCondition,
    });

    if (!property) {
      throw createError('Property not found or access denied', 404);
    }

    const contacts = await prisma.contact.findMany({
      where: { propertyId },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'desc' }
      ],
    });

    res.json({
      success: true,
      data: { contacts },
    });
  } catch (error) {
    next(error);
  }
});

// Get contact by ID
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const contact = await prisma.contact.findUnique({
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
      },
    });

    if (!contact) {
      throw createError('Contact not found', 404);
    }

    // Check permissions - inspectors can only view contacts for properties with their inspections
    if (req.user!.role === 'INSPECTOR') {
      const hasAccess = await prisma.property.findFirst({
        where: {
          id: contact.propertyId,
          inspections: {
            some: {
              inspectorId: req.user!.id,
            },
          },
        },
      });

      if (!hasAccess) {
        throw createError('Access denied', 403);
      }
    }

    res.json({
      success: true,
      data: { contact },
    });
  } catch (error) {
    next(error);
  }
});

// Create new contact
router.post('/', createContactValidation, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      propertyId,
      name,
      phone,
      email,
      role,
      isPrimary = false,
      notes,
    } = req.body;

    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw createError('Property not found', 404);
    }

    // If this is set as primary, unset other primary contacts
    if (isPrimary) {
      await prisma.contact.updateMany({
        where: { propertyId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const contact = await prisma.contact.create({
      data: {
        propertyId,
        name,
        phone,
        email,
        role,
        isPrimary,
        notes,
      },
    });

    res.status(201).json({
      success: true,
      data: { contact },
      message: 'Contact created successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Update contact
router.put('/:id', updateContactValidation, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;

    // Check if contact exists
    const existingContact = await prisma.contact.findUnique({
      where: { id },
    });

    if (!existingContact) {
      throw createError('Contact not found', 404);
    }

    const updateData: any = {};
    const allowedFields = ['name', 'phone', 'email', 'role', 'isPrimary', 'notes'];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // If this is set as primary, unset other primary contacts for the same property
    if (updateData.isPrimary === true) {
      await prisma.contact.updateMany({
        where: { 
          propertyId: existingContact.propertyId, 
          isPrimary: true,
          id: { not: id }
        },
        data: { isPrimary: false },
      });
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      data: { contact },
      message: 'Contact updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Delete contact
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const contact = await prisma.contact.findUnique({
      where: { id },
    });

    if (!contact) {
      throw createError('Contact not found', 404);
    }

    await prisma.contact.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Contact deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router; 