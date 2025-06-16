# Sample Data Management Scripts

This directory contains scripts for managing sample data in the WDO Inspection Manager application.

## manage-sample-data.js

A comprehensive script for adding, removing, and checking the status of sample properties, inspections, and calls.

### Features

- **Add Sample Properties**: Creates 10 realistic sample properties across different types (residential, commercial, industrial, mixed-use)
- **Add Sample Inspections**: Creates 10 realistic inspections with different types (WDO, TERMITE, PEST, MOISTURE, PREVENTIVE, STRUCTURAL)
- **Add Sample Calls**: Creates 18 realistic call records with customer interactions and communication history
- **Add All Sample Data**: Adds properties, inspections, and calls in one operation
- **Remove Sample Data**: Safely removes sample properties, inspections, and calls
- **Status Check**: Shows which sample data exists with detailed information including recent calls
- **Safety Checks**: Won't delete properties that have calls or inspections associated with them
- **Admin User Management**: Automatically creates an admin user if none exists

### Usage

#### From Host Machine (Docker)

```bash
# Add all sample data (properties + inspections + calls)
docker exec -it testleadsmanager-backend-1 node scripts/manage-sample-data.js add-all

# Add only sample properties
docker exec -it testleadsmanager-backend-1 node scripts/manage-sample-data.js add

# Add only sample inspections (requires properties)
docker exec -it testleadsmanager-backend-1 node scripts/manage-sample-data.js add-inspections

# Add only sample calls (requires properties)
docker exec -it testleadsmanager-backend-1 node scripts/manage-sample-data.js add-calls

# Remove all sample data (calls + inspections + properties)
docker exec -it testleadsmanager-backend-1 node scripts/manage-sample-data.js remove-all

# Remove only sample calls
docker exec -it testleadsmanager-backend-1 node scripts/manage-sample-data.js remove-calls

# Remove only sample inspections
docker exec -it testleadsmanager-backend-1 node scripts/manage-sample-data.js remove-inspections

# Remove only sample properties
docker exec -it testleadsmanager-backend-1 node scripts/manage-sample-data.js remove

# Check status of all sample data
docker exec -it testleadsmanager-backend-1 node scripts/manage-sample-data.js status
```

#### From Backend Container

```bash
# Enter the backend container
docker exec -it testleadsmanager-backend-1 bash

# Then run the script
node scripts/manage-sample-data.js add-all
node scripts/manage-sample-data.js add-calls
node scripts/manage-sample-data.js remove-calls
node scripts/manage-sample-data.js status
```

### Sample Data

#### Properties
The script includes 10 sample properties located across the Atlanta metro area:

1. **1234 Maple Street** - Atlanta, GA (Residential)
2. **5678 Oak Avenue** - Marietta, GA (Residential)  
3. **910 Pine Drive** - Roswell, GA (Residential)
4. **246 Commerce Plaza** - Sandy Springs, GA (Commercial)
5. **135 Industrial Way** - Alpharetta, GA (Industrial)
6. **789 Main Street** - Decatur, GA (Mixed-Use)
7. **321 Peachtree Road** - Atlanta, GA (Residential)
8. **654 Technology Drive** - Norcross, GA (Commercial)
9. **987 Piedmont Avenue** - Atlanta, GA (Residential)
10. **147 Business Center** - Dunwoody, GA (Commercial)

#### Inspections
The script includes 10 sample inspections with realistic findings and recommendations:

1. **1234 Maple Street** - TERMITE inspection (COMPLETED) - Active infestation found
2. **5678 Oak Avenue** - WDO inspection (COMPLETED) - No active activity detected
3. **910 Pine Drive** - PREVENTIVE inspection (COMPLETED) - Minor ant activity
4. **246 Commerce Plaza** - PEST inspection (IN_PROGRESS) - Rodent activity found
5. **135 Industrial Way** - MOISTURE inspection (COMPLETED) - High moisture levels
6. **789 Main Street** - WDO inspection (SCHEDULED) - Comprehensive assessment
7. **321 Peachtree Road** - WDO inspection (COMPLETED) - Pre-renovation clear
8. **654 Technology Drive** - PEST inspection (COMPLETED) - Minor ant trails
9. **987 Piedmont Avenue** - WDO inspection (SCHEDULED) - Pre-sale requirement
10. **147 Business Center** - PREVENTIVE inspection (SCHEDULED) - Annual maintenance

#### Calls
The script includes 18 sample call records with realistic customer interactions:

**Call Types:**
- **Initial Contact**: First customer contact and scheduling
- **Confirmation**: Appointment confirmations
- **Report Delivery**: Inspection report delivery calls
- **Follow-up**: Post-service follow-up calls
- **Complaints**: Customer complaint handling
- **Reminders**: Service appointment reminders

**Sample Call Scenarios:**
- Sarah Johnson (1234 Maple Street): 3 calls - Initial concern, confirmation, and report delivery
- Michael Chen (5678 Oak Avenue): 3 calls - Realtor scheduling, report delivery, post-closing follow-up
- Lisa Martinez (246 Commerce Plaza): 2 calls - Quarterly scheduling and emergency complaint
- David Thompson (135 Industrial Way): 1 call - Follow-up on moisture remediation
- Jennifer Brown (654 Technology Drive): 2 calls - Complaint and follow-up on ant treatment

### Safety Features

- **Duplicate Prevention**: Won't add properties, inspections, or calls that already exist
- **Data Preservation**: Won't delete properties that have associated calls or inspections
- **Relationship Management**: Automatically links calls to related inspections when applicable
- **User Creation**: Automatically creates an admin user if none exists
- **Error Handling**: Gracefully handles database connection issues and errors
- **Detailed Logging**: Provides clear feedback on what actions were taken

### Web UI Integration

Admins and managers can also manage sample data through the web interface:

- Navigate to **Properties** page
- Use **"Add Sample Data"** button to add all sample properties, inspections, and calls
- Use **"Remove Sample Data"** button to safely remove sample data
- Only data without dependencies will be removed safely

### Admin User

If no admin user exists, the script will automatically create one with these credentials:

- **Email**: admin@temp.local
- **Password**: WDOAdmin123!
- **Role**: ADMIN

> **Note**: Change these credentials after first login for security purposes.

### Output Examples

#### Adding All Sample Data
```
🚀 WDO Sample Data Manager

✅ Connected to database

🏠 Adding sample properties...
✅ Added: 1234 Maple Street
✅ Added: 5678 Oak Avenue
...

📊 Summary:
   • Added: 10 properties
   • Skipped: 0 properties (already exist)
   • Total sample properties: 10

🔍 Adding sample inspections...
✅ Added inspection: 1234 Maple Street - TERMITE
✅ Added inspection: 5678 Oak Avenue - WDO
...

📊 Summary:
   • Added: 10 inspections
   • Skipped: 0 inspections (already exist or property not found)
   • Total sample inspections: 10

📞 Adding sample calls...
✅ Added call: 1234 Maple Street - INITIAL_CONTACT (Sarah Johnson)
✅ Added call: 1234 Maple Street - CONFIRMATION (Sarah Johnson)
...

📊 Summary:
   • Added: 18 calls
   • Skipped: 0 calls (already exist or property not found)
   • Total sample calls: 18
```

#### Enhanced Status Check
```
🚀 WDO Sample Data Manager

✅ Connected to database

📋 Sample Data Status:

🏠 Found 10 sample properties in database:
   • 1234 Maple Street (RESIDENTIAL)
     📞 3 calls, 🔍 1 inspections
     Recent calls:
       📱 REPORT_DELIVERY to Sarah Johnson ✅ (Mon Jun 10 2024)
       📱 CONFIRMATION to Sarah Johnson ✅ (Thu Jun 13 2024)
       📞 INITIAL_CONTACT to Sarah Johnson 📅 (Wed Jun 05 2024)
     Inspections:
       ✅ TERMITE - COMPLETED (Mon Jun 10 2024)
   • 5678 Oak Avenue (RESIDENTIAL)
     📞 3 calls, 🔍 1 inspections
     Recent calls:
       📱 FOLLOW_UP to Michael Chen ✅ (Tue Jun 18 2024)
       📱 REPORT_DELIVERY to Michael Chen ✅ (Sat Jun 15 2024)
       📱 INITIAL_CONTACT to Michael Chen 📅 (Thu Jun 06 2024)
     Inspections:
       ✅ WDO - COMPLETED (Sat Jun 15 2024)
...

🔍 Found 10 sample inspections in database

📞 Found 18 sample calls in database

📊 Overall Summary:
   • Properties: 10/10
   • Inspections: 10/10
   • Calls: 18/18
```

### Command Reference

| Command | Description |
|---------|-------------|
| `add` | Add sample properties only |
| `add-all` | Add properties, inspections, and calls |
| `add-inspections` | Add inspections (requires existing properties) |
| `add-calls` | Add calls (requires existing properties) |
| `remove` | Remove sample properties only |
| `remove-all` | Remove calls, inspections, and properties |
| `remove-inspections` | Remove inspections only |
| `remove-calls` | Remove calls only |
| `status` | Show detailed status of all sample data | 