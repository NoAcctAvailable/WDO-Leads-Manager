# 🌐 Cloudflare HTTPS Setup Guide

This guide will help you set up Cloudflare HTTPS for your WDO Leads Manager application, providing enterprise-grade security, performance, and DDoS protection.

## 📋 Prerequisites

- A domain name that you own
- A Cloudflare account (free tier is sufficient)
- Your application deployed on a server with a public IP

## 🚀 Quick Setup Steps

### 1. Add Your Domain to Cloudflare

1. **Sign up/Login to Cloudflare**: Go to [cloudflare.com](https://www.cloudflare.com)
2. **Add a Site**: Click "Add a Site" and enter your domain name
3. **Choose Plan**: Select the Free plan (sufficient for most use cases)
4. **Review DNS Records**: Cloudflare will scan and import your existing DNS records
5. **Update Nameservers**: Change your domain's nameservers to Cloudflare's (provided in the dashboard)

### 2. Configure DNS Records

In your Cloudflare DNS dashboard, ensure you have these records:

```
Type: A
Name: @
Content: YOUR_SERVER_IP
Proxy status: Proxied (orange cloud)
TTL: Auto

Type: A  
Name: www
Content: YOUR_SERVER_IP
Proxy status: Proxied (orange cloud)
TTL: Auto
```

### 3. Configure SSL/TLS Settings

1. Go to **SSL/TLS** → **Overview**
2. Set encryption mode to **"Full (strict)"**
3. Go to **SSL/TLS** → **Edge Certificates**
4. Enable:
   - **Always Use HTTPS**: ON
   - **HTTP Strict Transport Security (HSTS)**: ON
   - **Minimum TLS Version**: 1.2
   - **Opportunistic Encryption**: ON
   - **TLS 1.3**: ON

### 4. Configure Security Settings

#### Firewall Rules
Go to **Security** → **WAF** → **Custom rules** and add:

```
Rule Name: Block Common Attacks
Expression: (cf.threat_score gt 10) or (cf.bot_management.score lt 30)
Action: Challenge (Managed Challenge)
```

#### Rate Limiting (Optional - Pro plan feature)
If you have a Pro plan, set up rate limiting:
- **Threshold**: 100 requests per minute per IP
- **Period**: 1 minute
- **Action**: Block for 1 hour

### 5. Optimize Performance

#### Page Rules
Go to **Rules** → **Page Rules** and add:

```
URL: yourdomain.com/api/*
Settings:
- Cache Level: Bypass
- Security Level: High

URL: yourdomain.com/static/*
Settings:
- Cache Level: Cache Everything
- Edge Cache TTL: 1 month
- Browser Cache TTL: 1 day
```

#### Caching
Go to **Caching** → **Configuration**:
- **Caching Level**: Standard
- **Browser Cache TTL**: 4 hours
- **Always Online**: ON

## 🛠️ Application Configuration

### 1. Update Environment Variables

Copy the environment template and configure it:

```bash
cp env.cloudflare.example .env
```

Edit `.env` with your actual values:

```bash
# Your actual domain
DOMAIN=yourdomain.com
CORS_ORIGIN=https://yourdomain.com  
VITE_API_URL=https://yourdomain.com/api

# Strong passwords and secrets
DB_PASSWORD=your-very-secure-database-password
JWT_SECRET=your-super-secure-jwt-secret-at-least-32-characters-long

# Production settings
NODE_ENV=production
TRUST_PROXY=true
```

### 2. Deploy with Cloudflare Configuration

Use the Cloudflare-optimized Docker Compose:

```bash
# Stop existing containers
docker-compose down

# Deploy with Cloudflare configuration
docker-compose -f docker-compose.cloudflare.yml up -d

# Check logs
docker-compose -f docker-compose.cloudflare.yml logs -f
```

### 3. Verify Deployment

1. **Test HTTPS**: Visit `https://yourdomain.com`
2. **Test API**: Visit `https://yourdomain.com/health`
3. **Check SSL**: Use [SSL Labs](https://www.ssllabs.com/ssltest/) to test your SSL configuration

## 🔒 Security Features Enabled

### Automatic Features
- ✅ **DDoS Protection**: Automatic protection against attacks
- ✅ **Web Application Firewall (WAF)**: Blocks common web attacks
- ✅ **Bot Management**: Filters malicious bots
- ✅ **SSL/TLS Encryption**: End-to-end encryption
- ✅ **Rate Limiting**: Built into nginx configuration

### Headers Added
- `Strict-Transport-Security`: Forces HTTPS
- `X-Content-Type-Options`: Prevents MIME sniffing
- `X-Frame-Options`: Prevents clickjacking
- `X-XSS-Protection`: XSS protection
- `Referrer-Policy`: Controls referrer information

## 🌟 Performance Optimizations

### CDN Benefits
- **Global Network**: 200+ data centers worldwide
- **Caching**: Static assets cached globally
- **Compression**: Automatic gzip/brotli compression
- **HTTP/2 & HTTP/3**: Modern protocol support

### Application Optimizations
- **Real IP Detection**: Proper client IP logging
- **Optimized Rate Limiting**: Cloudflare-aware limits
- **CORS Configuration**: Cloudflare-compatible CORS

## 🛡️ Advanced Security (Optional)

### Bot Fight Mode (Free)
1. Go to **Security** → **Bots**
2. Enable **Bot Fight Mode**

### Zero Trust Access (Paid)
For enhanced security, consider Cloudflare Zero Trust:
1. **Access**: Control who can access your admin panel
2. **Gateway**: DNS filtering and malware protection

## 📊 Monitoring & Analytics

### Cloudflare Analytics
- **Traffic Overview**: View requests, bandwidth, threats blocked
- **Security Events**: Monitor attacks and bot traffic
- **Performance**: Core Web Vitals and load times

### Application Monitoring
Check your application logs:
```bash
# View real-time logs
docker-compose -f docker-compose.cloudflare.yml logs -f nginx
docker-compose -f docker-compose.cloudflare.yml logs -f backend
```

## 🔧 Troubleshooting

### Common Issues

#### 1. SSL Certificate Errors
- **Issue**: Mixed content warnings
- **Solution**: Ensure all resources use HTTPS URLs

#### 2. CORS Errors
- **Issue**: Cross-origin requests blocked
- **Solution**: Verify `CORS_ORIGIN` environment variable matches your domain

#### 3. Real IP Issues
- **Issue**: All requests show Cloudflare IPs
- **Solution**: Verify nginx `real_ip_header CF-Connecting-IP;` is configured

#### 4. Performance Issues
- **Issue**: Slow loading times
- **Solution**: Check Cloudflare caching settings and page rules

### Debug Commands

```bash
# Check nginx configuration
docker-compose -f docker-compose.cloudflare.yml exec nginx nginx -t

# View real-time access logs  
docker-compose -f docker-compose.cloudflare.yml logs -f nginx | grep "GET\|POST"

# Check SSL certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

## 🔄 Maintenance

### Regular Tasks
- **Monitor** Cloudflare analytics weekly
- **Review** security events monthly  
- **Update** application containers monthly
- **Backup** database regularly

### Updates
When updating your application:
```bash
# Pull latest code
git pull

# Rebuild and deploy
docker-compose -f docker-compose.cloudflare.yml build
docker-compose -f docker-compose.cloudflare.yml up -d

# Clear Cloudflare cache if needed
curl -X POST "https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID/purge_cache" \
     -H "X-Auth-Email: your-email@example.com" \
     -H "X-Auth-Key: your-api-key" \
     -H "Content-Type: application/json" \
     --data '{"purge_everything":true}'
```

## 🎯 Next Steps

1. **Set up monitoring**: Consider tools like Uptime Robot or Pingdom
2. **Configure backups**: Set up automated database backups
3. **Load testing**: Test your application under load
4. **Documentation**: Keep your deployment notes updated

## 🆘 Support

If you encounter issues:

1. **Check Cloudflare Status**: [cloudflarestatus.com](https://www.cloudflarestatus.com/)
2. **Review Logs**: Application and nginx logs for errors
3. **Test Locally**: Verify the application works locally first
4. **Cloudflare Community**: [community.cloudflare.com](https://community.cloudflare.com/)

---

**🎉 Congratulations!** Your WDO Leads Manager is now secured with Cloudflare HTTPS, providing enterprise-grade security and performance! 