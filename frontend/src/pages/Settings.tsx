import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Container,
  Paper,
  Breadcrumbs,
  Link,
  Tabs,
  Tab,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Alert,
  CircularProgress,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import {
  Home as HomeIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  DataObject as DataIcon,
  Assignment as InspectionIcon,
  Api as ApiIcon,
  Security as SecurityIcon,
  Visibility as ViewIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import StreetViewSettings from '../components/StreetViewSettings'
import api from '../services/api'

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

const Settings: React.FC = () => {
  const { user } = useAuth()
  const [tabValue, setTabValue] = useState(0)
  // Removed unused loading state
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [sampleDataLoading, setSampleDataLoading] = useState(false)
  const [inspectionTypes, setInspectionTypes] = useState<any[]>([])
  const [sampleDataStatus, setSampleDataStatus] = useState<any>(null)

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null)
        setSuccess(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleAddSampleData = async () => {
    try {
      setSampleDataLoading(true)
      setError(null)
      
      const response = await api.post('/settings/sample-data/add-all')
      setSuccess(response.data.message)
      await fetchSampleDataStatus()
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to add sample data')
    } finally {
      setSampleDataLoading(false)
    }
  }

  const handleRemoveSampleData = async () => {
    if (!window.confirm('Are you sure you want to remove all sample data? This will delete sample properties, inspections, and calls.')) {
      return
    }

    try {
      setSampleDataLoading(true)
      setError(null)

      const response = await api.delete('/settings/sample-data/remove-all')
      setSuccess(response.data.message)
      await fetchSampleDataStatus()
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to remove sample data')
    } finally {
      setSampleDataLoading(false)
    }
  }

  const fetchSampleDataStatus = async () => {
    try {
      const response = await api.get('/settings/sample-data/status')
      // Parse the output to extract status information
      const output = response.data.data.output
      const lines = output.split('\n')
      
      let properties = 0, inspections = 0, calls = 0
      let totalProperties = 0, totalInspections = 0, totalCalls = 0
      
      lines.forEach((line: string) => {
        if (line.includes('Properties:')) {
          const match = line.match(/Properties: (\d+)\/(\d+)/)
          if (match) {
            properties = parseInt(match[1])
            totalProperties = parseInt(match[2])
          }
        }
        if (line.includes('Inspections:')) {
          const match = line.match(/Inspections: (\d+)\/(\d+)/)
          if (match) {
            inspections = parseInt(match[1])
            totalInspections = parseInt(match[2])
          }
        }
        if (line.includes('Calls:')) {
          const match = line.match(/Calls: (\d+)\/(\d+)/)
          if (match) {
            calls = parseInt(match[1])
            totalCalls = parseInt(match[2])
          }
        }
      })

      setSampleDataStatus({
        properties: { current: properties, total: totalProperties },
        inspections: { current: inspections, total: totalInspections },
        calls: { current: calls, total: totalCalls }
      })
    } catch (error) {
      console.error('Failed to fetch sample data status:', error)
    }
  }

  const fetchInspectionTypes = async () => {
    try {
      // This would fetch inspection type configurations
      // For now, we'll show the built-in enum values
      setInspectionTypes([
        { id: 'FULL_INSPECTION', name: 'Full Inspection', description: 'Complete property inspection including all areas' },
        { id: 'LIMITED_INSPECTION', name: 'Limited Inspection', description: 'Focused inspection of specific areas' },
        { id: 'RE_INSPECTION', name: 'Re-Inspection', description: 'Follow-up inspection after treatment' },
        { id: 'EXCLUSION', name: 'Exclusion', description: 'Identify and exclude pest entry points' }
      ])
    } catch (error: any) {
      setError('Failed to fetch inspection types')
    }
  }

  useEffect(() => {
    fetchSampleDataStatus()
    fetchInspectionTypes()
  }, [])

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link
            color="inherit"
            href="/dashboard"
            sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Dashboard
          </Link>
          <Typography
            color="text.primary"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <SettingsIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Settings
          </Typography>
        </Breadcrumbs>

        {/* Page Header */}
        <Box mb={4}>
          <Typography variant="h4" component="h1" gutterBottom>
            System Settings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure application settings, manage data, and view system information
          </Typography>
        </Box>

        {/* Alert Messages */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Settings Tabs */}
        <Paper sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="settings tabs">
              <Tab 
                icon={<DataIcon />} 
                label="Sample Data" 
                iconPosition="start"
                {...a11yProps(0)} 
              />
              <Tab 
                icon={<InspectionIcon />} 
                label="Inspection Types" 
                iconPosition="start"
                {...a11yProps(1)} 
              />
              <Tab 
                icon={<ApiIcon />} 
                label="API & System" 
                iconPosition="start"
                {...a11yProps(2)} 
              />
              <Tab 
                icon={<ViewIcon />} 
                label="Integrations" 
                iconPosition="start"
                {...a11yProps(3)} 
              />
              <Tab 
                icon={<SecurityIcon />} 
                label="User Info" 
                iconPosition="start"
                {...a11yProps(4)} 
              />
            </Tabs>
          </Box>

          {/* Sample Data Management Tab */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Sample Data Management
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Manage sample properties, inspections, and calls for testing and demonstration purposes.
                </Typography>
              </Grid>

              {/* Sample Data Status */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Current Sample Data
                    </Typography>
                    {sampleDataStatus ? (
                      <Stack spacing={2}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2">Properties:</Typography>
                          <Chip 
                            label={`${sampleDataStatus.properties.current}/${sampleDataStatus.properties.total}`}
                            color={sampleDataStatus.properties.current > 0 ? "success" : "default"}
                            size="small"
                          />
                        </Box>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2">Inspections:</Typography>
                          <Chip 
                            label={`${sampleDataStatus.inspections.current}/${sampleDataStatus.inspections.total}`}
                            color={sampleDataStatus.inspections.current > 0 ? "success" : "default"}
                            size="small"
                          />
                        </Box>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2">Calls:</Typography>
                          <Chip 
                            label={`${sampleDataStatus.calls.current}/${sampleDataStatus.calls.total}`}
                            color={sampleDataStatus.calls.current > 0 ? "success" : "default"}
                            size="small"
                          />
                        </Box>
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Loading status...
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<RefreshIcon />}
                      onClick={fetchSampleDataStatus}
                    >
                      Refresh Status
                    </Button>
                  </CardActions>
                </Card>
              </Grid>

              {/* Sample Data Actions */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Data Management Actions
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Add or remove complete sample dataset including properties, inspections, and calls.
                    </Typography>
                    <Stack spacing={2}>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={sampleDataLoading ? <CircularProgress size={20} /> : <AddIcon />}
                        onClick={handleAddSampleData}
                        disabled={sampleDataLoading}
                        fullWidth
                      >
                        Add Complete Sample Dataset
                      </Button>
                      <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={sampleDataLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
                        onClick={handleRemoveSampleData}
                        disabled={sampleDataLoading}
                        fullWidth
                      >
                        Remove All Sample Data
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* Sample Data Details */}
              <Grid item xs={12}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">Sample Data Details</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle1" gutterBottom>Properties (10)</Typography>
                        <Typography variant="body2" color="text.secondary">
                          • Residential, Commercial, Industrial, Mixed-Use<br/>
                          • Located across Atlanta metro area<br/>
                          • Realistic addresses and descriptions<br/>
                          • Unique address constraint enforced
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle1" gutterBottom>Inspections (10)</Typography>
                        <Typography variant="body2" color="text.secondary">
                          • Modern inspection types (Full, Limited, Re-Inspection, Exclusion)<br/>
                          • Realistic findings and recommendations<br/>
                          • Various status states<br/>
                          • Proper cost calculations
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle1" gutterBottom>Calls (18)</Typography>
                        <Typography variant="body2" color="text.secondary">
                          • Realistic customer interactions<br/>
                          • Various call purposes and outcomes<br/>
                          • Linked to properties and inspections<br/>
                          • Contact information included
                        </Typography>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Inspection Types Tab */}
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Inspection Types Configuration
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Manage available inspection types and their configurations.
                </Typography>
              </Grid>

              {inspectionTypes.map((type) => (
                <Grid item xs={12} md={6} key={type.id}>
                  <Card>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box flex={1}>
                          <Typography variant="h6" gutterBottom>
                            {type.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {type.description}
                          </Typography>
                          <Chip 
                            label={type.id} 
                            size="small" 
                            variant="outlined"
                            sx={{ fontFamily: 'monospace' }}
                          />
                        </Box>
                        <Chip 
                          label="Active" 
                          color="success" 
                          size="small"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          {/* API & System Tab */}
          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  API & System Information
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  View system configuration and API endpoint information.
                </Typography>
              </Grid>

              {/* Application Information */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Application Information
                    </Typography>
                    <Stack spacing={2}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Name:</Typography>
                        <Typography variant="body2">Test Leads Manager</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Version:</Typography>
                        <Typography variant="body2">1.0.0</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Environment:</Typography>
                        <Chip 
                          label={process.env.NODE_ENV === 'production' ? 'Production' : 'Development'}
                          color={process.env.NODE_ENV === 'production' ? 'error' : 'warning'}
                          size="small"
                        />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* API Information */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      API Configuration
                    </Typography>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Base URL:</Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                          {process.env.REACT_APP_API_URL || 'http://localhost:3001'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Available Endpoints:</Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          /api/auth, /api/properties, /api/inspections,<br/>
                          /api/calls, /api/contacts, /api/users,<br/>
                          /api/settings
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* Database Information */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Database Configuration
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={4}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Database Type:</Typography>
                          <Typography variant="body2">PostgreSQL</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">ORM:</Typography>
                          <Typography variant="body2">Prisma</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Connection:</Typography>
                          <Chip label="Connected" color="success" size="small" />
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Integrations Tab */}
          <TabPanel value={tabValue} index={3}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  External Integrations
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Configure external service integrations and API connections.
                </Typography>
              </Grid>

              {/* Street View Settings */}
              <Grid item xs={12}>
                <Paper sx={{ p: 0 }}>
                  <StreetViewSettings />
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          {/* User Information Tab */}
          <TabPanel value={tabValue} index={4}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  User Information
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  View your account information and permissions.
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Account Details
                    </Typography>
                    <Stack spacing={2}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Name:</Typography>
                        <Typography variant="body2">
                          {user?.firstName} {user?.lastName}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Email:</Typography>
                        <Typography variant="body2">{user?.email}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Role:</Typography>
                        <Chip 
                          label={user?.role} 
                          color={user?.role === 'ADMIN' ? 'error' : user?.role === 'MANAGER' ? 'warning' : 'primary'}
                          size="small"
                        />
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Status:</Typography>
                        <Chip 
                          label="Active" 
                          color="success"
                          size="small"
                        />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Permissions
                    </Typography>
                    <Stack spacing={1}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">View Properties:</Typography>
                        <Chip label="✓" color="success" size="small" />
                      </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">Manage Properties:</Typography>
                        <Chip 
                          label={['ADMIN', 'MANAGER'].includes(user?.role || '') ? '✓' : '✗'} 
                          color={['ADMIN', 'MANAGER'].includes(user?.role || '') ? 'success' : 'default'} 
                          size="small" 
                        />
                      </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">User Management:</Typography>
                        <Chip 
                          label={user?.role === 'ADMIN' ? '✓' : '✗'} 
                          color={user?.role === 'ADMIN' ? 'success' : 'default'} 
                          size="small" 
                        />
                      </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">System Settings:</Typography>
                        <Chip 
                          label={['ADMIN', 'MANAGER'].includes(user?.role || '') ? '✓' : '✗'} 
                          color={['ADMIN', 'MANAGER'].includes(user?.role || '') ? 'success' : 'default'} 
                          size="small" 
                        />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  )
}

export default Settings 