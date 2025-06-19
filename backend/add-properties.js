const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addProperties() {
  console.log('🌱 Adding sample properties...')

  // Get admin user
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })

  if (!adminUser) {
    console.log('❌ No admin user found')
    return
  }

  console.log(`👤 Using admin: ${adminUser.firstName} ${adminUser.lastName}`)

  const properties = [
    {
      address: '123 Oak Street',
      city: 'Atlanta',
      state: 'GA',
      zipCode: '30309',
      propertyType: 'RESIDENTIAL',
      description: 'Two-story colonial home with basement',
      notes: 'Previous termite treatment 3 years ago. Customer concerned about wood damage in garage.'
    },
    {
      address: '456 Pine Avenue',
      city: 'Marietta',
      state: 'GA',
      zipCode: '30062',
      propertyType: 'RESIDENTIAL',
      description: 'Ranch style home with crawl space',
      notes: 'New construction, preventive inspection requested before closing.'
    },
    {
      address: '789 Maple Drive',
      city: 'Roswell',
      state: 'GA',
      zipCode: '30075',
      propertyType: 'RESIDENTIAL',
      description: 'Victorian home built in 1920',
      notes: 'Historic home with original hardwood floors. Moisture issues in basement.'
    },
    {
      address: '321 Cedar Lane',
      city: 'Sandy Springs',
      state: 'GA',
      zipCode: '30328',
      propertyType: 'RESIDENTIAL',
      description: 'Modern townhouse with attached garage',
      notes: 'HOA required inspection. No known issues.'
    },
    {
      address: '654 Elm Court',
      city: 'Alpharetta',
      state: 'GA',
      zipCode: '30022',
      propertyType: 'RESIDENTIAL',
      description: 'Split-level home with deck',
      notes: 'Customer noticed small holes in deck posts. Possible carpenter ant activity.'
    },
    {
      address: '987 Birch Boulevard',
      city: 'Duluth',
      state: 'GA',
      zipCode: '30096',
      propertyType: 'RESIDENTIAL',
      description: 'Contemporary home with finished basement',
      notes: 'Real estate inspection for sale. Need detailed report for buyers.'
    },
    {
      address: '147 Magnolia Street',
      city: 'Decatur',
      state: 'GA',
      zipCode: '30030',
      propertyType: 'RESIDENTIAL',
      description: 'Craftsman bungalow with front porch',
      notes: 'Seller disclosure mentions previous pest control. Verification needed.'
    },
    {
      address: '258 Willow Way',
      city: 'Lawrenceville',
      state: 'GA',
      zipCode: '30043',
      propertyType: 'RESIDENTIAL',
      description: 'Two-story traditional with sunroom',
      notes: 'Customer found wood shavings near windows. Concerned about powder post beetles.'
    },
    {
      address: '741 Peachtree Plaza',
      city: 'Atlanta',
      state: 'GA',
      zipCode: '30308',
      propertyType: 'COMMERCIAL',
      description: 'Office building with retail space',
      notes: 'Annual commercial inspection. Previous issues with subterranean termites in basement.'
    },
    {
      address: '852 Industrial Parkway',
      city: 'Chamblee',
      state: 'GA',
      zipCode: '30341',
      propertyType: 'INDUSTRIAL',
      description: 'Warehouse facility with loading docks',
      notes: 'Large facility with multiple wooden structures. Comprehensive inspection needed.'
    }
  ]

  let created = 0
  for (const prop of properties) {
    try {
      const existing = await prisma.property.findFirst({
        where: {
          address: prop.address,
          city: prop.city
        }
      })

      if (!existing) {
        await prisma.property.create({
          data: {
            ...prop,
            createdById: adminUser.id
          }
        })
        console.log(`✅ Created: ${prop.address}, ${prop.city}`)
        created++
      } else {
        console.log(`⏭️  Exists: ${prop.address}, ${prop.city}`)
      }
    } catch (error) {
      console.error(`❌ Error creating ${prop.address}:`, error.message)
    }
  }

  const total = await prisma.property.count()
  console.log(`\n🎉 Complete! Created ${created} new properties`)
  console.log(`📊 Total properties in database: ${total}`)
  
  await prisma.$disconnect()
}

addProperties().catch((error) => {
  console.error('❌ Script failed:', error)
  process.exit(1)
}) 