const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create default inspection type configurations
  console.log('🔧 Setting up inspection type configurations...')
  const inspectionTypes = [
    {
      name: 'FULL_INSPECTION',
      displayName: 'Full Inspection',
      description: 'Complete wood destroying organism inspection of all accessible areas',
      sortOrder: 1
    },
    {
      name: 'LIMITED_INSPECTION',
      displayName: 'Limited Inspection',
      description: 'Inspection of specific areas or structures only',
      sortOrder: 2
    },
    {
      name: 'RE_INSPECTION',
      displayName: 'Re-Inspection',
      description: 'Follow-up inspection after treatment or repairs',
      sortOrder: 3
    },
    {
      name: 'EXCLUSION',
      displayName: 'Exclusion',
      description: 'Inspection to identify and exclude pest entry points',
      sortOrder: 4
    }
  ]

  for (const typeData of inspectionTypes) {
    try {
      const existingType = await prisma.inspectionTypeConfig.findUnique({
        where: { name: typeData.name }
      })

      if (!existingType) {
        await prisma.inspectionTypeConfig.create({
          data: typeData
        })
        console.log(`  ✅ Created inspection type: ${typeData.displayName}`)
      } else {
        console.log(`  ⏭️  Inspection type already exists: ${existingType.displayName}`)
      }
    } catch (error) {
      console.error(`  ❌ Error creating inspection type ${typeData.name}:`, error.message)
    }
  }

  // Check for admin user (but continue with seeding regardless)
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })

  if (!adminUser) {
    console.log('⚠️  No admin user found. Some data may not be seeded.')
  } else {
    // Set employee ID for admin if not already set
    if (!adminUser.employeeId) {
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { employeeId: '801' } // Set your employee ID here
    })
    console.log(`👤 Updated admin user ${adminUser.firstName} ${adminUser.lastName} with employee ID: 801`)
    } else {
      console.log(`👤 Using admin user: ${adminUser.firstName} ${adminUser.lastName} (Employee ID: ${adminUser.employeeId})`)
    }
  }

  // Create additional sample users with employee IDs if they don't exist
  const sampleUsers = [
    {
      email: 'inspector1@company.com',
      firstName: 'John',
      lastName: 'Inspector',
      role: 'INSPECTOR',
      employeeId: '802',
      password: await bcrypt.hash('password123', 10)
    },
    {
      email: 'inspector2@company.com', 
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'INSPECTOR',
      employeeId: '803',
      password: await bcrypt.hash('password123', 10)
    }
  ]

  console.log('👥 Creating sample users...')
  for (const userData of sampleUsers) {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      })

      if (!existingUser) {
        await prisma.user.create({
          data: userData
        })
        console.log(`  ✅ Created user: ${userData.firstName} ${userData.lastName} (Employee ID: ${userData.employeeId})`)
      } else {
        // Update existing user with employee ID if not set
        if (!existingUser.employeeId) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { employeeId: userData.employeeId }
          })
          console.log(`  ✅ Updated user: ${existingUser.firstName} ${existingUser.lastName} with employee ID: ${userData.employeeId}`)
        } else {
          console.log(`  ⏭️  User already exists: ${existingUser.firstName} ${existingUser.lastName} (Employee ID: ${existingUser.employeeId})`)
        }
      }
    } catch (error) {
      console.error(`  ❌ Error creating/updating user ${userData.email}:`, error.message)
    }
  }

  // Sample properties data for WDO inspection business
  const sampleProperties = [
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
      address: '369 Dogwood Drive',
      city: 'Norcross',
      state: 'GA',
      zipCode: '30071',
      propertyType: 'RESIDENTIAL',
      description: 'Ranch home with large workshop',
      notes: 'Workshop has extensive wood storage. Full inspection of all structures requested.'
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
    },
    {
      address: '963 Main Street',
      city: 'Tucker',
      state: 'GA',
      zipCode: '30084',
      propertyType: 'MIXED_USE',
      description: 'Mixed-use building with apartments above retail',
      notes: 'New property management company taking over. Complete assessment required.'
    },
    {
      address: '159 Hickory Hills',
      city: 'Johns Creek',
      state: 'GA',
      zipCode: '30097',
      propertyType: 'RESIDENTIAL',
      description: 'Luxury home with multiple decks',
      notes: 'High-end property with extensive outdoor wooden features. Premium inspection service.'
    },
    {
      address: '753 Riverside Drive',
      city: 'Smyrna',
      state: 'GA',
      zipCode: '30080',
      propertyType: 'RESIDENTIAL',
      description: 'Waterfront property with dock',
      notes: 'Moisture exposure concerns. Dock and pier inspection included.'
    },
    {
      address: '486 Forest Glen',
      city: 'Stone Mountain',
      state: 'GA',
      zipCode: '30083',
      propertyType: 'RESIDENTIAL',
      description: 'Log cabin style home',
      notes: 'All-wood construction. Requires specialized inspection techniques.'
    }
  ]

  console.log('🏠 Creating sample properties...')

  let createdCount = 0
  for (const propertyData of sampleProperties) {
    try {
      const existingProperty = await prisma.property.findFirst({
        where: {
          address: propertyData.address,
          city: propertyData.city,
        }
      })

      if (!existingProperty) {
        await prisma.property.create({
          data: {
            ...propertyData,
            createdById: adminUser.id,
          }
        })
        createdCount++
        console.log(`  ✅ Created property: ${propertyData.address}, ${propertyData.city}`)
      } else {
        console.log(`  ⏭️  Property already exists: ${propertyData.address}, ${propertyData.city}`)
      }
    } catch (error) {
      console.error(`  ❌ Error creating property ${propertyData.address}:`, error.message)
    }
  }

  console.log(`\n🎉 Database seeding completed!`)
  console.log(`📊 Created ${createdCount} new properties`)
  console.log(`🏠 Total properties in database: ${await prisma.property.count()}`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 