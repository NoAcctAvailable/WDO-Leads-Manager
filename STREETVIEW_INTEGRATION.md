# Google Street View Integration

## Overview

The WDO Inspection Manager now includes Google Street View Static API integration, allowing users to view street-level imagery of properties directly within the application.

## Features

### 🏠 Property Street View
- **Property Details**: Street view images display in the property details dialog
- **Visual Context**: Provides visual context for property locations during inspections
- **Interactive Maps**: Direct links to open properties in Google Maps

### ⚙️ Settings Management
- **Configuration Page**: Dedicated settings page for Street View configuration
- **API Key Management**: Secure storage and management of Google API keys
- **Enable/Disable Toggle**: Option to enable or disable Street View functionality
- **Test Preview**: Built-in testing tool to verify API key and configuration

### 🔧 Smart Error Handling
- **Graceful Degradation**: Shows placeholders when API key is not configured
- **Image Error Handling**: Handles cases where Street View imagery is unavailable
- **User-Friendly Messages**: Clear feedback about configuration status

## Setup Instructions

### 1. Google Cloud Console Setup

1. **Enable the API**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to APIs & Services > Library
   - Search for "Street View Static API"
   - Click "Enable"

2. **Create API Key**:
   - Go to APIs & Services > Credentials
   - Click "Create Credentials" > "API Key"
   - Copy the generated API key

3. **Secure Your API Key** (Recommended):
   - Click on your API key to edit it
   - Under "API restrictions", select "Restrict key"
   - Choose "Street View Static API"
   - Under "HTTP referrers", add your domain (e.g., `localhost:3000/*`, `yourdomain.com/*`)

### 2. Application Configuration

1. **Access Settings**:
   - Log into the WDO Inspection Manager
   - Click on your profile icon (top right)
   - Select "Settings" from the dropdown menu

2. **Configure Street View**:
   - Toggle "Enable Street View Integration" to ON
   - Enter your Google Street View API key
   - Enter a test address (default provided)
   - Click "Test Preview" to verify configuration
   - Click "Save Settings"

### 3. Verification

1. **Test the Integration**:
   - Navigate to Properties page
   - Click "View Details" on any property
   - You should see a Street View image in the property details dialog

2. **Troubleshooting**:
   - If Street View shows "unavailable", check your API key
   - Ensure the Street View Static API is enabled in Google Cloud Console
   - Verify your API key restrictions allow your domain

## Usage

### Viewing Property Street Views

1. **From Properties List**:
   - Navigate to the Properties page
   - Click the "View" (eye) icon on any property row
   - The property details dialog will show Street View imagery

2. **Street View Features**:
   - **Open in Maps**: Click the external link icon to open the property in Google Maps
   - **Responsive Display**: Street View adapts to different screen sizes
   - **Error Handling**: Shows helpful messages if imagery is unavailable

### Managing Street View Settings

1. **Access Settings**: Profile Menu > Settings
2. **Toggle Feature**: Enable/disable Street View as needed
3. **Update API Key**: Change or update your API key at any time
4. **Test Configuration**: Use the test preview to verify settings

## API Usage and Billing

### Google Street View Static API

- **Pricing**: Pay-per-use based on API calls
- **Free Tier**: Google provides free monthly usage credits
- **Billing**: Set up billing in Google Cloud Console to avoid service interruption

### API Call Details

- **Image Size**: 400x250 pixels (optimized for property views)
- **Parameters**: Address-based geocoding with standard viewing angle
- **Caching**: Browser caches images to reduce API calls

## Security Considerations

### API Key Protection

1. **Restrict API Key**: Limit to Street View Static API only
2. **Domain Restrictions**: Add HTTP referrer restrictions
3. **Monitor Usage**: Set up billing alerts and usage monitoring
4. **Regular Rotation**: Consider rotating API keys periodically

### Data Privacy

- **Address Data**: Street View requests include property addresses
- **Image Caching**: Images may be cached by browsers
- **Google Terms**: Usage subject to Google's Terms of Service

## Technical Implementation

### Components

- **`StreetView.tsx`**: Main component for displaying Street View images
- **`StreetViewSettings.tsx`**: Configuration interface for API settings
- **`Settings.tsx`**: Settings page including Street View configuration

### Storage

- **localStorage**: API keys stored in browser's localStorage
- **Session Management**: Settings persist across browser sessions
- **Security**: Consider backend storage for production environments

### Error Handling

- **No API Key**: Shows placeholder with configuration instructions
- **API Errors**: Graceful fallback to error state
- **Network Issues**: Handles offline scenarios

## Development Notes

### Environment Variables

While the current implementation uses localStorage for API key storage, you can also use environment variables:

```bash
REACT_APP_GOOGLE_STREETVIEW_API_KEY=your_api_key_here
```

### Production Considerations

1. **Backend Storage**: Consider storing API keys on the backend for enhanced security
2. **Rate Limiting**: Implement rate limiting to control API usage
3. **Error Monitoring**: Add logging for API errors and usage patterns
4. **Performance**: Consider implementing image caching strategies

## Support

For issues with:
- **Google API Setup**: Refer to [Google Cloud Documentation](https://cloud.google.com/maps-platform/docs/overview)
- **Application Integration**: Check the application logs and browser console
- **Feature Requests**: Contact the development team

## Version History

- **v1.0.0**: Initial Street View integration
  - Basic Street View display in property details
  - Settings management interface
  - Error handling and fallbacks
  - Google Maps integration links 