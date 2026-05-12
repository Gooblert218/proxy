# Environment Variables Reference

Complete guide to all configuration options for the Secure Proxy Browser backend.

## Required Variables

### `JWT_SECRET` (Required)
- **Type**: String
- **Purpose**: Secret key for signing JWT tokens
- **Default**: None (must be set)
- **Example**: `JWT_SECRET=your-super-secret-jwt-key-change-this`
- **Security**: Use strong random string, minimum 32 characters
- **Generate**: `openssl rand -hex 32`

### `API_KEY` (Required)
- **Type**: String
- **Purpose**: API key for frontend authentication
- **Default**: None (must be set)
- **Example**: `API_KEY=my-secure-api-key-12345`
- **Security**: Strong password-like string
- **Generate**: `openssl rand -base64 32`

### `ALLOWED_ORIGIN` (Required for Production)
- **Type**: String/CSV
- **Purpose**: CORS whitelist - frontend URLs allowed to access backend
- **Default**: `http://localhost:3001`
- **Example**: 
  ```env
  ALLOWED_ORIGIN=https://myproxy.pages.dev,https://proxy.example.com
  ```
- **Security**: Only include your Cloudflare Pages domain
- **Note**: Must match frontend URL exactly (including protocol and port)

## Optional Variables

### `PORT`
- **Type**: Number
- **Purpose**: Port the proxy server listens on
- **Default**: `3000`
- **Valid Range**: 1024-65535 (use 1-1023 requires root/admin)
- **Example**: `PORT=8080`
- **Recommendation**: Use 3000 for development, any available port for production

### `HOST`
- **Type**: String (IP Address)
- **Purpose**: Network interface to bind to
- **Default**: `localhost`
- **Options**:
  - `localhost` or `127.0.0.1`: Local only
  - `0.0.0.0`: All interfaces (recommended with port forwarding)
  - `192.168.1.X`: Specific internal IP
- **Example**: `HOST=0.0.0.0`

### `PROXY_TIMEOUT`
- **Type**: Number (milliseconds)
- **Purpose**: How long to wait for proxy requests before timing out
- **Default**: `30000` (30 seconds)
- **Valid Range**: 1000-600000
- **Examples**:
  - `PROXY_TIMEOUT=5000` - Short timeout for fast sites
  - `PROXY_TIMEOUT=60000` - Long timeout for slow sites
- **Note**: Increase if proxying large files or slow websites

### `RATE_LIMIT_WINDOW`
- **Type**: Number (minutes)
- **Purpose**: Time window for rate limiting
- **Default**: `15` (minutes)
- **Valid Range**: 1-1440
- **Example**: `RATE_LIMIT_WINDOW=5`
- **Note**: Combined with RATE_LIMIT_MAX_REQUESTS

### `RATE_LIMIT_MAX_REQUESTS`
- **Type**: Number
- **Purpose**: Max requests per IP per window
- **Default**: `100` (requests per window)
- **Valid Range**: 10-10000
- **Examples**:
  - `RATE_LIMIT_MAX_REQUESTS=50` - Strict (50 requests/15min = 3.3 req/sec)
  - `RATE_LIMIT_MAX_REQUESTS=500` - Permissive (500 requests/15min = 33 req/sec)

### `BLOCKED_DOMAINS` (Optional)
- **Type**: CSV (comma-separated)
- **Purpose**: Domains to block (security feature)
- **Default**: (empty)
- **Examples**:
  ```env
  BLOCKED_DOMAINS=localhost:3000,127.0.0.1
  BLOCKED_DOMAINS=192.168.*,malware-site.com
  BLOCKED_DOMAINS=ads.com,tracker.net
  ```
- **Note**: Supports wildcard patterns with `*`
- **Use Cases**:
  - Block local network access
  - Block malicious sites
  - Block tracking domains

### `ALLOWED_DOMAINS` (Optional)
- **Type**: CSV (comma-separated)
- **Purpose**: Whitelist - only these domains allowed (if set)
- **Default**: `*` (all allowed)
- **Examples**:
  ```env
  ALLOWED_DOMAINS=google.com,github.com,wikipedia.org
  ```
- **Security**: Restrict to known-safe sites
- **Note**: If set, overrides default allow-all behavior

### `NODE_ENV`
- **Type**: String
- **Purpose**: Node.js environment
- **Default**: `development`
- **Options**:
  - `development` - Shows detailed errors, live reload
  - `production` - Optimized, hides sensitive errors
- **Example**: `NODE_ENV=production`

## Security Best Practices

### Before Deployment

1. **Generate Secure Secrets**
   ```bash
   # JWT_SECRET (32+ bytes)
   openssl rand -hex 32
   
   # API_KEY
   openssl rand -base64 32
   ```

2. **Never Commit .env**
   - Add to .gitignore (already done)
   - Keep backup copy locally
   - Rotate keys periodically

3. **Verify CORS Origin**
   - Must be exact match with frontend URL
   - Include protocol (https://)
   - No trailing slashes

### For Increased Security

```env
# Stricter rate limiting
RATE_LIMIT_MAX_REQUESTS=50
RATE_LIMIT_WINDOW=5

# Strict domain blocking
BLOCKED_DOMAINS=localhost,127.0.0.1,192.168.*,malicious-*

# Or whitelist approach
ALLOWED_DOMAINS=google.com,github.com,wikipedia.org

# Custom timeout
PROXY_TIMEOUT=10000
```

### For Development/Testing

```env
# More permissive
RATE_LIMIT_MAX_REQUESTS=1000
RATE_LIMIT_WINDOW=60

# Allow local testing
ALLOWED_ORIGIN=http://localhost:3001,http://localhost:8787

NODE_ENV=development
```

## Example Configurations

### Development (Local Testing)
```env
PORT=3000
HOST=localhost
JWT_SECRET=dev-secret-key
API_KEY=dev-api-key
ALLOWED_ORIGIN=http://localhost:3001
RATE_LIMIT_MAX_REQUESTS=1000
RATE_LIMIT_WINDOW=60
PROXY_TIMEOUT=30000
NODE_ENV=development
```

### Production (Secure)
```env
PORT=3000
HOST=0.0.0.0
JWT_SECRET=<generate-strong-random>
API_KEY=<generate-strong-random>
ALLOWED_ORIGIN=https://myproxy.pages.dev
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW=15
PROXY_TIMEOUT=30000
BLOCKED_DOMAINS=localhost,127.0.0.1,192.168.*
NODE_ENV=production
```

### Production (Restricted)
```env
PORT=3000
HOST=0.0.0.0
JWT_SECRET=<generate-strong-random>
API_KEY=<generate-strong-random>
ALLOWED_ORIGIN=https://myproxy.pages.dev
ALLOWED_DOMAINS=google.com,github.com,wikipedia.org
RATE_LIMIT_MAX_REQUESTS=50
RATE_LIMIT_WINDOW=5
PROXY_TIMEOUT=15000
NODE_ENV=production
```

## Updating .env

1. Edit the `.env` file in your backend directory
2. Restart the server for changes to take effect:
   ```bash
   # Kill current server (Ctrl+C)
   # Then restart:
   npm start
   ```

3. Verify with health check:
   ```bash
   curl -H "X-API-Key: YOUR_API_KEY" http://localhost:3000/api/health
   ```

## Troubleshooting .env Issues

**"Cannot find module 'dotenv'"**
- Run: `npm install`

**Changes not taking effect**
- Restart server: `npm start`
- Verify .env is in correct directory (backend folder)

**API Key not working**
- Check for trailing spaces in .env
- Verify API_KEY matches in frontend configuration

**CORS errors**
- Verify ALLOWED_ORIGIN is exact match
- Both frontend and backend must use same protocol (http or https)

## See Also

- [README.md](README.md) - Full documentation
- [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment guide
- [QUICKSTART.md](QUICKSTART.md) - Quick setup guide
