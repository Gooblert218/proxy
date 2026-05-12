# Advanced Usage & Features

## Custom Proxy Headers

Modify the headers sent in proxy requests by editing `backend/server.js`:

```javascript
const sanitizedHeaders = {
    ...headers,
    'User-Agent': headers['User-Agent'] || 'Custom User Agent Here',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'X-Forwarded-For': req.ip,  // Forward original IP
};
```

## Rotating Proxy Features

Add to enable rotating user agents:

```javascript
const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
];

function getRandomUserAgent() {
    return userAgents[Math.floor(Math.random() * userAgents.length)];
}
```

## Caching Responses

Store frequently accessed pages to reduce bandwidth:

```javascript
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(url, method) {
    return `${method}:${url}`;
}

// Check cache before proxying
const cacheKey = getCacheKey(url, method);
const cached = cache.get(cacheKey);
if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.json(cached.data);
}
```

## Advanced Authentication

### Multi-User Support

Extend JWT token system for multiple users:

```javascript
app.post('/api/auth/register', (req, res) => {
    const { username, password } = req.body;
    
    // Hash password (use bcrypt in production!)
    const user = { username, password };
    
    const token = jwt.sign(user, process.env.JWT_SECRET, { 
        expiresIn: '24h' 
    });
    
    res.json({ token });
});
```

### Token Refresh

```javascript
app.post('/api/auth/refresh', authenticateToken, (req, res) => {
    const newToken = jwt.sign(
        { user: req.user.user },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
    res.json({ token: newToken });
});
```

## Request Filtering

Block specific request types or patterns:

```javascript
// Block large requests
app.all('/api/proxy', authenticateToken, (req, res, next) => {
    const contentLength = req.headers['content-length'];
    if (contentLength > 100000000) { // 100MB
        return res.status(413).json({ error: 'Request too large' });
    }
    next();
});

// Block specific file types
const blockedExtensions = ['.exe', '.zip', '.iso'];
if (blockedExtensions.some(ext => url.endsWith(ext))) {
    return res.status(403).json({ error: 'File type blocked' });
}
```

## Geolocation Spoofing

Add location headers to appear from different location:

```javascript
function addLocationHeaders(headers, location = 'US') {
    const geoHeaders = {
        'US': { 'CF-IPCountry': 'US', 'X-Forwarded-Country': 'US' },
        'UK': { 'CF-IPCountry': 'GB', 'X-Forwarded-Country': 'GB' },
        'CA': { 'CF-IPCountry': 'CA', 'X-Forwarded-Country': 'CA' },
    };
    
    return { ...headers, ...geoHeaders[location] };
}
```

## Logging & Analytics

### Request Logging

```javascript
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const log = {
            timestamp: new Date().toISOString(),
            ip: req.ip,
            method: req.method,
            path: req.path,
            status: res.statusCode,
            duration,
        };
        console.log(JSON.stringify(log));
    });
    next();
});
```

### Request Analytics

Track usage patterns:

```javascript
const analytics = {
    totalRequests: 0,
    requestsByDomain: {},
    requestsByHour: {},
    
    track(url, status) {
        this.totalRequests++;
        
        const domain = new URL(url).hostname;
        this.requestsByDomain[domain] = 
            (this.requestsByDomain[domain] || 0) + 1;
        
        const hour = new Date().getHours();
        this.requestsByHour[hour] = 
            (this.requestsByHour[hour] || 0) + 1;
    }
};

app.get('/api/analytics', authenticateToken, (req, res) => {
    res.json(analytics);
});
```

## Response Modification

### Strip Tracking Scripts

```javascript
function stripTracking(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const scripts = doc.querySelectorAll('script');
    scripts.forEach(script => {
        if (script.src && script.src.includes('google-analytics')) {
            script.remove();
        }
    });
    
    return doc.documentElement.innerHTML;
}
```

### Add Privacy Headers

```javascript
function addPrivacyHeaders(headers) {
    return {
        ...headers,
        'X-UA-Compatible': 'IE=edge',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'no-referrer',
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    };
}
```

## Docker Deployment

Create `Dockerfile` for containerized deployment:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

Build and run:
```bash
docker build -t proxy-browser .
docker run -p 3000:3000 --env-file .env proxy-browser
```

## Database Integration

Add SQLite for persistent logs:

```javascript
import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('proxy.db');

db.run(`
    CREATE TABLE IF NOT EXISTS requests (
        id INTEGER PRIMARY KEY,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        ip TEXT,
        url TEXT,
        status INTEGER,
        duration INTEGER
    )
`);

// Log requests
app.use((req, res, next) => {
    res.on('finish', () => {
        db.run(
            'INSERT INTO requests (ip, url, status, duration) VALUES (?, ?, ?, ?)',
            [req.ip, req.path, res.statusCode, Date.now()]
        );
    });
    next();
});
```

## Performance Optimization

### Compression

```javascript
import compression from 'compression';

app.use(compression());
```

### Connection Pooling

```javascript
// For high-traffic scenarios
const HttpProxyPool = require('http-proxy-pool');
const pool = new HttpProxyPool({ maxSockets: 100 });

app.all('/api/proxy', (req, res) => {
    pool.web(req, res, { target: url });
});
```

## WebSocket Support

Enable proxying WebSocket connections:

```javascript
const http = require('http');
const server = http.createServer(app);
const wsProxy = new httpProxy.createProxyServer({ ws: true });

server.on('upgrade', (req, socket, head) => {
    wsProxy.ws(req, socket, head, { 
        target: getTargetUrl(req) 
    });
});

server.listen(PORT);
```

## Rate Limiting by User

Per-user rate limits instead of per-IP:

```javascript
const userLimits = new Map();

function checkUserRateLimit(user) {
    const now = Date.now();
    if (!userLimits.has(user)) {
        userLimits.set(user, []);
    }
    
    const requests = userLimits.get(user);
    const recent = requests.filter(t => now - t < RATE_LIMIT_WINDOW);
    
    if (recent.length >= RATE_LIMIT_MAX) {
        return false;
    }
    
    recent.push(now);
    userLimits.set(user, recent);
    return true;
}
```

## Health Monitoring

Add detailed health endpoint:

```javascript
app.get('/api/health/detailed', (req, res) => {
    const uptime = process.uptime();
    const memory = process.memoryUsage();
    
    res.json({
        status: 'healthy',
        uptime: `${Math.floor(uptime / 60)} minutes`,
        memory: {
            heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)} MB`,
            heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)} MB`,
        },
        timestamp: new Date().toISOString(),
    });
});
```

## Load Balancing

For multiple home PCs, use Cloudflare Workers to balance:

```javascript
// In Cloudflare Workers
export default {
    async fetch(request) {
        const servers = [
            'https://proxy1.example.com',
            'https://proxy2.example.com',
        ];
        
        const server = servers[Math.floor(Math.random() * servers.length)];
        return fetch(`${server}${request.url}`);
    }
}
```

## See Also

- [README.md](README.md) - Core documentation
- [ENV.md](ENV.md) - Environment variables
- [DEPLOYMENT.md](DEPLOYMENT.md) - Production setup
