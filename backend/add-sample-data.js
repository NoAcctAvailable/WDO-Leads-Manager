const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addSampleData() {
  console.log('🌱 Adding sample leads, inspections, and calls...')

  // Get admin user and properties
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })

  if (!adminUser) {
    console.log('❌ No admin user found')
    return
  }

  const properties = await prisma.property.findMany({
    take: 8 // Get first 8 properties to work with
  })

  if (properties.length === 0) {
    console.log('❌ No properties found. Please add properties first.')
    return
  }

  console.log(`👤 Using admin: ${adminUser.firstName} ${adminUser.lastName}`)
  console.log(`🏠 Found ${properties.length} properties to work with`)

  // Sample leads data
  const leadsData = [
    {
      contactName: 'Sarah Johnson',
      contactEmail: 'sarah.johnson@email.com',
      contactPhone: '(404) 555-0123',
      status: 'SCHEDULED',
      priority: 'HIGH',
      source: 'Real Estate Referral',
      notes: 'Pre-purchase inspection. Closing date is next Friday.',
      estimatedValue: 450.0,
      followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days from now
    },
    {
      contactName: 'Michael Chen',
      contactEmail: 'mchen@homemail.com',
      contactPhone: '(770) 555-0456',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      source: 'Website',
      notes: 'Found termite damage in basement. Needs immediate attention.',
      estimatedValue: 680.0,
      followUpDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) // Tomorrow
    },
    {
      contactName: 'Emily Rodriguez',
      contactEmail: 'emily.r@gmail.com',
      contactPhone: '(678) 555-0789',
      status: 'NEW',
      priority: 'MEDIUM',
      source: 'Google Ads',
      notes: 'Routine annual inspection for commercial property.',
      estimatedValue: 320.0,
      followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
    },
    {
      contactName: 'David Thompson',
      contactEmail: 'dthompson@realty.com',
      contactPhone: '(404) 555-0321',
      status: 'CONTACTED',
      priority: 'MEDIUM',
      source: 'Referral',
      notes: 'Historic home requires specialized inspection techniques.',
      estimatedValue: 525.0,
      followUpDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days from now
    },
    {
      contactName: 'Lisa Park',
      contactEmail: 'lisa.park@email.com',
      contactPhone: '(770) 555-0654',
      status: 'COMPLETED',
      priority: 'LOW',
      source: 'Word of Mouth',
      notes: 'Preventive inspection completed. No issues found.',
      estimatedValue: 275.0,
      followUpDate: null
    },
    {
      contactName: 'Robert Williams',
      contactEmail: 'rwilliams@construction.com',
      contactPhone: '(678) 555-0987',
      status: 'SCHEDULED',
      priority: 'HIGH',
      source: 'Construction Company',
      notes: 'Large industrial facility inspection. Multiple structures.',
      estimatedValue: 1250.0,
      followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week from now
    }
  ]

  // Create leads
  console.log('\n📋 Creating sample leads...')
  const createdLeads = []
  for (let i = 0; i < Math.min(leadsData.length, properties.length); i++) {
    try {
      const lead = await prisma.lead.create({
        data: {
          ...leadsData[i],
          propertyId: properties[i].id,
          createdById: adminUser.id,
          assignedToId: adminUser.id
        }
      })
      createdLeads.push(lead)
      console.log(`  ✅ Created lead: ${lead.contactName} for ${properties[i].address}`)
    } catch (error) {
      console.error(`  ❌ Error creating lead:`, error.message)
    }
  }

  // Sample inspections data
  const inspectionsData = [
    {
      scheduledDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
      status: 'SCHEDULED',
      inspectionType: 'WDO',
      cost: 450.0,
      findings: null,
      recommendations: null
    },
    {
      scheduledDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      completedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: 'COMPLETED',
      inspectionType: 'TERMITE',
      cost: 680.0,
      findings: 'Subterranean termite activity detected in basement support beams. Active mud tubes found along foundation wall.',
      recommendations: 'Immediate termite treatment required. Replace damaged support beam. Install moisture barrier.'
    },
    {
      scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      status: 'SCHEDULED',
      inspectionType: 'WDO',
      cost: 320.0,
      findings: null,
      recommendations: null
    },
    {
      scheduledDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday
      completedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      status: 'COMPLETED',
      inspectionType: 'MOISTURE',
      cost: 525.0,
      findings: 'Elevated moisture levels in crawl space. Minor wood decay detected in floor joists.',
      recommendations: 'Improve ventilation. Repair moisture source. Monitor affected areas.'
    },
    {
      scheduledDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      completedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      status: 'COMPLETED',
      inspectionType: 'PREVENTIVE',
      cost: 275.0,
      findings: 'No evidence of wood destroying organisms. Property in good condition.',
      recommendations: 'Continue regular maintenance. Schedule next inspection in 12 months.'
    }
  ]

  // Create inspections
  console.log('\n🔍 Creating sample inspections...')
  const createdInspections = []
  for (let i = 0; i < Math.min(inspectionsData.length, createdLeads.length); i++) {
    try {
      const inspection = await prisma.inspection.create({
        data: {
          ...inspectionsData[i],
          leadId: createdLeads[i].id,
          propertyId: createdLeads[i].propertyId,
          inspectorId: adminUser.id
        }
      })
      createdInspections.push(inspection)
      console.log(`  ✅ Created ${inspection.inspectionType} inspection for ${createdLeads[i].contactName}`)
    } catch (error) {
      console.error(`  ❌ Error creating inspection:`, error.message)
    }
  }

  // Sample calls data
  const callsData = [
    {
      callType: 'OUTBOUND',
      purpose: 'INITIAL_CONTACT',
      contactName: 'Sarah Johnson',
      contactPhone: '(404) 555-0123',
      duration: 8,
      notes: 'Initial contact made. Explained our WDO inspection services. Customer interested in scheduling.',
      outcome: 'SCHEDULED',
      followUpDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
    },
    {
      callType: 'OUTBOUND',
      purpose: 'CONFIRMATION',
      contactName: 'Michael Chen',
      contactPhone: '(770) 555-0456',
      duration: 5,
      notes: 'Confirmed tomorrow\'s inspection appointment. Provided arrival time window.',
      outcome: 'COMPLETED',
      followUpDate: null
    },
    {
      callType: 'INBOUND',
      purpose: 'GENERAL_INQUIRY',
      contactName: 'Emily Rodriguez',
      contactPhone: '(678) 555-0789',
      duration: 12,
      notes: 'Customer called asking about commercial inspection pricing. Provided quote.',
      outcome: 'ANSWERED',
      followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    },
    {
      callType: 'OUTBOUND',
      purpose: 'FOLLOW_UP',
      contactName: 'David Thompson',
      contactPhone: '(404) 555-0321',
      duration: 15,
      notes: 'Discussed historic home inspection requirements. Explained specialized techniques needed.',
      outcome: 'ANSWERED',
      followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    },
    {
      callType: 'OUTBOUND',
      purpose: 'REPORT_DELIVERY',
      contactName: 'Lisa Park',
      contactPhone: '(770) 555-0654',
      duration: 6,
      notes: 'Called to notify that inspection report is ready. Email sent with detailed findings.',
      outcome: 'COMPLETED',
      followUpDate: null
    },
    {
      callType: 'OUTBOUND',
      purpose: 'SCHEDULING',
      contactName: 'Robert Williams',
      contactPhone: '(678) 555-0987',
      duration: 20,
      notes: 'Coordinated industrial facility inspection. Discussed access requirements and timeline.',
      outcome: 'SCHEDULED',
      followUpDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    },
    {
      callType: 'INBOUND',
      purpose: 'COMPLAINT',
      contactName: 'Previous Customer',
      contactPhone: '(404) 555-9999',
      duration: 25,
      notes: 'Customer concerned about missed termite damage. Reviewed inspection process and findings.',
      outcome: 'CALLBACK_REQUESTED',
      followUpDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
    },
    {
      callType: 'OUTBOUND',
      purpose: 'REMINDER',
      contactName: 'Sarah Johnson',
      contactPhone: '(404) 555-0123',
      duration: 3,
      notes: 'Reminder call for tomorrow\'s inspection. Customer confirmed availability.',
      outcome: 'ANSWERED',
      followUpDate: null
    }
  ]

  // Create calls
  console.log('\n📞 Creating sample calls...')
  let createdCalls = 0
  for (let i = 0; i < callsData.length; i++) {
    try {
      // Assign calls to leads and properties
      const leadIndex = i % createdLeads.length
      const lead = createdLeads[leadIndex]
      const inspection = createdInspections[leadIndex] || null

      const call = await prisma.call.create({
        data: {
          ...callsData[i],
          propertyId: lead.propertyId,
          leadId: lead.id,
          inspectionId: inspection?.id || null,
          madeById: adminUser.id,
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random time in last week
        }
      })
      createdCalls++
      console.log(`  ✅ Created ${call.purpose} call to ${call.contactName}`)
    } catch (error) {
      console.error(`  ❌ Error creating call:`, error.message)
    }
  }

  // Summary
  console.log(`\n🎉 Sample data creation complete!`)
  console.log(`📊 Summary:`)
  console.log(`   📋 Leads: ${createdLeads.length}`)
  console.log(`   🔍 Inspections: ${createdInspections.length}`)
  console.log(`   📞 Calls: ${createdCalls}`)
  console.log(`   🏠 Properties: ${properties.length}`)

  // Final counts
  const totalLeads = await prisma.lead.count()
  const totalInspections = await prisma.inspection.count()
  const totalCalls = await prisma.call.count()
  const totalProperties = await prisma.property.count()

  console.log(`\n📈 Database totals:`)
  console.log(`   📋 Total Leads: ${totalLeads}`)
  console.log(`   🔍 Total Inspections: ${totalInspections}`)
  console.log(`   📞 Total Calls: ${totalCalls}`)
  console.log(`   🏠 Total Properties: ${totalProperties}`)

  await prisma.$disconnect()
}

addSampleData().catch((error) => {
  console.error('❌ Script failed:', error)
  process.exit(1)
}) 