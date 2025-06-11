const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')
  
  // Check if any admin users already exist
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })
  
  if (existingAdmin) {
    console.log('✅ Admin user already exists, skipping seed.')
    return
  }
  
  // Create temporary admin account
  const tempPassword = 'WDOAdmin123!'
  const hashedPassword = await bcrypt.hash(tempPassword, 10)
  
  const tempAdmin = await prisma.user.create({
    data: {
      email: 'admin@temp.local',
      password: hashedPassword,
      firstName: 'Temporary',
      lastName: 'Administrator',
      role: 'ADMIN',
      active: true,
      isFirstLogin: true // Force password change on first login
    }
  })
  
  console.log('🔑 Temporary admin account created:')
  console.log('   Email: admin@temp.local')
  console.log('   Password: WDOAdmin123!')
  console.log('   ⚠️  IMPORTANT: Change this password immediately after first login!')
  console.log('')
  console.log('🚀 Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 