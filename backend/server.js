import express from 'express';
import httpProxy from 'http-proxy';
import helmet from 'helmet';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { URL } from 'url';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Force clear old env vars before loading .env
delete process.env.API_KEY;
delete process.env.JWT_SECRET;

dotenv.config({ path: path.join(__dirname, '.env'), override: true });

console.log('📋 Configuration Loaded:');
console.log('   __dirname:', __dirname);
console.log('   .env path:', path.join(__dirname, '.env'));
console.log('   API_KEY length:', (process.env.API_KEY || '').length);
console.log('   API_KEY:', (process.env.API_KEY || 'NOT SET').substring(0, 10) + '...');
console.log('   ALLOWED_ORIGIN:', process.env.ALLOWED_ORIGIN || 'NOT SET');

const app = express();
const proxy = httpProxy.createProxyServer({
  timeout: parseInt(process.env.PROXY_TIMEOUT || '30000'),
  changeOrigin: true,
});

// Security Middleware
app.use(helmet());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS Configuration
const allowedOrigins = (process.env.ALLOWED_ORIGIN || 'http://localhost:3001').split(',');
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));

// Rate limiting (simple in-memory implementation)
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000;
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');

function checkRateLimit(ip) {
  const now = Date.now();
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, []);
  }
  
  const requests = requestCounts.get(ip);
  const recentRequests = requests.filter(t => now - t < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= RATE_LIMIT_MAX) {
    return false;
  }
  
  recentRequests.push(now);
  requestCounts.set(ip, recentRequests);
  return true;
}

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const apiKey = req.headers['x-api-key'];

  if (!token && !apiKey) {
    return res.status(401).json({ error: 'No token or API key provided' });
  }

  // Check API key (simpler for frontend)
  if (apiKey) {
    const expectedKey = process.env.API_KEY;
    const keyMatch = apiKey === expectedKey;
    
    if (!keyMatch) {
      console.log('❌ API Key mismatch:');
      console.log('   Received:', apiKey.substring(0, 10) + '...');
      console.log('   Expected:', (expectedKey || 'NOT SET').substring(0, 10) + '...');
      console.log('   Lengths:', apiKey.length, 'vs', (expectedKey || '').length);
    }
    
    if (keyMatch) {
      return next();
    }
    return res.status(403).json({ error: 'Invalid API key' });
  }

  // Verify JWT token
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

// Rate limiting middleware
app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  next();
});

// Generate token (for development/testing)
app.post('/api/auth/token', (req, res) => {
  const token = jwt.sign(
    { user: 'proxy-user', iat: Date.now() },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  res.json({ token });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Debug endpoint - shows loaded API key (first 20 chars + last 5 chars)
app.get('/api/debug', (req, res) => {
  const apiKey = process.env.API_KEY || 'NOT SET';
  const masked = apiKey.length > 25 ? apiKey.substring(0, 20) + '...' + apiKey.substring(apiKey.length - 5) : '***';
  res.json({ 
    apiKeyLoaded: masked,
    apiKeyLength: apiKey.length,
    allowedOrigin: process.env.ALLOWED_ORIGIN,
    note: 'API key is masked for security'
  });
});

// Proxy endpoint with authentication
app.all('/api/proxy', authenticateToken, (req, res) => {
  try {
    const { url, method = 'GET', headers = {}, body } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate and parse URL
    let targetUrl;
    try {
      targetUrl = new URL(url);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Check blocked domains
    const blockedDomains = (process.env.BLOCKED_DOMAINS || '').split(',').filter(d => d);
    const isBlocked = blockedDomains.some(domain => {
      const pattern = domain.replace(/\*/g, '.*');
      return new RegExp(pattern).test(targetUrl.host);
    });

    if (isBlocked) {
      return res.status(403).json({ error: 'Domain is blocked' });
    }

    // Sanitize headers - remove potentially problematic ones
    const sanitizedHeaders = {
      ...headers,
      'User-Agent': headers['User-Agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
    };
    delete sanitizedHeaders['host'];
    delete sanitizedHeaders['connection'];

    // Create target URL for proxy
    const targetPath = targetUrl.pathname + targetUrl.search;
    
    // Create proxy options
    const proxyOptions = {
      target: `${targetUrl.protocol}//${targetUrl.hostname}${targetUrl.port ? ':' + targetUrl.port : ''}`,
      changeOrigin: true,
      secure: false,
      headers: sanitizedHeaders,
      timeout: parseInt(process.env.PROXY_TIMEOUT || '30000'),
    };

    // Set custom path if needed
    if (targetPath && targetPath !== '/') {
      req.url = targetPath;
    }

    // Use http-proxy to forward the request
    proxy.web(req, res, proxyOptions, (err) => {
      console.error('Proxy error:', err.message);
      res.status(502).json({ 
        error: 'Bad Gateway', 
        message: err.message 
      });
    });

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Simple streaming proxy for GET requests
app.get('/proxy/*', authenticateToken, (req, res) => {
  try {
    const targetUrl = req.params[0];
    
    if (!targetUrl) {
      return res.status(400).json({ error: 'URL is required' });
    }

    let fullUrl;
    try {
      fullUrl = new URL(targetUrl);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    proxy.web(req, res, { target: fullUrl.toString() });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling
proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err);
  res.status(502).json({ error: 'Bad Gateway', details: err.message });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`
  🌐 Proxy Server Running
  ================================
  URL: http://${HOST}:${PORT}
  Environment: ${process.env.NODE_ENV || 'development'}
  CORS Origin: ${process.env.ALLOWED_ORIGIN || 'Not configured'}
  ================================
  `);
});
