'use strict';

const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  const cookies = req.cookies;
  const cookieEntries = Object.entries(cookies)
    .map(([k, v]) => `<li><strong>${escapeHtml(k)}</strong>: ${escapeHtml(v)}</li>`)
    .join('');

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SW Cookies Demo</title>
</head>
<body>
  <h1>Service Worker Cookies Demo</h1>

  <h2>Current Cookies</h2>
  <ul id="cookie-list">${cookieEntries || '<li>No cookies set</li>'}</ul>

  <button onclick="createCookies()">Create Cookies</button>

  <script>
    function createCookies() {
      fetch('/create-cookies').then(() => location.reload());
    }

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.error('SW registration failed:', err);
      });
    }

    window.addEventListener('message', async (event) => {
      const url = event.data;
      if (typeof url !== 'string') return;

      const registration = await navigator.serviceWorker.ready;
      const controller = registration.active;
      if (!controller) return;

      const channel = new MessageChannel();
      channel.port1.onmessage = (e) => {
        const {data} = e;
        event.source.postMessage({data}, '*');
      };
      controller.postMessage(url, [channel.port2]);
    });
  </script>
</body>
</html>`);
});

app.get('/create-cookies', (req, res) => {
  const random = () => crypto.randomBytes(8).toString('hex');

  const base = { secure: true, httpOnly: true };

  res.cookie('SAMESITE_NONE', random(), { ...base, sameSite: 'none' });
  res.cookie('SAMESITE_LAX', random(), { ...base, sameSite: 'lax' });
  res.cookie('SAMESITE_STRICT', random(), { ...base, sameSite: 'strict' });
  res.cookie('NO_SAMESITE', random(), { ...base });

  res.json({ success: true });
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
