import React from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  LinearProgress,
} from '@mui/material'
import {
  People,
  Home,
  Assignment,
  CheckCircle,
} from '@mui/icons-material'

const Dashboard: React.FC = () => {
  // Mock data - replace with actual API calls
  const stats = {
    totalLeads: 156,
    totalProperties: 89,
    totalInspections: 234,
    completedInspections: 198,
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
              {value}
            </Typography>
          </Box>
          <Box color={color}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      
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
                Completion Rate: {Math.round((stats.completedInspections / stats.totalInspections) * 100)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(stats.completedInspections / stats.totalInspections) * 100}
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
            <Typography variant="body2" color="textSecondary">
              • New lead added for 123 Main St
            </Typography>
            <Typography variant="body2" color="textSecondary">
              • Inspection completed at 456 Oak Ave
            </Typography>
            <Typography variant="body2" color="textSecondary">
              • Property registered: 789 Pine Rd
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Dashboard 