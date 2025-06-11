import React, { useState, useEffect } from 'react'
import {
  Box,
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
  InputAdornment
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Home as HomeIcon,
  Business as BusinessIcon,
  Factory as FactoryIcon,
  LocationCity as MixedIcon,
  Visibility as ViewIcon,
  Phone as PhoneIcon,
  PhoneInTalk as CallIcon
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

interface Property {
  id: string
  address: string
  city: string
  state: string
  zipCode: string
  propertyType: 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL' | 'MIXED_USE'
  description?: string
  notes?: string
  createdAt: string
  createdBy: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  _count: {
    leads: number
    inspections: number
  }
  inspections?: Inspection[]
  leads?: Lead[]
  calls?: Call[]
}

interface Call {
  id: string
  callType: 'INBOUND' | 'OUTBOUND'
  purpose: string
  contactName: string
  contactPhone?: string
  duration?: number
  notes?: string
  outcome: string
  followUpDate?: string
  reminderDate?: string
  completed: boolean
  createdAt: string
  madeBy: {
    id: string
    firstName: string
    lastName: string
  }
}

interface Inspection {
  id: string
  scheduledDate: string
  completedDate?: string
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED'
  inspectionType: 'WDO' | 'TERMITE' | 'PEST' | 'MOISTURE' | 'STRUCTURAL' | 'PREVENTIVE'
  findings?: string
  recommendations?: string
  cost?: number
  inspector: {
    id: string
    firstName: string
    lastName: string
  }
}

interface Lead {
  id: string
  contactName: string
  contactEmail?: string
  contactPhone?: string
  status: string
  priority: string
  createdAt: string
  assignedTo?: {
    id: string
    firstName: string
    lastName: string
  }
}

interface PropertyFormData {
  address: string
  city: string
  state: string
  zipCode: string
  propertyType: 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL' | 'MIXED_USE'
  description: string
  notes: string
}

const propertyTypeColors = {
  RESIDENTIAL: 'primary',
  COMMERCIAL: 'secondary',
  INDUSTRIAL: 'warning',
  MIXED_USE: 'success'
} as const

const propertyTypeIcons = {
  RESIDENTIAL: <HomeIcon />,
  COMMERCIAL: <BusinessIcon />,
  INDUSTRIAL: <FactoryIcon />,
  MIXED_USE: <MixedIcon />
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'SCHEDULED': return 'primary'
    case 'IN_PROGRESS': return 'warning'
    case 'COMPLETED': return 'success'
    case 'CANCELLED': return 'error'
    case 'RESCHEDULED': return 'info'
    default: return 'default'
  }
}



const Properties: React.FC = () => {
  const { user } = useAuth()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Pagination and filtering
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [propertyTypeFilter, setPropertyTypeFilter] = useState('')
  
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isViewMode, setIsViewMode] = useState(false)
  
  // Call dialog states
  const [isCallDialogOpen, setIsCallDialogOpen] = useState(false)
  const [editingCall, setEditingCall] = useState<Call | null>(null)
  const [callFormData, setCallFormData] = useState({
    contactName: '',
    contactPhone: '',
    callType: 'OUTBOUND' as 'INBOUND' | 'OUTBOUND',
    purpose: 'FOLLOW_UP',
    outcome: 'NO_ANSWER',
    duration: '',
    notes: '',
    reminderDate: ''
  })
  
  // Inspection dialog states
  const [isInspectionDialogOpen, setIsInspectionDialogOpen] = useState(false)
  const [editingInspection, setEditingInspection] = useState<Inspection | null>(null)
  const [inspectionFormData, setInspectionFormData] = useState({
    scheduledDate: '',
    inspectionType: 'WDO' as 'WDO' | 'TERMITE' | 'PEST' | 'MOISTURE' | 'STRUCTURAL' | 'PREVENTIVE',
    status: 'SCHEDULED' as 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED',
    completedDate: '',
    findings: '',
    recommendations: '',
    cost: ''
  })
  
  // Form state
  const [formData, setFormData] = useState<PropertyFormData>({
    address: '',
    city: '',
    state: '',
    zipCode: '',
    propertyType: 'RESIDENTIAL',
    description: '',
    notes: ''
  })
  
  // Stats
  const [stats, setStats] = useState({
    totalProperties: 0,
    propertiesWithLeads: 0,
    propertiesWithInspections: 0
  })

  const canManageProperties = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  useEffect(() => {
    fetchProperties()
    if (canManageProperties) {
      fetchStats()
    }
  }, [page, searchTerm, propertyTypeFilter])

  const fetchProperties = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (propertyTypeFilter) params.append('propertyType', propertyTypeFilter)
      
      const response = await api.get(`/properties?${params}`)
      setProperties(response.data.data.properties)
      setTotalPages(response.data.data.pagination.totalPages)
      setError(null)
    } catch (error: any) {
      setError('Failed to fetch properties')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await api.get('/properties/stats/overview')
      setStats(response.data.data.overview)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleSearch = () => {
    setPage(1)
    fetchProperties()
  }

  const handleCreateProperty = () => {
    setSelectedProperty(null)
    setIsEditing(false)
    setIsViewMode(false)
    setFormData({
      address: '',
      city: '',
      state: '',
      zipCode: '',
      propertyType: 'RESIDENTIAL',
      description: '',
      notes: ''
    })
    setIsDialogOpen(true)
  }

  const handleEditProperty = (property: Property) => {
    setSelectedProperty(property)
    setIsEditing(true)
    setIsViewMode(false)
    setFormData({
      address: property.address,
      city: property.city,
      state: property.state,
      zipCode: property.zipCode,
      propertyType: property.propertyType,
      description: property.description || '',
      notes: property.notes || ''
    })
    setIsDialogOpen(true)
  }

  const handleViewProperty = async (property: Property) => {
    try {
      setLoading(true)
      // Fetch detailed property data including inspections and leads
      const response = await api.get(`/properties/${property.id}`)
      setSelectedProperty(response.data.data.property)
      setIsEditing(false)
      setIsViewMode(true)
      setIsDialogOpen(true)
    } catch (error) {
      setError('Failed to load property details')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProperty = async (property: Property) => {
    if (!window.confirm(`Are you sure you want to delete the property at ${property.address}?`)) {
      return
    }

    try {
      await api.delete(`/properties/${property.id}`)
      setSuccess('Property deleted successfully')
      fetchProperties()
      if (canManageProperties) fetchStats()
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete property')
    }
  }

  const handleSubmit = async () => {
    try {
      if (isEditing && selectedProperty) {
        await api.put(`/properties/${selectedProperty.id}`, formData)
        setSuccess('Property updated successfully')
      } else {
        await api.post('/properties', formData)
        setSuccess('Property created successfully')
      }
      setIsDialogOpen(false)
      fetchProperties()
      if (canManageProperties) fetchStats()
    } catch (error: any) {
      setError(error.response?.data?.errors?.[0]?.msg || error.response?.data?.message || 'Failed to save property')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const handleLogCall = (property: Property) => {
    setSelectedProperty(property)
    setCallFormData({
      contactName: property.leads?.[0]?.contactName || '',
      contactPhone: property.leads?.[0]?.contactPhone || '',
      callType: 'OUTBOUND',
      purpose: 'FOLLOW_UP',
      outcome: 'NO_ANSWER',
      duration: '',
      notes: '',
      reminderDate: ''
    })
    setIsCallDialogOpen(true)
  }

  const handleSubmitCall = async () => {
    if (!selectedProperty) return

    try {
      const callData = {
        propertyId: selectedProperty.id,
        contactName: callFormData.contactName,
        contactPhone: callFormData.contactPhone || undefined,
        callType: callFormData.callType,
        purpose: callFormData.purpose,
        outcome: callFormData.outcome,
        duration: callFormData.duration ? parseInt(callFormData.duration) : undefined,
        notes: callFormData.notes || undefined,
        reminderDate: callFormData.reminderDate ? new Date(callFormData.reminderDate).toISOString() : undefined,
        completed: callFormData.outcome !== 'CALLBACK_REQUESTED'
      }

      if (editingCall) {
        await api.put(`/calls/${editingCall.id}`, callData)
        setSuccess('Call updated successfully')
      } else {
        await api.post('/calls', callData)
        setSuccess('Call logged successfully')
      }
      
      setIsCallDialogOpen(false)
      setEditingCall(null)
      
      // Refresh property details to show the updated call
      if (isViewMode) {
        const response = await api.get(`/properties/${selectedProperty.id}`)
        setSelectedProperty(response.data.data.property)
      }
    } catch (error: any) {
      setError(error.response?.data?.errors?.[0]?.msg || error.response?.data?.message || 'Failed to save call')
    }
  }

  const handleEditCall = (call: Call) => {
    setEditingCall(call)
    setCallFormData({
      contactName: call.contactName,
      contactPhone: call.contactPhone || '',
      callType: call.callType,
      purpose: call.purpose,
      outcome: call.outcome,
      duration: call.duration?.toString() || '',
      notes: call.notes || '',
      reminderDate: call.reminderDate ? new Date(call.reminderDate).toISOString().slice(0, 16) : ''
    })
    setIsCallDialogOpen(true)
  }

  const handleDeleteCall = async (callId: string) => {
    if (!window.confirm('Are you sure you want to delete this call record?')) {
      return
    }

    try {
      await api.delete(`/calls/${callId}`)
      setSuccess('Call deleted successfully')
      
      // Refresh property details
      if (selectedProperty && isViewMode) {
        const response = await api.get(`/properties/${selectedProperty.id}`)
        setSelectedProperty(response.data.data.property)
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete call')
    }
  }

  const handleEditInspection = async (inspection: Inspection) => {
    setEditingInspection(inspection)
    setInspectionFormData({
      scheduledDate: new Date(inspection.scheduledDate).toISOString().slice(0, 16),
      inspectionType: inspection.inspectionType,
      status: inspection.status,
      completedDate: inspection.completedDate ? new Date(inspection.completedDate).toISOString().slice(0, 16) : '',
      findings: inspection.findings || '',
      recommendations: inspection.recommendations || '',
      cost: inspection.cost?.toString() || ''
    })
    setIsInspectionDialogOpen(true)
  }

  const handleSubmitInspection = async () => {
    if (!selectedProperty) return

    try {
      const inspectionData = {
        propertyId: selectedProperty.id,
        inspectorId: editingInspection?.inspector.id, // Keep existing inspector for edits
        scheduledDate: new Date(inspectionFormData.scheduledDate).toISOString(),
        inspectionType: inspectionFormData.inspectionType,
        status: inspectionFormData.status,
        completedDate: inspectionFormData.completedDate ? new Date(inspectionFormData.completedDate).toISOString() : undefined,
        findings: inspectionFormData.findings || undefined,
        recommendations: inspectionFormData.recommendations || undefined,
        cost: inspectionFormData.cost ? parseFloat(inspectionFormData.cost) : undefined
      }

      if (editingInspection) {
        await api.put(`/inspections/${editingInspection.id}`, inspectionData)
        setSuccess('Inspection updated successfully')
      } else {
        // For new inspections, we'd need to select an inspector
        setError('Creating new inspections not implemented yet')
        return
      }
      
      setIsInspectionDialogOpen(false)
      setEditingInspection(null)
      
      // Refresh property details
      if (isViewMode) {
        const response = await api.get(`/properties/${selectedProperty.id}`)
        setSelectedProperty(response.data.data.property)
      }
    } catch (error: any) {
      setError(error.response?.data?.errors?.[0]?.msg || error.response?.data?.message || 'Failed to save inspection')
    }
  }

  const handleDeleteInspection = async (inspectionId: string) => {
    if (!window.confirm('Are you sure you want to delete this inspection record?')) {
      return
    }

    try {
      await api.delete(`/inspections/${inspectionId}`)
      setSuccess('Inspection deleted successfully')
      
      // Refresh property details
      if (selectedProperty && isViewMode) {
        const response = await api.get(`/properties/${selectedProperty.id}`)
        setSelectedProperty(response.data.data.property)
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete inspection')
    }
  }

  if (loading && properties.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Properties
        </Typography>
        {canManageProperties && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateProperty}
          >
            Add Property
          </Button>
        )}
      </Box>

      {/* Stats Cards */}
      {canManageProperties && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Properties
                </Typography>
                <Typography variant="h4">
                  {stats.totalProperties}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  With Leads
                </Typography>
                <Typography variant="h4">
                  {stats.propertiesWithLeads}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  With Inspections
                </Typography>
                <Typography variant="h4">
                  {stats.propertiesWithInspections}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

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

      {/* Search and Filter */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth>
              <InputLabel>Property Type</InputLabel>
              <Select
                value={propertyTypeFilter}
                label="Property Type"
                onChange={(e) => setPropertyTypeFilter(e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="RESIDENTIAL">Residential</MenuItem>
                <MenuItem value="COMMERCIAL">Commercial</MenuItem>
                <MenuItem value="INDUSTRIAL">Industrial</MenuItem>
                <MenuItem value="MIXED_USE">Mixed Use</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2} md={1}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleSearch}
              startIcon={<SearchIcon />}
            >
              Search
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Properties Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Address</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>City, State</TableCell>
              <TableCell>ZIP</TableCell>
              <TableCell>Leads</TableCell>
              <TableCell>Inspections</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {properties.map((property) => (
              <TableRow 
                key={property.id} 
                hover 
                sx={{ cursor: 'pointer' }}
                onClick={() => handleViewProperty(property)}
              >
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {property.address}
                  </Typography>
                  {property.description && (
                    <Typography variant="caption" color="textSecondary">
                      {property.description}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    icon={propertyTypeIcons[property.propertyType]}
                    label={property.propertyType.replace('_', ' ')}
                    color={propertyTypeColors[property.propertyType]}
                    size="small"
                  />
                </TableCell>
                <TableCell>{property.city}, {property.state}</TableCell>
                <TableCell>{property.zipCode}</TableCell>
                <TableCell>
                  <Chip
                    label={property._count.leads}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={property._count.inspections}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{formatDate(property.createdAt)}</TableCell>
                <TableCell>
                  <Tooltip title="View Details">
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewProperty(property)
                      }}
                    >
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Log Call">
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleLogCall(property)
                      }}
                      sx={{ color: 'success.main' }}
                    >
                      <CallIcon />
                    </IconButton>
                  </Tooltip>
                  {canManageProperties && (
                    <>
                      <Tooltip title="Edit">
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditProperty(property)
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteProperty(property)
                          }}
                          disabled={property._count.leads > 0 || property._count.inspections > 0}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
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
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
            color="primary"
          />
        </Box>
      )}

      {/* Property Dialog */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {isViewMode ? 'Property Details' : isEditing ? 'Edit Property' : 'Add New Property'}
        </DialogTitle>
        <DialogContent>
          {isViewMode && selectedProperty ? (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {selectedProperty.address}
                      </Typography>
                      <Typography color="textSecondary" gutterBottom>
                        {selectedProperty.city}, {selectedProperty.state} {selectedProperty.zipCode}
                      </Typography>
                      <Chip
                        icon={propertyTypeIcons[selectedProperty.propertyType]}
                        label={selectedProperty.propertyType.replace('_', ' ')}
                        color={propertyTypeColors[selectedProperty.propertyType]}
                        sx={{ mb: 2 }}
                      />
                    </Box>
                    {canManageProperties && (
                      <Tooltip title="Edit Property">
                        <IconButton
                          onClick={() => handleEditProperty(selectedProperty)}
                          sx={{ color: 'primary.main' }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Grid>
                
                {selectedProperty.description && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>Description</Typography>
                    <Typography>{selectedProperty.description}</Typography>
                  </Grid>
                )}
                
                {selectedProperty.notes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>Notes</Typography>
                    <Typography>{selectedProperty.notes}</Typography>
                  </Grid>
                )}
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2" gutterBottom>Leads</Typography>
                  <Typography>{selectedProperty._count?.leads || 0}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" gutterBottom>Inspections</Typography>
                  <Typography>{selectedProperty._count?.inspections || 0}</Typography>
                </Grid>

                {/* Inspections Section */}
                {selectedProperty.inspections && selectedProperty.inspections.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                      Inspection History ({selectedProperty.inspections.length})
                    </Typography>
                    {selectedProperty.inspections.map((inspection) => (
                      <Card key={inspection.id} variant="outlined" sx={{ mb: 2 }}>
                        <CardContent>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2" fontWeight="medium">
                                {inspection.inspectionType.replace('_', ' ')} Inspection
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                Scheduled: {formatDate(inspection.scheduledDate)}
                              </Typography>
                              {inspection.completedDate && (
                                <Typography variant="body2" color="textSecondary">
                                  Completed: {formatDate(inspection.completedDate)}
                                </Typography>
                              )}
                              {inspection.findings && (
                                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                  Findings: {inspection.findings}
                                </Typography>
                              )}
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                <Box>
                                  <Chip
                                    label={inspection.status.replace('_', ' ')}
                                    color={getStatusColor(inspection.status) as any}
                                    size="small"
                                    sx={{ mb: 1 }}
                                  />
                                  <Typography variant="body2">
                                    Inspector: {inspection.inspector.firstName} {inspection.inspector.lastName}
                                  </Typography>
                                  {inspection.cost && (
                                    <Typography variant="body2">
                                      Cost: ${inspection.cost.toFixed(2)}
                                    </Typography>
                                  )}
                                </Box>
                                {canManageProperties && (
                                  <Box>
                                    <Tooltip title="Edit Inspection">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleEditInspection(inspection)}
                                        sx={{ color: 'primary.main' }}
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete Inspection">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleDeleteInspection(inspection.id)}
                                        sx={{ color: 'error.main' }}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                )}
                              </Box>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    ))}
                  </Grid>
                )}

                {/* Calls Section */}
                {selectedProperty.calls && selectedProperty.calls.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                      Call History ({selectedProperty.calls.length})
                    </Typography>
                    {selectedProperty.calls.map((call) => (
                      <Card key={call.id} variant="outlined" sx={{ mb: 2 }}>
                        <CardContent>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <Box display="flex" alignItems="center" gap={1} mb={1}>
                                <PhoneIcon color={call.callType === 'INBOUND' ? 'success' : 'primary'} fontSize="small" />
                                <Typography variant="body2" fontWeight="medium">
                                  {call.callType} - {call.purpose.replace('_', ' ')}
                                </Typography>
                              </Box>
                              <Typography variant="body2" color="textSecondary">
                                Contact: {call.contactName}
                              </Typography>
                              {call.contactPhone && (
                                <Typography variant="body2" color="textSecondary">
                                  Phone: {call.contactPhone}
                                </Typography>
                              )}
                              <Typography variant="body2" color="textSecondary">
                                Date: {formatDate(call.createdAt)}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                <Box>
                                  <Chip
                                    label={call.outcome.replace('_', ' ')}
                                    color={call.outcome === 'ANSWERED' ? 'success' : call.outcome === 'NO_ANSWER' ? 'warning' : 'default'}
                                    size="small"
                                    sx={{ mb: 1 }}
                                  />
                                  <Typography variant="body2">
                                    By: {call.madeBy.firstName} {call.madeBy.lastName}
                                  </Typography>
                                  {call.duration && (
                                    <Typography variant="body2">
                                      Duration: {call.duration} minutes
                                    </Typography>
                                  )}
                                  {call.reminderDate && !call.completed && (
                                    <Typography variant="body2" color="warning.main">
                                      Reminder: {formatDate(call.reminderDate)}
                                    </Typography>
                                  )}
                                </Box>
                                <Box>
                                  <Tooltip title="Edit Call">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleEditCall(call)}
                                      sx={{ color: 'primary.main' }}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  {canManageProperties && (
                                    <Tooltip title="Delete Call">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleDeleteCall(call.id)}
                                        sx={{ color: 'error.main' }}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </Box>
                              </Box>
                            </Grid>
                            {call.notes && (
                              <Grid item xs={12}>
                                <Typography variant="body2" color="textSecondary">
                                  Notes: {call.notes}
                                </Typography>
                              </Grid>
                            )}
                          </Grid>
                        </CardContent>
                      </Card>
                    ))}
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                    Created By
                  </Typography>
                  <Typography>{selectedProperty.createdBy.firstName} {selectedProperty.createdBy.lastName}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {formatDate(selectedProperty.createdAt)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="City"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="State"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="ZIP Code"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Property Type</InputLabel>
                    <Select
                      value={formData.propertyType}
                      label="Property Type"
                      onChange={(e) => setFormData({ ...formData, propertyType: e.target.value as any })}
                    >
                      <MenuItem value="RESIDENTIAL">Residential</MenuItem>
                      <MenuItem value="COMMERCIAL">Commercial</MenuItem>
                      <MenuItem value="INDUSTRIAL">Industrial</MenuItem>
                      <MenuItem value="MIXED_USE">Mixed Use</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes"
                    multiline
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </Grid>
              </Grid>
            </Box>
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

      {/* Call Dialog */}
      <Dialog open={isCallDialogOpen} onClose={() => setIsCallDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Log Call</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Call Type</InputLabel>
                  <Select
                    value={callFormData.callType}
                    label="Call Type"
                    onChange={(e) => setCallFormData({ ...callFormData, callType: e.target.value as any })}
                  >
                    <MenuItem value="OUTBOUND">Outbound</MenuItem>
                    <MenuItem value="INBOUND">Inbound</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Purpose</InputLabel>
                  <Select
                    value={callFormData.purpose}
                    label="Purpose"
                    onChange={(e) => setCallFormData({ ...callFormData, purpose: e.target.value })}
                  >
                    <MenuItem value="INITIAL_CONTACT">Initial Contact</MenuItem>
                    <MenuItem value="FOLLOW_UP">Follow Up</MenuItem>
                    <MenuItem value="SCHEDULING">Scheduling</MenuItem>
                    <MenuItem value="CONFIRMATION">Confirmation</MenuItem>
                    <MenuItem value="RESCHEDULING">Rescheduling</MenuItem>
                    <MenuItem value="REPORT_DELIVERY">Report Delivery</MenuItem>
                    <MenuItem value="PAYMENT">Payment</MenuItem>
                    <MenuItem value="COMPLAINT">Complaint</MenuItem>
                    <MenuItem value="GENERAL_INQUIRY">General Inquiry</MenuItem>
                    <MenuItem value="REMINDER">Reminder</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact Name"
                  value={callFormData.contactName}
                  onChange={(e) => setCallFormData({ ...callFormData, contactName: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={callFormData.contactPhone}
                  onChange={(e) => setCallFormData({ ...callFormData, contactPhone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Outcome</InputLabel>
                  <Select
                    value={callFormData.outcome}
                    label="Outcome"
                    onChange={(e) => setCallFormData({ ...callFormData, outcome: e.target.value })}
                  >
                    <MenuItem value="ANSWERED">Answered</MenuItem>
                    <MenuItem value="NO_ANSWER">No Answer</MenuItem>
                    <MenuItem value="VOICEMAIL">Voicemail</MenuItem>
                    <MenuItem value="BUSY">Busy</MenuItem>
                    <MenuItem value="WRONG_NUMBER">Wrong Number</MenuItem>
                    <MenuItem value="SCHEDULED">Scheduled</MenuItem>
                    <MenuItem value="COMPLETED">Completed</MenuItem>
                    <MenuItem value="DECLINED">Declined</MenuItem>
                    <MenuItem value="CALLBACK_REQUESTED">Callback Requested</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Duration (minutes)"
                  type="number"
                  value={callFormData.duration}
                  onChange={(e) => setCallFormData({ ...callFormData, duration: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={3}
                  value={callFormData.notes}
                  onChange={(e) => setCallFormData({ ...callFormData, notes: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Reminder Date (optional)"
                  type="datetime-local"
                  value={callFormData.reminderDate}
                  onChange={(e) => setCallFormData({ ...callFormData, reminderDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  helperText="Set a reminder for follow-up"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCallDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmitCall} variant="contained">
            {editingCall ? 'Update Call' : 'Log Call'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Inspection Edit Dialog */}
      <Dialog open={isInspectionDialogOpen} onClose={() => setIsInspectionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Inspection</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Scheduled Date"
                  type="datetime-local"
                  value={inspectionFormData.scheduledDate}
                  onChange={(e) => setInspectionFormData({ ...inspectionFormData, scheduledDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Inspection Type</InputLabel>
                  <Select
                    value={inspectionFormData.inspectionType}
                    label="Inspection Type"
                    onChange={(e) => setInspectionFormData({ ...inspectionFormData, inspectionType: e.target.value as any })}
                  >
                    <MenuItem value="WDO">WDO (Wood Destroying Organism)</MenuItem>
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
                    value={inspectionFormData.status}
                    label="Status"
                    onChange={(e) => setInspectionFormData({ ...inspectionFormData, status: e.target.value as any })}
                  >
                    <MenuItem value="SCHEDULED">Scheduled</MenuItem>
                    <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                    <MenuItem value="COMPLETED">Completed</MenuItem>
                    <MenuItem value="CANCELLED">Cancelled</MenuItem>
                    <MenuItem value="RESCHEDULED">Rescheduled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Completed Date"
                  type="datetime-local"
                  value={inspectionFormData.completedDate}
                  onChange={(e) => setInspectionFormData({ ...inspectionFormData, completedDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  disabled={inspectionFormData.status !== 'COMPLETED'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Cost"
                  type="number"
                  value={inspectionFormData.cost}
                  onChange={(e) => setInspectionFormData({ ...inspectionFormData, cost: e.target.value })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Findings"
                  multiline
                  rows={3}
                  value={inspectionFormData.findings}
                  onChange={(e) => setInspectionFormData({ ...inspectionFormData, findings: e.target.value })}
                  helperText="Describe any issues or observations found during the inspection"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Recommendations"
                  multiline
                  rows={3}
                  value={inspectionFormData.recommendations}
                  onChange={(e) => setInspectionFormData({ ...inspectionFormData, recommendations: e.target.value })}
                  helperText="Recommended actions or treatments"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsInspectionDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmitInspection} variant="contained">
            Update Inspection
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Properties 