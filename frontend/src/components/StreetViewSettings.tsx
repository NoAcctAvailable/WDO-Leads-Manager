import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  FormControlLabel,
  Switch,
  Grid,
  Divider,
  Link
} from '@mui/material'
import { Settings as SettingsIcon, Visibility as ViewIcon } from '@mui/icons-material'

interface StreetViewSettingsProps {
  onApiKeyChange?: (apiKey: string) => void
}

const StreetViewSettings: React.FC<StreetViewSettingsProps> = ({ onApiKeyChange }) => {
  const [apiKey, setApiKey] = useState('')
  const [isEnabled, setIsEnabled] = useState(false)
  const [testAddress, setTestAddress] = useState('1600 Amphitheatre Parkway, Mountain View, CA 94043')
  const [showPreview, setShowPreview] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    // Load saved settings from localStorage
    const savedApiKey = localStorage.getItem('streetview_api_key') || ''
    const savedEnabled = localStorage.getItem('streetview_enabled') === 'true'
    
    setApiKey(savedApiKey)
    setIsEnabled(savedEnabled)
  }, [])

  const handleSaveSettings = () => {
    // Save to localStorage (in production, this should be saved to backend)
    localStorage.setItem('streetview_api_key', apiKey)
    localStorage.setItem('streetview_enabled', isEnabled.toString())
    
    // Set environment variable for the session
    if (apiKey) {
      (window as any).REACT_APP_GOOGLE_STREETVIEW_API_KEY = apiKey
    }
    
    onApiKeyChange?.(apiKey)
    setSuccess('Settings saved successfully!')
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleTestPreview = () => {
    setShowPreview(true)
  }

  const streetViewUrl = apiKey && testAddress 
    ? `https://maps.googleapis.com/maps/api/streetview?size=400x300&location=${encodeURIComponent(testAddress)}&heading=0&pitch=0&key=${apiKey}`
    : null

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <SettingsIcon />
          <Typography variant="h6">Google Street View Configuration</Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={isEnabled}
                  onChange={(e) => setIsEnabled(e.target.checked)}
                />
              }
              label="Enable Street View Integration"
            />
          </Grid>

          {isEnabled && (
            <>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Google Street View API Key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Google Street View API key"
                  helperText={
                    <span>
                      Get your API key from the{' '}
                      <Link
                        href="https://console.cloud.google.com/apis/library/street-view-image-api"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Google Cloud Console
                      </Link>
                    </span>
                  }
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Test Address"
                  value={testAddress}
                  onChange={(e) => setTestAddress(e.target.value)}
                  placeholder="Enter an address to test"
                />
              </Grid>

              <Grid item xs={12}>
                <Box display="flex" gap={2}>
                  <Button
                    variant="contained"
                    onClick={handleSaveSettings}
                    disabled={!apiKey}
                  >
                    Save Settings
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleTestPreview}
                    disabled={!apiKey || !testAddress}
                    startIcon={<ViewIcon />}
                  >
                    Test Preview
                  </Button>
                </Box>
              </Grid>

              {success && (
                <Grid item xs={12}>
                  <Alert severity="success">{success}</Alert>
                </Grid>
              )}

              {showPreview && streetViewUrl && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Street View Preview
                  </Typography>
                  <Box
                    component="img"
                    src={streetViewUrl}
                    alt="Street View Preview"
                    sx={{
                      width: '100%',
                      maxWidth: 400,
                      height: 300,
                      objectFit: 'cover',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                    onError={() => {
                      setSuccess(null)
                      alert('Failed to load Street View image. Please check your API key and address.')
                    }}
                  />
                </Grid>
              )}

              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Setup Instructions:</strong>
                    <br />
                    1. Go to Google Cloud Console and enable the Street View Static API
                    <br />
                    2. Create credentials (API Key) and restrict it to Street View Static API
                    <br />
                    3. Optionally restrict the API key to your domain for security
                    <br />
                    4. Enter the API key above and save settings
                  </Typography>
                </Alert>
              </Grid>
            </>
          )}
        </Grid>
      </CardContent>
    </Card>
  )
}

export default StreetViewSettings 