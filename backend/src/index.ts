import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import propertyRoutes from './routes/properties';
import inspectionRoutes from './routes/inspections';
import callRoutes from './routes/calls';
import contactRoutes from './routes/contacts';
import settingsRoutes from './routes/settings';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { authenticate } from './middleware/auth';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] // Replace with your actual domain
    : ['http://localhost:3000'],
  credentials: true,
}));

// Global rate limiting (more restrictive)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per 15 minutes
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 login attempts per 15 minutes
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts from this IP, please try again later.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
app.use('/api/', globalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint (public)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Public authentication routes (login only)
app.use('/api/auth', authRoutes);

// 🔒 GLOBAL AUTHENTICATION PROTECTION FOR ALL API ROUTES
// Apply authentication middleware to all routes except auth
app.use('/api/*', authenticate);

// Protected API routes
app.use('/api/users', userRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/settings', settingsRoutes);

// Security headers for API responses
app.use('/api/*', (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Catch-all for unauthorized API access
app.use('/api/*', (req, res) => {
  res.status(401).json({
    success: false,
    error: {
      message: 'Authentication required. Please provide a valid Bearer token.',
      code: 'AUTHENTICATION_REQUIRED'
    }
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler for non-API routes
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    error: {
      message: 'Route not found',
      code: 'ROUTE_NOT_FOUND'
    }
  });
});

const PORT = process.env.PORT || 3001;

// Initialize temporary admin account if no admin exists
async function initializeTempAdmin() {
  try {
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      return;
    }
    
    const tempPassword = 'WDOAdmin123!';
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    const tempAdmin = await prisma.user.create({
      data: {
        email: 'admin@temp.local',
        password: hashedPassword,
        firstName: 'Temporary',
        lastName: 'Administrator',
        role: 'ADMIN',
        active: true,
        isFirstLogin: true
      }
    });
    
    console.log('🔑 Temporary admin account created:');
    console.log('   📧 Email: admin@temp.local');
    console.log('   🔒 Password: WDOAdmin123!');
    console.log('   ⚠️  IMPORTANT: Change this password immediately after first login!');
    console.log('');
  } catch (error) {
    console.error('❌ Error creating temporary admin:', error);
  }
}

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Initialize temporary admin account
    await initializeTempAdmin();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌟 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('🔒 API Security: LOCKED DOWN - Authentication required for all endpoints');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer(); 