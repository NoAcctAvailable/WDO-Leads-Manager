import React from 'react'
import { Box, Typography, Container, Paper, Breadcrumbs, Link } from '@mui/material'
import { Home as HomeIcon, Settings as SettingsIcon } from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import StreetViewSettings from '../components/StreetViewSettings'

const Settings: React.FC = () => {
  const { user } = useAuth()

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
            Settings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure application settings and integrations
          </Typography>
        </Box>

        {/* Settings Sections */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          
          {/* Street View Settings */}
          <Paper sx={{ p: 0 }}>
            <StreetViewSettings />
          </Paper>

          {/* User Information */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              User Information
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 2 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Name
                </Typography>
                <Typography>
                  {user?.firstName} {user?.lastName}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Email
                </Typography>
                <Typography>{user?.email}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Role
                </Typography>
                <Typography>{user?.role}</Typography>
              </Box>
            </Box>
          </Paper>

          {/* Application Information */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Application Information
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 2 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Application Name
                </Typography>
                <Typography>WDO Inspection Manager</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Version
                </Typography>
                <Typography>1.0.0</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Environment
                </Typography>
                <Typography>
                  {process.env.NODE_ENV === 'production' ? 'Production' : 'Development'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  API Endpoint
                </Typography>
                <Typography>
                  {process.env.REACT_APP_API_URL || 'http://localhost:3001'}
                </Typography>
              </Box>
            </Box>
          </Paper>

        </Box>
      </Box>
    </Container>
  )
}

export default Settings 