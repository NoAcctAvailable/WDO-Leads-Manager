# 🔒 API Security Documentation

## Overview

Your WDO Leads Manager API has been **completely locked down** with enterprise-grade security measures. All endpoints now require authentication except for essential public endpoints.

## 🛡️ Security Features Implemented

### 1. **Global Authentication Protection**
- ✅ **ALL API endpoints** require valid JWT Bearer tokens
- ✅ Only `/health` and `/api/auth/login` endpoints are public
- ✅ Invalid or missing tokens return clear error messages
- ✅ Token validation includes expiry and user status checks

### 2. **Advanced Token Security**
- ✅ JWT tokens expire after 24 hours
- ✅ Tokens are invalidated when user data changes (password, etc.)
- ✅ User active status is verified on every request
- ✅ Comprehensive token validation with detailed error messages

### 3. **Rate Limiting Protection**
- ✅ **Global Rate Limit**: 100 requests per 15 minutes per IP
- ✅ **Auth Rate Limit**: 10 login attempts per 15 minutes per IP
- ✅ Health check endpoints exempt from rate limiting
- ✅ Structured error responses with clear codes

### 4. **Security Headers**
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `X-Frame-Options: DENY`
- ✅ `X-XSS-Protection: 1; mode=block`
- ✅ `Referrer-Policy: strict-origin-when-cross-origin`
- ✅ Content Security Policy (CSP) configuration
- ✅ Cache control for sensitive data

### 5. **CORS Security**
- ✅ Strict origin validation
- ✅ Credentials support for authenticated requests
- ✅ Limited allowed headers and methods
- ✅ Production-ready origin filtering

### 6. **Audit Logging**
- ✅ All authentication attempts logged
- ✅ Authorization failures tracked
- ✅ Successful API access logged with user details
- ✅ Suspicious activity detection

## 🚫 What's Blocked

### Unauthorized Access Attempts
```bash
# This will fail with authentication required
curl -X GET http://localhost:3001/api/properties
# Response: {"success":false,"error":{"message":"Authentication required. Please provide a valid Bearer token."}}

curl -X GET http://localhost:3001/api/users  
# Response: {"success":false,"error":{"message":"Authentication required. Please provide a valid Bearer token."}}

curl -X GET http://localhost:3001/api/leads
# Response: {"success":false,"error":{"message":"Authentication required. Please provide a valid Bearer token."}}
```

### Rate Limiting
```bash
# After 10 failed login attempts in 15 minutes:
curl -X POST http://localhost:3001/api/auth/login -d '{"email":"test","password":"test"}'
# Response: {"success":false,"error":{"message":"Too many authentication attempts from this IP, please try again later.","code":"AUTH_RATE_LIMIT_EXCEEDED"}}
```

### Invalid Tokens
```bash
# Invalid or expired tokens
curl -X GET http://localhost:3001/api/properties -H "Authorization: Bearer invalid_token"
# Response: {"success":false,"error":{"message":"Invalid token format. Please login again."}}
```

## ✅ What's Still Accessible

### Public Endpoints
```bash
# Health check (always accessible)
curl -X GET http://localhost:3001/health
# Response: {"status":"OK","timestamp":"2025-06-12T16:41:38.608Z","version":"1.0.0"}

# Login endpoint (public for authentication)
curl -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@temp.local","password":"correct_password"}'
# Response: {"success":true,"data":{"user":{...},"token":"..."}}
```

## 🔐 Authentication Flow

### 1. **Login Required**
All users must authenticate through `/api/auth/login` to receive a JWT token.

### 2. **Token Usage**
All subsequent API requests must include the token:
```
Authorization: Bearer <jwt_token>
```

### 3. **Token Validation**
Every request validates:
- Token format and signature
- Token expiration
- User existence and active status
- Token freshness (not issued before password changes)

## 📊 Security Monitoring

### Real-time Logging
- ✅ Authentication attempts (successful and failed)
- ✅ Authorization failures
- ✅ Rate limit violations
- ✅ Invalid token usage
- ✅ Suspicious activity patterns

### Log Examples
```
🚫 Unauthorized API access attempt: GET /api/properties from 192.168.1.100
🚫 Invalid token attempt: TokenExpiredError from 192.168.1.100
🚫 Token for inactive user: user@example.com from 192.168.1.100
✅ Authenticated: admin@temp.local (ADMIN) - GET /api/properties
✅ Authorized: admin@temp.local (ADMIN) for GET /api/users
```

## ⚙️ Configuration

### Environment Variables
```env
# Required for JWT security
JWT_SECRET=your_super_secure_secret_key

# Optional API key for external integrations
API_KEY=your_api_key_for_external_services

# Production origins (comma-separated)
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Logging level
LOG_LEVEL=info
```

### Rate Limiting Thresholds
- **Global API**: 100 requests/15 minutes per IP
- **Authentication**: 10 attempts/15 minutes per IP
- **API Key**: 1000 requests/hour per key

## 🚨 Security Alerts

The API will now:
1. **Block all unauthorized access** immediately
2. **Rate limit aggressive requests** automatically
3. **Log suspicious activity** for monitoring
4. **Validate tokens thoroughly** on every request
5. **Protect against common attacks** (XSS, CSRF, etc.)

## 🔧 Testing Security

You can verify the security is working by:

```bash
# Test unauthorized access (should fail)
curl -X GET http://localhost:3001/api/properties

# Test rate limiting (make 15+ requests rapidly)
for i in {1..15}; do curl -X POST http://localhost:3001/api/auth/login -d '{"email":"test","password":"test"}'; done

# Test health check (should work)
curl -X GET http://localhost:3001/health

# Test valid authentication (should work with correct credentials)
curl -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@temp.local","password":"WDOAdmin123!"}'
```

## 🛡️ Security Best Practices

1. **Change default credentials** immediately
2. **Use strong JWT secrets** in production
3. **Monitor logs** for suspicious activity
4. **Keep dependencies updated** regularly
5. **Use HTTPS** in production
6. **Implement API versioning** for future changes
7. **Regular security audits** recommended

---

**🔒 Your API is now completely locked down and secure!** 