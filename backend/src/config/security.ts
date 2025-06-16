import rateLimit from 'express-rate-limit';

// Global rate limiting configuration
export const globalRateLimit = rateLimit({
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
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  }
});

// Authentication endpoint rate limiting (stricter)
export const authRateLimit = rateLimit({
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

// API key rate limiting (for external integrations)
export const apiKeyRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // limit each API key to 1000 requests per hour
  message: {
    success: false,
    error: {
      message: 'API key rate limit exceeded. Please contact support.',
      code: 'API_KEY_RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security headers configuration
export const securityHeaders = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for development
};

// CORS configuration
export const corsConfig = {
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean)
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin', 
    'X-Requested-With', 
    'Content-Type', 
    'Accept', 
    'Authorization',
    'X-API-Key'
  ],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400, // 24 hours
};

// JWT configuration
export const jwtConfig = {
  secret: process.env.JWT_SECRET!,
  expiresIn: '24h',
  issuer: 'wdo-leads-api',
  audience: 'wdo-leads-app',
  algorithm: 'HS256' as const,
};

// Password policy
export const passwordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  blacklist: [
    'password', '123456', 'qwerty', 'admin', 'letmein', 'welcome',
    'monkey', 'dragon', 'master', 'password123', 'admin123'
  ],
};

// Audit log configuration
export const auditConfig = {
  enabled: process.env.NODE_ENV === 'production',
  logLevel: process.env.LOG_LEVEL || 'info',
  sensitiveFields: [
    'password', 'token', 'secret', 'key', 'authorization',
    'cookie', 'session', 'ssn', 'creditcard'
  ],
};

// API security rules
export const apiSecurityRules = {
  maxRequestSize: '10mb',
  maxJsonDepth: 10,
  maxArrayLength: 1000,
  maxStringLength: 50000,
  allowedFileTypes: ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.doc', '.docx'],
  maxFileSize: '50mb',
};

// Session configuration
export const sessionConfig = {
  maxSessions: 5, // Maximum concurrent sessions per user
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  refreshThreshold: 2 * 60 * 60 * 1000, // Refresh token if expires within 2 hours
};

// Security monitoring thresholds
export const securityThresholds = {
  maxFailedLogins: 5,
  lockoutDuration: 30 * 60 * 1000, // 30 minutes
  maxTokenRefreshAttempts: 3,
  suspiciousActivityThreshold: 10,
}; 