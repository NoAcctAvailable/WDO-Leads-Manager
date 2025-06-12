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
} from '@mui/material'
import {
  People,
  Home,
  Assignment,
  CheckCircle,
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

interface DashboardStats {
  totalLeads: number
  totalProperties: number
  totalInspections: number
  completedInspections: number
}

interface RecentActivity {
  text: string
  id: string
}

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    totalProperties: 0,
    totalInspections: 0,
    completedInspections: 0,
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Only fetch stats if user has permission (ADMIN or MANAGER)
      if (user?.role === 'ADMIN' || user?.role === 'MANAGER') {
        const [propertiesResponse, inspectionsResponse, leadsResponse] = await Promise.all([
          api.get('/properties/stats/overview'),
          api.get('/inspections/stats/overview'),
          api.get('/leads/stats/overview'),
        ])

        const propertyStats = propertiesResponse.data.data.overview
        const inspectionStats = inspectionsResponse.data.data.overview
        const leadStats = leadsResponse.data.data.overview

        setStats({
          totalLeads: leadStats.totalLeads || 0,
          totalProperties: propertyStats.totalProperties || 0,
          totalInspections: inspectionStats.totalInspections || 0,
          completedInspections: inspectionStats.completedInspections || 0,
        })

        // Build recent activity from the recent data
        const activities: RecentActivity[] = []
        
        // Add recent leads
        if (leadsResponse.data.data.recentLeads?.length > 0) {
          leadsResponse.data.data.recentLeads.slice(0, 2).forEach((lead: any, index: number) => {
            activities.push({
              id: `lead-${index}`,
              text: `New lead added: ${lead.contactName} for ${lead.property?.address || 'Property'}`
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
          totalLeads: 0,
          totalProperties: 0,
          totalInspections: 0,
          completedInspections: 0,
        })
        setRecentActivity([
          { id: '1', text: 'Welcome to the WDO Leads Manager' },
          { id: '2', text: 'Check your assigned leads and inspections' },
        ])
      }
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
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

  if (loading && stats.totalLeads === 0) {
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
            title="Total Leads"
            value={stats.totalLeads}
            icon={<People fontSize="large" />}
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
      </Grid>
    </Box>
  )
}

export default Dashboard 