import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Chip,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from '@mui/material'
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as ManagerIcon,
  Engineering as InspectorIcon,
  Phone as CallsIcon,
  Home as PropertiesIcon,
  Email as EmailIcon,
  Schedule as ScheduleIcon,
  CheckCircle as ActiveIcon,
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import { authApi } from '../services/api'

interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'ADMIN' | 'MANAGER' | 'INSPECTOR' | 'USER'
  active: boolean
  employeeId?: string
  createdAt: string
  updatedAt: string
  _count?: {
    calls: number
    inspections: number
    createdProperties: number
  }
}

interface ProfileFormData {
  firstName: string
  lastName: string
  email: string
  employeeId: string
}

interface PasswordFormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

const Profile: React.FC = () => {
  const { updateUserAndToken } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Edit mode states
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  
  // Form states
  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    email: '',
    employeeId: '',
  })
  
  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await authApi.getProfile()
      const profileData = response.data.data
      setProfile(profileData)
      setProfileForm({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        employeeId: profileData.employeeId || '',
      })
      setError(null)
    } catch (error: any) {
      setError('Failed to load profile data')
      console.error('Profile fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProfileSubmit = async () => {
    try {
      setError(null) // Clear any previous errors
      const response = await authApi.updateProfile(profileForm)
      console.log('Profile update response:', response.data) // Debug logging
      
      const updatedUser = response.data.data
      
      if (!updatedUser) {
        throw new Error('Invalid response: user data not found')
      }
      
      // Update local state and auth context
      setProfile(updatedUser)
      
      // Only call updateUserAndToken if we have valid user data
      if (updatedUser.id && updatedUser.email) {
        // Extract only the User interface fields for auth context
        const userForAuth = {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          role: updatedUser.role,
          isFirstLogin: false // Profile updates never set this to true
        }
        updateUserAndToken(userForAuth)
      }
      
      setIsEditingProfile(false)
      setSuccess('Profile updated successfully')
    } catch (error: any) {
      console.error('Profile update error:', error)
      const errorMessage = error.response?.data?.error?.message || 
                          error.response?.data?.message ||
                          error.message ||
                          'Failed to update profile'
      setError(errorMessage)
    }
  }

  const handlePasswordSubmit = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setError('New password must be at least 6 characters')
      return
    }

    try {
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setIsPasswordDialogOpen(false)
      setSuccess('Password changed successfully')
    } catch (error: any) {
      setError(error.response?.data?.error?.message || 'Failed to change password')
    }
  }

  const handleCancelEdit = () => {
    if (profile) {
      setProfileForm({
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        employeeId: profile.employeeId || '',
      })
    }
    setIsEditingProfile(false)
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <AdminIcon />
      case 'MANAGER': return <ManagerIcon />
      case 'INSPECTOR': return <InspectorIcon />
      default: return <PersonIcon />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'error'
      case 'MANAGER': return 'warning'
      case 'INSPECTOR': return 'info'
      default: return 'default'
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (!profile) {
    return (
      <Alert severity="error">Failed to load profile data</Alert>
    )
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        My Profile
      </Typography>

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

      <Grid container spacing={3}>
        {/* Profile Header Card */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={3}>
                <Avatar
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    fontSize: '2rem',
                    bgcolor: 'primary.main'
                  }}
                >
                  {getInitials(profile.firstName, profile.lastName)}
                </Avatar>
                <Box flex={1}>
                  <Typography variant="h5" gutterBottom>
                    {profile.firstName} {profile.lastName}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={2} mb={1}>
                    <Chip
                      label={profile.role}
                      color={getRoleColor(profile.role) as any}
                      icon={getRoleIcon(profile.role)}
                      size="small"
                    />
                    <Chip
                      label={profile.active ? 'Active' : 'Inactive'}
                      color={profile.active ? 'success' : 'default'}
                      icon={<ActiveIcon />}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    Member since {new Date(profile.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
                <Box>
                  <Button
                    variant="outlined"
                    startIcon={<LockIcon />}
                    onClick={() => setIsPasswordDialogOpen(true)}
                    sx={{ mr: 1 }}
                  >
                    Change Password
                  </Button>
                  {!isEditingProfile ? (
                    <Button
                      variant="contained"
                      startIcon={<EditIcon />}
                      onClick={() => setIsEditingProfile(true)}
                    >
                      Edit Profile
                    </Button>
                  ) : (
                    <Box display="inline-flex" gap={1}>
                      <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleProfileSubmit}
                        color="primary"
                      >
                        Save
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<CancelIcon />}
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </Button>
                    </Box>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Personal Information */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                    disabled={!isEditingProfile}
                    variant={isEditingProfile ? "outlined" : "filled"}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                    disabled={!isEditingProfile}
                    variant={isEditingProfile ? "outlined" : "filled"}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    disabled={!isEditingProfile}
                    variant={isEditingProfile ? "outlined" : "filled"}
                    helperText={isEditingProfile ? "This will be your login email" : ""}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Employee ID"
                    value={profileForm.employeeId}
                    onChange={(e) => setProfileForm({ ...profileForm, employeeId: e.target.value })}
                    disabled={!isEditingProfile}
                    variant={isEditingProfile ? "outlined" : "filled"}
                    helperText={isEditingProfile ? "Your employee number (e.g., 801)" : ""}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Account Details */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="User ID" 
                    secondary={profile.id}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <EmailIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Email" 
                    secondary={profile.email}
                  />
                </ListItem>
                {profile.employeeId && (
                  <ListItem>
                    <ListItemIcon>
                      <InspectorIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Employee ID" 
                      secondary={profile.employeeId}
                    />
                  </ListItem>
                )}
                <ListItem>
                  <ListItemIcon>
                    <ScheduleIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Created" 
                    secondary={new Date(profile.createdAt).toLocaleString()}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <ScheduleIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Last Updated" 
                    secondary={new Date(profile.updatedAt).toLocaleString()}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Activity Summary */}
        {profile._count && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Activity Summary
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <CallsIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h4" color="primary">
                        {profile._count.calls}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Calls Made
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                                             <InspectorIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h4" color="secondary">
                        {profile._count.inspections}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Inspections
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                                             <PropertiesIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h4" color="success.main">
                        {profile._count.createdProperties}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Properties Created
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Password Change Dialog */}
      <Dialog open={isPasswordDialogOpen} onClose={() => setIsPasswordDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Current Password"
              type={showPasswords.current ? 'text' : 'password'}
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              margin="normal"
              InputProps={{
                endAdornment: (
                  <Tooltip title={showPasswords.current ? "Hide password" : "Show password"}>
                    <IconButton
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      edge="end"
                    >
                                              {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </Tooltip>
                ),
              }}
            />
            
            <TextField
              fullWidth
              label="New Password"
              type={showPasswords.new ? 'text' : 'password'}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              margin="normal"
              helperText="Must be at least 6 characters"
              InputProps={{
                endAdornment: (
                  <Tooltip title={showPasswords.new ? "Hide password" : "Show password"}>
                    <IconButton
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      edge="end"
                    >
                      {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </Tooltip>
                ),
              }}
            />
            
            <TextField
              fullWidth
              label="Confirm New Password"
              type={showPasswords.confirm ? 'text' : 'password'}
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              margin="normal"
              error={passwordForm.confirmPassword !== '' && passwordForm.newPassword !== passwordForm.confirmPassword}
              helperText={
                passwordForm.confirmPassword !== '' && passwordForm.newPassword !== passwordForm.confirmPassword
                  ? "Passwords do not match"
                  : ""
              }
              InputProps={{
                endAdornment: (
                  <Tooltip title={showPasswords.confirm ? "Hide password" : "Show password"}>
                    <IconButton
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      edge="end"
                    >
                                              {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </Tooltip>
                ),
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsPasswordDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handlePasswordSubmit}
            disabled={
              !passwordForm.currentPassword || 
              !passwordForm.newPassword || 
              passwordForm.newPassword !== passwordForm.confirmPassword ||
              passwordForm.newPassword.length < 6
            }
          >
            Change Password
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Profile 