// Service Worker for CyberShield IDS PWA
const CACHE_NAME = 'cybershield-v1.0.0';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});

// Background sync for threat data
self.addEventListener('sync', (event) => {
  if (event.tag === 'threat-sync') {
    event.waitUntil(syncThreatData());
  }
});

// Push notifications for security alerts
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Security alert detected',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view',
        title: 'View Details',
        icon: '/icons/view-icon.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss-icon.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('CyberShield Security Alert', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

async function syncThreatData() {
  try {
    // Sync threat data with server when online
    const response = await fetch('/api/sync-threats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timestamp: Date.now()
      })
    });
    
    if (response.ok) {
      console.log('Threat data synced successfully');
    }
  } catch (error) {
    console.error('Failed to sync threat data:', error);
  }
}