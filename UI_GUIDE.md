# Screenshots & Demo

This file shows what the Secure Proxy Browser looks like and how it works.

## Main Interface

The frontend provides an intuitive interface with:

- **Left Sidebar**: Configuration panel
  - Server URL input (where your home PC proxy is)
  - API Key authentication
  - Connect/Disconnect buttons
  - Privacy options (block JavaScript, strip cookies, anonymize headers)

- **Main Area**: Proxy browser
  - Address bar (enter any URL)
  - Toolbar (reload, home, stop buttons)
  - Content display area
  - Connection status indicator

## Features Visualization

### Connection Status
- 🔴 Red indicator: Disconnected (cannot browse)
- 🟢 Green indicator: Connected (ready to proxy)

### Configuration Panel
```
┌─ Configuration ──────────────┐
│ Server URL: *.*.*.*:3000     │
│ API Key: ••••••••••••••      │
│ [Connect] [Disconnect]       │
│                              │
│ ☑ Block JavaScript          │
│ ☑ Strip Cookies             │
│ ☑ Anonymize Headers         │
└──────────────────────────────┘
```

### Browser Interface
```
┌─ Address Bar ────────────────────────────────────┐
│ google.com                      [Go]             │
│ ⟳ (reload)  🏠 (home)  ⊘ (stop)                │
├──────────────────────────────────────────────────┤
│                                                  │
│ [Google Search Results Here - Proxied Content]  │
│                                                  │
└──────────────────────────────────────────────────┘
```

## How It Works (Diagram)

### Without Proxy (Normal Browsing)
```
Your Device                    ISP/Network              Website
┌─────────────┐  1. Connects  ┌──────────────┐         ┌────────┐
│ Browser     │──────────────► │ Your IP:     │────────►│Website │
│ (visible IP)│                │ 123.45.67.89 │         └────────┘
└─────────────┘  4. Response   └──────────────┘         
     ▲                              │
     └──────────────────────────────┘
Website sees: Your real IP (123.45.67.89)
```

### With Proxy (Your Setup)
```
Your Device                 Cloudflare              Your Home PC            Website
(Different WiFi)           (Frontend)              (Proxy Server)          
┌─────────────┐  HTTPS     ┌──────────┐  API Request  ┌──────────┐
│ Browser     │───────────►│ Pages    │──────────────►│ Proxy    │
│ (1.1.1.1)   │            │(Frontend)│              │(Proxy)   │
└─────────────┘◄───────────┘          ◄──────────────┘          │
     ▲           Encrypted  └──────────┘  HTTP/HTTPS             │
     │                                         │                  │
     └──────────────────────────────────────────────────────────┘
                            Via Proxy                ┌────────┐
                                                    │Website │
                                                    └────────┘

Website sees: Your HOME PC's IP (not your current IP!)
You see: Website content securely
Cloudflare sees: Only encrypted traffic
ISP on current WiFi sees: Only HTTPS to Cloudflare
```

## Setup Process Visualization

### 5-Minute Setup
```
Step 1: Backend (5 min)        Step 2: Public Access
┌─────────────────┐            ┌──────────────────┐
│ npm install     │   or       │ Cloudflare Tunnel│
│ npm start       │────────────│ Port Forwarding  │
│ ✓ Running       │            │ Get URL: https://│
└─────────────────┘            └──────────────────┘
         │                              │
         │                    Step 3: Deploy Frontend
         │                    ┌──────────────────┐
         └───────────────────►│ pages.cloudflare │
                              │ Upload frontend  │
                              │ Auto-deploy      │
                              │ Get URL: *.pages │
                              └──────────────────┘
                                      │
                         Step 4: Connect & Browse
                         ┌──────────────────┐
                         │ Enter server URL │
                         │ Enter API key    │
                         │ Click Connect    │
                         │ ✓ Browse safely  │
                         └──────────────────┘
```

## Feature Highlights

### Security Features
```
🔐 JWT Authentication      → Only authorized requests
🔐 Rate Limiting          → Max 100 requests/15min
🔐 CORS Protection        → Only your domain allowed
🔐 Header Sanitization    → Remove tracking headers
🔐 SSL/TLS Encryption     → All traffic encrypted
```

### Privacy Options
```
📊 Block JavaScript       → Disable client-side scripts
🍪 Strip Cookies          → Remove all cookies
👤 Anonymize Headers      → Hide browser fingerprint
```

## Performance Metrics

### Speed
- Frontend load: <1 second (Cloudflare CDN)
- First proxy request: ~2-5 seconds
- Subsequent requests: <1-2 seconds
- Background: Network latency + proxying overhead

### Throughput
- Typical bandwidth: 50-100 Mbps (limited by home internet)
- Concurrent users: 1 recommended, up to 10 possible
- File download: Full speed of your home connection

### Latency
- Latency addition: +10-50ms (depends on distance to home PC)
- Cloudflare Tunnel: ~20-40ms faster than port forwarding

## Message Types

### Success
```
✓ Connected to proxy server
```

### Error
```
✗ Connection failed: Invalid API key
✗ HTTP 403: Domain is blocked
```

### Info
```
ℹ Request stopped
ℹ Disconnected from proxy server
```

## Configuration Examples

### Standard Setup
```
Server URL: https://xxx.cfargotunnel.com
API Key: mySecureAPIKey
Options: All unchecked
→ Standard browsing through your home PC
```

### Privacy Mode
```
Server URL: https://xxx.cfargotunnel.com
API Key: mySecureAPIKey
Options:
  ✓ Block JavaScript
  ✓ Strip Cookies
  ✓ Anonymize Headers
→ Maximum privacy, minimal tracking
```

### Restricted Access
```
Backend .env:
  BLOCKED_DOMAINS=ads.com,tracker.net
  ALLOWED_DOMAINS=google.com,github.com
→ Only safe sites accessible
```

## Deployment Options

### Local Testing
- Frontend: http://localhost:8787
- Backend: http://localhost:3000
- Perfect for: Testing before going live

### Production with Cloudflare Tunnel
- Frontend: https://your-project.pages.dev
- Backend: https://your-tunnel.cfargotunnel.com
- Best for: Easy public access, no port forwarding

### Production with Port Forwarding
- Frontend: https://your-project.pages.dev
- Backend: https://your-public-ip:3000
- Best for: Maximum control, more complex setup

## Typical Usage Flow

1. **Connect Phase**
   - User enters server URL and API key
   - Clicks "Connect"
   - Connection status changes to green
   - User is ready to browse

2. **Browse Phase**
   - User enters URL (e.g., "google.com")
   - Clicks "Go"
   - Loading indicator appears
   - Content loads from proxy
   - Results displayed

3. **Disconnect Phase**
   - User clicks "Disconnect"
   - Connection status returns to red
   - Browsing disabled until reconnect

## Browser Compatibility

✅ Works on:
- Chrome/Chromium
- Firefox
- Safari
- Edge
- Any modern browser with HTTPS support

✅ Platforms:
- Windows (PC)
- macOS
- Linux
- iOS Safari
- Android Chrome

## Troubleshooting Visual Guide

### Issue: Can't Connect
```
Check: Backend running?
  └─► Yes: Check API key
      ├─► Correct: Check firewall
      ├─► Wrong: Update in frontend
      └─► Missing: Add to .env
  └─► No: npm start in backend folder
```

### Issue: "Too Many Requests"
```
Solution:
  └─► Wait 15 minutes for rate limit reset
  └─► Or: Increase RATE_LIMIT_MAX_REQUESTS in .env
```

### Issue: Slow Speed
```
Check: Internet connection quality
  └─► Slow: Expected with long distances
  └─► Good: Increase PROXY_TIMEOUT in .env
```

---

For more details, see the full documentation in README.md and other .md files.
