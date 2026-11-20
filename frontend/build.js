const fs = require('fs');
const path = require('path');

const rawUrl = process.env.API_BASE_URL || process.env.API_URL || process.env.BACKEND_URL || '';
const cleanUrl = rawUrl.trim().replace(/\/+$/, '');

const content = `// Auto-generated during build\nwindow.API_BASE_URL = "${cleanUrl}";\n`;
fs.writeFileSync(path.join(__dirname, 'config.js'), content, 'utf8');
console.log(`[build.js] Configured window.API_BASE_URL = "${cleanUrl}"`);
