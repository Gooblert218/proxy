class ProxyBrowser {
    constructor() {
        this.serverUrl = localStorage.getItem('serverUrl') || 'https://settlement-timer-opt-trips.trycloudflare.com';
        this.apiKey = localStorage.getItem('apiKey') || '';
        this.isConnected = false;
        this.currentUrl = '';
        this.requestAbortController = null;

        this.initElements();
        this.attachEventListeners();
        this.updateConnectionStatus();
        this.loadStoredConfig();
    }

    initElements() {
        this.serverUrlInput = document.getElementById('serverUrl');
        this.apiKeyInput = document.getElementById('apiKey');
        this.connectBtn = document.getElementById('connectBtn');
        this.disconnectBtn = document.getElementById('disconnectBtn');
        this.urlInput = document.getElementById('urlInput');
        this.goBtn = document.getElementById('goBtn');
        this.reloadBtn = document.getElementById('reloadBtn');
        this.homeBtn = document.getElementById('homeBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.browserContent = document.getElementById('browserContent');
        this.configMessage = document.getElementById('configMessage');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.connectionStatus = document.getElementById('connectionStatus');
        this.blockJavascript = document.getElementById('blockJavascript');
        this.stripCookies = document.getElementById('stripCookies');
        this.anonymizeHeaders = document.getElementById('anonymizeHeaders');
        this.requestInfo = document.getElementById('requestInfo');
        this.requestDetails = document.getElementById('requestDetails');
        this.timestamp = document.getElementById('timestamp');
    }

    attachEventListeners() {
        this.connectBtn.addEventListener('click', () => this.connect());
        this.disconnectBtn.addEventListener('click', () => this.disconnect());
        this.goBtn.addEventListener('click', () => this.browse());
        this.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.browse();
        });
        this.reloadBtn.addEventListener('click', () => this.reload());
        this.homeBtn.addEventListener('click', () => this.goHome());
        this.stopBtn.addEventListener('click', () => this.stop());

        // Save config to localStorage
        this.serverUrlInput.addEventListener('change', () => {
            localStorage.setItem('serverUrl', this.serverUrlInput.value);
            this.serverUrl = this.serverUrlInput.value;
        });

        this.apiKeyInput.addEventListener('change', () => {
            let apiKey = this.apiKeyInput.value;
            // Strip "API_KEY=" prefix if accidentally pasted
            if (apiKey.startsWith('API_KEY=')) {
                apiKey = apiKey.substring(8);
                this.apiKeyInput.value = apiKey;
            }
            localStorage.setItem('apiKey', apiKey);
            this.apiKey = apiKey;
        });
    }

    loadStoredConfig() {
        this.serverUrlInput.value = this.serverUrl;
        this.apiKeyInput.value = this.apiKey;
    }

    showMessage(message, type = 'info') {
        this.configMessage.textContent = message;
        this.configMessage.className = `message ${type}`;
        setTimeout(() => {
            this.configMessage.className = 'message';
        }, 5000);
    }

    async connect() {
        this.serverUrl = this.serverUrlInput.value;
        this.apiKey = this.apiKeyInput.value;

        // Strip "API_KEY=" prefix if accidentally pasted
        if (this.apiKey.startsWith('API_KEY=')) {
            this.apiKey = this.apiKey.substring(8);
            this.apiKeyInput.value = this.apiKey;
        }

        if (!this.serverUrl) {
            this.showMessage('Please enter server URL', 'error');
            return;
        }

        if (!this.apiKey) {
            this.showMessage('Please enter API key', 'error');
            return;
        }

        try {
            const response = await fetch(`${this.serverUrl}/api/health`, {
                method: 'GET',
                headers: {
                    'X-API-Key': this.apiKey,
                },
            });

            if (response.ok) {
                this.isConnected = true;
                this.updateConnectionStatus();
                this.showMessage('✓ Connected to proxy server', 'success');
                this.connectBtn.disabled = true;
                this.disconnectBtn.disabled = false;
                this.urlInput.focus();
            } else {
                this.showMessage('Failed to connect: Invalid credentials', 'error');
            }
        } catch (error) {
            this.showMessage(`Connection failed: ${error.message}`, 'error');
        }
    }

    disconnect() {
        this.isConnected = false;
        this.updateConnectionStatus();
        this.showMessage('Disconnected from proxy server', 'info');
        this.connectBtn.disabled = false;
        this.disconnectBtn.disabled = true;
        this.browserContent.innerHTML = '<div class="welcome-screen"><h2>Disconnected</h2><p>Configure and reconnect to browse</p></div>';
    }

    updateConnectionStatus() {
        if (this.isConnected) {
            this.connectionStatus.textContent = '● Connected';
            this.connectionStatus.className = 'status-indicator connected';
        } else {
            this.connectionStatus.textContent = '● Disconnected';
            this.connectionStatus.className = 'status-indicator disconnected';
        }
    }

    async browse() {
        if (!this.isConnected) {
            this.showMessage('Not connected to proxy server', 'error');
            return;
        }

        let url = this.urlInput.value.trim();

        if (!url) {
            this.showMessage('Please enter a URL', 'error');
            return;
        }

        // Add protocol if missing
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        this.currentUrl = url;
        await this.loadPage(url);
    }

    async loadPage(url) {
        this.loadingIndicator.classList.remove('hidden');
        this.requestInfo.classList.add('hidden');

        // Cancel previous request if any
        if (this.requestAbortController) {
            this.requestAbortController.abort();
        }

        this.requestAbortController = new AbortController();

        try {
            const response = await fetch(`${this.serverUrl}/api/proxy`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.apiKey,
                },
                body: JSON.stringify({
                    url: url,
                    method: 'GET',
                    headers: this.getHeaders(),
                }),
                signal: this.requestAbortController.signal,
            });

            const contentType = response.headers.get('content-type');
            let content;

            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || 'Request failed');
                }
                content = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
            } else {
                content = await response.text();
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${content}`);
            }

            // Store HTML content but strip scripts if enabled
            if (this.blockJavascript) {
                content = this.stripScripts(content);
            }

            this.browserContent.innerHTML = `<div class="proxy-content">${content}</div>`;
            this.urlInput.value = url;

            this.showRequestDetails(url, response);
            this.updateTimestamp();
        } catch (error) {
            if (error.name === 'AbortError') {
                this.showMessage('Request cancelled', 'info');
            } else {
                this.browserContent.innerHTML = `
                    <div class="error-screen">
                        <h2>Error Loading Page</h2>
                        <pre>${this.escapeHtml(error.message)}</pre>
                        <p>Make sure your server is running and the URL is valid.</p>
                    </div>
                `;
                this.showMessage(error.message, 'error');
            }
        } finally {
            this.loadingIndicator.classList.add('hidden');
        }
    }

    getHeaders() {
        const headers = {
            'User-Agent': navigator.userAgent,
        };

        if (this.anonymizeHeaders) {
            headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
            delete headers['Referer'];
        }

        return headers;
    }

    stripScripts(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Remove script tags
        const scripts = doc.querySelectorAll('script');
        scripts.forEach(script => script.remove());

        // Remove event handlers
        const allElements = doc.querySelectorAll('*');
        allElements.forEach(el => {
            Array.from(el.attributes).forEach(attr => {
                if (attr.name.startsWith('on')) {
                    el.removeAttribute(attr.name);
                }
            });
        });

        return doc.documentElement.innerHTML;
    }

    showRequestDetails(url, response) {
        const details = `URL: ${url}
Status: ${response.status} ${response.statusText}
Content-Type: ${response.headers.get('content-type')}
Content-Length: ${response.headers.get('content-length') || 'unknown'}
Timestamp: ${new Date().toISOString()}`;

        this.requestDetails.textContent = details;
        this.requestInfo.classList.remove('hidden');
    }

    reload() {
        if (this.currentUrl) {
            this.loadPage(this.currentUrl);
        }
    }

    goHome() {
        this.urlInput.value = '';
        this.browserContent.innerHTML = '<div class="welcome-screen"><h2>Secure Proxy Browser</h2><p>Enter a URL to browse</p></div>';
        this.requestInfo.classList.add('hidden');
    }

    stop() {
        if (this.requestAbortController) {
            this.requestAbortController.abort();
            this.loadingIndicator.classList.add('hidden');
            this.showMessage('Request stopped', 'info');
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    updateTimestamp() {
        this.timestamp.textContent = new Date().toLocaleTimeString();
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.proxyBrowser = new ProxyBrowser();
});
