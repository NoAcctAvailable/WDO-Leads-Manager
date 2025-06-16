import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Pagination,
  Tooltip,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as ManagerIcon,
  Engineering as InspectorIcon,
  Phone as CallsIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Search as SearchIcon,
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'ADMIN' | 'MANAGER' | 'INSPECTOR' | 'USER'
  active: boolean
  employeeId?: string
  createdAt: string
  updatedAt: string
  _count: {
    calls: number
    inspections: number
    createdProperties?: number
  }
}

interface UserFormData {
  email: string
  firstName: string
  lastName: string
  role: 'ADMIN' | 'MANAGER' | 'INSPECTOR' | 'USER'
  employeeId: string
  generatePassword: boolean
  password?: string
}

const Users: React.FC = () => {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Pagination and filtering
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isViewMode, setIsViewMode] = useState(false)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    firstName: '',
    lastName: '',
    role: 'USER',
    employeeId: '',
    generatePassword: true,
    password: ''
  })
  
  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    managerUsers: 0,
    inspectorUsers: 0,
    regularUsers: 0
  })

  const canManageUsers = currentUser?.role === 'ADMIN'

  useEffect(() => {
    fetchUsers()
    fetchStats()
  }, [page, searchTerm, roleFilter, activeFilter])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (roleFilter) params.append('role', roleFilter)
      if (activeFilter) params.append('active', activeFilter)
      
      const response = await api.get(`/users?${params}`)
      setUsers(response.data.data.users)
      setTotalPages(response.data.data.pagination.totalPages)
      setError(null)
    } catch (error: any) {
      setError('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      // Since there's no dedicated stats endpoint, we'll calculate from the full user list
      const response = await api.get('/users?limit=1000')
      const allUsers = response.data.data.users
      
      const stats = {
        totalUsers: allUsers.length,
        activeUsers: allUsers.filter((u: User) => u.active).length,
        adminUsers: allUsers.filter((u: User) => u.role === 'ADMIN').length,
        managerUsers: allUsers.filter((u: User) => u.role === 'MANAGER').length,
        inspectorUsers: allUsers.filter((u: User) => u.role === 'INSPECTOR').length,
        regularUsers: allUsers.filter((u: User) => u.role === 'USER').length,
      }
      
      setStats(stats)
    } catch (error) {
      console.error('Failed to fetch user stats:', error)
    }
  }

  const handleSearch = () => {
    setPage(1)
    fetchUsers()
  }

  const handleCreateUser = () => {
    setSelectedUser(null)
    setIsEditing(false)
    setIsViewMode(false)
    setTempPassword(null)
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      role: 'USER',
      employeeId: '',
      generatePassword: true,
      password: ''
    })
    setIsDialogOpen(true)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setIsEditing(true)
    setIsViewMode(false)
    setTempPassword(null)
    setFormData({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      employeeId: user.employeeId || '',
      generatePassword: false,
      password: ''
    })
    setIsDialogOpen(true)
  }

  const handleViewUser = (user: User) => {
    setSelectedUser(user)
    setIsEditing(false)
    setIsViewMode(true)
    setTempPassword(null)
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    try {
      if (isEditing && selectedUser) {
        // Update existing user
        const updateData: any = {}
        if (formData.role !== selectedUser.role) updateData.role = formData.role
        
        if (Object.keys(updateData).length > 0) {
          await api.put(`/users/${selectedUser.id}`, updateData)
          setSuccess('User updated successfully')
        }
      } else {
        // Create new user
        const response = await api.post('/users', formData)
        if (response.data.data.temporaryPassword) {
          setTempPassword(response.data.data.temporaryPassword)
          setSuccess('User created successfully with temporary password')
        } else {
          setSuccess('User created successfully')
        }
      }
      
      fetchUsers()
      fetchStats()
      
      if (!tempPassword) {
        setIsDialogOpen(false)
      }
    } catch (error: any) {
      setError(error.response?.data?.error?.message || 'Failed to save user')
    }
  }

  const handleToggleActive = async (user: User) => {
    try {
      await api.put(`/users/${user.id}`, { active: !user.active })
      setSuccess(`User ${!user.active ? 'activated' : 'deactivated'} successfully`)
      fetchUsers()
      fetchStats()
    } catch (error: any) {
      setError(error.response?.data?.error?.message || 'Failed to update user status')
    }
  }

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`Are you sure you want to delete user ${user.firstName} ${user.lastName}?`)) {
      return
    }

    try {
      await api.delete(`/users/${user.id}`)
      setSuccess('User deleted successfully')
      fetchUsers()
      fetchStats()
    } catch (error: any) {
      setError(error.response?.data?.error?.message || 'Failed to delete user')
    }
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

  if (!canManageUsers) {
    return (
      <Box>
        <Alert severity="error">
          Access denied. Only administrators can manage users.
        </Alert>
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateUser}
        >
          Add User
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Users
              </Typography>
              <Typography variant="h4">
                {stats.totalUsers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.activeUsers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Admins
              </Typography>
              <Typography variant="h4" color="error.main">
                {stats.adminUsers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Managers
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.managerUsers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Inspectors
              </Typography>
              <Typography variant="h4" color="info.main">
                {stats.inspectorUsers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Users
              </Typography>
              <Typography variant="h4">
                {stats.regularUsers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search users"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleSearch}>
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={roleFilter}
                label="Role"
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <MenuItem value="">All Roles</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
                <MenuItem value="MANAGER">Manager</MenuItem>
                <MenuItem value="INSPECTOR">Inspector</MenuItem>
                <MenuItem value="USER">User</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={activeFilter}
                label="Status"
                onChange={(e) => setActiveFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setSearchTerm('')
                setRoleFilter('')
                setActiveFilter('')
                setPage(1)
              }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Users Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Activity</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="textSecondary">
                      No users found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        {getRoleIcon(user.role)}
                        <Box ml={2}>
                          <Typography variant="subtitle2">
                            {user.firstName} {user.lastName}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={user.role}
                        color={getRoleColor(user.role) as any}
                        icon={getRoleIcon(user.role)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        {user.active ? (
                          <Chip
                            size="small"
                            label="Active"
                            color="success"
                            icon={<ActiveIcon />}
                          />
                        ) : (
                          <Chip
                            size="small"
                            label="Inactive"
                            color="default"
                            icon={<InactiveIcon />}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {user._count.calls} calls
                        </Typography>
                        <Typography variant="body2">
                          {user._count.inspections} inspections
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" gap={1}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewUser(user)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit User">
                          <IconButton
                            size="small"
                            onClick={() => handleEditUser(user)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={user.active ? "Deactivate" : "Activate"}>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleActive(user)}
                            disabled={user.id === currentUser?.id}
                          >
                            {user.active ? <InactiveIcon /> : <ActiveIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete User">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteUser(user)}
                            disabled={user.id === currentUser?.id}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {totalPages > 1 && (
          <Box display="flex" justifyContent="center" p={2}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, newPage) => setPage(newPage)}
              color="primary"
            />
          </Box>
        )}
      </Paper>

      {/* User Dialog */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {isViewMode ? 'User Details' : isEditing ? 'Edit User' : 'Create New User'}
        </DialogTitle>
        <DialogContent>
          {tempPassword && (
            <Alert severity="success" sx={{ mb: 3 }}>
              <Typography variant="h6">User Created Successfully!</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Temporary Password: <strong>{tempPassword}</strong>
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Please securely share this password with the user. They will be required to change it on first login.
              </Typography>
            </Alert>
          )}

          {isViewMode && selectedUser ? (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>Name</Typography>
                  <Typography>{selectedUser.firstName} {selectedUser.lastName}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>Email</Typography>
                  <Typography>{selectedUser.email}</Typography>
                </Grid>
                {selectedUser.employeeId && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" gutterBottom>Employee ID</Typography>
                    <Typography>{selectedUser.employeeId}</Typography>
                  </Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>Role</Typography>
                  <Chip
                    label={selectedUser.role}
                    color={getRoleColor(selectedUser.role) as any}
                    icon={getRoleIcon(selectedUser.role)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>Status</Typography>
                  <Chip
                    label={selectedUser.active ? 'Active' : 'Inactive'}
                    color={selectedUser.active ? 'success' : 'default'}
                    icon={selectedUser.active ? <ActiveIcon /> : <InactiveIcon />}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>Created</Typography>
                  <Typography>{new Date(selectedUser.createdAt).toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>Last Updated</Typography>
                  <Typography>{new Date(selectedUser.updatedAt).toLocaleString()}</Typography>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="h6" gutterBottom>Activity Summary</Typography>
              <List>
                <ListItem>
                  <ListItemIcon><CallsIcon /></ListItemIcon>
                  <ListItemText 
                    primary="Calls" 
                    secondary={selectedUser._count.calls}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><InspectorIcon /></ListItemIcon>
                  <ListItemText 
                    primary="Inspections" 
                    secondary={selectedUser._count.inspections}
                  />
                </ListItem>
              </List>
            </Box>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  disabled={isEditing}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  disabled={isEditing}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={isEditing}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Employee ID"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  helperText="Employee number (e.g., 801, 802, etc.)"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={formData.role}
                    label="Role"
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  >
                    <MenuItem value="USER">User</MenuItem>
                    <MenuItem value="INSPECTOR">Inspector</MenuItem>
                    <MenuItem value="MANAGER">Manager</MenuItem>
                    <MenuItem value="ADMIN">Admin</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {!isEditing && (
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.generatePassword}
                        onChange={(e) => setFormData({ ...formData, generatePassword: e.target.checked })}
                      />
                    }
                    label="Generate temporary password (recommended)"
                  />
                  {!formData.generatePassword && (
                    <TextField
                      fullWidth
                      label="Password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      sx={{ mt: 2 }}
                      helperText="Minimum 6 characters"
                    />
                  )}
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>
            {tempPassword ? 'Close' : 'Cancel'}
          </Button>
          {!isViewMode && !tempPassword && (
            <Button variant="contained" onClick={handleSubmit}>
              {isEditing ? 'Update User' : 'Create User'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Users 