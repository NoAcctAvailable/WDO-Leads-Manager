import React, { useState, useEffect } from 'react'
import { Box, Card, CardMedia, Typography, IconButton, Tooltip } from '@mui/material'
import { OpenInNew as OpenIcon, Settings as SettingsIcon } from '@mui/icons-material'

interface StreetViewProps {
  address: string
  city: string
  state: string
  zipCode: string
  width?: number
  height?: number
  showLink?: boolean
  showSettings?: boolean
}

const StreetView: React.FC<StreetViewProps> = ({
  address,
  city,
  state,
  zipCode,
  width = 400,
  height = 300,
  showLink = true,
  showSettings = false
}) => {
  const [apiKey, setApiKey] = useState('')
  const [isEnabled, setIsEnabled] = useState(false)
  const [imageError, setImageError] = useState(false)
  
  useEffect(() => {
    // Load API key and settings from localStorage
    const savedApiKey = localStorage.getItem('streetview_api_key') || ''
    const savedEnabled = localStorage.getItem('streetview_enabled') === 'true'
    
    setApiKey(savedApiKey)
    setIsEnabled(savedEnabled)
  }, [])
  
  // Format the full address for the API
  const fullAddress = `${address}, ${city}, ${state} ${zipCode}`
  const encodedAddress = encodeURIComponent(fullAddress)
  
  // Google Street View Static API URL
  const streetViewUrl = apiKey && isEnabled 
    ? `https://maps.googleapis.com/maps/api/streetview?size=${width}x${height}&location=${encodedAddress}&heading=0&pitch=0&key=${apiKey}`
    : null
  
  // Google Maps URL for opening in new tab
  const mapsUrl = `https://www.google.com/maps/place/${encodedAddress}`
  
  const handleOpenInMaps = () => {
    window.open(mapsUrl, '_blank')
  }

  const handleOpenSettings = () => {
    // This could open a settings dialog or navigate to settings page
    window.location.href = '/settings'
  }

  const handleImageError = () => {
    setImageError(true)
  }

  // If Street View is disabled or no API key is configured
  if (!isEnabled || !apiKey) {
    return (
      <Card>
        <Box
          sx={{
            width,
            height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'grey.100',
            flexDirection: 'column',
            gap: 1,
            p: 2
          }}
        >
          <Typography variant="body2" color="text.secondary" align="center">
            Street View Preview
          </Typography>
          <Typography variant="caption" color="text.secondary" align="center">
            {!isEnabled ? 'Street View is disabled' : 'Configure Google Street View API key to enable'}
          </Typography>
          <Box display="flex" gap={1} mt={1}>
            {showLink && (
              <Tooltip title="Open in Google Maps">
                <IconButton onClick={handleOpenInMaps} size="small">
                  <OpenIcon />
                </IconButton>
              </Tooltip>
            )}
            {showSettings && (
              <Tooltip title="Configure Street View">
                <IconButton onClick={handleOpenSettings} size="small">
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </Card>
    )
  }

  // If there was an error loading the image
  if (imageError) {
    return (
      <Card>
        <Box
          sx={{
            width,
            height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'error.light',
            flexDirection: 'column',
            gap: 1,
            p: 2
          }}
        >
          <Typography variant="body2" color="error.contrastText" align="center">
            Street View Unavailable
          </Typography>
          <Typography variant="caption" color="error.contrastText" align="center">
            No street view imagery for this location
          </Typography>
          {showLink && (
            <Tooltip title="Open in Google Maps">
              <IconButton onClick={handleOpenInMaps} size="small" sx={{ color: 'error.contrastText' }}>
                <OpenIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Card>
    )
  }

  return (
    <Card>
      <Box position="relative">
        <CardMedia
          component="img"
          height={height}
          image={streetViewUrl || ''}
          alt={`Street view of ${fullAddress}`}
          sx={{
            objectFit: 'cover'
          }}
          onError={handleImageError}
        />
        {showLink && (
          <Box
            position="absolute"
            top={8}
            right={8}
          >
            <Tooltip title="Open in Google Maps">
              <IconButton
                onClick={handleOpenInMaps}
                size="small"
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 1)'
                  }
                }}
              >
                <OpenIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
    </Card>
  )
}

export default StreetView 