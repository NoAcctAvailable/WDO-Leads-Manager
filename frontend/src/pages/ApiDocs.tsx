import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  IconButton,
  Grid,
  List,
  ListItem,
  ListItemText,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import {
  ContentCopy as ContentCopyIcon,
  Security as SecurityIcon,
  Code as CodeIcon,
  Key as KeyIcon,
  Settings as SettingsIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ApiDocs: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');

  const baseUrl = 'http://localhost:3001';

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchApiKey();
    }
  }, [user]);

  const fetchApiKey = async () => {
    try {
      setApiKey('wdo-api-key-' + Math.random().toString(36).substr(2, 32));
    } catch (error) {
      console.error('Failed to fetch API key:', error);
    }
  };

  const generateNewApiKey = async () => {
    try {
      const newKey = 'wdo-api-key-' + Math.random().toString(36).substr(2, 32);
      setApiKey(newKey);
      setApiKeyDialogOpen(false);
    } catch (error) {
      console.error('Failed to generate new API key:', error);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(`${type} copied to clipboard!`);
    setTimeout(() => setCopySuccess(''), 3000);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (user?.role !== 'ADMIN') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Access denied. API documentation is only available to administrators.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CodeIcon />
        API Documentation
      </Typography>

      {copySuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {copySuccess}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Overview" />
          <Tab label="Authentication" />
          <Tab label="Endpoints" />
          <Tab label="API Key" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              WDO Leads Manager API
            </Typography>
            <Typography variant="body1" paragraph>
              A comprehensive REST API for managing wood-destroying organism (WDO) inspection leads, 
              properties, calls, inspections, and contacts. All endpoints require authentication except for login.
            </Typography>
            
            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Security Features
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="JWT Bearer Token Authentication" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Role-based Access Control" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Rate Limiting Protection" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Request Validation" />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Base URL
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
                      {baseUrl}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Authentication
            </Typography>
            <Typography variant="body1" paragraph>
              All API endpoints except <code>/api/auth/login</code> require authentication using JWT Bearer tokens.
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Headers Required
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
                <Typography sx={{ fontFamily: 'monospace' }}>
                  Authorization: Bearer YOUR_JWT_TOKEN<br />
                  Content-Type: application/json
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => copyToClipboard('Authorization: Bearer YOUR_JWT_TOKEN\nContent-Type: application/json', 'Headers')}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Paper>
            </Box>

            <Typography variant="h6" gutterBottom>
              User Roles
            </Typography>
            <List>
              <ListItem>
                <Chip label="ADMIN" color="error" size="small" sx={{ mr: 2 }} />
                <ListItemText primary="Full access to all endpoints and user management" />
              </ListItem>
              <ListItem>
                <Chip label="MANAGER" color="warning" size="small" sx={{ mr: 2 }} />
                <ListItemText primary="Manage properties, inspections, calls, view users" />
              </ListItem>
              <ListItem>
                <Chip label="INSPECTOR" color="info" size="small" sx={{ mr: 2 }} />
                <ListItemText primary="Create/update inspections and calls" />
              </ListItem>
              <ListItem>
                <Chip label="USER" color="default" size="small" sx={{ mr: 2 }} />
                <ListItemText primary="View properties and inspections, log calls" />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              API Endpoints
            </Typography>
            
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>Authentication</Typography>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Chip label="POST" color="primary" size="small" />
                  <Typography sx={{ fontFamily: 'monospace' }}>/api/auth/login</Typography>
                </Box>
                <Typography variant="body2">Authenticate user and receive JWT token</Typography>
              </Paper>
              
              <Paper sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Chip label="GET" color="success" size="small" />
                  <Typography sx={{ fontFamily: 'monospace' }}>/api/auth/profile</Typography>
                  <Chip label="Auth Required" size="small" variant="outlined" />
                </Box>
                <Typography variant="body2">Get current user profile</Typography>
              </Paper>
              
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Chip label="PUT" color="warning" size="small" />
                  <Typography sx={{ fontFamily: 'monospace' }}>/api/auth/change-password</Typography>
                  <Chip label="Auth Required" size="small" variant="outlined" />
                </Box>
                <Typography variant="body2">Change user password and update profile</Typography>
              </Paper>
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>Properties</Typography>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Chip label="GET" color="success" size="small" />
                  <Typography sx={{ fontFamily: 'monospace' }}>/api/properties</Typography>
                  <Chip label="Auth Required" size="small" variant="outlined" />
                </Box>
                <Typography variant="body2">Get all properties with filtering and pagination</Typography>
                <Typography variant="caption">Query params: page, limit, propertyType, search</Typography>
              </Paper>
              
              <Paper sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Chip label="GET" color="success" size="small" />
                  <Typography sx={{ fontFamily: 'monospace' }}>/api/properties/:id</Typography>
                  <Chip label="Auth Required" size="small" variant="outlined" />
                </Box>
                <Typography variant="body2">Get specific property with full details</Typography>
              </Paper>
              
              <Paper sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Chip label="POST" color="primary" size="small" />
                  <Typography sx={{ fontFamily: 'monospace' }}>/api/properties</Typography>
                  <Chip label="Auth Required" size="small" variant="outlined" />
                  <Chip label="ADMIN, MANAGER, INSPECTOR" size="small" color="secondary" />
                </Box>
                <Typography variant="body2">Create new property</Typography>
              </Paper>
              
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Chip label="DELETE" color="error" size="small" />
                  <Typography sx={{ fontFamily: 'monospace' }}>/api/properties/:id</Typography>
                  <Chip label="Auth Required" size="small" variant="outlined" />
                  <Chip label="ADMIN, MANAGER" size="small" color="secondary" />
                </Box>
                <Typography variant="body2">Delete property</Typography>
              </Paper>
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>Inspections</Typography>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Chip label="GET" color="success" size="small" />
                  <Typography sx={{ fontFamily: 'monospace' }}>/api/inspections</Typography>
                  <Chip label="Auth Required" size="small" variant="outlined" />
                </Box>
                <Typography variant="body2">Get all inspections with filtering</Typography>
                <Typography variant="caption">Query params: page, limit, propertyId, inspectorId, status, type</Typography>
              </Paper>
              
              <Paper sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Chip label="POST" color="primary" size="small" />
                  <Typography sx={{ fontFamily: 'monospace' }}>/api/inspections</Typography>
                  <Chip label="Auth Required" size="small" variant="outlined" />
                </Box>
                <Typography variant="body2">Create new inspection</Typography>
              </Paper>
              
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Chip label="PUT" color="warning" size="small" />
                  <Typography sx={{ fontFamily: 'monospace' }}>/api/inspections/:id</Typography>
                  <Chip label="Auth Required" size="small" variant="outlined" />
                </Box>
                <Typography variant="body2">Update inspection</Typography>
              </Paper>
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>Calls</Typography>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Chip label="GET" color="success" size="small" />
                  <Typography sx={{ fontFamily: 'monospace' }}>/api/calls</Typography>
                  <Chip label="Auth Required" size="small" variant="outlined" />
                </Box>
                <Typography variant="body2">Get all calls with filtering</Typography>
              </Paper>
              
              <Paper sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Chip label="POST" color="primary" size="small" />
                  <Typography sx={{ fontFamily: 'monospace' }}>/api/calls</Typography>
                  <Chip label="Auth Required" size="small" variant="outlined" />
                </Box>
                <Typography variant="body2">Create new call log</Typography>
              </Paper>
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>Contacts</Typography>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Chip label="GET" color="success" size="small" />
                  <Typography sx={{ fontFamily: 'monospace' }}>/api/contacts/property/:propertyId</Typography>
                  <Chip label="Auth Required" size="small" variant="outlined" />
                </Box>
                <Typography variant="body2">Get all contacts for a property</Typography>
              </Paper>
              
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Chip label="POST" color="primary" size="small" />
                  <Typography sx={{ fontFamily: 'monospace' }}>/api/contacts</Typography>
                  <Chip label="Auth Required" size="small" variant="outlined" />
                </Box>
                <Typography variant="body2">Create new contact</Typography>
              </Paper>
            </Box>

            <Box>
              <Typography variant="h6" gutterBottom>Users</Typography>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Chip label="GET" color="success" size="small" />
                  <Typography sx={{ fontFamily: 'monospace' }}>/api/users</Typography>
                  <Chip label="Auth Required" size="small" variant="outlined" />
                  <Chip label="ADMIN, MANAGER" size="small" color="secondary" />
                </Box>
                <Typography variant="body2">Get all users</Typography>
              </Paper>
              
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Chip label="POST" color="primary" size="small" />
                  <Typography sx={{ fontFamily: 'monospace' }}>/api/users</Typography>
                  <Chip label="Auth Required" size="small" variant="outlined" />
                  <Chip label="ADMIN" size="small" color="secondary" />
                </Box>
                <Typography variant="body2">Create new user</Typography>
              </Paper>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <KeyIcon />
              API Key Management
            </Typography>
            <Typography variant="body1" paragraph>
              Manage your API key for external integrations and third-party applications.
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>Current API Key</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TextField
                  fullWidth
                  value={apiKey}
                  type={showApiKey ? 'text' : 'password'}
                  InputProps={{
                    readOnly: true,
                    sx: { fontFamily: 'monospace' },
                    endAdornment: (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          onClick={() => setShowApiKey(!showApiKey)}
                          edge="end"
                        >
                          {showApiKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                        <IconButton
                          onClick={() => copyToClipboard(apiKey, 'API Key')}
                          edge="end"
                        >
                          <ContentCopyIcon />
                        </IconButton>
                      </Box>
                    ),
                  }}
                />
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => setApiKeyDialogOpen(true)}
                >
                  Generate New
                </Button>
              </Box>
            </Box>

            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Important:</strong> Keep your API key secure and never share it publicly. 
                If you generate a new key, update all your integrations immediately.
              </Typography>
            </Alert>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>Usage Example</Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
                <Typography sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
{`curl -X GET "${baseUrl}/api/properties" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "X-API-Key: ${apiKey}" \\
  -H "Content-Type: application/json"`}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => copyToClipboard(
                    `curl -X GET "${baseUrl}/api/properties" \\\n  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\\n  -H "X-API-Key: ${apiKey}" \\\n  -H "Content-Type: application/json"`,
                    'cURL command'
                  )}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Paper>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>

      <Dialog open={apiKeyDialogOpen} onClose={() => setApiKeyDialogOpen(false)}>
        <DialogTitle>Generate New API Key</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Are you sure you want to generate a new API key? This action will invalidate the current key
            and may break existing integrations.
          </Typography>
          <Alert severity="warning">
            Make sure to update all applications using the current API key.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApiKeyDialogOpen(false)}>Cancel</Button>
          <Button onClick={generateNewApiKey} variant="contained" color="warning">
            Generate New Key
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApiDocs; 