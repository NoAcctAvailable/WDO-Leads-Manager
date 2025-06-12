import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Alert,
  Grid,
  Box,
} from '@mui/material'
import { authApi } from '../services/api'

interface FirstLoginDialogProps {
  open: boolean
  currentUser: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
  }
  onComplete: (updatedUser: any) => void
}

const FirstLoginDialog: React.FC<FirstLoginDialogProps> = ({
  open,
  currentUser,
  onComplete,
}) => {
  const [formData, setFormData] = useState({
    currentPassword: 'WDOAdmin123!', // Pre-fill with temp password
    newPassword: '',
    confirmPassword: '',
    firstName: currentUser.firstName,
    lastName: currentUser.lastName,
    email: currentUser.email,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }))
    if (error) setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (formData.newPassword.length < 6) {
      setError('New password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const response = await authApi.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
      })

      onComplete(response.data.data.user)
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 
                          error.response?.data?.errors?.[0]?.msg ||
                          'Failed to update password and profile'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog 
      open={open} 
      maxWidth="sm" 
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: { minHeight: '600px' }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        Welcome to WDO Leads Manager
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            For security reasons, you must change your temporary password and update your profile information before proceeding.
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            <strong>First Time Setup Required</strong><br />
            Please set a secure password and verify your profile information.
          </Alert>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Typography variant="h6" sx={{ mb: 2 }}>Password</Typography>
          
          <TextField
            fullWidth
            type="password"
            label="Current Password"
            value={formData.currentPassword}
            onChange={handleChange('currentPassword')}
            margin="normal"
            required
            helperText="Your temporary password"
          />

          <TextField
            fullWidth
            type="password"
            label="New Password"
            value={formData.newPassword}
            onChange={handleChange('newPassword')}
            margin="normal"
            required
            helperText="Must be at least 6 characters"
          />

          <TextField
            fullWidth
            type="password"
            label="Confirm New Password"
            value={formData.confirmPassword}
            onChange={handleChange('confirmPassword')}
            margin="normal"
            required
          />

          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Profile Information</Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.firstName}
                onChange={handleChange('firstName')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={handleChange('lastName')}
                required
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            type="email"
            label="Email Address"
            value={formData.email}
            onChange={handleChange('email')}
            margin="normal"
            required
            helperText="This will be your login email"
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button
          onClick={handleSubmit}
          variant="contained"
          fullWidth
          size="large"
          disabled={loading}
          sx={{ py: 1.5 }}
        >
          {loading ? 'Updating...' : 'Complete Setup'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default FirstLoginDialog 