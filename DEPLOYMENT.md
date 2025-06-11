# WDO Leads Manager - Deployment Guide

## 🚀 Quick Start

Your WDO Leads Manager application is now ready to deploy! Here's how to get it running:

### Development Mode (Local Testing)

1. **Start the development servers:**
   ```bash
   npm run dev
   ```
   This will start:
   - Backend on `http://localhost:3001`
   - Frontend on `http://localhost:3000`

### Production Mode (Docker)

1. **Start with Docker Compose:**
   ```bash
   docker-compose up -d
   ```
   This will start:
   - PostgreSQL database
   - Backend API server
   - Frontend web server
   - Nginx reverse proxy

2. **Initialize the database:**
   ```bash
   docker-compose exec backend npx prisma db push
   ```

3. **Create an admin user (optional):**
   ```bash
   docker-compose exec backend node -e "
   const { PrismaClient } = require('@prisma/client');
   const bcrypt = require('bcryptjs');
   const prisma = new PrismaClient();
   
   async function createAdmin() {
     const hashedPassword = await bcrypt.hash('admin123', 12);
     const user = await prisma.user.create({
       data: {
         email: 'admin@example.com',
         password: hashedPassword,
         firstName: 'Admin',
         lastName: 'User',
         role: 'ADMIN'
       }
     });
     console.log('Admin user created:', user.email);
   }
   createAdmin().catch(console.error).finally(() => prisma.\$disconnect());
   "
   ```

## 🔐 Security Configuration

### Production Security Checklist

- [x] **Change default passwords** - Update `.env` file
- [x] **Generate strong JWT secret** - Already done by setup script
- [x] **SSL/HTTPS enabled** - Self-signed certificates created
- [x] **Rate limiting configured** - Backend has rate limiting
- [x] **Input validation** - All API endpoints validated
- [x] **SQL injection protection** - Using Prisma ORM
- [x] **Security headers** - Nginx and Express configured

### Environment Variables to Customize

Edit `.env` file for your environment:

```env
# Strong database password
DB_PASSWORD=your_secure_password_here

# Unique JWT secret (already generated)
JWT_SECRET=your-generated-jwt-secret

# Production/development mode
NODE_ENV=production

# Custom port (if needed)
PORT=3001
```

## 🌐 Public Deployment

### For Production Servers

1. **Get SSL certificates** (replace self-signed ones):
   ```bash
   # Using Let's Encrypt
   certbot --nginx -d yourdomain.com
   # Or place your certificates in:
   # ssl/cert.pem
   # ssl/key.pem
   ```

2. **Update CORS settings** in `backend/src/index.ts`:
   ```typescript
   app.use(cors({
     origin: ['https://yourdomain.com'],
     credentials: true,
   }));
   ```

3. **Configure firewall**:
   - Allow ports 80 (HTTP) and 443 (HTTPS)
   - Block direct access to port 3001 (backend)
   - Block direct access to port 5432 (database)

4. **Use environment variables**:
   ```bash
   export DB_PASSWORD="your-secure-password"
   export JWT_SECRET="your-secure-jwt-secret"
   docker-compose up -d
   ```

### Cloud Deployment Options

#### AWS EC2/ECS
- Use RDS for PostgreSQL database
- Use Application Load Balancer
- Store secrets in AWS Secrets Manager

#### Google Cloud
- Use Cloud SQL for PostgreSQL
- Use Cloud Run for containers
- Use Secret Manager for credentials

#### DigitalOcean
- Use Managed PostgreSQL
- Use App Platform or Droplets
- Use environment variables for secrets

## 📊 Database Management

### Backup and Restore

```bash
# Backup
docker-compose exec db pg_dump -U postgres wdo_leads > backup.sql

# Restore
docker-compose exec -T db psql -U postgres wdo_leads < backup.sql
```

### Database Migrations

```bash
# Apply changes to schema
docker-compose exec backend npx prisma db push

# Generate new migration
docker-compose exec backend npx prisma migrate dev --name migration_name
```

## 🔧 Monitoring and Maintenance

### Health Checks

- Backend: `http://localhost:3001/health`
- Frontend: `http://localhost/health`

### Logs

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db
```

### Updates

```bash
# Update the application
git pull
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## ⚡ Performance Optimization

### For High Traffic

1. **Enable Redis caching** (add to docker-compose.yml):
   ```yaml
   redis:
     image: redis:alpine
     restart: unless-stopped
   ```

2. **Use CDN** for static assets

3. **Enable database connection pooling**

4. **Add horizontal scaling**:
   ```yaml
   backend:
     scale: 3
   ```

## 🔍 Troubleshooting

### Common Issues

1. **Database connection failed**
   ```bash
   docker-compose logs db
   # Check if PostgreSQL is running
   ```

2. **Backend not starting**
   ```bash
   docker-compose logs backend
   # Usually environment variable issues
   ```

3. **Frontend not loading**
   ```bash
   docker-compose logs frontend
   # Check nginx configuration
   ```

### Reset Everything

```bash
docker-compose down -v
docker-compose up -d --build
```

## 📋 Default Login

After creating an admin user, use these credentials:
- **Email**: admin@example.com
- **Password**: admin123

**⚠️ Change these immediately after first login!**

## 🆘 Support

- Check logs: `docker-compose logs`
- Verify services: `docker-compose ps`
- Database issues: Check PostgreSQL logs
- Network issues: Verify Docker network settings

---

**🎉 Your WDO Leads Manager is ready for production!** 