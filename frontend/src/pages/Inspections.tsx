import React, { useState, useEffect } from 'react'
import {
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  Card,
  CardContent,
  Alert,
  Pagination,
  Tooltip,
  CircularProgress,
  InputAdornment,
  Avatar,
  Stack,
  Box as MuiBox,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Assignment as InspectionIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  Home as HomeIcon,
  Business as BusinessIcon,
  Factory as FactoryIcon,
  LocationCity as MixedIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

interface Inspection {
  id: string
  scheduledDate: string
  completedDate?: string
  status: 'UNCONTACTED' | 'IN_PROGRESS' | 'SOLD' | 'DECLINED'
  inspectionType: 'WDO' | 'TERMITE' | 'PEST' | 'MOISTURE' | 'STRUCTURAL' | 'PREVENTIVE'
  findings?: string
  recommendations?: string
  cost?: number
  createdAt: string
  property: {
    id: string
    address: string
    city: string
    state: string
    zipCode: string
    propertyType?: 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL' | 'MIXED_USE'
    description?: string
  }
  inspector: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  calls: Array<{
    id: string
    callType: string
    purpose: string
    contactName: string
    outcome: string
    createdAt: string
  }>
}

interface Property {
  id: string
  address: string
  city: string
  state: string
  zipCode: string
  propertyType: 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL' | 'MIXED_USE'
  description?: string
}

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
}

interface InspectionFormData {
  propertyId: string
  inspectorId: string
  scheduledDate: string
  inspectionType: 'WDO' | 'TERMITE' | 'PEST' | 'MOISTURE' | 'STRUCTURAL' | 'PREVENTIVE'
  status: 'UNCONTACTED' | 'IN_PROGRESS' | 'SOLD' | 'DECLINED'
  completedDate: string
  findings: string
  recommendations: string
  cost: string
}

interface Stats {
  totalInspections: number
  uncontactedInspections: number
  soldInspections: number
  inProgressInspections: number
  revenueThisMonth: number
}

// Property type icons and colors
const propertyTypeIcons = {
  RESIDENTIAL: <HomeIcon />,
  COMMERCIAL: <BusinessIcon />,
  INDUSTRIAL: <FactoryIcon />,
  MIXED_USE: <MixedIcon />
}

const propertyTypeColors = {
  RESIDENTIAL: 'primary',
  COMMERCIAL: 'secondary',
  INDUSTRIAL: 'warning',
  MIXED_USE: 'info'
} as const

// Status colors and icons
const statusIcons = {
  UNCONTACTED: <ScheduleIcon />,
  IN_PROGRESS: <WarningIcon />,
  SOLD: <CheckIcon />,
  DECLINED: <CancelIcon />
}

const statusColors = {
  UNCONTACTED: 'warning',
  IN_PROGRESS: 'info',
  SOLD: 'success',
  DECLINED: 'error'
} as const

// Inspection type colors
const inspectionTypeColors = {
  WDO: 'primary',
  TERMITE: 'error',
  PEST: 'warning',
  MOISTURE: 'info',
  STRUCTURAL: 'secondary',
  PREVENTIVE: 'success'
} as const

const Inspections: React.FC = () => {
  const { user } = useAuth()
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [inspectors, setInspectors] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Pagination and filtering
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [inspectorFilter, setInspectorFilter] = useState('')
  
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isViewMode, setIsViewMode] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState<InspectionFormData>({
    propertyId: '',
    inspectorId: '',
    scheduledDate: '',
    inspectionType: 'WDO',
    status: 'UNCONTACTED',
    completedDate: '',
    findings: '',
    recommendations: '',
    cost: ''
  })
  
  // Stats
  const [stats, setStats] = useState<Stats>({
    totalInspections: 0,
    uncontactedInspections: 0,
    soldInspections: 0,
    inProgressInspections: 0,
    revenueThisMonth: 0
  })

  const canManageInspections = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  useEffect(() => {
    fetchInspections()
    if (canManageInspections) {
      fetchStats()
    }
    fetchPropertiesAndInspectors()
  }, [page, statusFilter, typeFilter, inspectorFilter])

  const fetchInspections = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      })
      
      if (statusFilter) params.append('status', statusFilter)
      if (typeFilter) params.append('inspectionType', typeFilter)
      if (inspectorFilter) params.append('inspectorId', inspectorFilter)
      
      const response = await api.get(`/inspections?${params}`)
      setInspections(response.data.data.inspections)
      setTotalPages(response.data.data.pagination.totalPages)
      setError(null)
    } catch (error: any) {
      setError('Failed to fetch inspections')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await api.get('/inspections/stats/overview')
      setStats(response.data.data.overview)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const fetchPropertiesAndInspectors = async () => {
    try {
      const [propertiesResponse, usersResponse] = await Promise.all([
        api.get('/properties?limit=100'),
        api.get('/users?limit=100')
      ])
      
      setProperties(propertiesResponse.data.data.properties)
      
      // Filter users to only show inspectors, managers, and admins
      const availableInspectors = usersResponse.data.data.users.filter((u: User) => 
        ['ADMIN', 'MANAGER', 'INSPECTOR'].includes(u.role)
      )
      setInspectors(availableInspectors)
    } catch (error) {
      console.error('Failed to fetch properties and inspectors:', error)
    }
  }

  const handleSearch = () => {
    setPage(1)
    fetchInspections()
  }

  const handleCreateInspection = () => {
    setSelectedInspection(null)
    setIsEditing(false)
    setIsViewMode(false)
    setFormData({
      propertyId: '',
      inspectorId: user?.role === 'INSPECTOR' ? user.id : '',
      scheduledDate: '',
      inspectionType: 'WDO',
      status: 'UNCONTACTED',
      completedDate: '',
      findings: '',
      recommendations: '',
      cost: ''
    })
    setIsDialogOpen(true)
  }

  const handleEditInspection = (inspection: Inspection) => {
    setSelectedInspection(inspection)
    setIsEditing(true)
    setIsViewMode(false)
    setFormData({
      propertyId: inspection.property.id,
      inspectorId: inspection.inspector.id,
      scheduledDate: new Date(inspection.scheduledDate).toISOString().slice(0, 16),
      inspectionType: inspection.inspectionType,
      status: inspection.status,
      completedDate: inspection.completedDate ? new Date(inspection.completedDate).toISOString().slice(0, 16) : '',
      findings: inspection.findings || '',
      recommendations: inspection.recommendations || '',
      cost: inspection.cost?.toString() || ''
    })
    setIsDialogOpen(true)
  }

  const handleViewInspection = async (inspection: Inspection) => {
    try {
      setLoading(true)
      const response = await api.get(`/inspections/${inspection.id}`)
      setSelectedInspection(response.data.data.inspection)
      setIsEditing(false)
      setIsViewMode(true)
      setIsDialogOpen(true)
    } catch (error) {
      setError('Failed to load inspection details')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteInspection = async (inspection: Inspection) => {
    if (!window.confirm(`Are you sure you want to delete the ${inspection.inspectionType} inspection for ${inspection.property.address}?`)) {
      return
    }

    try {
      await api.delete(`/inspections/${inspection.id}`)
      setSuccess('Inspection deleted successfully')
      fetchInspections()
      if (canManageInspections) fetchStats()
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete inspection')
    }
  }

  const handleSubmit = async () => {
    try {
      if (isEditing && selectedInspection) {
        await api.put(`/inspections/${selectedInspection.id}`, {
          ...formData,
          cost: formData.cost ? parseFloat(formData.cost) : undefined,
          completedDate: formData.completedDate || undefined
        })
        setSuccess('Inspection updated successfully')
      } else {
        await api.post('/inspections', {
          ...formData,
          cost: formData.cost ? parseFloat(formData.cost) : undefined,
          completedDate: formData.completedDate || undefined
        })
        setSuccess('Inspection created successfully')
      }
      setIsDialogOpen(false)
      fetchInspections()
      if (canManageInspections) fetchStats()
    } catch (error: any) {
      setError(error.response?.data?.errors?.[0]?.msg || error.response?.data?.message || 'Failed to save inspection')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const StatCard = ({ title, value, icon, color }: any) => (
    <Card>
      <CardContent>
        <MuiBox display="flex" alignItems="center" justifyContent="space-between">
          <MuiBox>
            <Typography color="textSecondary" gutterBottom variant="h6">
              {title}
            </Typography>
            <Typography variant="h4" component="h2">
              {loading ? <CircularProgress size={24} /> : value}
            </Typography>
          </MuiBox>
          <MuiBox color={color}>
            {icon}
          </MuiBox>
        </MuiBox>
      </CardContent>
    </Card>
  )

  if (loading && inspections.length === 0) {
    return (
      <MuiBox display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </MuiBox>
    )
  }

  return (
    <MuiBox>
      <MuiBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Inspections
        </Typography>
        {canManageInspections && (
          <MuiBox display="flex" gap={2}>
            <Button
              startIcon={<RefreshIcon />}
              onClick={() => {
                fetchInspections()
                fetchStats()
              }}
              variant="outlined"
            >
              Refresh
            </Button>
            <Button
              startIcon={<AddIcon />}
              variant="contained"
              onClick={handleCreateInspection}
            >
              Schedule Inspection
            </Button>
          </MuiBox>
        )}
      </MuiBox>

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

      {/* Stats Cards */}
      {canManageInspections && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Inspections"
              value={stats.totalInspections}
              icon={<InspectionIcon fontSize="large" />}
              color="primary.main"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Uncontacted"
              value={stats.uncontactedInspections}
              icon={<ScheduleIcon fontSize="large" />}
              color="warning.main"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Sold"
              value={stats.soldInspections}
              icon={<CheckIcon fontSize="large" />}
              color="success.main"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Revenue (Month)"
              value={formatCurrency(stats.revenueThisMonth)}
              icon={<MoneyIcon fontSize="large" />}
              color="info.main"
            />
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="UNCONTACTED">Uncontacted</MenuItem>
                <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                <MenuItem value="SOLD">Sold</MenuItem>
                <MenuItem value="DECLINED">Declined</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                label="Type"
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="WDO">WDO</MenuItem>
                <MenuItem value="TERMITE">Termite</MenuItem>
                <MenuItem value="PEST">Pest</MenuItem>
                <MenuItem value="MOISTURE">Moisture</MenuItem>
                <MenuItem value="STRUCTURAL">Structural</MenuItem>
                <MenuItem value="PREVENTIVE">Preventive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Inspector</InputLabel>
              <Select
                value={inspectorFilter}
                label="Inspector"
                onChange={(e) => setInspectorFilter(e.target.value)}
              >
                <MenuItem value="">All Inspectors</MenuItem>
                {inspectors.map((inspector) => (
                  <MenuItem key={inspector.id} value={inspector.id}>
                    {inspector.firstName} {inspector.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleSearch}
              startIcon={<SearchIcon />}
            >
              Filter
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Inspections Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Property</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Inspector</TableCell>
              <TableCell>Scheduled</TableCell>
              <TableCell>Completed</TableCell>
              <TableCell>Cost</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inspections.map((inspection) => (
              <TableRow 
                key={inspection.id} 
                hover 
                sx={{ cursor: 'pointer' }}
                onClick={() => handleViewInspection(inspection)}
              >
                <TableCell>
                  <MuiBox display="flex" alignItems="center" gap={1}>
                    {inspection.property.propertyType && propertyTypeIcons[inspection.property.propertyType]}
                    <MuiBox>
                      <Typography variant="body2" fontWeight="medium">
                        {inspection.property.address}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {inspection.property.city}, {inspection.property.state}
                      </Typography>
                    </MuiBox>
                  </MuiBox>
                </TableCell>
                <TableCell>
                  <Chip
                    label={inspection.inspectionType}
                    color={inspectionTypeColors[inspection.inspectionType]}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    icon={statusIcons[inspection.status]}
                    label={inspection.status.replace('_', ' ')}
                    color={statusColors[inspection.status]}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <MuiBox display="flex" alignItems="center" gap={1}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                      {inspection.inspector.firstName.charAt(0)}
                    </Avatar>
                    <Typography variant="body2">
                      {inspection.inspector.firstName} {inspection.inspector.lastName}
                    </Typography>
                  </MuiBox>
                </TableCell>
                <TableCell>{formatDate(inspection.scheduledDate)}</TableCell>
                <TableCell>
                  {inspection.completedDate ? formatDate(inspection.completedDate) : '-'}
                </TableCell>
                <TableCell>
                  {inspection.cost ? formatCurrency(inspection.cost) : '-'}
                </TableCell>
                <TableCell>
                  <Tooltip title="View Details">
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewInspection(inspection)
                      }}
                    >
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  {(canManageInspections || (user?.role === 'INSPECTOR' && inspection.inspector.id === user.id)) && (
                    <>
                      <Tooltip title="Edit">
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditInspection(inspection)
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      {canManageInspections && (
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteInspection(inspection)
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalPages > 1 && (
        <MuiBox display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
            color="primary"
          />
        </MuiBox>
      )}

      {/* Inspection Dialog */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <MuiBox display="flex" alignItems="center" gap={1}>
            <InspectionIcon />
            <Typography variant="h5" component="span">
              {isViewMode ? 'Inspection Details' : isEditing ? 'Edit Inspection' : 'Schedule New Inspection'}
            </Typography>
          </MuiBox>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {isViewMode && selectedInspection ? (
            <MuiBox>
              {/* Inspection Header */}
              <Card 
                elevation={0} 
                sx={{ 
                  mb: 3, 
                  background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <CardContent sx={{ pb: 2 }}>
                  <MuiBox display="flex" justifyContent="space-between" alignItems="flex-start">
                    <MuiBox flex={1}>
                      <MuiBox display="flex" alignItems="center" gap={2} mb={2}>
                        <Avatar 
                          sx={{ 
                            bgcolor: `${inspectionTypeColors[selectedInspection.inspectionType]}.main`,
                            width: 56,
                            height: 56
                          }}
                        >
                          <InspectionIcon />
                        </Avatar>
                        <MuiBox>
                          <Typography variant="h5" fontWeight="600" gutterBottom>
                            {selectedInspection.inspectionType} Inspection
                          </Typography>
                          <MuiBox display="flex" alignItems="center" gap={1} mb={1}>
                            <LocationIcon color="action" fontSize="small" />
                            <Typography color="textSecondary" variant="h6">
                              {selectedInspection.property.address}
                            </Typography>
                          </MuiBox>
                          <Chip
                            icon={statusIcons[selectedInspection.status]}
                            label={selectedInspection.status.replace('_', ' ')}
                            color={statusColors[selectedInspection.status]}
                            size="medium"
                            sx={{ fontWeight: 'medium' }}
                          />
                        </MuiBox>
                      </MuiBox>
                    </MuiBox>
                    {(canManageInspections || (user?.role === 'INSPECTOR' && selectedInspection.inspector.id === user.id)) && (
                      <Tooltip title="Edit Inspection">
                        <IconButton
                          onClick={() => handleEditInspection(selectedInspection)}
                          sx={{ 
                            color: 'primary.main',
                            bgcolor: 'background.paper',
                            '&:hover': { bgcolor: 'primary.50' }
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </MuiBox>
                </CardContent>
              </Card>

              <Grid container spacing={3}>
                {/* Inspection Details */}
                <Grid item xs={12} md={6}>
                  <Card elevation={2}>
                    <CardContent>
                      <Typography variant="h6" fontWeight="600" gutterBottom>
                        Inspection Details
                      </Typography>
                      <Stack spacing={2}>
                        <MuiBox>
                          <Typography variant="subtitle2" color="textSecondary">Inspector</Typography>
                          <MuiBox display="flex" alignItems="center" gap={1}>
                            <PersonIcon color="action" fontSize="small" />
                            <Typography>
                              {selectedInspection.inspector.firstName} {selectedInspection.inspector.lastName}
                            </Typography>
                          </MuiBox>
                        </MuiBox>
                        <MuiBox>
                          <Typography variant="subtitle2" color="textSecondary">Scheduled Date</Typography>
                          <MuiBox display="flex" alignItems="center" gap={1}>
                            <CalendarIcon color="action" fontSize="small" />
                            <Typography>{formatDateTime(selectedInspection.scheduledDate)}</Typography>
                          </MuiBox>
                        </MuiBox>
                        {selectedInspection.completedDate && (
                          <MuiBox>
                            <Typography variant="subtitle2" color="textSecondary">Completed Date</Typography>
                            <MuiBox display="flex" alignItems="center" gap={1}>
                              <CheckIcon color="success" fontSize="small" />
                              <Typography>{formatDateTime(selectedInspection.completedDate)}</Typography>
                            </MuiBox>
                          </MuiBox>
                        )}
                        {selectedInspection.cost && (
                          <MuiBox>
                            <Typography variant="subtitle2" color="textSecondary">Cost</Typography>
                            <MuiBox display="flex" alignItems="center" gap={1}>
                              <MoneyIcon color="action" fontSize="small" />
                              <Typography>{formatCurrency(selectedInspection.cost)}</Typography>
                            </MuiBox>
                          </MuiBox>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Property Details */}
                <Grid item xs={12} md={6}>
                  <Card elevation={2}>
                    <CardContent>
                      <Typography variant="h6" fontWeight="600" gutterBottom>
                        Property Information
                      </Typography>
                      <Stack spacing={2}>
                        <MuiBox>
                          <Typography variant="subtitle2" color="textSecondary">Address</Typography>
                          <Typography>{selectedInspection.property.address}</Typography>
                          <Typography variant="body2" color="textSecondary">
                            {selectedInspection.property.city}, {selectedInspection.property.state} {selectedInspection.property.zipCode}
                          </Typography>
                        </MuiBox>
                        {selectedInspection.property.propertyType && (
                          <MuiBox>
                            <Typography variant="subtitle2" color="textSecondary">Property Type</Typography>
                            <Chip
                              icon={propertyTypeIcons[selectedInspection.property.propertyType]}
                              label={selectedInspection.property.propertyType.replace('_', ' ')}
                              color={propertyTypeColors[selectedInspection.property.propertyType]}
                              size="small"
                            />
                          </MuiBox>
                        )}
                        {selectedInspection.property.description && (
                          <MuiBox>
                            <Typography variant="subtitle2" color="textSecondary">Description</Typography>
                            <Typography variant="body2">{selectedInspection.property.description}</Typography>
                          </MuiBox>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Findings and Recommendations */}
                {(selectedInspection.findings || selectedInspection.recommendations) && (
                  <Grid item xs={12}>
                    <Card elevation={2}>
                      <CardContent>
                        <Typography variant="h6" fontWeight="600" gutterBottom>
                          Inspection Results
                        </Typography>
                        {selectedInspection.findings && (
                          <MuiBox mb={2}>
                            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                              Findings
                            </Typography>
                            <Typography variant="body2">{selectedInspection.findings}</Typography>
                          </MuiBox>
                        )}
                        {selectedInspection.recommendations && (
                          <MuiBox>
                            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                              Recommendations
                            </Typography>
                            <Typography variant="body2">{selectedInspection.recommendations}</Typography>
                          </MuiBox>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {/* Related Calls */}
                {selectedInspection.calls && selectedInspection.calls.length > 0 && (
                  <Grid item xs={12}>
                    <Card elevation={2}>
                      <CardContent>
                        <Typography variant="h6" fontWeight="600" gutterBottom>
                          Related Calls ({selectedInspection.calls.length})
                        </Typography>
                        <Stack spacing={1}>
                          {selectedInspection.calls.map((call) => (
                            <MuiBox key={call.id} p={2} border={1} borderColor="divider" borderRadius={1}>
                              <MuiBox display="flex" justifyContent="between" alignItems="center">
                                <MuiBox>
                                  <Typography variant="body2" fontWeight="600">
                                    {call.callType} - {call.contactName}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    {call.purpose.replace('_', ' ')} • {call.outcome.replace('_', ' ')}
                                  </Typography>
                                </MuiBox>
                                <Typography variant="caption" color="textSecondary">
                                  {formatDate(call.createdAt)}
                                </Typography>
                              </MuiBox>
                            </MuiBox>
                          ))}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </MuiBox>
          ) : (
            // Form for creating/editing
            <MuiBox sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Property</InputLabel>
                    <Select
                      value={formData.propertyId}
                      label="Property"
                      onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                    >
                      {properties.map((property) => (
                        <MenuItem key={property.id} value={property.id}>
                          {property.address} - {property.city}, {property.state}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Inspector</InputLabel>
                    <Select
                      value={formData.inspectorId}
                      label="Inspector"
                      onChange={(e) => setFormData({ ...formData, inspectorId: e.target.value })}
                      disabled={user?.role === 'INSPECTOR'}
                    >
                      {inspectors.map((inspector) => (
                        <MenuItem key={inspector.id} value={inspector.id}>
                          {inspector.firstName} {inspector.lastName} ({inspector.role})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="datetime-local"
                    label="Scheduled Date"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Inspection Type</InputLabel>
                    <Select
                      value={formData.inspectionType}
                      label="Inspection Type"
                      onChange={(e) => setFormData({ ...formData, inspectionType: e.target.value as any })}
                    >
                      <MenuItem value="WDO">WDO</MenuItem>
                      <MenuItem value="TERMITE">Termite</MenuItem>
                      <MenuItem value="PEST">Pest</MenuItem>
                      <MenuItem value="MOISTURE">Moisture</MenuItem>
                      <MenuItem value="STRUCTURAL">Structural</MenuItem>
                      <MenuItem value="PREVENTIVE">Preventive</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={formData.status}
                      label="Status"
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    >
                      <MenuItem value="UNCONTACTED">Uncontacted</MenuItem>
                      <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                      <MenuItem value="SOLD">Sold</MenuItem>
                      <MenuItem value="DECLINED">Declined</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="datetime-local"
                    label="Completed Date (Optional)"
                    value={formData.completedDate}
                    onChange={(e) => setFormData({ ...formData, completedDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Cost (Optional)"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Findings (Optional)"
                    value={formData.findings}
                    onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                    placeholder="Describe what was found during the inspection..."
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Recommendations (Optional)"
                    value={formData.recommendations}
                    onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                    placeholder="Provide recommendations based on findings..."
                  />
                </Grid>
              </Grid>
            </MuiBox>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>
            {isViewMode ? 'Close' : 'Cancel'}
          </Button>
          {!isViewMode && (
            <Button onClick={handleSubmit} variant="contained">
              {isEditing ? 'Update' : 'Create'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </MuiBox>
  )
}

export default Inspections 