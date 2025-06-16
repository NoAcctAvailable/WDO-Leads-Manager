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
  InputAdornment,
  Avatar,
  Stack
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
  PhoneInTalk as CallIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  Assignment as InspectionIcon,
  AccessTime as TimeIcon,
  Notes as NotesIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Cancel as CancelIcon,
  Build as BuildIcon,
  PersonAdd as PersonAddIcon,
  Email as EmailIcon
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import { useSearchParams } from 'react-router-dom'
import api from '../services/api'
import StreetView from '../components/StreetView'

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
    calls: number
    inspections: number
  }
  inspections?: Inspection[]
  calls?: Call[]
  contacts?: Contact[]
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
  inspectionId?: string
  inspection?: {
    id: string
    inspectionType: string
    status: string
    scheduledDate: string
  }
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
  status: 'UNCONTACTED' | 'IN_PROGRESS' | 'SOLD' | 'DECLINED'
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

interface Contact {
  id: string
  name: string
  phone?: string
  email?: string
  role?: string
  isPrimary: boolean
  notes?: string
  createdAt: string
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
    case 'UNCONTACTED': return 'primary'
    case 'IN_PROGRESS': return 'warning'
    case 'SOLD': return 'success'
    case 'DECLINED': return 'error'
    default: return 'default'
  }
}

const Properties: React.FC = () => {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
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
    contactId: '', // New field for selected contact ID
    contactName: '',
    contactPhone: '',
    callType: 'OUTBOUND' as 'INBOUND' | 'OUTBOUND',
    purpose: 'FOLLOW_UP',
    outcome: 'NO_ANSWER',
    duration: '',
    notes: '',
    reminderDate: '',
    inspectionId: ''
  })
  
  // Inspection dialog states
  const [isInspectionDialogOpen, setIsInspectionDialogOpen] = useState(false)
  const [editingInspection, setEditingInspection] = useState<Inspection | null>(null)
  const [inspectionFormData, setInspectionFormData] = useState({
    scheduledDate: '',
    inspectionType: 'WDO' as 'WDO' | 'TERMITE' | 'PEST' | 'MOISTURE' | 'STRUCTURAL' | 'PREVENTIVE',
    status: 'UNCONTACTED' as 'UNCONTACTED' | 'IN_PROGRESS' | 'SOLD' | 'DECLINED',
    completedDate: '',
    findings: '',
    recommendations: '',
    cost: ''
  })

  // Contact dialog states
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [contactFormData, setContactFormData] = useState({
    name: '',
    phone: '',
    email: '',
    role: '',
    isPrimary: false,
    notes: ''
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
    propertiesWithCalls: 0,
    propertiesWithInspections: 0
  })

  // Sample data states
  const [isSampleDataLoading, setIsSampleDataLoading] = useState(false)

  const canManageProperties = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  useEffect(() => {
    fetchProperties()
    if (canManageProperties) {
      fetchStats()
    }
  }, [page, searchTerm, propertyTypeFilter])

  // Handle URL parameter for viewing specific property
  useEffect(() => {
    const viewPropertyId = searchParams.get('view')
    if (viewPropertyId) {
      // First try to find the property in the current list
      const propertyToView = properties.find(p => p.id === viewPropertyId)
      if (propertyToView) {
        handleViewProperty(propertyToView)
        // Remove the URL parameter after opening the dialog
        setSearchParams(params => {
          params.delete('view')
          return params
        })
      } else if (properties.length > 0) {
        // If property is not in current list, fetch it directly
        fetchAndViewProperty(viewPropertyId)
      }
    }
  }, [properties, searchParams])

  const fetchAndViewProperty = async (propertyId: string) => {
    try {
      const response = await api.get(`/properties/${propertyId}`)
      const property = response.data.data.property
      setSelectedProperty(property)
      setIsEditing(false)
      setIsViewMode(true)
      setIsDialogOpen(true)
      // Remove the URL parameter after opening the dialog
      setSearchParams(params => {
        params.delete('view')
        return params
      })
    } catch (error) {
      setError('Failed to load property details')
      // Remove invalid URL parameter
      setSearchParams(params => {
        params.delete('view')
        return params
      })
    }
  }

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
    
    // Try to find primary contact or use first contact, otherwise default to new
    const primaryContact = property.contacts?.find(contact => contact.isPrimary)
    const defaultContact = primaryContact || property.contacts?.[0]
    
    setCallFormData({
      contactId: defaultContact ? defaultContact.id : 'new',
      contactName: defaultContact ? defaultContact.name : '',
      contactPhone: defaultContact ? (defaultContact.phone || '') : '',
      callType: 'OUTBOUND' as 'INBOUND' | 'OUTBOUND',
      purpose: 'FOLLOW_UP',
      outcome: 'NO_ANSWER',
      duration: '',
      notes: '',
      reminderDate: '',
      inspectionId: ''
    })
    setEditingCall(null)
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
        completed: callFormData.outcome !== 'CALLBACK_REQUESTED',
        inspectionId: callFormData.inspectionId || undefined
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
        
        // Check if we need to prompt for inspection status update
        if (!editingCall && callFormData.inspectionId) {
          const linkedInspection = response.data.data.property.inspections?.find(
            (inspection: Inspection) => inspection.id === callFormData.inspectionId
          )
          
          if (linkedInspection && linkedInspection.status === 'UNCONTACTED') {
            const shouldUpdate = window.confirm(
              `The linked inspection "${linkedInspection.inspectionType.replace('_', ' ')}" is currently "Uncontacted". ` +
              'Since contact has been made, would you like to update the inspection status to "In Progress"?'
            )
            
            if (shouldUpdate) {
              try {
                await api.put(`/inspections/${linkedInspection.id}`, {
                  propertyId: selectedProperty.id,
                  inspectorId: linkedInspection.inspector.id,
                  scheduledDate: linkedInspection.scheduledDate,
                  inspectionType: linkedInspection.inspectionType,
                  status: 'IN_PROGRESS',
                  completedDate: linkedInspection.completedDate || undefined,
                  findings: linkedInspection.findings || undefined,
                  recommendations: linkedInspection.recommendations || undefined,
                  cost: linkedInspection.cost || undefined
                })
                
                setSuccess('Call logged and inspection status updated to "In Progress"')
                
                // Refresh again to show the updated inspection status
                const updatedResponse = await api.get(`/properties/${selectedProperty.id}`)
                setSelectedProperty(updatedResponse.data.data.property)
              } catch (error: any) {
                setError('Call logged successfully, but failed to update inspection status')
              }
            }
          }
        }
      }
    } catch (error: any) {
      setError(error.response?.data?.errors?.[0]?.msg || error.response?.data?.message || 'Failed to save call')
    }
  }

  const handleEditCall = (call: Call) => {
    setEditingCall(call)
    setCallFormData({
      contactId: '',
      contactName: call.contactName,
      contactPhone: call.contactPhone || '',
      callType: call.callType,
      purpose: call.purpose,
      outcome: call.outcome,
      duration: call.duration?.toString() || '',
      notes: call.notes || '',
      reminderDate: call.reminderDate ? new Date(call.reminderDate).toISOString().slice(0, 16) : '',
      inspectionId: call.inspectionId || ''
    })
    setIsCallDialogOpen(true)
  }

  const handleContactSelection = (contactId: string) => {
    if (!contactId || contactId === 'new') {
      // Clear contact fields for new contact
      setCallFormData({
        ...callFormData,
        contactId: 'new',
        contactName: '',
        contactPhone: ''
      })
    } else {
      // Find selected contact and populate fields
      const selectedContact = selectedProperty?.contacts?.find(contact => contact.id === contactId)
      if (selectedContact) {
        setCallFormData({
          ...callFormData,
          contactId: contactId,
          contactName: selectedContact.name,
          contactPhone: selectedContact.phone || ''
        })
      }
    }
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
    try {
      await api.delete(`/inspections/${inspectionId}`)
      setSuccess('Inspection deleted successfully')
      
      // Refresh the property details
      if (selectedProperty) {
        handleViewProperty(selectedProperty)
      }
    } catch (error: any) {
      setError('Failed to delete inspection')
    }
  }

  const handleAddContact = () => {
    setContactFormData({
      name: '',
      phone: '',
      email: '',
      role: '',
      isPrimary: false,
      notes: ''
    })
    setEditingContact(null)
    setIsContactDialogOpen(true)
  }

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact)
    setContactFormData({
      name: contact.name,
      phone: contact.phone || '',
      email: contact.email || '',
      role: contact.role || '',
      isPrimary: contact.isPrimary,
      notes: contact.notes || ''
    })
    setIsContactDialogOpen(true)
  }

  const handleSubmitContact = async () => {
    if (!selectedProperty) return

    try {
      const contactData = {
        propertyId: selectedProperty.id,
        name: contactFormData.name,
        phone: contactFormData.phone || undefined,
        email: contactFormData.email || undefined,
        role: contactFormData.role || undefined,
        isPrimary: contactFormData.isPrimary,
        notes: contactFormData.notes || undefined
      }

      if (editingContact) {
        await api.put(`/contacts/${editingContact.id}`, contactData)
        setSuccess('Contact updated successfully')
      } else {
        await api.post('/contacts', contactData)
        setSuccess('Contact added successfully')
      }
      
      setIsContactDialogOpen(false)
      setEditingContact(null)
      
      // Refresh property details
      if (isViewMode) {
        const response = await api.get(`/properties/${selectedProperty.id}`)
        setSelectedProperty(response.data.data.property)
      }
    } catch (error: any) {
      setError(error.response?.data?.errors?.[0]?.msg || error.response?.data?.message || 'Failed to save contact')
    }
  }

  const handleDeleteContact = async (contactId: string) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) {
      return
    }

    try {
      await api.delete(`/contacts/${contactId}`)
      setSuccess('Contact deleted successfully')
      
      // Refresh property details
      if (selectedProperty && isViewMode) {
        const response = await api.get(`/properties/${selectedProperty.id}`)
        setSelectedProperty(response.data.data.property)
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete contact')
    }
  }

  const handleAddSampleData = async () => {
    try {
      setIsSampleDataLoading(true)
      setError(null)
      
      const sampleProperties = [
        {
          address: "1234 Maple Street",
          city: "Atlanta",
          state: "GA",
          zipCode: "30309",
          propertyType: "RESIDENTIAL",
          description: "Single-family home built in 1995",
          notes: "Customer reported termite activity in basement"
        },
        {
          address: "5678 Oak Avenue",
          city: "Marietta", 
          state: "GA",
          zipCode: "30060",
          propertyType: "RESIDENTIAL",
          description: "Two-story colonial home",
          notes: "Pre-purchase inspection requested"
        },
        {
          address: "910 Pine Drive",
          city: "Roswell",
          state: "GA", 
          zipCode: "30075",
          propertyType: "RESIDENTIAL",
          description: "Ranch style home with deck",
          notes: "Annual preventive inspection"
        },
        {
          address: "246 Commerce Plaza",
          city: "Sandy Springs",
          state: "GA",
          zipCode: "30328", 
          propertyType: "COMMERCIAL",
          description: "Office building complex",
          notes: "Quarterly commercial inspection"
        },
        {
          address: "135 Industrial Way",
          city: "Alpharetta",
          state: "GA",
          zipCode: "30004",
          propertyType: "INDUSTRIAL", 
          description: "Warehouse facility",
          notes: "Moisture concerns in storage area"
        },
        {
          address: "789 Main Street",
          city: "Decatur",
          state: "GA", 
          zipCode: "30030",
          propertyType: "MIXED_USE",
          description: "Mixed-use building with retail and apartments",
          notes: "Comprehensive WDO inspection needed"
        },
        {
          address: "321 Peachtree Road",
          city: "Atlanta",
          state: "GA",
          zipCode: "30305",
          propertyType: "RESIDENTIAL",
          description: "Historic home renovation project", 
          notes: "Pre-renovation termite inspection"
        },
        {
          address: "654 Technology Drive",
          city: "Norcross",
          state: "GA",
          zipCode: "30071",
          propertyType: "COMMERCIAL",
          description: "Tech office building",
          notes: "Employee reported pest sightings"
        },
        {
          address: "987 Piedmont Avenue",
          city: "Atlanta",
          state: "GA",
          zipCode: "30308",
          propertyType: "RESIDENTIAL",
          description: "Luxury condominium unit",
          notes: "Pre-sale inspection requirement"
        },
        {
          address: "147 Business Center",
          city: "Dunwoody",
          state: "GA",
          zipCode: "30338",
          propertyType: "COMMERCIAL",
          description: "Multi-tenant office complex",
          notes: "Annual maintenance inspection"
        }
      ]

      let propertiesAdded = 0
      const createdProperties: any[] = []

      // Add each sample property
      for (const property of sampleProperties) {
        try {
          const response = await api.post('/properties', property)
          createdProperties.push(response.data.data.property)
          propertiesAdded++
        } catch (error: any) {
          // Property might already exist, that's ok
          if (error.response?.status !== 409) {
            console.error(`Error adding property ${property.address}:`, error)
          }
        }
      }

      // Get users to assign as inspectors and get all properties
      const [usersResponse, propertiesResponse] = await Promise.all([
        api.get('/users'),
        api.get('/properties?limit=100')
      ])
      
      const users = usersResponse.data.data.users
      const allProperties = propertiesResponse.data.data.properties
      const currentUserId = user?.id || users[0]?.id

      // Add sample inspections for the properties
      const sampleInspections = [
        {
          propertyAddress: "1234 Maple Street",
          inspectionType: "TERMITE",
          scheduledDate: "2024-06-10T09:00:00.000Z",
          completedDate: "2024-06-11T14:30:00.000Z",
          findings: "Active termite infestation found in basement support beams. Moisture damage evident around foundation.",
          recommendations: "Immediate termite treatment required. Repair moisture issues and replace damaged wood.",
          cost: 350.00,
          status: "SOLD"
        },
        {
          propertyAddress: "5678 Oak Avenue",
          inspectionType: "WDO",
          scheduledDate: "2024-06-15T10:30:00.000Z",
          completedDate: "2024-06-15T12:45:00.000Z",
          findings: "No active WDO activity detected. Previous termite damage found in garage area, appears treated.",
          recommendations: "Property suitable for purchase. Consider annual preventive treatment.",
          cost: 275.00,
          status: "SOLD"
        },
        {
          propertyAddress: "910 Pine Drive",
          inspectionType: "PREVENTIVE",
          scheduledDate: "2024-06-20T14:00:00.000Z",
          completedDate: "2024-06-20T15:30:00.000Z",
          findings: "Minor carpenter ant activity in deck area. No termite activity detected.",
          recommendations: "Localized ant treatment applied. Remove wood debris near deck.",
          cost: 125.00,
          status: "SOLD"
        },
        {
          propertyAddress: "246 Commerce Plaza",
          inspectionType: "PEST",
          scheduledDate: "2024-06-25T11:00:00.000Z",
          findings: "Multiple entry points found. Evidence of rodent activity in storage areas.",
          recommendations: "Seal entry points. Install monitoring stations. Quarterly follow-up recommended.",
          cost: 450.00,
          status: "IN_PROGRESS"
        },
        {
          propertyAddress: "135 Industrial Way",
          inspectionType: "MOISTURE",
          scheduledDate: "2024-06-18T08:30:00.000Z",
          completedDate: "2024-06-18T11:00:00.000Z",
          findings: "High moisture levels detected in northeast corner. Conducive conditions for termites.",
          recommendations: "Address moisture source immediately. Install dehumidification system.",
          cost: 200.00,
          status: "SOLD"
        },
        {
          propertyAddress: "789 Main Street",
          inspectionType: "WDO",
          scheduledDate: "2024-06-22T13:00:00.000Z",
          findings: "Comprehensive inspection in progress. Initial findings suggest no active infestation.",
          recommendations: "Awaiting final results. Preventive treatment may be recommended.",
          status: "UNCONTACTED"
        }
      ]

      let inspectionsAdded = 0
      const createdInspections: any[] = []

      for (const inspectionData of sampleInspections) {
        const property = allProperties.find((p: any) => p.address === inspectionData.propertyAddress)
        if (property) {
          try {
            const inspectionPayload: any = {
              propertyId: property.id,
              inspectorId: currentUserId,
              inspectionType: inspectionData.inspectionType,
              scheduledDate: inspectionData.scheduledDate,
              status: inspectionData.status
            }

            if (inspectionData.completedDate) {
              inspectionPayload.completedDate = inspectionData.completedDate
            }
            if (inspectionData.findings) {
              inspectionPayload.findings = inspectionData.findings
            }
            if (inspectionData.recommendations) {
              inspectionPayload.recommendations = inspectionData.recommendations
            }
            if (inspectionData.cost) {
              inspectionPayload.cost = inspectionData.cost
            }

            const response = await api.post('/inspections', inspectionPayload)
            createdInspections.push(response.data.data.inspection)
            inspectionsAdded++
          } catch (error: any) {
            console.error(`Error adding inspection for ${inspectionData.propertyAddress}:`, error)
          }
        }
      }

      // Add sample calls for some properties
      const sampleCalls = [
        {
          propertyAddress: "1234 Maple Street",
          contactName: "John Smith",
          contactPhone: "(404) 555-0101",
          callType: "OUTBOUND",
          purpose: "INITIAL_CONTACT",
          outcome: "ANSWERED",
          duration: 15,
          notes: "Customer reported termite activity in basement. Scheduled inspection for next week.",
          completed: true
        },
        {
          propertyAddress: "1234 Maple Street",
          contactName: "John Smith",
          contactPhone: "(404) 555-0101",
          callType: "OUTBOUND",
          purpose: "FOLLOW_UP",
          outcome: "ANSWERED",
          duration: 8,
          notes: "Confirmed inspection findings. Customer approved treatment plan.",
          completed: true
        },
        {
          propertyAddress: "5678 Oak Avenue",
          contactName: "Sarah Johnson",
          contactPhone: "(770) 555-0202",
          callType: "INBOUND",
          purpose: "SCHEDULING",
          outcome: "SCHEDULED",
          duration: 12,
          notes: "Real estate agent called to schedule pre-purchase inspection.",
          completed: true
        },
        {
          propertyAddress: "910 Pine Drive",
          contactName: "Mike Wilson",
          contactPhone: "(678) 555-0303",
          callType: "OUTBOUND",
          purpose: "CONFIRMATION",
          outcome: "VOICEMAIL",
          duration: 2,
          notes: "Left voicemail confirming tomorrow's preventive inspection appointment.",
          completed: true
        },
        {
          propertyAddress: "246 Commerce Plaza",
          contactName: "Lisa Chen",
          contactPhone: "(404) 555-0404",
          callType: "OUTBOUND",
          purpose: "REPORT_DELIVERY",
          outcome: "ANSWERED",
          duration: 20,
          notes: "Discussed inspection findings with property manager. Explained recommended actions.",
          completed: true
        },
        {
          propertyAddress: "789 Main Street",
          contactName: "David Brown",
          contactPhone: "(770) 555-0505",
          callType: "OUTBOUND",
          purpose: "INITIAL_CONTACT",
          outcome: "NO_ANSWER",
          notes: "No answer. Will try again tomorrow.",
          completed: false,
          reminderDate: "2024-06-23T09:00:00.000Z"
        }
      ]

      let callsAdded = 0

      for (const callData of sampleCalls) {
        const property = allProperties.find((p: any) => p.address === callData.propertyAddress)
        if (property) {
          try {
            const callPayload: any = {
              propertyId: property.id,
              contactName: callData.contactName,
              contactPhone: callData.contactPhone,
              callType: callData.callType,
              purpose: callData.purpose,
              outcome: callData.outcome,
              completed: callData.completed
            }

            if (callData.duration) callPayload.duration = callData.duration
            if (callData.notes) callPayload.notes = callData.notes
            if (callData.reminderDate) callPayload.reminderDate = callData.reminderDate

            // Try to link to inspection if applicable
            const linkedInspection = createdInspections.find(inspection => 
              inspection.propertyId === property.id
            )
            if (linkedInspection && ['CONFIRMATION', 'FOLLOW_UP', 'REPORT_DELIVERY'].includes(callData.purpose)) {
              callPayload.inspectionId = linkedInspection.id
            }

            await api.post('/calls', callPayload)
            callsAdded++
          } catch (error: any) {
            console.error(`Error adding call for ${callData.propertyAddress}:`, error)
          }
        }
      }

      // Add sample contacts for some properties
      const sampleContacts = [
        {
          propertyAddress: "1234 Maple Street",
          name: "John Smith",
          phone: "(404) 555-0101",
          email: "john.smith@email.com",
          role: "Homeowner",
          isPrimary: true,
          notes: "Prefers morning appointments. Has basement access concerns."
        },
        {
          propertyAddress: "5678 Oak Avenue",
          name: "Sarah Johnson",
          phone: "(770) 555-0202",
          email: "sarah.j@realty.com",
          role: "Real Estate Agent",
          isPrimary: true,
          notes: "Representing buyer. Fast closing timeline."
        },
        {
          propertyAddress: "5678 Oak Avenue",
          name: "Tom Miller",
          phone: "(404) 555-0606",
          email: "tom.miller@email.com",
          role: "Buyer",
          isPrimary: false,
          notes: "First-time home buyer. Needs detailed explanation of findings."
        },
        {
          propertyAddress: "910 Pine Drive",
          name: "Mike Wilson",
          phone: "(678) 555-0303",
          email: "mike.w@email.com",
          role: "Homeowner",
          isPrimary: true,
          notes: "Long-time customer. Annual service agreement."
        },
        {
          propertyAddress: "246 Commerce Plaza",
          name: "Lisa Chen",
          phone: "(404) 555-0404",
          email: "lisa.chen@bizprop.com",
          role: "Property Manager",
          isPrimary: true,
          notes: "Manages multiple properties. Prefers email communication for reports."
        },
        {
          propertyAddress: "789 Main Street",
          name: "David Brown",
          phone: "(770) 555-0505",
          email: "david.brown@email.com",
          role: "Building Owner",
          isPrimary: true,
          notes: "Owns several commercial properties in the area."
        }
      ]

      let contactsAdded = 0

      for (const contactData of sampleContacts) {
        const property = allProperties.find((p: any) => p.address === contactData.propertyAddress)
        if (property) {
          try {
            await api.post('/contacts', {
              propertyId: property.id,
              name: contactData.name,
              phone: contactData.phone,
              email: contactData.email,
              role: contactData.role,
              isPrimary: contactData.isPrimary,
              notes: contactData.notes
            })
            contactsAdded++
          } catch (error: any) {
            console.error(`Error adding contact for ${contactData.propertyAddress}:`, error)
          }
        }
      }

      setSuccess(`Successfully added ${propertiesAdded} properties, ${inspectionsAdded} inspections, ${callsAdded} calls, and ${contactsAdded} contacts`)
      fetchProperties()
      if (canManageProperties) {
        fetchStats()
      }
    } catch (error: any) {
      setError('Failed to add sample data')
    } finally {
      setIsSampleDataLoading(false)
    }
  }

  const handleRemoveSampleData = async () => {
    try {
      setIsSampleDataLoading(true)
      setError(null)
      
      // Get all properties to find sample ones
      const response = await api.get('/properties?limit=100')
      const allProperties = response.data.data.properties
      
      // Sample property addresses to identify and remove
      const sampleAddresses = [
        "1234 Maple Street",
        "5678 Oak Avenue", 
        "910 Pine Drive",
        "246 Commerce Plaza",
        "135 Industrial Way",
        "789 Main Street",
        "321 Peachtree Road",
        "654 Technology Drive",
        "987 Piedmont Avenue",
        "147 Business Center"
      ]
      
      const samplesToRemove = allProperties.filter((property: Property) => 
        sampleAddresses.includes(property.address)
      )
      
      if (samplesToRemove.length === 0) {
        setError('No sample properties found to remove')
        return
      }
      
      let propertiesRemoved = 0
      let inspectionsRemoved = 0
      
      // Remove inspections first, then properties
      for (const property of samplesToRemove) {
        try {
          // Get inspections for this property
          const inspectionsResponse = await api.get(`/inspections?propertyId=${property.id}`)
          const inspections = inspectionsResponse.data.data.inspections
          
          // Remove inspections
          for (const inspection of inspections) {
            try {
              await api.delete(`/inspections/${inspection.id}`)
              inspectionsRemoved++
            } catch (error: any) {
              console.warn(`Could not delete inspection ${inspection.id}:`, error.response?.data?.message)
            }
          }
          
          // Remove property
          await api.delete(`/properties/${property.id}`)
          propertiesRemoved++
        } catch (error: any) {
          console.warn(`Could not delete property ${property.address}:`, error.response?.data?.message)
        }
      }

      setSuccess(`Removed ${propertiesRemoved} properties and ${inspectionsRemoved} inspections`)
      fetchProperties()
      if (canManageProperties) {
        fetchStats()
      }
    } catch (error: any) {
      setError('Failed to remove sample data')
    } finally {
      setIsSampleDataLoading(false)
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
        <Box>
          {canManageProperties && (
            <>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleRemoveSampleData}
                disabled={isSampleDataLoading}
                sx={{ mr: 1 }}
              >
                {isSampleDataLoading ? <CircularProgress size={20} /> : 'Remove Sample Data'}
              </Button>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleAddSampleData}
                disabled={isSampleDataLoading}
                sx={{ mr: 2 }}
              >
                {isSampleDataLoading ? <CircularProgress size={20} /> : 'Add Sample Data'}
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateProperty}
              >
                Add Property
              </Button>
            </>
          )}
        </Box>
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
                  With Calls
                </Typography>
                <Typography variant="h4">
                  {stats.propertiesWithCalls}
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
              <TableCell>Calls</TableCell>
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
                    label={property._count.calls}
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
                          disabled={property._count.calls > 0 || property._count.inspections > 0}
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
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" gap={1}>
            {propertyTypeIcons[selectedProperty?.propertyType || 'RESIDENTIAL']}
            <Typography variant="h5" component="span">
              {isViewMode ? 'Property Details' : isEditing ? 'Edit Property' : 'Add New Property'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {isViewMode && selectedProperty ? (
            <Box>
              {/* Property Header */}
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
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box flex={1}>
                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <Avatar 
                          sx={{ 
                            bgcolor: `${propertyTypeColors[selectedProperty.propertyType]}.main`,
                            width: 56,
                            height: 56
                          }}
                        >
                          {propertyTypeIcons[selectedProperty.propertyType]}
                        </Avatar>
                        <Box>
                          <Typography variant="h5" fontWeight="600" gutterBottom>
                            {selectedProperty.address}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <LocationIcon color="action" fontSize="small" />
                            <Typography color="textSecondary" variant="h6">
                              {selectedProperty.city}, {selectedProperty.state} {selectedProperty.zipCode}
                            </Typography>
                          </Box>
                          <Chip
                            icon={propertyTypeIcons[selectedProperty.propertyType]}
                            label={selectedProperty.propertyType.replace('_', ' ')}
                            color={propertyTypeColors[selectedProperty.propertyType]}
                            size="medium"
                            sx={{ fontWeight: 'medium' }}
                          />
                        </Box>
                      </Box>
                    </Box>
                    {canManageProperties && (
                      <Tooltip title="Edit Property">
                        <IconButton
                          onClick={() => handleEditProperty(selectedProperty)}
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
                  </Box>
                </CardContent>
              </Card>

              <Grid container spacing={3}>
                {/* Street View Section */}
                <Grid item xs={12} lg={8}>
                  <Card elevation={2} sx={{ height: 'fit-content' }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <LocationIcon color="primary" />
                        <Typography variant="h6" fontWeight="600">Street View</Typography>
                      </Box>
                      <Box 
                        sx={{ 
                          borderRadius: 2, 
                          overflow: 'hidden',
                          border: '1px solid',
                          borderColor: 'divider'
                        }}
                      >
                        <StreetView
                          address={selectedProperty.address}
                          city={selectedProperty.city}
                          state={selectedProperty.state}
                          zipCode={selectedProperty.zipCode}
                          width={600}
                          height={300}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Quick Stats */}
                <Grid item xs={12} lg={4}>
                  <Stack spacing={2}>
                    {/* Activity Summary */}
                    <Card elevation={2}>
                      <CardContent>
                        <Typography variant="h6" fontWeight="600" gutterBottom>
                          Activity Summary
                        </Typography>
                        <Stack spacing={2}>
                          <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box display="flex" alignItems="center" gap={1}>
                              <PhoneIcon color="primary" fontSize="small" />
                              <Typography variant="body2">Total Calls</Typography>
                            </Box>
                            <Chip 
                              label={selectedProperty._count?.calls || 0} 
                              color="primary" 
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                          <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box display="flex" alignItems="center" gap={1}>
                              <InspectionIcon color="secondary" fontSize="small" />
                              <Typography variant="body2">Total Inspections</Typography>
                            </Box>
                            <Chip 
                              label={selectedProperty._count?.inspections || 0} 
                              color="secondary" 
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>

                    {/* Property Info */}
                    {(selectedProperty.description || selectedProperty.notes) && (
                      <Card elevation={2}>
                        <CardContent>
                          <Typography variant="h6" fontWeight="600" gutterBottom>
                            Property Information
                          </Typography>
                          {selectedProperty.description && (
                            <Box mb={selectedProperty.notes ? 2 : 0}>
                              <Box display="flex" alignItems="center" gap={1} mb={1}>
                                <NotesIcon color="action" fontSize="small" />
                                <Typography variant="subtitle2" fontWeight="600">Description</Typography>
                              </Box>
                              <Typography variant="body2" color="textSecondary" sx={{ pl: 3 }}>
                                {selectedProperty.description}
                              </Typography>
                            </Box>
                          )}
                          {selectedProperty.notes && (
                            <Box>
                              <Box display="flex" alignItems="center" gap={1} mb={1}>
                                <NotesIcon color="action" fontSize="small" />
                                <Typography variant="subtitle2" fontWeight="600">Notes</Typography>
                              </Box>
                              <Typography variant="body2" color="textSecondary" sx={{ pl: 3 }}>
                                {selectedProperty.notes}
                              </Typography>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </Stack>
                </Grid>

                {/* Contacts Section */}
                <Grid item xs={12}>
                  <Card elevation={2} sx={{ mt: 3 }}>
                    <CardContent sx={{ pb: 1 }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <PersonIcon color="info" />
                          <Typography variant="h6" fontWeight="600">
                            Contacts ({selectedProperty.contacts?.length || 0})
                          </Typography>
                        </Box>
                        {canManageProperties && (
                          <Button
                            startIcon={<PersonAddIcon />}
                            variant="outlined"
                            size="small"
                            onClick={handleAddContact}
                          >
                            Add Contact
                          </Button>
                        )}
                      </Box>
                      
                      {selectedProperty.contacts && selectedProperty.contacts.length > 0 ? (
                        <Stack spacing={2}>
                          {selectedProperty.contacts.map((contact) => (
                            <Card 
                              key={contact.id} 
                              variant="outlined" 
                              sx={{ 
                                border: '1px solid',
                                borderColor: contact.isPrimary ? 'primary.main' : 'divider',
                                backgroundColor: contact.isPrimary ? 'primary.50' : 'inherit',
                                '&:hover': { 
                                  borderColor: 'info.main',
                                  boxShadow: 1
                                },
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <CardContent sx={{ pb: 2 }}>
                                <Grid container spacing={2}>
                                  <Grid item xs={12} md={8}>
                                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                                      <Avatar 
                                        sx={{ 
                                          bgcolor: contact.isPrimary ? 'primary.main' : 'info.main',
                                          width: 40,
                                          height: 40
                                        }}
                                      >
                                        <PersonIcon />
                                      </Avatar>
                                      <Box>
                                        <Box display="flex" alignItems="center" gap={1}>
                                          <Typography variant="h6" fontWeight="600">
                                            {contact.name}
                                          </Typography>
                                          {contact.isPrimary && (
                                            <Chip
                                              label="Primary"
                                              color="primary"
                                              size="small"
                                            />
                                          )}
                                        </Box>
                                        {contact.role && (
                                          <Typography variant="body2" color="textSecondary">
                                            {contact.role}
                                          </Typography>
                                        )}
                                      </Box>
                                    </Box>
                                    
                                    <Grid container spacing={2}>
                                      {contact.phone && (
                                        <Grid item xs={12} sm={6}>
                                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                                            <PhoneIcon color="action" fontSize="small" />
                                            <Typography variant="body2" fontWeight="600">Phone</Typography>
                                          </Box>
                                          <Typography variant="body2" color="textSecondary" sx={{ pl: 3 }}>
                                            {contact.phone}
                                          </Typography>
                                        </Grid>
                                      )}
                                      
                                      {contact.email && (
                                        <Grid item xs={12} sm={6}>
                                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                                            <EmailIcon color="action" fontSize="small" />
                                            <Typography variant="body2" fontWeight="600">Email</Typography>
                                          </Box>
                                          <Typography variant="body2" color="textSecondary" sx={{ pl: 3 }}>
                                            {contact.email}
                                          </Typography>
                                        </Grid>
                                      )}
                                    </Grid>
                                    
                                    {contact.notes && (
                                      <Box mt={2}>
                                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                                          <NotesIcon color="info" fontSize="small" />
                                          <Typography variant="body2" fontWeight="600">Notes</Typography>
                                        </Box>
                                        <Typography variant="body2" color="textSecondary" sx={{ pl: 3 }}>
                                          {contact.notes}
                                        </Typography>
                                      </Box>
                                    )}
                                  </Grid>
                                  
                                  <Grid item xs={12} md={4}>
                                    {canManageProperties && (
                                      <Box display="flex" flexDirection="column" gap={1} alignItems="flex-end">
                                        <Button
                                          startIcon={<EditIcon />}
                                          variant="outlined"
                                          size="small"
                                          onClick={() => handleEditContact(contact)}
                                          sx={{ minWidth: 120 }}
                                        >
                                          Edit
                                        </Button>
                                        <Button
                                          startIcon={<DeleteIcon />}
                                          variant="outlined"
                                          color="error"
                                          size="small"
                                          onClick={() => handleDeleteContact(contact.id)}
                                          sx={{ minWidth: 120 }}
                                        >
                                          Delete
                                        </Button>
                                      </Box>
                                    )}
                                  </Grid>
                                </Grid>
                              </CardContent>
                            </Card>
                          ))}
                        </Stack>
                      ) : (
                        <Box textAlign="center" py={4}>
                          <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                          <Typography variant="body1" color="textSecondary">
                            No contacts added yet
                          </Typography>
                          {canManageProperties && (
                            <Typography variant="body2" color="textSecondary">
                              Click "Add Contact" to get started
                            </Typography>
                          )}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Inspections Section */}
                {selectedProperty.inspections && selectedProperty.inspections.length > 0 && (
                  <Grid item xs={12}>
                    <Card elevation={2} sx={{ mt: 3 }}>
                      <CardContent sx={{ pb: 1 }}>
                        <Box display="flex" alignItems="center" gap={1} mb={3}>
                          <InspectionIcon color="secondary" />
                          <Typography variant="h6" fontWeight="600">
                            Inspection History ({selectedProperty.inspections.length})
                          </Typography>
                        </Box>
                        <Stack spacing={2}>
                          {selectedProperty.inspections.map((inspection) => (
                            <Card 
                              key={inspection.id} 
                              variant="outlined" 
                              sx={{ 
                                border: '1px solid',
                                borderColor: 'divider',
                                '&:hover': { 
                                  borderColor: 'secondary.main',
                                  boxShadow: 1
                                },
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <CardContent sx={{ pb: 2 }}>
                                <Grid container spacing={2}>
                                  <Grid item xs={12} md={8}>
                                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                                      <Avatar 
                                        sx={{ 
                                          bgcolor: `${getStatusColor(inspection.status)}.main`,
                                          width: 40,
                                          height: 40
                                        }}
                                      >
                                        {inspection.status === 'SOLD' ? <CheckIcon /> : 
                                         inspection.status === 'DECLINED' ? <CancelIcon /> :
                                         inspection.status === 'IN_PROGRESS' ? <BuildIcon /> : <ScheduleIcon />}
                                      </Avatar>
                                      <Box>
                                        <Typography variant="h6" fontWeight="600">
                                          {inspection.inspectionType.replace('_', ' ')} Inspection
                                        </Typography>
                                        <Chip
                                          label={inspection.status.replace('_', ' ')}
                                          color={getStatusColor(inspection.status) as any}
                                          size="small"
                                          sx={{ mt: 0.5 }}
                                        />
                                      </Box>
                                    </Box>
                                    
                                    <Grid container spacing={2}>
                                      <Grid item xs={12} sm={6}>
                                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                                          <CalendarIcon color="action" fontSize="small" />
                                          <Typography variant="body2" fontWeight="600">Scheduled</Typography>
                                        </Box>
                                        <Typography variant="body2" color="textSecondary" sx={{ pl: 3 }}>
                                          {formatDate(inspection.scheduledDate)}
                                        </Typography>
                                      </Grid>
                                      
                                      {inspection.completedDate && (
                                        <Grid item xs={12} sm={6}>
                                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                                            <CheckIcon color="success" fontSize="small" />
                                            <Typography variant="body2" fontWeight="600">Completed</Typography>
                                          </Box>
                                          <Typography variant="body2" color="textSecondary" sx={{ pl: 3 }}>
                                            {formatDate(inspection.completedDate)}
                                          </Typography>
                                        </Grid>
                                      )}
                                      
                                      <Grid item xs={12} sm={6}>
                                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                                          <PersonIcon color="action" fontSize="small" />
                                          <Typography variant="body2" fontWeight="600">Inspector</Typography>
                                        </Box>
                                        <Typography variant="body2" color="textSecondary" sx={{ pl: 3 }}>
                                          {inspection.inspector.firstName} {inspection.inspector.lastName}
                                        </Typography>
                                      </Grid>
                                      
                                      {inspection.cost && (
                                        <Grid item xs={12} sm={6}>
                                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                                            <MoneyIcon color="success" fontSize="small" />
                                            <Typography variant="body2" fontWeight="600">Cost</Typography>
                                          </Box>
                                          <Typography variant="body2" color="textSecondary" sx={{ pl: 3 }}>
                                            ${inspection.cost.toFixed(2)}
                                          </Typography>
                                        </Grid>
                                      )}
                                    </Grid>
                                    
                                    {(inspection.findings || inspection.recommendations) && (
                                      <Box mt={2}>
                                        {inspection.findings && (
                                          <Box mb={1}>
                                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                                              <WarningIcon color="warning" fontSize="small" />
                                              <Typography variant="body2" fontWeight="600">Findings</Typography>
                                            </Box>
                                            <Typography variant="body2" color="textSecondary" sx={{ pl: 3 }}>
                                              {inspection.findings}
                                            </Typography>
                                          </Box>
                                        )}
                                        {inspection.recommendations && (
                                          <Box>
                                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                                              <NotesIcon color="info" fontSize="small" />
                                              <Typography variant="body2" fontWeight="600">Recommendations</Typography>
                                            </Box>
                                            <Typography variant="body2" color="textSecondary" sx={{ pl: 3 }}>
                                              {inspection.recommendations}
                                            </Typography>
                                          </Box>
                                        )}
                                      </Box>
                                    )}
                                  </Grid>
                                  
                                  <Grid item xs={12} md={4}>
                                    {canManageProperties && (
                                      <Box display="flex" flexDirection="column" gap={1} alignItems="flex-end">
                                        <Button
                                          startIcon={<EditIcon />}
                                          variant="outlined"
                                          size="small"
                                          onClick={() => handleEditInspection(inspection)}
                                          sx={{ minWidth: 120 }}
                                        >
                                          Edit
                                        </Button>
                                        <Button
                                          startIcon={<DeleteIcon />}
                                          variant="outlined"
                                          color="error"
                                          size="small"
                                          onClick={() => handleDeleteInspection(inspection.id)}
                                          sx={{ minWidth: 120 }}
                                        >
                                          Delete
                                        </Button>
                                      </Box>
                                    )}
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

                {/* Calls Section */}
                {selectedProperty.calls && selectedProperty.calls.length > 0 && (
                  <Grid item xs={12}>
                    <Card elevation={2} sx={{ mt: 3 }}>
                      <CardContent sx={{ pb: 1 }}>
                        <Box display="flex" alignItems="center" gap={1} mb={3}>
                          <PhoneIcon color="primary" />
                          <Typography variant="h6" fontWeight="600">
                            Call History ({selectedProperty.calls.length})
                          </Typography>
                        </Box>
                        <Stack spacing={2}>
                          {selectedProperty.calls.map((call) => (
                            <Card 
                              key={call.id} 
                              variant="outlined" 
                              sx={{ 
                                border: '1px solid',
                                borderColor: 'divider',
                                '&:hover': { 
                                  borderColor: 'primary.main',
                                  boxShadow: 1
                                },
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <CardContent sx={{ pb: 2 }}>
                                <Grid container spacing={2}>
                                  <Grid item xs={12} md={8}>
                                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                                      <Avatar 
                                        sx={{ 
                                          bgcolor: call.callType === 'INBOUND' ? 'success.main' : 'primary.main',
                                          width: 40,
                                          height: 40
                                        }}
                                      >
                                        {call.callType === 'INBOUND' ? <CallIcon /> : <PhoneIcon />}
                                      </Avatar>
                                      <Box>
                                        <Typography variant="h6" fontWeight="600">
                                          {call.callType} Call
                                        </Typography>
                                        <Box display="flex" gap={1} mt={0.5}>
                                          <Chip
                                            label={call.purpose.replace('_', ' ')}
                                            size="small"
                                            variant="outlined"
                                          />
                                          <Chip
                                            label={call.outcome.replace('_', ' ')}
                                            color={call.outcome === 'ANSWERED' ? 'success' : call.outcome === 'NO_ANSWER' ? 'warning' : 'default'}
                                            size="small"
                                          />
                                        </Box>
                                      </Box>
                                    </Box>
                                    
                                    <Grid container spacing={2}>
                                      <Grid item xs={12} sm={6}>
                                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                                          <PersonIcon color="action" fontSize="small" />
                                          <Typography variant="body2" fontWeight="600">Contact</Typography>
                                        </Box>
                                        <Typography variant="body2" color="textSecondary" sx={{ pl: 3 }}>
                                          {call.contactName}
                                        </Typography>
                                        {call.contactPhone && (
                                          <Typography variant="body2" color="textSecondary" sx={{ pl: 3 }}>
                                            📞 {call.contactPhone}
                                          </Typography>
                                        )}
                                      </Grid>
                                      
                                      <Grid item xs={12} sm={6}>
                                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                                          <CalendarIcon color="action" fontSize="small" />
                                          <Typography variant="body2" fontWeight="600">Date & Time</Typography>
                                        </Box>
                                        <Typography variant="body2" color="textSecondary" sx={{ pl: 3 }}>
                                          {formatDate(call.createdAt)}
                                        </Typography>
                                      </Grid>
                                      
                                      <Grid item xs={12} sm={6}>
                                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                                          <PersonIcon color="action" fontSize="small" />
                                          <Typography variant="body2" fontWeight="600">Made By</Typography>
                                        </Box>
                                        <Typography variant="body2" color="textSecondary" sx={{ pl: 3 }}>
                                          {call.madeBy.firstName} {call.madeBy.lastName}
                                        </Typography>
                                      </Grid>
                                      
                                      {call.duration && (
                                        <Grid item xs={12} sm={6}>
                                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                                            <TimeIcon color="action" fontSize="small" />
                                            <Typography variant="body2" fontWeight="600">Duration</Typography>
                                          </Box>
                                          <Typography variant="body2" color="textSecondary" sx={{ pl: 3 }}>
                                            {call.duration} minutes
                                          </Typography>
                                        </Grid>
                                      )}
                                      
                                      {call.inspection && (
                                        <Grid item xs={12} sm={6}>
                                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                                            <InspectionIcon color="secondary" fontSize="small" />
                                            <Typography variant="body2" fontWeight="600">Linked Inspection</Typography>
                                          </Box>
                                          <Typography variant="body2" color="textSecondary" sx={{ pl: 3 }}>
                                            {call.inspection.inspectionType.replace('_', ' ')}
                                          </Typography>
                                          <Box sx={{ pl: 3, mt: 0.5 }}>
                                            <Chip
                                              label={call.inspection.status.replace('_', ' ')}
                                              color={getStatusColor(call.inspection.status) as any}
                                              size="small"
                                            />
                                          </Box>
                                        </Grid>
                                      )}
                                    </Grid>
                                    
                                    {call.reminderDate && !call.completed && (
                                      <Box mt={2} p={2} sx={{ bgcolor: 'warning.50', borderRadius: 1, border: '1px solid', borderColor: 'warning.200' }}>
                                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                                          <ScheduleIcon color="warning" fontSize="small" />
                                          <Typography variant="body2" fontWeight="600" color="warning.dark">
                                            Reminder Set
                                          </Typography>
                                        </Box>
                                        <Typography variant="body2" color="warning.dark" sx={{ pl: 3 }}>
                                          {formatDate(call.reminderDate)}
                                        </Typography>
                                      </Box>
                                    )}
                                    
                                    {call.notes && (
                                      <Box mt={2}>
                                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                                          <NotesIcon color="info" fontSize="small" />
                                          <Typography variant="body2" fontWeight="600">Notes</Typography>
                                        </Box>
                                        <Typography variant="body2" color="textSecondary" sx={{ pl: 3 }}>
                                          {call.notes}
                                        </Typography>
                                      </Box>
                                    )}
                                  </Grid>
                                  
                                  <Grid item xs={12} md={4}>
                                    <Box display="flex" flexDirection="column" gap={1} alignItems="flex-end">
                                      <Button
                                        startIcon={<EditIcon />}
                                        variant="outlined"
                                        size="small"
                                        onClick={() => handleEditCall(call)}
                                        sx={{ minWidth: 120 }}
                                      >
                                        Edit
                                      </Button>
                                      {canManageProperties && (
                                        <Button
                                          startIcon={<DeleteIcon />}
                                          variant="outlined"
                                          color="error"
                                          size="small"
                                          onClick={() => handleDeleteCall(call.id)}
                                          sx={{ minWidth: 120 }}
                                        >
                                          Delete
                                        </Button>
                                      )}
                                    </Box>
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

                {/* Creator Information & Actions */}
                <Grid item xs={12}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 3 }}>
                    {/* Creator Info */}
                    <Card elevation={1} sx={{ flex: 1 }}>
                      <CardContent sx={{ py: 2 }}>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ bgcolor: 'info.main' }}>
                            <PersonIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="600">Created By</Typography>
                            <Typography variant="body2" color="textSecondary">
                              {selectedProperty.createdBy.firstName} {selectedProperty.createdBy.lastName}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {formatDate(selectedProperty.createdAt)}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    {canManageProperties && (
                      <Card elevation={1} sx={{ flex: 1 }}>
                        <CardContent sx={{ py: 2 }}>
                          <Typography variant="subtitle2" fontWeight="600" gutterBottom>Quick Actions</Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            <Button
                              startIcon={<PhoneIcon />}
                              variant="outlined"
                              size="small"
                              onClick={() => handleLogCall(selectedProperty)}
                            >
                              Log Call
                            </Button>
                            <Button
                              startIcon={<InspectionIcon />}
                              variant="outlined"
                              size="small"
                              color="secondary"
                              onClick={() => {
                                setSelectedProperty(selectedProperty)
                                setEditingInspection(null)
                                setInspectionFormData({
                                  scheduledDate: '',
                                  inspectionType: 'WDO',
                                  status: 'UNCONTACTED',
                                  completedDate: '',
                                  findings: '',
                                  recommendations: '',
                                  cost: ''
                                })
                                setIsInspectionDialogOpen(true)
                              }}
                            >
                              Schedule Inspection
                            </Button>
                            <Button
                              startIcon={<PersonAddIcon />}
                              variant="outlined"
                              size="small"
                              color="info"
                              onClick={handleAddContact}
                            >
                              Add Contact
                            </Button>
                          </Stack>
                        </CardContent>
                      </Card>
                    )}
                  </Stack>
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
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Contact</InputLabel>
                  <Select
                    value={callFormData.contactId}
                    label="Contact"
                    onChange={(e) => handleContactSelection(e.target.value)}
                  >
                    <MenuItem value="new">+ Add New Contact</MenuItem>
                    {selectedProperty?.contacts?.map((contact) => (
                      <MenuItem key={contact.id} value={contact.id}>
                        <Box display="flex" alignItems="center" gap={1} width="100%">
                          <Box>
                            <Typography variant="body2" fontWeight="600">
                              {contact.name}
                            </Typography>
                            {contact.phone && (
                              <Typography variant="body2" color="textSecondary" fontSize="0.8rem">
                                {contact.phone}
                              </Typography>
                            )}
                          </Box>
                          {contact.isPrimary && (
                            <Chip label="Primary" color="primary" size="small" sx={{ ml: 'auto' }} />
                          )}
                        </Box>
                      </MenuItem>
                    ))}
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
                  disabled={callFormData.contactId !== 'new' && callFormData.contactId !== ''}
                  helperText={callFormData.contactId !== 'new' && callFormData.contactId !== '' ? 
                    'Contact selected from list above' : 'Enter name for new contact'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={callFormData.contactPhone}
                  onChange={(e) => setCallFormData({ ...callFormData, contactPhone: e.target.value })}
                  disabled={callFormData.contactId !== 'new' && callFormData.contactId !== ''}
                  helperText={callFormData.contactId !== 'new' && callFormData.contactId !== '' ? 
                    'Phone from selected contact' : 'Enter phone for new contact (optional)'}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Related Inspection (Optional)</InputLabel>
                  <Select
                    value={callFormData.inspectionId}
                    label="Related Inspection (Optional)"
                    onChange={(e) => setCallFormData({ ...callFormData, inspectionId: e.target.value })}
                  >
                    <MenuItem value="">None</MenuItem>
                    {selectedProperty?.inspections?.map((inspection) => (
                      <MenuItem key={inspection.id} value={inspection.id}>
                        {inspection.inspectionType.replace('_', ' ')} - {inspection.status.replace('_', ' ')} 
                        ({formatDate(inspection.scheduledDate)})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
                  label="Completed Date"
                  type="datetime-local"
                  value={inspectionFormData.completedDate}
                  onChange={(e) => setInspectionFormData({ ...inspectionFormData, completedDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                                      disabled={inspectionFormData.status !== 'SOLD'}
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

      {/* Contact Dialog */}
      <Dialog open={isContactDialogOpen} onClose={() => setIsContactDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingContact ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Name"
                  value={contactFormData.name}
                  onChange={(e) => setContactFormData({ ...contactFormData, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={contactFormData.phone}
                  onChange={(e) => setContactFormData({ ...contactFormData, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={contactFormData.email}
                  onChange={(e) => setContactFormData({ ...contactFormData, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Role"
                  value={contactFormData.role}
                  onChange={(e) => setContactFormData({ ...contactFormData, role: e.target.value })}
                  placeholder="e.g., Owner, Tenant, Agent"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Primary Contact</InputLabel>
                  <Select
                    value={contactFormData.isPrimary ? 'true' : 'false'}
                    label="Primary Contact"
                    onChange={(e) => setContactFormData({ ...contactFormData, isPrimary: e.target.value === 'true' })}
                  >
                    <MenuItem value="false">No</MenuItem>
                    <MenuItem value="true">Yes</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={3}
                  value={contactFormData.notes}
                  onChange={(e) => setContactFormData({ ...contactFormData, notes: e.target.value })}
                  placeholder="Additional information about this contact"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsContactDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmitContact} variant="contained">
            {editingContact ? 'Update Contact' : 'Add Contact'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Properties 