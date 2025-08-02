// ======================================
// ANDREA PADOAN PWA SERVICE WORKER
// Performance-focused, NO notifications
// ======================================

const CACHE_NAME = 'andrea-pwa-v1.0.0';
const STATIC_CACHE = 'andrea-static-v1';
const DYNAMIC_CACHE = 'andrea-dynamic-v1';
const IMAGE_CACHE = 'andrea-images-v1';

// 🎯 CRITICAL RESOURCES - Sempre in cache
const CRITICAL_ASSETS = [
  '/',
  '/chi-sono.html',
  '/components/hero-chisono.html',
  '/components/intro-blocks.html',
  '/css/critical.css',
  '/js/core.js',
  '/images/chi-sono.jpg',
  '/images/andrea-profile.jpg',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// ⚡ PRELOAD RESOURCES - Cache when idle
const PRELOAD_ASSETS = [
  '/components/testimonials-google.html',
  '/components/values-section.html',
  '/components/story-cards.html',
  '/components/results-section.html',
  '/images/storia-1.jpeg',
  '/images/storia-2.JPG',
  '/images/valore-determinazione.jpg',
  '/images/valore-costanza.jpg'
];

// 🚫 NEVER CACHE - Always fetch fresh
const NEVER_CACHE = [
  '/api/',
  'analytics',
  'gtag',
  'google-analytics',
  'googletagmanager'
];

// ======================================
// INSTALL EVENT - Setup caches
// ======================================
self.addEventListener('install', event => {
  console.log('🚀 SW: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache critical resources immediately
      caches.open(STATIC_CACHE).then(cache => {
        console.log('📦 SW: Caching critical assets');
        return cache.addAll(CRITICAL_ASSETS);
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// ======================================
// ACTIVATE EVENT - Cleanup old caches
// ======================================
self.addEventListener('activate', event => {
  console.log('✅ SW: Activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== IMAGE_CACHE) {
              console.log('🗑️ SW: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control of all clients
      self.clients.claim(),
      
      // Preload non-critical assets when idle
      preloadWhenIdle()
    ])
  );
});

// ======================================
// FETCH EVENT - Smart caching strategy
// ======================================
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip never-cache URLs
  if (NEVER_CACHE.some(pattern => url.href.includes(pattern))) {
    return;
  }
  
  // Different strategies for different content types
  if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else if (isHTMLRequest(request)) {
    event.respondWith(handleHTMLRequest(request));
  } else if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else {
    event.respondWith(handleDynamicRequest(request));
  }
});

// ======================================
// CACHING STRATEGIES
// ======================================

// 🖼️ IMAGES: Cache First with WebP fallback
async function handleImageRequest(request) {
  try {
    const cache = await caches.open(IMAGE_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
      console.log('🖼️ SW: Serving cached image:', request.url);
      return cached;
    }
    
    // Try to fetch with WebP support
    const response = await fetchWithWebPSupport(request);
    
    // Cache successful responses
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('❌ SW: Image fetch failed:', error);
    return new Response('Image not available', { status: 404 });
  }
}

// 📄 HTML: Network First with Cache Fallback
async function handleHTMLRequest(request) {
  try {
    // Try network first for fresh content
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      console.log('📄 SW: Cached fresh HTML:', request.url);
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    // Fallback to cache
    console.log('📄 SW: Network failed, trying cache:', request.url);
    const cache = await caches.open(DYNAMIC_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    // Last resort: offline page
    return new Response(`
      <html>
        <head><title>Offline - Andrea Padoan</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px; background: #000; color: #fff;">
          <h1 style="color: #ff6b35;">Sei Offline</h1>
          <p>Connettiti a internet per accedere al sito di Andrea Padoan</p>
          <button onclick="location.reload()" style="background: #ff6b35; color: white; border: none; padding: 15px 30px; border-radius: 25px; font-size: 16px; cursor: pointer;">
            Riprova
          </button>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// ⚡ STATIC ASSETS: Cache First
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  
  if (cached) {
    console.log('⚡ SW: Serving cached asset:', request.url);
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('❌ SW: Static asset fetch failed:', error);
    return new Response('Asset not available', { status: 404 });
  }
}

// 🌐 DYNAMIC: Network First
async function handleDynamicRequest(request) {
  try {
    const response = await fetch(request);
    
    // Cache successful API responses briefly
    if (response.ok && !request.url.includes('analytics')) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cached = await cache.match(request);
    return cached || new Response('Service unavailable', { status: 503 });
  }
}

// ======================================
// UTILITY FUNCTIONS
// ======================================

function isImageRequest(request) {
  return request.destination === 'image' || 
         /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(request.url);
}

function isHTMLRequest(request) {
  return request.destination === 'document' ||
         request.headers.get('accept')?.includes('text/html');
}

function isStaticAsset(request) {
  return /\.(css|js|font|woff|woff2)$/i.test(request.url) ||
         request.url.includes('cdnjs.cloudflare.com');
}

// WebP support detection and serving
async function fetchWithWebPSupport(request) {
  const url = new URL(request.url);
  
  // Check if browser supports WebP
  const acceptHeader = request.headers.get('accept') || '';
  const supportsWebP = acceptHeader.includes('image/webp');
  
  if (supportsWebP && url.pathname.match(/\.(jpg|jpeg|png)$/i)) {
    // Try WebP version first
    const webpUrl = url.pathname.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    try {
      const webpResponse = await fetch(webpUrl);
      if (webpResponse.ok) {
        console.log('🖼️ SW: Serving WebP version:', webpUrl);
        return webpResponse;
      }
    } catch (error) {
      // WebP failed, continue with original
    }
  }
  
  return fetch(request);
}

// Preload assets when browser is idle
async function preloadWhenIdle() {
  if ('requestIdleCallback' in self) {
    self.requestIdleCallback(async () => {
      console.log('🎯 SW: Preloading assets during idle time');
      const cache = await caches.open(STATIC_CACHE);
      
      for (const asset of PRELOAD_ASSETS) {
        try {
          if (!(await cache.match(asset))) {
            const response = await fetch(asset);
            if (response.ok) {
              await cache.put(asset, response);
              console.log('📦 SW: Preloaded:', asset);
            }
          }
        } catch (error) {
          console.log('⚠️ SW: Failed to preload:', asset);
        }
      }
    });
  }
}

// ======================================
// BACKGROUND SYNC (for offline actions)
// ======================================
self.addEventListener('sync', event => {
  if (event.tag === 'whatsapp-contact') {
    event.waitUntil(handleOfflineWhatsAppContact());
  }
});

async function handleOfflineWhatsAppContact() {
  // Handle queued WhatsApp contacts when back online
  const contacts = await getStoredContacts();
  
  for (const contact of contacts) {
    try {
      // Process the contact (send to analytics, etc.)
      await processContact(contact);
      await removeStoredContact(contact.id);
    } catch (error) {
      console.log('❌ SW: Failed to process contact:', error);
    }
  }
}

// ======================================
// PERFORMANCE MONITORING
// ======================================
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'PERFORMANCE_LOG') {
    console.log('📊 SW: Performance data received:', event.data.metrics);
    // Could send to analytics here
  }
});

// ======================================
// CACHE MANAGEMENT
// ======================================

// Clean old caches periodically
setInterval(async () => {
  await cleanOldCaches();
}, 24 * 60 * 60 * 1000); // Once per day

async function cleanOldCaches() {
  const cacheWhitelist = [STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE];
  const cacheNames = await caches.keys();
  
  return Promise.all(
    cacheNames.map(cacheName => {
      if (!cacheWhitelist.includes(cacheName)) {
        console.log('🗑️ SW: Cleaning old cache:', cacheName);
        return caches.delete(cacheName);
      }
    })
  );
}

console.log('🚀 Andrea Padoan PWA Service Worker loaded successfully!');