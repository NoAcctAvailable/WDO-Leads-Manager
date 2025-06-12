#!/bin/sh

echo "🚀 Starting WDO Leads Manager Backend..."

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
npx wait-on tcp:db:5432 -t 30000

# Initialize database schema (create tables if they don't exist)
echo "📊 Initializing database schema..."
npx prisma db push --accept-data-loss

# Generate Prisma client (in case of any changes)
echo "🔧 Generating Prisma client..."
npx prisma generate

# Start the application
echo "🌟 Starting server..."
exec node dist/index.js 