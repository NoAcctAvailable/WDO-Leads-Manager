#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const sampleProperties = [
  {
    address: "1234 Maple Street",
    city: "Atlanta",
    state: "GA",
    zipCode: "30309",
    propertyType: "RESIDENTIAL",
    description: "Single-family home built in 1995",
    notes: "Customer reported termite activity in basement"
  },
  {
    address: "5678 Oak Avenue",
    city: "Marietta", 
    state: "GA",
    zipCode: "30060",
    propertyType: "RESIDENTIAL",
    description: "Two-story colonial home",
    notes: "Pre-purchase inspection requested"
  },
  {
    address: "910 Pine Drive",
    city: "Roswell",
    state: "GA", 
    zipCode: "30075",
    propertyType: "RESIDENTIAL",
    description: "Ranch style home with deck",
    notes: "Annual preventive inspection"
  },
  {
    address: "246 Commerce Plaza",
    city: "Sandy Springs",
    state: "GA",
    zipCode: "30328", 
    propertyType: "COMMERCIAL",
    description: "Office building complex",
    notes: "Quarterly commercial inspection"
  },
  {
    address: "135 Industrial Way",
    city: "Alpharetta",
    state: "GA",
    zipCode: "30004",
    propertyType: "INDUSTRIAL", 
    description: "Warehouse facility",
    notes: "Moisture concerns in storage area"
  },
  {
    address: "789 Main Street",
    city: "Decatur",
    state: "GA", 
    zipCode: "30030",
    propertyType: "MIXED_USE",
    description: "Mixed-use building with retail and apartments",
    notes: "Comprehensive inspection needed"
  },
  {
    address: "321 Peachtree Road",
    city: "Atlanta",
    state: "GA",
    zipCode: "30305",
    propertyType: "RESIDENTIAL",
    description: "Historic home renovation project", 
    notes: "Pre-renovation termite inspection"
  },
  {
    address: "654 Technology Drive",
    city: "Norcross",
    state: "GA",
    zipCode: "30071",
    propertyType: "COMMERCIAL",
    description: "Tech office building",
    notes: "Employee reported pest sightings"
  },
  {
    address: "987 Piedmont Avenue",
    city: "Atlanta",
    state: "GA",
    zipCode: "30308",
    propertyType: "RESIDENTIAL",
    description: "Luxury condominium unit",
    notes: "Pre-sale inspection requirement"
  },
  {
    address: "147 Business Center",
    city: "Dunwoody",
    state: "GA",
    zipCode: "30338",
    propertyType: "COMMERCIAL",
    description: "Multi-tenant office complex",
    notes: "Annual maintenance inspection"
  }
];

const sampleInspections = [
  {
    propertyAddress: "1234 Maple Street",
    inspectionType: "FULL_INSPECTION",
    scheduledDate: new Date('2024-06-10'),
    findings: "Active termite infestation found in basement support beams. Moisture damage evident around foundation.",
    recommendations: "Immediate termite treatment required. Repair moisture issues and replace damaged wood.",
    status: "SOLD"
  },
  {
    propertyAddress: "5678 Oak Avenue",
    inspectionType: "FULL_INSPECTION",
    scheduledDate: new Date('2024-06-15'),
    findings: "No active pest activity detected. Previous termite damage found in garage area, appears treated.",
    recommendations: "Property suitable for purchase. Consider annual preventive treatment.",
    status: "SOLD"
  },
  {
    propertyAddress: "910 Pine Drive",
    inspectionType: "LIMITED_INSPECTION",
    scheduledDate: new Date('2024-06-20'),
    findings: "Minor carpenter ant activity in deck area. No termite activity detected.",
    recommendations: "Localized ant treatment applied. Remove wood debris near deck.",
    status: "SOLD"
  },
  {
    propertyAddress: "246 Commerce Plaza",
    inspectionType: "EXCLUSION",
    scheduledDate: new Date('2024-06-25'),
    findings: "Multiple entry points found. Evidence of rodent activity in storage areas.",
    recommendations: "Seal entry points. Install monitoring stations. Quarterly follow-up recommended.",
    status: "IN_PROGRESS"
  },
  {
    propertyAddress: "135 Industrial Way",
    inspectionType: "LIMITED_INSPECTION",
    scheduledDate: new Date('2024-06-18'),
    findings: "High moisture levels detected in northeast corner. Conducive conditions for termites.",
    recommendations: "Address moisture source immediately. Install dehumidification system.",
    status: "SOLD"
  },
  {
    propertyAddress: "789 Main Street",
    inspectionType: "FULL_INSPECTION",
    scheduledDate: new Date('2024-06-30'),
    findings: "Extensive old termite damage in retail section. Active powder post beetle infestation in apartments.",
    recommendations: "Comprehensive treatment plan required. Replace damaged structural elements.",
    status: "UNCONTACTED"
  },
  {
    propertyAddress: "321 Peachtree Road",
    inspectionType: "FULL_INSPECTION",
    scheduledDate: new Date('2024-06-12'),
    findings: "Foundation area clear of pest activity. Soil treatment applied as preventive measure.",
    recommendations: "Proceed with renovation. Maintain preventive soil barrier.",
    status: "SOLD"
  },
  {
    propertyAddress: "654 Technology Drive",
    inspectionType: "LIMITED_INSPECTION",
    scheduledDate: new Date('2024-06-22'),
    findings: "Minor ant trails in break room area. No structural pest activity detected.",
    recommendations: "Basic ant treatment applied. Improve sanitation practices.",
    status: "SOLD"
  },
  {
    propertyAddress: "987 Piedmont Avenue",
    inspectionType: "FULL_INSPECTION",
    scheduledDate: new Date('2024-07-05'),
    findings: "",
    recommendations: "",
    status: "UNCONTACTED"
  },
  {
    propertyAddress: "147 Business Center",
    inspectionType: "RE_INSPECTION",
    scheduledDate: new Date('2024-07-01'),
    findings: "",
    recommendations: "",
    status: "UNCONTACTED"
  }
];

const sampleCalls = [
  {
    propertyAddress: "1234 Maple Street",
    callType: "INBOUND",
    purpose: "INITIAL_CONTACT",
    contactName: "Sarah Johnson",
    contactPhone: "(404) 555-0123",
    duration: 8,
    notes: "Homeowner concerned about termite activity in basement. Scheduled inspection for next week.",
    outcome: "SCHEDULED",
    daysAgo: 14
  },
  {
    propertyAddress: "1234 Maple Street", 
    callType: "OUTBOUND",
    purpose: "CONFIRMATION",
    contactName: "Sarah Johnson",
    contactPhone: "(404) 555-0123",
    duration: 3,
    notes: "Confirmed inspection appointment for Monday at 10 AM.",
    outcome: "ANSWERED",
    daysAgo: 7
  },
  {
    propertyAddress: "1234 Maple Street",
    callType: "OUTBOUND", 
    purpose: "REPORT_DELIVERY",
    contactName: "Sarah Johnson",
    contactPhone: "(404) 555-0123",
    duration: 12,
    notes: "Delivered inspection report. Explained findings and treatment recommendations in detail.",
    outcome: "COMPLETED",
    daysAgo: 2
  },
  {
    propertyAddress: "5678 Oak Avenue",
    callType: "OUTBOUND",
    purpose: "INITIAL_CONTACT", 
    contactName: "Michael Chen",
    contactPhone: "(770) 555-0456",
    duration: 15,
    notes: "Realtor requested pre-purchase inspection. Property under contract, closing in 3 weeks.",
    outcome: "SCHEDULED",
    daysAgo: 12
  },
  {
    propertyAddress: "5678 Oak Avenue",
    callType: "OUTBOUND",
    purpose: "REPORT_DELIVERY",
    contactName: "Michael Chen", 
    contactPhone: "(770) 555-0456",
    duration: 6,
    notes: "Provided clearance letter via email. Property approved for closing.",
    outcome: "COMPLETED",
    daysAgo: 5
  },
  {
    propertyAddress: "910 Pine Drive",
    callType: "INBOUND",
    purpose: "REMINDER",
    contactName: "Robert Williams",
    contactPhone: "(678) 555-0789",
    duration: 4,
    notes: "Customer called for annual inspection reminder. Scheduled for next month.",
    outcome: "SCHEDULED",
    daysAgo: 8
  },
  {
    propertyAddress: "246 Commerce Plaza",
    callType: "OUTBOUND",
    purpose: "SCHEDULING",
    contactName: "Lisa Martinez",
    contactPhone: "(404) 555-0321",
    duration: 7,
    notes: "Facility manager scheduling quarterly inspection. Arranged for after-hours service.",
    outcome: "SCHEDULED",
    daysAgo: 10
  },
  {
    propertyAddress: "246 Commerce Plaza",
    callType: "INBOUND",
    purpose: "COMPLAINT",
    contactName: "Lisa Martinez",
    contactPhone: "(404) 555-0321", 
    duration: 18,
    notes: "Tenant reported increased rodent activity. Escalated to emergency service. Inspection in progress.",
    outcome: "COMPLETED",
    daysAgo: 3
  },
  {
    propertyAddress: "135 Industrial Way",
    callType: "OUTBOUND",
    purpose: "FOLLOW_UP",
    contactName: "David Thompson",
    contactPhone: "(770) 555-0654",
    duration: 9,
    notes: "Followed up on moisture remediation progress. Customer reported good results from dehumidification.",
    outcome: "ANSWERED",
    daysAgo: 6
  },
  {
    propertyAddress: "789 Main Street",
    callType: "INBOUND", 
    purpose: "GENERAL_INQUIRY",
    contactName: "Patricia Davis",
    contactPhone: "(404) 555-0987",
    duration: 22,
    notes: "Property manager inquiring about comprehensive inspection for mixed-use building. Discussed scope and pricing.",
    outcome: "SCHEDULED",
    daysAgo: 15
  },
  {
    propertyAddress: "321 Peachtree Road",
    callType: "OUTBOUND",
    purpose: "INITIAL_CONTACT",
    contactName: "James Wilson",
    contactPhone: "(770) 555-0135",
    duration: 11,
    notes: "Contractor requested pre-renovation inspection for historic home. Emphasized importance of thorough check.",
    outcome: "SCHEDULED", 
    daysAgo: 13
  },
  {
    propertyAddress: "321 Peachtree Road",
    callType: "OUTBOUND",
    purpose: "REPORT_DELIVERY",
    contactName: "James Wilson",
    contactPhone: "(770) 555-0135",
    duration: 8,
    notes: "Provided clearance for renovation work. Recommended maintaining soil treatment barrier.",
    outcome: "COMPLETED",
    daysAgo: 4
  },
  {
    propertyAddress: "654 Technology Drive",
    callType: "INBOUND",
    purpose: "COMPLAINT",
    contactName: "Jennifer Brown",
    contactPhone: "(678) 555-0246",
    duration: 5,
    notes: "Office manager reported ant sightings in employee break room. Scheduled same-day service.",
    outcome: "SCHEDULED",
    daysAgo: 9
  },
  {
    propertyAddress: "987 Piedmont Avenue",
    callType: "OUTBOUND", 
    purpose: "SCHEDULING",
    contactName: "Thomas Garcia",
    contactPhone: "(404) 555-0579",
    duration: 6,
    notes: "Real estate agent scheduling pre-sale inspection for luxury condo. Appointment set for next week.",
    outcome: "SCHEDULED",
    daysAgo: 11
  },
  {
    propertyAddress: "147 Business Center",
    callType: "OUTBOUND",
    purpose: "REMINDER",
    contactName: "Amanda Miller",
    contactPhone: "(770) 555-0864",
    duration: 4,
    notes: "Annual maintenance inspection reminder for office complex. Confirmed preferred schedule.",
    outcome: "ANSWERED",
    daysAgo: 7
  },
  {
    propertyAddress: "5678 Oak Avenue",
    callType: "OUTBOUND",
    purpose: "FOLLOW_UP",
    contactName: "Michael Chen",
    contactPhone: "(770) 555-0456",
    duration: 5,
    notes: "Post-closing follow-up call. New homeowner satisfied with inspection service.",
    outcome: "ANSWERED",
    daysAgo: 1
  },
  {
    propertyAddress: "654 Technology Drive",
    callType: "OUTBOUND",
    purpose: "FOLLOW_UP", 
    contactName: "Jennifer Brown",
    contactPhone: "(678) 555-0246",
    duration: 3,
    notes: "Follow-up on ant treatment. No further pest activity reported. Recommended sanitation improvements.",
    outcome: "COMPLETED",
    daysAgo: 2
  },
  {
    propertyAddress: "910 Pine Drive",
    callType: "OUTBOUND",
    purpose: "CONFIRMATION",
    contactName: "Robert Williams", 
    contactPhone: "(678) 555-0789",
    duration: 2,
    notes: "Confirmed upcoming annual inspection appointment. Reminded about deck area access.",
    outcome: "ANSWERED",
    daysAgo: 1
  }
];

async function getOrCreateAdminUser() {
  // Try to find existing admin
  let admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  if (!admin) {
    // Create admin if none exists
    const hashedPassword = await bcrypt.hash('WDOAdmin123!', 10);
    admin = await prisma.user.create({
      data: {
        email: 'admin@temp.local',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        active: true,
        isFirstLogin: false
      }
    });
    console.log('✅ Created admin user');
  }

  return admin;
}

async function addSampleProperties() {
  try {
    console.log('🏠 Adding sample properties...');
    
    const admin = await getOrCreateAdminUser();
    let addedCount = 0;
    let skippedCount = 0;

    for (const propertyData of sampleProperties) {
      // Check if property already exists (by address only since addresses should be unique)
      const existing = await prisma.property.findFirst({
        where: { 
          address: propertyData.address
        }
      });

      if (existing) {
        console.log(`⏭️  Skipped: ${propertyData.address} (already exists)`);
        skippedCount++;
        continue;
      }

      await prisma.property.create({
        data: {
          ...propertyData,
          createdById: admin.id
        }
      });

      console.log(`✅ Added: ${propertyData.address}`);
      addedCount++;
    }

    console.log(`\n📊 Summary:`);
    console.log(`   • Added: ${addedCount} properties`);
    console.log(`   • Skipped: ${skippedCount} properties (already exist)`);
    console.log(`   • Total sample properties: ${sampleProperties.length}`);

  } catch (error) {
    console.error('❌ Error adding sample properties:', error);
    throw error;
  }
}

async function addSampleInspections() {
  try {
    console.log('🔍 Adding sample inspections...');
    
    const admin = await getOrCreateAdminUser();
    let addedCount = 0;
    let skippedCount = 0;

    for (const inspectionData of sampleInspections) {
      // Find the property by address
      const property = await prisma.property.findFirst({
        where: { 
          address: inspectionData.propertyAddress
        }
      });

      if (!property) {
        console.log(`⏭️  Skipped inspection for: ${inspectionData.propertyAddress} (property not found)`);
        skippedCount++;
        continue;
      }

      // Check if inspection already exists
      const existing = await prisma.inspection.findFirst({
        where: { 
          propertyId: property.id,
          inspectionType: inspectionData.inspectionType,
          scheduledDate: inspectionData.scheduledDate
        }
      });

      if (existing) {
        console.log(`⏭️  Skipped inspection: ${inspectionData.propertyAddress} - ${inspectionData.inspectionType} (already exists)`);
        skippedCount++;
        continue;
      }

      await prisma.inspection.create({
        data: {
          propertyId: property.id,
          inspectorId: admin.id,
          inspectionType: inspectionData.inspectionType,
          scheduledDate: inspectionData.scheduledDate,
          findings: inspectionData.findings,
          recommendations: inspectionData.recommendations,
          status: inspectionData.status,
          completedDate: inspectionData.status === 'SOLD' ? inspectionData.scheduledDate : null
        }
      });

      console.log(`✅ Added inspection: ${inspectionData.propertyAddress} - ${inspectionData.inspectionType}`);
      addedCount++;
    }

    console.log(`\n📊 Summary:`);
    console.log(`   • Added: ${addedCount} inspections`);
    console.log(`   • Skipped: ${skippedCount} inspections (already exist or property not found)`);
    console.log(`   • Total sample inspections: ${sampleInspections.length}`);

  } catch (error) {
    console.error('❌ Error adding sample inspections:', error);
    throw error;
  }
}

async function addSampleCalls() {
  try {
    console.log('📞 Adding sample calls...');
    
    const admin = await getOrCreateAdminUser();
    let addedCount = 0;
    let skippedCount = 0;

    for (const callData of sampleCalls) {
      // Find the property by address
      const property = await prisma.property.findFirst({
        where: { 
          address: callData.propertyAddress
        }
      });

      if (!property) {
        console.log(`⏭️  Skipped call for: ${callData.propertyAddress} (property not found)`);
        skippedCount++;
        continue;
      }

      // Check if similar call already exists (to avoid duplicates)
      const existing = await prisma.call.findFirst({
        where: { 
          propertyId: property.id,
          contactName: callData.contactName,
          purpose: callData.purpose,
          notes: callData.notes
        }
      });

      if (existing) {
        console.log(`⏭️  Skipped call: ${callData.propertyAddress} - ${callData.purpose} (similar call exists)`);
        skippedCount++;
        continue;
      }

      // Calculate call date based on daysAgo
      const callDate = new Date();
      callDate.setDate(callDate.getDate() - callData.daysAgo);

      // Find related inspection if applicable
      let inspectionId = null;
      if (callData.purpose === 'REPORT_DELIVERY' || callData.purpose === 'FOLLOW_UP') {
        const relatedInspection = await prisma.inspection.findFirst({
          where: { 
            propertyId: property.id
          },
          orderBy: { scheduledDate: 'desc' }
        });
        if (relatedInspection) {
          inspectionId = relatedInspection.id;
        }
      }

      await prisma.call.create({
        data: {
          propertyId: property.id,
          inspectionId: inspectionId,
          madeById: admin.id,
          callType: callData.callType,
          purpose: callData.purpose,
          contactName: callData.contactName,
          contactPhone: callData.contactPhone,
          duration: callData.duration,
          notes: callData.notes,
          outcome: callData.outcome,
          completed: true,
          createdAt: callDate,
          updatedAt: callDate
        }
      });

      console.log(`✅ Added call: ${callData.propertyAddress} - ${callData.purpose} (${callData.contactName})`);
      addedCount++;
    }

    console.log(`\n📊 Summary:`);
    console.log(`   • Added: ${addedCount} calls`);
    console.log(`   • Skipped: ${skippedCount} calls (already exist or property not found)`);
    console.log(`   • Total sample calls: ${sampleCalls.length}`);

  } catch (error) {
    console.error('❌ Error adding sample calls:', error);
    throw error;
  }
}

async function removeSampleCalls() {
  try {
    console.log('🗑️  Removing sample calls...');
    
    // Get all sample property addresses
    const sampleAddresses = sampleProperties.map(p => p.address);

    // Find all properties that match sample addresses
    const properties = await prisma.property.findMany({
        where: { 
        address: { in: sampleAddresses }
        }
      });

    if (properties.length === 0) {
      console.log('⏭️  No sample properties found');
      return;
    }

    const propertyIds = properties.map(p => p.id);

    // Remove all calls for sample properties
    const deletedCalls = await prisma.call.deleteMany({
        where: { 
        propertyId: { in: propertyIds }
        }
      });

    console.log(`\n📊 Summary:`);
    console.log(`   • Removed: ${deletedCalls.count} calls from sample properties`);

  } catch (error) {
    console.error('❌ Error removing sample calls:', error);
    throw error;
  }
}

async function removeSampleInspections() {
  try {
    console.log('🗑️  Removing sample inspections...');
    
    // Get all sample property addresses
    const sampleAddresses = sampleProperties.map(p => p.address);

    // Find all properties that match sample addresses
    const properties = await prisma.property.findMany({
        where: { 
        address: { in: sampleAddresses }
        }
      });

    if (properties.length === 0) {
      console.log('⏭️  No sample properties found');
      return;
    }

    const propertyIds = properties.map(p => p.id);

    // Remove all inspections for sample properties
    const deletedInspections = await prisma.inspection.deleteMany({
        where: { 
        propertyId: { in: propertyIds }
      }
    });

    console.log(`\n📊 Summary:`);
    console.log(`   • Removed: ${deletedInspections.count} inspections from sample properties`);

  } catch (error) {
    console.error('❌ Error removing sample inspections:', error);
    throw error;
  }
}

async function removeSampleProperties() {
  try {
    console.log('🗑️  Removing sample properties...');
    
    const sampleAddresses = sampleProperties.map(p => p.address);
    
    // Find all properties that match sample addresses and have no dependent data
    const properties = await prisma.property.findMany({
      where: { 
        address: { in: sampleAddresses }
      },
        include: {
          _count: {
            select: {
              calls: true,
              inspections: true
            }
          }
        }
      });

    if (properties.length === 0) {
      console.log('⏭️  No sample properties found');
      return;
      }

    // Filter properties that can be safely deleted (no dependent data)
    const safeToDelete = properties.filter(p => p._count.calls === 0 && p._count.inspections === 0);
    const hasData = properties.filter(p => p._count.calls > 0 || p._count.inspections > 0);

    // Remove safe properties
    if (safeToDelete.length > 0) {
      const propertyIds = safeToDelete.map(p => p.id);
      const deletedProperties = await prisma.property.deleteMany({
        where: {
          id: { in: propertyIds }
        }
      });

      console.log(`✅ Removed ${deletedProperties.count} properties`);
      safeToDelete.forEach(p => console.log(`   • ${p.address}`));
    }

    // Report properties that couldn't be deleted
    if (hasData.length > 0) {
      console.log(`\n⚠️  ${hasData.length} properties skipped (have dependent data):`);
      hasData.forEach(p => {
        console.log(`   • ${p.address} (${p._count.calls} calls, ${p._count.inspections} inspections)`);
      });
    }

    console.log(`\n📊 Summary:`);
    console.log(`   • Removed: ${safeToDelete.length} properties`);
    console.log(`   • Skipped: ${hasData.length} properties (have dependent data)`);
    console.log(`   • Total sample addresses: ${sampleAddresses.length}`);

  } catch (error) {
    console.error('❌ Error removing sample properties:', error);
    throw error;
  }
}

async function showStatus() {
  try {
    console.log('📋 Sample Data Status:');
    
    // Check properties
    const sampleAddresses = sampleProperties.map(p => p.address);
    const existingProperties = await prisma.property.findMany({
      where: {
        address: { in: sampleAddresses }
      },
      include: {
        _count: {
          select: {
            calls: true,
            inspections: true
          }
        },
        inspections: {
          select: {
            inspectionType: true,
            status: true,
            scheduledDate: true
          }
        },
        calls: {
          select: {
            callType: true,
            purpose: true,
            outcome: true,
            contactName: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 3
        }
      }
    });

    console.log(`\n🏠 Found ${existingProperties.length} sample properties in database:`);
    
    existingProperties.forEach(property => {
      console.log(`   • ${property.address} (${property.propertyType})`);
      console.log(`     📞 ${property._count.calls} calls, 🔍 ${property._count.inspections} inspections`);
      
      // Show recent calls
      if (property.calls.length > 0) {
        console.log(`     Recent calls:`);
        property.calls.forEach(call => {
          const callIcon = call.callType === 'INBOUND' ? '📞' : '📱';
          const outcomeIcon = call.outcome === 'ANSWERED' ? '✅' : 
                             call.outcome === 'COMPLETED' ? '✅' : 
                             call.outcome === 'SCHEDULED' ? '📅' : '❌';
          console.log(`       ${callIcon} ${call.purpose} to ${call.contactName} ${outcomeIcon} (${call.createdAt.toDateString()})`);
        });
      }
      
      // Show inspections
      if (property.inspections.length > 0) {
        console.log(`     Inspections:`);
        property.inspections.forEach(inspection => {
                const statusIcon = inspection.status === 'SOLD' ? '✅' :
                         inspection.status === 'IN_PROGRESS' ? '🔄' : 
                         inspection.status === 'DECLINED' ? '❌' : '📅';
          console.log(`       ${statusIcon} ${inspection.inspectionType} - ${inspection.status} (${inspection.scheduledDate.toDateString()})`);
        });
      }
    });

    const missingPropertiesCount = sampleAddresses.length - existingProperties.length;
    if (missingPropertiesCount > 0) {
      console.log(`\n⚠️  ${missingPropertiesCount} sample properties are missing from database`);
    }

    // Check inspections
    let totalSampleInspections = 0;
    for (const property of existingProperties) {
      for (const sampleInspection of sampleInspections) {
        if (sampleInspection.propertyAddress === property.address) {
          const exists = property.inspections.some(inspection => 
            inspection.inspectionType === sampleInspection.inspectionType &&
            inspection.scheduledDate.getTime() === sampleInspection.scheduledDate.getTime()
          );
          if (exists) totalSampleInspections++;
        }
      }
    }

    console.log(`\n🔍 Found ${totalSampleInspections} sample inspections in database`);
    const missingInspectionsCount = sampleInspections.length - totalSampleInspections;
    if (missingInspectionsCount > 0) {
      console.log(`   ⚠️  ${missingInspectionsCount} sample inspections are missing from database`);
    }

    // Check calls
    let totalSampleCalls = 0;
    for (const property of existingProperties) {
      for (const sampleCall of sampleCalls) {
        if (sampleCall.propertyAddress === property.address) {
          const exists = property.calls.some(call => 
            call.contactName === sampleCall.contactName &&
            call.purpose === sampleCall.purpose
          );
          if (exists) totalSampleCalls++;
        }
      }
    }

    console.log(`\n📞 Found ${totalSampleCalls} sample calls in database`);
    const missingCallsCount = sampleCalls.length - totalSampleCalls;
    if (missingCallsCount > 0) {
      console.log(`   ⚠️  ${missingCallsCount} sample calls are missing from database`);
    }

    // Summary
    console.log(`\n📊 Overall Summary:`);
    console.log(`   • Properties: ${existingProperties.length}/${sampleProperties.length}`);
    console.log(`   • Inspections: ${totalSampleInspections}/${sampleInspections.length}`);
    console.log(`   • Calls: ${totalSampleCalls}/${sampleCalls.length}`);

  } catch (error) {
    console.error('❌ Error checking status:', error);
    throw error;
  }
}

async function main() {
  const command = process.argv[2];

  console.log('🚀 Test Leads Sample Data Manager\n');

  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    switch (command) {
      case 'add':
        await addSampleProperties();
        break;
      
      case 'add-all':
        await addSampleProperties();
        await addSampleInspections();
        await addSampleCalls();
        break;
      
      case 'add-inspections':
        await addSampleInspections();
        break;
      
      case 'add-calls':
        await addSampleCalls();
        break;
      
      case 'remove':
        await removeSampleProperties();
        break;
      
      case 'remove-all':
        await removeSampleCalls();
        await removeSampleInspections();
        await removeSampleProperties();
        break;
      
      case 'remove-inspections':
        await removeSampleInspections();
        break;
      
      case 'remove-calls':
        await removeSampleCalls();
        break;
      
      case 'status':
        await showStatus();
        break;
      
      default:
        console.log('Usage: node manage-sample-data.js <command>\n');
        console.log('Commands:');
        console.log('  add                - Add sample properties to database');
        console.log('  add-all            - Add sample properties, inspections, and calls');
        console.log('  add-inspections    - Add sample inspections (requires properties)');
        console.log('  add-calls          - Add sample calls (requires properties)');
        console.log('  remove             - Remove sample properties from database');
        console.log('  remove-all         - Remove sample calls, inspections, and properties');
        console.log('  remove-inspections - Remove sample inspections only');
        console.log('  remove-calls       - Remove sample calls only');
        console.log('  status             - Show current status of sample data');
        console.log('\nData Relationships:');
        console.log('  • Properties: 10 sample properties across Georgia');
        console.log('  • Inspections: 10 realistic inspections with findings');
        console.log('  • Calls: 18 realistic call records with customer interactions');
        console.log('\nExamples:');
        console.log('  node manage-sample-data.js add-all       # Add complete sample dataset');
        console.log('  node manage-sample-data.js add-calls     # Add calls to existing properties');
        console.log('  node manage-sample-data.js remove-calls  # Remove calls but keep properties');
        console.log('  node manage-sample-data.js status        # Check what data is currently loaded');
        break;
    }

  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('\n✅ Disconnected from database');
  }
}

main(); 