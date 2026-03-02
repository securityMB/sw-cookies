// Service Worker for sw-cookies demo
'use strict';

self.addEventListener('message', async (event) => {
  const url = event.data;
  if (typeof url !== 'string') return;

  const port = event.ports[0];
  if (!port) return;

  // Only allow fetching same-origin URLs to prevent SSRF
  let parsedUrl;
  try {
    parsedUrl = new URL(url, self.location.origin);
  } catch {
    port.postMessage({ error: 'Invalid URL' });
    return;
  }
  if (parsedUrl.origin !== self.location.origin) {
    port.postMessage({ error: 'Cross-origin fetch not allowed' });
    return;
  }

  try {
    const response = await fetch(parsedUrl.href);
    const text = await response.text();
    port.postMessage(text);
  } catch (err) {
    port.postMessage({ error: err.message });
  }
});
