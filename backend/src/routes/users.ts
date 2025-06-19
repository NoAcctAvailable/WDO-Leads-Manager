import { Router, Response, NextFunction } from 'express';
import { body, query, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { createError } from '../middleware/errorHandler';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Apply authentication to all routes
router.use(authenticate);

// Create new user (Admin only)
router.post('/', authorize('ADMIN'), [
  body('email').isEmail().normalizeEmail(),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('role').isIn(['ADMIN', 'MANAGER', 'INSPECTOR', 'USER']),
  body('employeeId').optional().trim(),
  body('generatePassword').optional().isBoolean(),
], async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password, firstName, lastName, role, employeeId, generatePassword = false } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw createError('User already exists with this email', 400);
    }

    // Check if employeeId already exists (if provided)
    if (employeeId) {
      const existingEmployeeId = await prisma.user.findUnique({ where: { employeeId } });
      if (existingEmployeeId) {
        throw createError('Employee ID already exists', 400);
      }
    }

    // Generate temporary password if requested, otherwise use provided password
    let finalPassword = password;
    let isTemporaryPassword = false;
    
    if (generatePassword || !password) {
      // Generate secure temporary password
      const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
      finalPassword = Array.from({length: 12}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      isTemporaryPassword = true;
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(finalPassword, saltRounds);

    // Create user (admin can set any role)
    const userData: any = {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
    };

    if (employeeId) {
      userData.employeeId = employeeId;
    }

    const user = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        employeeId: true,
        active: true,
        createdAt: true,
      },
    });

    const responseData: any = { user };
    
    // Include temporary password in response for admin to share with user
    if (isTemporaryPassword) {
      responseData.temporaryPassword = finalPassword;
      responseData.message = `User created successfully. Temporary password: ${finalPassword}`;
      responseData.instructions = 'Please securely share this temporary password with the user. They will be required to change it on first login.';
    }

    res.status(201).json({
      success: true,
      data: responseData,
      message: isTemporaryPassword ? 'User created with temporary password' : 'User created successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Get all users (Admin/Manager only)
router.get('/', authorize('ADMIN', 'MANAGER'), [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('role').optional().isIn(['ADMIN', 'MANAGER', 'INSPECTOR', 'USER']),
  query('active').optional().isBoolean(),
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

    const where: any = {};
    
    if (req.query.role) where.role = req.query.role;
    if (req.query.active !== undefined) where.active = req.query.active === 'true';
    
    if (req.query.search) {
      const search = req.query.search as string;
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          active: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              calls: true,
              inspections: true,
              createdProperties: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        users,
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

// Get user by employee ID (for looking up inspector UUID from employee number)
router.get('/by-employee/:employeeId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { employeeId } = req.params;

    const user = await prisma.user.findUnique({
      where: { employeeId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        employeeId: true,
        active: true,
      },
    });

    if (!user) {
      throw createError('User not found with employee ID: ' + employeeId, 404);
    }

    if (!user.active) {
      throw createError('User account is inactive', 400);
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
});

// Get user by ID (Admin/Manager only)
router.get('/:id', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            calls: true,
            inspections: true,
            createdProperties: true,
          },
        },
      },
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
});

// Update user role/status (Admin only)
router.put('/:id', authorize('ADMIN'), [
  body('role').optional().isIn(['ADMIN', 'MANAGER', 'INSPECTOR', 'USER']),
  body('active').optional().isBoolean(),
], async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { role, active } = req.body;

    // Prevent users from deactivating themselves
    if (id === req.user!.id && active === false) {
      throw createError('Cannot deactivate your own account', 400);
    }

    const updateData: any = {};
    if (role !== undefined) updateData.role = role;
    if (active !== undefined) updateData.active = active;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        active: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: { user },
      message: 'User updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Delete user (Admin only)
router.delete('/:id', authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Prevent users from deleting themselves
    if (id === req.user!.id) {
      throw createError('Cannot delete your own account', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            calls: true,
            inspections: true,
            createdProperties: true,
          },
        },
      },
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    // Check if user has associated data
    const hasData = user._count.calls > 0 ||
                   user._count.inspections > 0 ||
                   user._count.createdProperties > 0;

    if (hasData) {
      // Instead of deleting, deactivate the user
      await prisma.user.update({
        where: { id },
        data: { active: false },
      });

      res.json({
        success: true,
        message: 'User deactivated successfully (user has associated data)',
      });
    } else {
      // Safe to delete
      await prisma.user.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    }
  } catch (error) {
    next(error);
  }
});

// Get users for assignment (returns active inspectors/managers/admins)
router.get('/assignable/list', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        active: true,
        role: {
          in: ['ADMIN', 'MANAGER', 'INSPECTOR'],
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
      orderBy: [
        { role: 'asc' },
        { firstName: 'asc' },
      ],
    });

    res.json({
      success: true,
      data: { users },
    });
  } catch (error) {
    next(error);
  }
});

export default router; 