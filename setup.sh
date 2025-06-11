#!/bin/bash

echo "🚀 Setting up WDO Leads Manager..."

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating environment file..."
    cat > .env << EOF
# Database
DB_PASSWORD=postgres123

# JWT Secret (CHANGE THIS IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production-$(date +%s)

# Application
NODE_ENV=development
PORT=3001

# Database URL
DATABASE_URL=postgresql://postgres:postgres123@db:5432/wdo_leads
EOF
    echo "✅ Environment file created (.env)"
else
    echo "📄 Environment file already exists"
fi

# Create SSL directory for certificates
if [ ! -d ssl ]; then
    echo "📁 Creating SSL directory..."
    mkdir ssl
    echo "🔐 Generating self-signed SSL certificates..."
    openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
    echo "✅ SSL certificates created"
fi

# Generate Prisma client
echo "🔧 Setting up database schema..."
cd backend
npx prisma generate 2>/dev/null || echo "⚠️  Prisma generate will run when backend starts"
cd ..

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the application:"
echo "  Development: npm run dev"
echo "  Production:  docker-compose up -d"
echo ""
echo "The application will be available at:"
echo "  Frontend: http://localhost:3000 (dev) or http://localhost (prod)"
echo "  Backend:  http://localhost:3001"
echo ""
echo "📖 See README.md for detailed instructions" 