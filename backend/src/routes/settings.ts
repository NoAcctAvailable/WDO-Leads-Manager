import { Router, Response, NextFunction } from 'express';
import { body, query, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { authenticate, authorize } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { spawn } from 'child_process';
import path from 'path';

const prisma = new PrismaClient();

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Admin middleware
const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user!.role !== 'ADMIN') {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin access required' 
    });
  }
  next();
};

// Validation rules
const createInspectionTypeValidation = [
  body('name').notEmpty().trim().withMessage('Name is required'),
  body('displayName').notEmpty().trim().withMessage('Display name is required'),
  body('description').optional().trim(),
  body('active').optional().isBoolean(),
  body('sortOrder').optional().isInt({ min: 0 }),
];

const updateInspectionTypeValidation = [
  body('name').optional().trim(),
  body('displayName').optional().trim(),
  body('description').optional().trim(),
  body('active').optional().isBoolean(),
  body('sortOrder').optional().isInt({ min: 0 }),
];

// Get all inspection types (accessible to all authenticated users)
router.get('/inspection-types', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const inspectionTypes = await prisma.inspectionTypeConfig.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });

    res.json({
      success: true,
      data: { inspectionTypes },
    });
  } catch (error) {
    next(error);
  }
});

// Get all inspection types including inactive ones (admin only)
router.get('/inspection-types/all', requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const inspectionTypes = await prisma.inspectionTypeConfig.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    res.json({
      success: true,
      data: { inspectionTypes },
    });
  } catch (error) {
    next(error);
  }
});

// Get inspection type by ID (admin only)
router.get('/inspection-types/:id', requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const inspectionType = await prisma.inspectionTypeConfig.findUnique({
      where: { id },
    });

    if (!inspectionType) {
      throw createError('Inspection type not found', 404);
    }

    res.json({
      success: true,
      data: { inspectionType },
    });
  } catch (error) {
    next(error);
  }
});

// Create new inspection type (admin only)
router.post('/inspection-types', requireAdmin, createInspectionTypeValidation, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      name,
      displayName,
      description,
      active = true,
      sortOrder = 0,
    } = req.body;

    // Check if name already exists
    const existingType = await prisma.inspectionTypeConfig.findUnique({
      where: { name },
    });

    if (existingType) {
      throw createError('Inspection type with this name already exists', 400);
    }

    const inspectionType = await prisma.inspectionTypeConfig.create({
      data: {
        name,
        displayName,
        description,
        active,
        sortOrder,
      },
    });

    res.status(201).json({
      success: true,
      data: { inspectionType },
      message: 'Inspection type created successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Update inspection type (admin only)
router.put('/inspection-types/:id', requireAdmin, updateInspectionTypeValidation, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;

    // Check if inspection type exists
    const existingType = await prisma.inspectionTypeConfig.findUnique({
      where: { id },
    });

    if (!existingType) {
      throw createError('Inspection type not found', 404);
    }

    // Check if name is being changed and if it conflicts
    if (req.body.name && req.body.name !== existingType.name) {
      const conflictingType = await prisma.inspectionTypeConfig.findUnique({
        where: { name: req.body.name },
      });

      if (conflictingType) {
        throw createError('Inspection type with this name already exists', 400);
      }
    }

    const updateData: any = {};
    const allowedFields = ['name', 'displayName', 'description', 'active', 'sortOrder'];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const inspectionType = await prisma.inspectionTypeConfig.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      data: { inspectionType },
      message: 'Inspection type updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Delete inspection type (admin only)
router.delete('/inspection-types/:id', requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const inspectionType = await prisma.inspectionTypeConfig.findUnique({
      where: { id },
    });

    if (!inspectionType) {
      throw createError('Inspection type not found', 404);
    }

    // Check if this inspection type is currently in use
    const inspectionsUsingType = await prisma.inspection.count({
      where: { inspectionType: inspectionType.name as any },
    });

    if (inspectionsUsingType > 0) {
      throw createError('Cannot delete inspection type that is currently in use', 400);
    }

    await prisma.inspectionTypeConfig.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Inspection type deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Sample data management endpoints
router.post('/sample-data/add-all', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const scriptPath = path.join(process.cwd(), 'scripts', 'manage-sample-data.js');
    
    const result = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
      const child = spawn('node', [scriptPath, 'add-all'], {
        cwd: process.cwd(),
        stdio: ['inherit', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`Script failed with code ${code}: ${stderr}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });

    // Parse the output to extract counts
    const lines = result.stdout.split('\n');
    let propertiesAdded = 0;
    let inspectionsAdded = 0;
    let callsAdded = 0;

    lines.forEach(line => {
      if (line.includes('Added: ') && line.includes('properties')) {
        const match = line.match(/Added: (\d+) properties/);
        if (match) propertiesAdded = parseInt(match[1]);
      }
      if (line.includes('Added: ') && line.includes('inspections')) {
        const match = line.match(/Added: (\d+) inspections/);
        if (match) inspectionsAdded = parseInt(match[1]);
      }
      if (line.includes('Added: ') && line.includes('calls')) {
        const match = line.match(/Added: (\d+) calls/);
        if (match) callsAdded = parseInt(match[1]);
      }
    });

    res.json({
      success: true,
      message: `Successfully added ${propertiesAdded} properties, ${inspectionsAdded} inspections, and ${callsAdded} calls`,
      data: {
        propertiesAdded,
        inspectionsAdded,
        callsAdded,
        output: result.stdout
      }
    });
  } catch (error: any) {
    next(createError(`Failed to add sample data: ${error.message}`, 500));
  }
});

router.delete('/sample-data/remove-all', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const scriptPath = path.join(process.cwd(), 'scripts', 'manage-sample-data.js');
    
    const result = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
      const child = spawn('node', [scriptPath, 'remove-all'], {
        cwd: process.cwd(),
        stdio: ['inherit', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`Script failed with code ${code}: ${stderr}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });

    // Parse the output to extract counts
    const lines = result.stdout.split('\n');
    let propertiesRemoved = 0;
    let inspectionsRemoved = 0;
    let callsRemoved = 0;

    lines.forEach(line => {
      if (line.includes('Removed: ') && line.includes('properties')) {
        const match = line.match(/Removed: (\d+) properties/);
        if (match) propertiesRemoved = parseInt(match[1]);
      }
      if (line.includes('Removed: ') && line.includes('inspections')) {
        const match = line.match(/Removed: (\d+) inspections/);
        if (match) inspectionsRemoved = parseInt(match[1]);
      }
      if (line.includes('Removed: ') && line.includes('calls')) {
        const match = line.match(/Removed: (\d+) calls/);
        if (match) callsRemoved = parseInt(match[1]);
      }
    });

    res.json({
      success: true,
      message: `Successfully removed ${callsRemoved} calls, ${inspectionsRemoved} inspections, and ${propertiesRemoved} properties`,
      data: {
        propertiesRemoved,
        inspectionsRemoved,
        callsRemoved,
        output: result.stdout
      }
    });
  } catch (error: any) {
    next(createError(`Failed to remove sample data: ${error.message}`, 500));
  }
});

router.get('/sample-data/status', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const scriptPath = path.join(process.cwd(), 'scripts', 'manage-sample-data.js');
    
    const result = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
      const child = spawn('node', [scriptPath, 'status'], {
        cwd: process.cwd(),
        stdio: ['inherit', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`Script failed with code ${code}: ${stderr}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });

    res.json({
      success: true,
      data: {
        output: result.stdout
      }
    });
  } catch (error: any) {
    next(createError(`Failed to get sample data status: ${error.message}`, 500));
  }
});

export default router; 