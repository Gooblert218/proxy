# Deployment Guide: Cloudflare Pages + Home PC Proxy

This guide walks through deploying the Secure Proxy Browser to production.

## Step 1: Prepare Your Home PC Backend

### 1.1 Install Node.js
- Download from nodejs.org (LTS version recommended)
- Verify: `node --version`

### 1.2 Configure Backend Server

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
```env
PORT=3000
HOST=0.0.0.0
JWT_SECRET=<generate-strong-random-string>
API_KEY=<generate-strong-api-key>
ALLOWED_ORIGIN=https://your-project.pages.dev
```

Generate secure secrets:
- Linux/macOS: `openssl rand -hex 32`
- Online: https://www.random.org/strings/

### 1.3 Make Server Accessible from Internet

#### Using Cloudflare Tunnel (Recommended)

1. Install Cloudflare Tunnel:
   ```bash
   # macOS
   brew install cloudflare/cloudflare/cloudflared
   
   # Windows
   # Download from https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
   
   # Linux
   wget https://github.com/cloudflare/cloudflared/releases/download/2024.1.0/cloudflared-linux-amd64
   chmod +x cloudflared-linux-amd64
   sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
   ```

2. Authenticate:
   ```bash
   cloudflared tunnel login
   ```

3. Create tunnel configuration (~/.cloudflared/config.yml):
   ```yaml
   tunnel: secure-proxy-browser
   credentials-file: /home/user/.cloudflared/secure-proxy-browser.json
   
   ingress:
     - hostname: proxy-api.your-domain.com
       service: http://localhost:3000
     - service: http_status:404
   ```

4. Start tunnel:
   ```bash
   cloudflared tunnel run secure-proxy-browser
   ```

5. Create DNS record in Cloudflare Dashboard:
   - Type: CNAME
   - Name: proxy-api
   - Content: <tunnel-id>.cfargotunnel.com
   - TTL: Auto

#### Using Port Forwarding (Alternative)

1. Access router admin panel (usually 192.168.1.1 or 192.168.0.1)
2. Find Port Forwarding settings
3. Forward external port 3000 → internal IP:3000
4. Set up Dynamic DNS (optional, if IP changes):
   - Use: DuckDNS, No-IP, or similar
   - Add your domain to Cloudflare DNS

### 1.4 Test Backend Connection

```bash
# Start server
npm start

# From another device, test:
curl -H "X-API-Key: YOUR_API_KEY" https://your-backend-url/api/health
```

Expected response:
```json
{"status":"ok","timestamp":"2024-01-15T10:30:00.000Z"}
```

## Step 2: Deploy Frontend to Cloudflare Pages

### 2.1 Create GitHub Repository

1. Create new repo: github.com/new
2. Clone to your machine:
   ```bash
   git clone https://github.com/your-username/secure-proxy-browser.git
   cd secure-proxy-browser
   ```

3. Add frontend files:
   ```bash
   cp -r frontend/* .
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

### 2.2 Deploy via Cloudflare Dashboard

1. Log in to Cloudflare Dashboard
2. Go to **Pages** → **Create a project** → **Connect to Git**
3. Authorize GitHub and select your repository
4. Configure build settings:
   - **Build command**: Leave empty (static site)
   - **Build output directory**: `.`
5. Click **Save and Deploy**

Cloudflare will:
- Deploy your site to `https://repo-name-xxx.pages.dev`
- Provide automatic HTTPS
- Enable global CDN caching

### 2.3 Verify Deployment

Visit your Pages URL and you should see the proxy browser interface.

## Step 3: Configure Connection Between Frontend & Backend

### 3.1 Update Backend CORS

Edit `backend/.env`:
```env
ALLOWED_ORIGIN=https://repo-name-xxx.pages.dev
```

Restart backend:
```bash
npm start
```

### 3.2 Update Frontend Configuration

Visit your frontend URL → Configuration panel:
- **Server URL**: `https://proxy-api.your-domain.com` (or your tunnel/port-forwarded URL)
- **API Key**: Your `API_KEY` from `.env`
- Click **Connect**

## Step 4: Test End-to-End

1. Frontend loads ✅
2. Can connect to backend ✅
3. Browse a test URL (e.g., https://example.com)
4. Content loads successfully ✅

## Troubleshooting Deployment

### Frontend deploys but can't connect to backend

**Check:**
- Backend is running on home PC
- Cloudflare Tunnel or port forwarding is active
- API key is correct
- Server URL is accessible from internet
- CORS origin in `.env` matches your Pages domain

**Test:**
```bash
curl -H "X-API-Key: YOUR_API_KEY" https://your-backend-url/api/health
```

### Backend works locally but not remotely

**Likely causes:**
- Firewall blocking port 3000
- Router not forwarding port correctly
- Dynamic IP changed (if not using Tunnel)

**Solution:**
- Use Cloudflare Tunnel (easiest)
- Check router port forwarding settings
- Configure Dynamic DNS

### Rate limiting triggered

Reduce request frequency or increase limits in `.env`:
```env
RATE_LIMIT_WINDOW=30
RATE_LIMIT_MAX_REQUESTS=500
```

### CORS errors in browser console

**Check:**
- `ALLOWED_ORIGIN` in backend `.env` matches frontend URL exactly
- Both frontend and backend are using HTTPS (if one uses HTTP, won't work)
- API key is correct

## Security Checklist for Production

- [ ] Changed JWT_SECRET and API_KEY to random values
- [ ] Backend only accessible via HTTPS (Tunnel or port forwarded to HTTPS)
- [ ] ALLOWED_ORIGIN set to exact Pages URL
- [ ] Rate limiting configured appropriately
- [ ] Blocked domains configured (if needed)
- [ ] Backend .env not committed to git (use .gitignore)
- [ ] Cloudflare Tunnel credentials not shared
- [ ] Test with privacy browser (or different network) to verify proxying works

## Optional: Custom Domain for Frontend

1. In Cloudflare Dashboard → Pages → your project
2. Click **Custom domain**
3. Add your domain (e.g., proxy.example.com)
4. Follow DNS instructions

## Monitoring

**Backend logs:**
```bash
# Keep running in terminal to see requests
npm start
```

**Frontend errors:**
- Browser DevTools → Console tab
- Check network requests to your backend URL

**Rate limit stats:**
Add to backend for monitoring (advanced):
```javascript
// Add in server.js after requestCounts updates
if (Math.random() < 0.01) {
    console.log('Active IPs:', requestCounts.size);
}
```

## Updating Your Proxy

**Backend updates:**
1. Edit `backend/server.js`
2. Test locally: `npm start`
3. Restart server on home PC

**Frontend updates:**
1. Edit frontend files
2. Commit and push to GitHub
3. Cloudflare redeploys automatically

## Support

- Check backend logs for errors
- Test backend directly: `curl https://backend-url/api/health`
- Verify credentials: server URL and API key
- Review Cloudflare Tunnel dashboard for connection status
