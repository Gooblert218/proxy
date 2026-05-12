# Quick Start Guide

Get your secure proxy browser running in 5 minutes.

## For Windows Users

### Backend Setup

1. **Install Node.js**
   - Download from nodejs.org
   - Run installer, accept defaults
   - Open PowerShell, verify: `node --version`

2. **Setup Backend Server**
   ```powershell
   cd C:\Users\[YourUsername]\Downloads\browser\backend
   npm install
   cp .env.example .env
   
   # Edit .env with Notepad and change:
   # API_KEY=your-secret-key
   # JWT_SECRET=your-secret-secret
   ```

3. **Run Backend**
   ```powershell
   npm start
   ```
   
   You'll see:
   ```
   🌐 Proxy Server Running
   URL: http://0.0.0.0:3000
   ```

### Make Backend Accessible from Internet

**Option A: Easy - Cloudflare Tunnel**
```powershell
# Install Cloudflare Tunnel
# Download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/

# Run it
.\cloudflared.exe tunnel --url http://localhost:3000
```

You'll get a URL like: `https://xxx.trycloudflareaccess.com`

**Option B: Port Forward in Router**
- Login to router (usually 192.168.1.1)
- Find "Port Forwarding"
- Forward port 3000 to your PC's IP

### Frontend Setup

1. **Clone/Download Project**
   - Already done if you have this file

2. **Deploy to Cloudflare Pages**
   - Go to pages.cloudflare.com
   - Click "Create project"
   - Upload the `frontend` folder
   - Get your Pages URL like: `https://project-xxx.pages.dev`

3. **Update Backend Configuration**
   - Edit `backend\.env`
   - Change `ALLOWED_ORIGIN=https://your-pages-url.pages.dev`
   - Restart backend (`npm start`)

### First Run

1. Open your Cloudflare Pages URL
2. Enter:
   - **Server URL**: Your Cloudflare Tunnel URL or backend address
   - **API Key**: The value you set in `.env`
3. Click **Connect**
4. Try browsing: `google.com`

## For Mac Users

### Backend Setup

```bash
# Install Node.js (via Homebrew if not installed)
brew install node

# Navigate to project
cd ~/Downloads/browser/backend

# Install and configure
npm install
cp .env.example .env

# Edit .env
nano .env
# Change API_KEY and JWT_SECRET

# Run server
npm start
```

### Make It Public

```bash
# Install Cloudflare Tunnel
brew install cloudflare/cloudflare/cloudflared

# Run tunnel (keep this running)
cloudflared tunnel --url http://localhost:3000
```

### Deploy Frontend

1. Go to pages.cloudflare.com
2. Connect GitHub repo or upload `frontend` folder
3. Cloudflare auto-deploys
4. Copy your Pages URL

### Connect

Visit your Pages URL and configure with tunnel URL and API key.

## For Linux Users

```bash
# Update and install Node.js
sudo apt update
sudo apt install nodejs npm

# Setup backend
cd ~/Downloads/browser/backend
npm install
cp .env.example .env

# Edit config
nano .env  # Change API_KEY and JWT_SECRET

# Run
npm start
```

### Public Access

```bash
# Get Cloudflare Tunnel
wget https://github.com/cloudflare/cloudflared/releases/download/2024.1.0/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared

# Run tunnel
cloudflared tunnel --url http://localhost:3000
```

## Verify It Works

Backend should respond:
```bash
curl -H "X-API-Key: your-api-key" http://localhost:3000/api/health

# Should return:
# {"status":"ok","timestamp":"2024-01-15T..."}
```

## Troubleshooting

**Backend won't start?**
- Check port 3000 is free: `netstat -ano | findstr 3000`
- Kill process using it, or change PORT in .env

**Can't connect frontend?**
- Verify backend is running
- Check API key is correct (in both .env and frontend)
- Make sure ALLOWED_ORIGIN matches your Pages URL

**Website loads slowly?**
- Increase PROXY_TIMEOUT in .env
- Check internet connection on home PC

**Getting "too many requests"?**
- Wait a bit, or increase RATE_LIMIT_MAX_REQUESTS in .env

## Next Steps

1. ✅ Backend running on home PC
2. ✅ Frontend deployed to Cloudflare Pages
3. ✅ Connected and tested
4. → Read [DEPLOYMENT.md](DEPLOYMENT.md) for production setup
5. → Check [README.md](README.md) for full documentation
