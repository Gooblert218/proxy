# Secure Proxy Browser

A privacy-focused web proxy that routes all traffic through your home PC, allowing you to browse safely across different networks with a different apparent IP address.

## Features

✨ **Security First**
- JWT token-based authentication
- API key verification
- Rate limiting to prevent abuse
- Helmet.js security headers
- CORS protection

🌐 **Privacy**
- Routes all traffic through your home PC
- Anonymize headers option
- Strip cookies option
- Block JavaScript option
- No data stored on third-party servers

🚀 **Easy Deployment**
- Frontend deployed on Cloudflare Pages (no server required)
- Node.js backend runs on your home PC
- No admin permissions needed

## Architecture

```
┌─────────────────────────┐
│  Cloudflare Pages       │
│  (Frontend - Static)    │
│  - HTML/CSS/JS          │
└────────┬────────────────┘
         │ HTTPS
         │ (Encrypted)
         ▼
┌─────────────────────────┐
│  Your Home PC           │
│  (Backend Server)       │
│  - Node.js Proxy        │
│  - Authentication       │
│  - Rate Limiting        │
└────────┬────────────────┘
         │ HTTP/HTTPS
         │ (Via Proxy)
         ▼
┌─────────────────────────┐
│  Target Website         │
│  (Any URL)              │
└─────────────────────────┘
```

## Setup Instructions

### Backend Setup (Home PC)

#### Prerequisites
- Node.js 16+ installed
- Port 3000 available (or modify in .env)

#### Installation

1. Clone/extract the project:
```bash
cd browser/backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

4. Edit `.env` with your configuration:
```env
PORT=3000
HOST=0.0.0.0
JWT_SECRET=your-super-secret-key-change-this
API_KEY=your-secure-api-key
ALLOWED_ORIGIN=https://your-proxy-domain.pages.dev
PROXY_TIMEOUT=30000
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

5. Run the server:
```bash
npm start
```

Server should output:
```
🌐 Proxy Server Running
================================
URL: http://0.0.0.0:3000
================================
```

#### Making It Accessible from Internet

You have several options:

**Option 1: Use Cloudflare Tunnel (Recommended - No Port Forwarding)**
```bash
# Install Cloudflare CLI tool
# See: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/install-and-setup/tunnel-guide/

# Start tunnel
cloudflared tunnel --url http://localhost:3000
```

**Option 2: Port Forwarding (Router Level)**
- Log into your router's admin panel
- Forward external port 3000 to your PC's internal IP (e.g., 192.168.1.100:3000)
- Use your public IP or DynamicDNS service

**Option 3: Ngrok (Quick Testing)**
```bash
npx ngrok http 3000
```

### Frontend Setup (Cloudflare Pages)

#### Local Testing

1. Install dependencies:
```bash
cd browser/frontend
npm install -g wrangler
```

2. Preview locally:
```bash
wrangler pages dev
```

Browser will open at `http://localhost:8787`

#### Deploy to Cloudflare Pages

1. Create a GitHub repository with your `frontend` folder

2. In Cloudflare Dashboard:
   - Go to Pages
   - Click "Create a project"
   - Select your GitHub repository
   - Build settings:
     - Build command: (leave empty)
     - Build output directory: `.`
   - Deploy

3. Update `.env` with your Cloudflare Pages URL in the backend:
```env
ALLOWED_ORIGIN=https://your-project.pages.dev
```

4. Restart your backend server

## Usage

1. Open your Cloudflare Pages URL
2. Enter your backend server URL (if deployed, use the Cloudflare Tunnel or public IP)
3. Enter the API key (from your backend `.env`)
4. Click "Connect"
5. Enter any URL in the address bar and click "Go"

## Security Notes

⚠️ **Important Security Considerations:**

1. **Change Default Secrets**: Update `JWT_SECRET` and `API_KEY` to strong random values
2. **HTTPS Only**: Always use HTTPS for production (Cloudflare Pages auto-enables this)
3. **API Key Management**: 
   - Don't share your API key
   - Store it securely
   - Rotate keys periodically
4. **Rate Limiting**: Adjust `RATE_LIMIT_MAX_REQUESTS` based on your needs
5. **Blocked Domains**: Add dangerous domains to `BLOCKED_DOMAINS` if needed
6. **CORS Origin**: Only allow your Cloudflare Pages domain

## Advanced Configuration

### Adding Blocked Domains

Edit `.env`:
```env
BLOCKED_DOMAINS=localhost:3000,127.0.0.1,192.168.*,malicious-site.com
```

### Increasing Rate Limits

```env
RATE_LIMIT_WINDOW=30
RATE_LIMIT_MAX_REQUESTS=500
```

### Custom Headers

Modify `server.js` to add custom headers:
```javascript
const sanitizedHeaders = {
    ...headers,
    'Custom-Header': 'Your-Value',
};
```

## Troubleshooting

**Frontend can't connect to backend:**
- Verify backend is running: `http://backend-url:3000/api/health`
- Check API key is correct
- Ensure CORS origin matches in `.env`
- Check firewall settings

**Requests timing out:**
- Increase `PROXY_TIMEOUT` in `.env`
- Check if target website is responding
- Test with simpler websites first

**Too many requests error:**
- Reduce request frequency
- Increase `RATE_LIMIT_MAX_REQUESTS`
- Check if multiple tabs are open

**Backend won't start:**
- Ensure port 3000 is not in use: `lsof -i :3000` (macOS/Linux) or `netstat -ano | findstr :3000` (Windows)
- Check Node.js version: `node --version` (needs 16+)

## Development

### Backend Development
```bash
cd backend
npm run dev  # Uses --watch flag for auto-reload
```

### Frontend Development
```bash
cd frontend
wrangler pages dev  # Local preview with hot reload
```

## Deployment Checklist

- [ ] Change `JWT_SECRET` to random string
- [ ] Change `API_KEY` to strong password
- [ ] Set `ALLOWED_ORIGIN` to your Cloudflare Pages domain
- [ ] Deploy backend to home PC (test locally first)
- [ ] Set up Cloudflare Tunnel or port forwarding
- [ ] Deploy frontend to Cloudflare Pages
- [ ] Test connection end-to-end
- [ ] Enable rate limiting
- [ ] Review security settings

## License

MIT

## Support

For issues or questions, check the troubleshooting section or review server logs.
