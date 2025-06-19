import { Router, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authorize, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

interface RecentActivity {
  type: string;
  message: string;
  date: Date;
}

// Get dashboard overview statistics
router.get('/overview', authorize('ADMIN', 'MANAGER', 'INSPECTOR', 'USER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [
      totalLeads,
      totalProperties,
      totalInspections,
      completedInspections,
      recentActivity,
    ] = await Promise.all([
      // Total leads
      prisma.lead.count(),
      
      // Total properties
      prisma.property.count(),
      
      // Total inspections
      prisma.inspection.count(),
      
      // Completed inspections
      prisma.inspection.count({
        where: { status: 'COMPLETED' }
      }),
      
      // Recent activity (last 5 items)
      Promise.all([
        prisma.lead.findMany({
          take: 2,
          orderBy: { createdAt: 'desc' },
          include: {
            property: {
              select: { address: true }
            }
          }
        }),
        prisma.inspection.findMany({
          take: 2,
          orderBy: { completedDate: 'desc' },
          where: { status: 'COMPLETED' },
          include: {
            property: {
              select: { address: true }
            }
          }
        }),
        prisma.property.findMany({
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { address: true, createdAt: true }
        })
      ])
    ]);

    // Format recent activity
    const [recentLeads, recentInspections, recentProperties] = recentActivity;
    const formattedActivity: RecentActivity[] = [
      ...recentLeads.map((lead: any) => ({
        type: 'lead',
        message: `New lead added for ${lead.property.address}`,
        date: lead.createdAt
      })),
      ...recentInspections.map((inspection: any) => ({
        type: 'inspection',
        message: `Inspection completed at ${inspection.property.address}`,
        date: inspection.completedDate
      })),
      ...recentProperties.map((property: any) => ({
        type: 'property',
        message: `Property registered: ${property.address}`,
        date: property.createdAt
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);

    res.json({
      success: true,
      data: {
        overview: {
          totalLeads,
          totalProperties,
          totalInspections,
          completedInspections,
        },
        recentActivity: formattedActivity,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router; 