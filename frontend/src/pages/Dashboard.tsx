import React, { useEffect, useState } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  LinearProgress,
  Alert,
  CircularProgress,
  Chip,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  Phone,
  Home,
  Assignment,
  CheckCircle,
  Schedule,
  Warning,
  Person,
  PhoneInTalk,
  Visibility,
  Business,
  Factory,
  LocationCity,
  AccessTime,
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

interface DashboardStats {
  totalCalls: number
  totalProperties: number
  totalInspections: number
  completedInspections: number
}

interface RecentActivity {
  text: string
  id: string
}

interface CallReminder {
  id: string
  contactName: string
  contactPhone?: string
  purpose: string
  notes?: string
  reminderDate: string
  createdAt: string
  property: {
    id: string
    address: string
    city: string
    state: string
    zipCode: string
  }
  madeBy: {
    id: string
    firstName: string
    lastName: string
  }
}

interface RecentProperty {
  id: string
  address: string
  city: string
  state: string
  zipCode: string
  propertyType: 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL' | 'MIXED_USE'
  description?: string
  createdAt: string
  createdBy: {
    id: string
    firstName: string
    lastName: string
  }
  _count: {
    calls: number
    inspections: number
  }
}

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats>({
    totalCalls: 0,
    totalProperties: 0,
    totalInspections: 0,
    completedInspections: 0,
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [upcomingReminders, setUpcomingReminders] = useState<CallReminder[]>([])
  const [overdueReminders, setOverdueReminders] = useState<CallReminder[]>([])
  const [recentProperties, setRecentProperties] = useState<RecentProperty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch call reminders for all users (not just admin/manager)
      const [upcomingResponse, overdueResponse, recentPropertiesResponse] = await Promise.all([
        api.get('/calls/reminders/upcoming'),
        api.get('/calls/reminders/overdue'),
        api.get('/properties?page=1&limit=5'), // Fetch 5 most recent properties
      ])

      setUpcomingReminders(upcomingResponse.data.data.calls || [])
      setOverdueReminders(overdueResponse.data.data.calls || [])
      setRecentProperties(recentPropertiesResponse.data.data.properties || [])

      // Only fetch stats if user has permission (ADMIN or MANAGER)
      if (user?.role === 'ADMIN' || user?.role === 'MANAGER') {
        const [propertiesResponse, inspectionsResponse, callsResponse] = await Promise.all([
          api.get('/properties/stats/overview'),
          api.get('/inspections/stats/overview'),
          api.get('/calls/stats/overview'),
        ])

        const propertyStats = propertiesResponse.data.data.overview
        const inspectionStats = inspectionsResponse.data.data.overview
        const callStats = callsResponse.data.data.overview

        setStats({
          totalCalls: callStats.totalCalls || 0,
          totalProperties: propertyStats.totalProperties || 0,
          totalInspections: inspectionStats.totalInspections || 0,
          completedInspections: inspectionStats.completedInspections || 0,
        })

        // Build recent activity from the recent data
        const activities: RecentActivity[] = []
        
        // Add recent calls
        if (callsResponse.data.data.recentCalls?.length > 0) {
          callsResponse.data.data.recentCalls.slice(0, 2).forEach((call: any, index: number) => {
            activities.push({
              id: `call-${index}`,
              text: `Call made to ${call.contactName} for ${call.property?.address || 'Property'}`
            })
          })
        }

        // Add recent inspections
        if (inspectionsResponse.data.data.upcomingInspections?.length > 0) {
          inspectionsResponse.data.data.upcomingInspections.slice(0, 1).forEach((inspection: any, index: number) => {
            activities.push({
              id: `inspection-${index}`,
              text: `Upcoming inspection at ${inspection.property?.address || 'Property'}`
            })
          })
        }

        setRecentActivity(activities)
      } else {
        // For non-admin users, show limited stats or redirect to their specific view
        setStats({
          totalCalls: 0,
          totalProperties: 0,
          totalInspections: 0,
          completedInspections: 0,
        })
        setRecentActivity([
          { id: '1', text: 'Welcome to the WDO Inspection Manager' },
          { id: '2', text: 'Check your assigned inspections and calls' },
        ])
      }
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const formatDateRelative = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      return 'Less than 1 hour'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hour${Math.floor(diffInHours) !== 1 ? 's' : ''}`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''}`
    }
  }

  const handleViewProperty = (propertyId: string) => {
    navigate(`/properties?view=${propertyId}`)
  }

  const StatCard = ({ title, value, icon, color }: any) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="h6">
              {title}
            </Typography>
            <Typography variant="h4" component="h2">
              {loading ? <CircularProgress size={24} /> : value}
            </Typography>
          </Box>
          <Box color={color}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )

  if (loading && stats.totalCalls === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {user?.role !== 'ADMIN' && user?.role !== 'MANAGER' && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Limited dashboard view. Contact your administrator for full statistics access.
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Overview Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Calls"
            value={stats.totalCalls}
            icon={<Phone fontSize="large" />}
            color="primary.main"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Properties"
            value={stats.totalProperties}
            icon={<Home fontSize="large" />}
            color="success.main"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Inspections"
            value={stats.totalInspections}
            icon={<Assignment fontSize="large" />}
            color="warning.main"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed"
            value={stats.completedInspections}
            icon={<CheckCircle fontSize="large" />}
            color="info.main"
          />
        </Grid>

        {/* Progress Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Inspection Progress
            </Typography>
            <Box mt={2}>
              <Typography variant="body2" color="textSecondary">
                Completion Rate: {stats.totalInspections > 0 ? Math.round((stats.completedInspections / stats.totalInspections) * 100) : 0}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={stats.totalInspections > 0 ? (stats.completedInspections / stats.totalInspections) * 100 : 0}
                sx={{ mt: 1, height: 8, borderRadius: 4 }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <Typography key={activity.id} variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  • {activity.text}
                </Typography>
              ))
            ) : (
              <Typography variant="body2" color="textSecondary">
                No recent activity to display
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Call Reminders Section */}
        <Grid item xs={12}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 2, mb: 3 }}>
            Call Reminders
          </Typography>
        </Grid>

        {/* Overdue Reminders */}
        {overdueReminders.length > 0 && (
          <Grid item xs={12}>
            <Card sx={{ border: '1px solid', borderColor: 'error.main', bgcolor: 'error.50' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Warning color="error" />
                  <Typography variant="h6" color="error.main" fontWeight="600">
                    Overdue Call Reminders ({overdueReminders.length})
                  </Typography>
                </Box>
                <Stack spacing={2}>
                  {overdueReminders.map((reminder) => (
                    <Card key={reminder.id} variant="outlined" sx={{ bgcolor: 'white' }}>
                      <CardContent sx={{ pb: '16px !important' }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} md={8}>
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                              <Person fontSize="small" color="action" />
                              <Typography variant="subtitle1" fontWeight="600">
                                {reminder.contactName}
                              </Typography>
                              {reminder.contactPhone && (
                                <Typography variant="body2" color="textSecondary">
                                  • {reminder.contactPhone}
                                </Typography>
                              )}
                            </Box>
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                              📍 {reminder.property.address}, {reminder.property.city}, {reminder.property.state}
                            </Typography>
                            <Chip 
                              label={reminder.purpose.replace('_', ' ')} 
                              size="small" 
                              color="primary" 
                              sx={{ mr: 1 }}
                            />
                            <Chip 
                              label={`Overdue by ${formatDateRelative(reminder.reminderDate)}`} 
                              size="small" 
                              color="error"
                            />
                            {reminder.notes && (
                              <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                                "{reminder.notes}"
                              </Typography>
                            )}
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Box display="flex" gap={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                              <Tooltip title="Call Contact">
                                {reminder.contactPhone ? (
                                  <IconButton 
                                    color="primary" 
                                    component="a"
                                    href={`tel:${reminder.contactPhone}`}
                                  >
                                    <PhoneInTalk />
                                  </IconButton>
                                ) : (
                                  <IconButton color="primary" disabled>
                                    <PhoneInTalk />
                                  </IconButton>
                                )}
                              </Tooltip>
                              <Tooltip title="View Property">
                                <IconButton 
                                  color="info"
                                  onClick={() => handleViewProperty(reminder.property.id)}
                                >
                                  <Visibility />
                                </IconButton>
                              </Tooltip>
                            </Box>
                            <Typography variant="caption" color="textSecondary" display="block" textAlign={{ xs: 'left', md: 'right' }}>
                              Set by {reminder.madeBy.firstName} {reminder.madeBy.lastName}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Upcoming Reminders */}
        <Grid item xs={12}>
          <Card sx={{ border: '1px solid', borderColor: upcomingReminders.length > 0 ? 'warning.main' : 'divider' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Schedule color={upcomingReminders.length > 0 ? "warning" : "action"} />
                <Typography variant="h6" fontWeight="600">
                  Upcoming Call Reminders ({upcomingReminders.length})
                </Typography>
              </Box>
              {upcomingReminders.length > 0 ? (
                <Stack spacing={2}>
                  {upcomingReminders.map((reminder) => (
                    <Card key={reminder.id} variant="outlined">
                      <CardContent sx={{ pb: '16px !important' }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} md={8}>
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                              <Person fontSize="small" color="action" />
                              <Typography variant="subtitle1" fontWeight="600">
                                {reminder.contactName}
                              </Typography>
                              {reminder.contactPhone && (
                                <Typography variant="body2" color="textSecondary">
                                  • {reminder.contactPhone}
                                </Typography>
                              )}
                            </Box>
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                              📍 {reminder.property.address}, {reminder.property.city}, {reminder.property.state}
                            </Typography>
                            <Chip 
                              label={reminder.purpose.replace('_', ' ')} 
                              size="small" 
                              color="primary" 
                              sx={{ mr: 1 }}
                            />
                            <Chip 
                              label={`Due ${formatDate(reminder.reminderDate)}`} 
                              size="small" 
                              color="warning"
                            />
                            {reminder.notes && (
                              <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                                "{reminder.notes}"
                              </Typography>
                            )}
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Box display="flex" gap={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                              <Tooltip title="Call Contact">
                                {reminder.contactPhone ? (
                                  <IconButton 
                                    color="primary" 
                                    component="a"
                                    href={`tel:${reminder.contactPhone}`}
                                  >
                                    <PhoneInTalk />
                                  </IconButton>
                                ) : (
                                  <IconButton color="primary" disabled>
                                    <PhoneInTalk />
                                  </IconButton>
                                )}
                              </Tooltip>
                              <Tooltip title="View Property">
                                <IconButton 
                                  color="info"
                                  onClick={() => handleViewProperty(reminder.property.id)}
                                >
                                  <Visibility />
                                </IconButton>
                              </Tooltip>
                            </Box>
                            <Typography variant="caption" color="textSecondary" display="block" textAlign={{ xs: 'left', md: 'right' }}>
                              Set by {reminder.madeBy.firstName} {reminder.madeBy.lastName}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No upcoming call reminders
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Properties Section */}
        <Grid item xs={12}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 3 }}>
            Recent Properties
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Home color="success" />
                <Typography variant="h6" fontWeight="600">
                  Recently Added Properties ({recentProperties.length})
                </Typography>
              </Box>
              {recentProperties.length > 0 ? (
                <Stack spacing={2}>
                  {recentProperties.map((property) => (
                    <Card key={property.id} variant="outlined" sx={{ 
                      '&:hover': { 
                        borderColor: 'primary.main',
                        boxShadow: 1,
                        cursor: 'pointer'
                      },
                      transition: 'all 0.2s ease'
                    }}>
                      <CardContent sx={{ pb: '16px !important' }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} md={8}>
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                              {property.propertyType === 'RESIDENTIAL' && <Home fontSize="small" color="primary" />}
                              {property.propertyType === 'COMMERCIAL' && <Business fontSize="small" color="secondary" />}
                              {property.propertyType === 'INDUSTRIAL' && <Factory fontSize="small" color="warning" />}
                              {property.propertyType === 'MIXED_USE' && <LocationCity fontSize="small" color="info" />}
                              <Typography variant="subtitle1" fontWeight="600">
                                {property.address}
                              </Typography>
                              <Chip 
                                label={property.propertyType.replace('_', ' ')} 
                                size="small" 
                                color={
                                  property.propertyType === 'RESIDENTIAL' ? 'primary' :
                                  property.propertyType === 'COMMERCIAL' ? 'secondary' :
                                  property.propertyType === 'INDUSTRIAL' ? 'warning' : 'info'
                                }
                                variant="outlined"
                              />
                            </Box>
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                              📍 {property.city}, {property.state} {property.zipCode}
                            </Typography>
                            {property.description && (
                              <Typography variant="body2" color="textSecondary" sx={{ mb: 1, fontStyle: 'italic' }}>
                                {property.description}
                              </Typography>
                            )}
                            <Box display="flex" gap={1} mt={1}>
                              <Chip 
                                label={`${property._count.calls} calls`} 
                                size="small" 
                                variant="outlined"
                                color="primary"
                              />
                              <Chip 
                                label={`${property._count.inspections} inspections`} 
                                size="small" 
                                variant="outlined"
                                color="secondary"
                              />
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Box display="flex" gap={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }} mb={1}>
                              <Tooltip title="View Property">
                                <IconButton 
                                  color="primary"
                                  onClick={() => handleViewProperty(property.id)}
                                >
                                  <Visibility />
                                </IconButton>
                              </Tooltip>
                            </Box>
                            <Typography variant="caption" color="textSecondary" display="block" textAlign={{ xs: 'left', md: 'right' }}>
                              <AccessTime fontSize="inherit" sx={{ mr: 0.5 }} />
                              Added {formatDate(property.createdAt)}
                            </Typography>
                            <Typography variant="caption" color="textSecondary" display="block" textAlign={{ xs: 'left', md: 'right' }}>
                              by {property.createdBy.firstName} {property.createdBy.lastName}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No recent properties to display
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Dashboard 