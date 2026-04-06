import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, new URL('.', import.meta.url).pathname, '')

  return {
    plugins: [
      react(),
      tailwindcss(),
      emitMessagingServiceWorker(env),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.svg',
          'icon.svg',
          'icon-maskable.svg',
          'icon-maskable.png',
          'icon-192.png',
          'icon-512.png',
          'apple-touch-icon.png',
        ],
        manifest: {
          name: "Jamie's 90-Day Burn",
          short_name: "Jamie's Burn",
          description:
            "Jamie’s mobile-first burn ritual with workouts, body-proof tracking, goals, and encouraging check-ins.",
          theme_color: '#120d16',
          background_color: '#09060d',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          icons: [
            {
              src: '/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: '/icon-maskable.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        },
      }),
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom'],
            firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            icons: ['lucide-react'],
          },
        },
      },
    },
  }
})

function emitMessagingServiceWorker(env) {
  const firebaseRuntimeConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY || '',
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: env.VITE_FIREBASE_APP_ID || '',
    measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || '',
  }
  const workerSource = buildMessagingServiceWorkerSource(firebaseRuntimeConfig)

  return {
    name: 'emit-firebase-messaging-service-worker',
    configureServer(server) {
      server.middlewares.use('/push/firebase-messaging-sw.js', (_req, res) => {
        res.setHeader('Content-Type', 'application/javascript')
        res.end(workerSource)
      })
    },
    generateBundle() {
      this.emitFile({
        fileName: 'push/firebase-messaging-sw.js',
        source: workerSource,
        type: 'asset',
      })
    },
  }
}

function buildMessagingServiceWorkerSource(firebaseRuntimeConfig) {
  return `
importScripts('https://www.gstatic.com/firebasejs/12.11.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.11.0/firebase-messaging-compat.js');

firebase.initializeApp(${JSON.stringify(firebaseRuntimeConfig)});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || payload?.data?.title || "Jamie's 90-Day Burn";
  const body = payload?.notification?.body || payload?.data?.body || 'A little reminder is waiting for you.';
  const link = payload?.fcmOptions?.link || payload?.data?.link || '/';

  self.registration.showNotification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { link },
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = event.notification?.data?.link || '/';
  event.waitUntil(clients.openWindow(link));
});
  `.trim()
}
