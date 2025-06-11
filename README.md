# WDO Leads Manager

A comprehensive web application for managing Wood Destroying Organism (WDO) inspection leads, built with security and scalability in mind.

## 🏗️ Architecture

- **Frontend**: React 18 + TypeScript + Material-UI
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt password hashing
- **Containerization**: Docker with multi-stage builds
- **Reverse Proxy**: Nginx with SSL support and security headers
- **Security**: Rate limiting, CORS, input validation, SQL injection protection

## 🚀 Features

### Core Functionality
- **Property Management**: Add, edit, and track properties requiring inspection
- **Lead Management**: Comprehensive lead tracking with status management
- **Inspection Scheduling**: Schedule and manage WDO inspections
- **User Management**: Role-based access control (Admin, Manager, Inspector, User)
- **Dashboard**: Real-time analytics and reporting

### Security Features
- JWT-based authentication with secure password hashing
- Role-based authorization
- Rate limiting on API endpoints
- CORS protection
- SQL injection protection via Prisma ORM
- Input validation and sanitization
- Security headers (HSTS, XSS protection, etc.)
- HTTPS enforcement

### Technical Features
- Responsive design for desktop and mobile
- Real-time data with React Query
- Pagination and filtering
- Docker containerization
- Health checks and monitoring
- Comprehensive error handling

## 🛠️ Tech Stack

### Backend
- **Node.js** with **Express.js**
- **TypeScript** for type safety
- **Prisma ORM** for database management
- **PostgreSQL** database
- **JWT** for authentication
- **bcrypt** for password hashing
- **express-validator** for input validation
- **express-rate-limit** for rate limiting
- **helmet** for security headers

### Frontend
- **React 18** with **TypeScript**
- **Material-UI (MUI)** for components
- **React Router** for navigation
- **React Query** for API state management
- **Axios** for HTTP requests
- **Vite** for build tooling

### DevOps
- **Docker** with multi-stage builds
- **Docker Compose** for orchestration
- **Nginx** reverse proxy
- **SSL/TLS** support

## 📦 Installation & Setup

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL (if running locally)

### Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd wdo-leads-manager
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Database
   DB_PASSWORD=your_secure_password

   # JWT Secret (CHANGE THIS IN PRODUCTION!)
   JWT_SECRET=your-super-secret-jwt-key-change-in-production

   # Application
   NODE_ENV=production
   PORT=3001

   # Database URL
   DATABASE_URL=postgresql://postgres:your_secure_password@db:5432/wdo_leads
   ```

3. **Start the application**
   ```bash
   docker-compose up -d
   ```

4. **Initialize the database**
   ```bash
   docker-compose exec backend npx prisma db push
   ```

5. **Access the application**
   
   **Automatic Temporary Admin Account**: When you start the application for the first time, a temporary admin account is automatically created:
   
   - **Email**: `admin@temp.local`
   - **Password**: `WDOAdmin123!`
   - **Note**: You will be required to change this password on first login for security
   
   Use these credentials to log in and create additional user accounts through the admin interface.

6. **Create additional users** (optional)
   ```bash
   docker-compose exec backend npx prisma db seed
   ```

The application will be available at:
- **Frontend**: http://localhost (or https://localhost with SSL)
- **Backend API**: http://localhost:3001
- **Database**: localhost:5432

### Local Development Setup

1. **Install dependencies**
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Setup database**
   ```bash
   cd backend
   npx prisma db push
   npx prisma generate
   ```

3. **Start development servers**
   ```bash
   # From root directory
   npm run dev
   ```

   Or start individually:
   ```bash
   # Backend (Terminal 1)
   cd backend && npm run dev

   # Frontend (Terminal 2)
   cd frontend && npm run dev
   ```

## 🔐 Security Configuration

### SSL/HTTPS Setup

1. **Generate SSL certificates** (for production):
   ```bash
   mkdir ssl
   # Add your SSL certificate files:
   # ssl/cert.pem
   # ssl/key.pem
   ```

2. **For development/testing**, create self-signed certificates:
   ```bash
   openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes
   ```

### Environment Variables

**Critical security settings to change in production:**

- `JWT_SECRET`: Use a strong, unique secret key
- `DB_PASSWORD`: Use a strong database password
- Update CORS origins in `backend/src/index.ts`
- Configure proper SSL certificates

## 📊 Database Schema

The application uses the following main entities:

- **Users**: Authentication and role management
- **Properties**: Properties requiring inspection
- **Leads**: Lead tracking and management
- **Inspections**: Inspection scheduling and results

## 🔧 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Resource Endpoints
- Properties: `/api/properties`
- Leads: `/api/leads`
- Inspections: `/api/inspections`
- Users: `/api/users` (Admin/Manager only)

All endpoints support standard CRUD operations with pagination, filtering, and sorting.

## 🚀 Deployment

### Production Deployment

1. **Configure environment variables**
2. **Setup SSL certificates**
3. **Deploy with Docker Compose**:
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

### Scaling Considerations

- Use a managed PostgreSQL service (AWS RDS, Google Cloud SQL, etc.)
- Implement Redis for session storage
- Use a CDN for static assets
- Configure horizontal scaling with load balancers
- Implement monitoring and logging (ELK stack, Prometheus, etc.)

## 🧪 Testing

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# E2E tests
npm run test:e2e
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the troubleshooting section

## 🔧 Troubleshooting

### Common Issues

1. **Database connection issues**
   - Check PostgreSQL is running
   - Verify connection string
   - Ensure database exists

2. **Authentication issues**
   - Check JWT secret configuration
   - Verify token expiration
   - Clear browser localStorage

3. **Docker issues**
   - Run `docker-compose down && docker-compose up --build`
   - Check logs: `docker-compose logs`

### Performance Optimization

- Enable database indexing
- Implement caching strategies
- Optimize API queries
- Use CDN for static assets
- Monitor application performance

---

**Built with ❤️ for efficient WDO inspection management** 