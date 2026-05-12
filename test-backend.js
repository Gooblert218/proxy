const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/health',
    method: 'GET',
    headers: {
        'X-API-Key': 'AWD8!@!awIAWoidkpp124!!!mkwaawadaaaaaaaaaaaaaaA'
    }
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', data);
    });
});

req.on('error', (error) => {
    console.error('Error:', error.message);
    console.error('⚠️ Backend is not running! Start it first.');
});

req.end();
