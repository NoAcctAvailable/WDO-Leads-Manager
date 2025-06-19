# SSL Certificate Setup

## Cloudflare Origin Certificates

After generating your Cloudflare Origin Certificate, save the files as:

1. **Certificate** → `cloudflare-cert.pem`
   - Copy the "Origin Certificate" text block (including -----BEGIN CERTIFICATE----- and -----END CERTIFICATE-----)

2. **Private Key** → `cloudflare-key.pem`  
   - Copy the "Private Key" text block (including -----BEGIN PRIVATE KEY----- and -----END PRIVATE KEY-----)

## File Structure:
```
ssl/
├── cloudflare-cert.pem    (Certificate)
├── cloudflare-key.pem     (Private Key)
└── README.md              (This file)
```

## Next Steps:
After placing both files, update your docker-compose.yml to use the secure configuration. 