# Jamie's 90-Day Burn PWA

Jamie&apos;s 90-Day Burn is now a mobile-first React PWA built for Vercel and Firebase.

The app keeps the spirit of the original GAS version:

- exact workout links for the home program
- friend-like coaching written directly to Jamie
- Hello Kitty softness + Kuromi follow-through in the visual system
- workouts, hydration, mindset, goals, measurements, and InBody proof in one pocket coach

## Stack

- React + Vite
- Tailwind CSS v4
- lucide-react
- Firebase Authentication
- Cloud Firestore
- Firebase Admin SDK for reminder push delivery
- vite-plugin-pwa
- Vercel

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy the env template:

```bash
cp .env.example .env
```

3. Fill in the Firebase values in `.env`.

Required keys:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`
- `VITE_FIREBASE_VAPID_KEY` for web push reminders
- `FIREBASE_ADMIN_PROJECT_ID` for server-side reminder sending
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`

Server reminder keys:

- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`
- `GEMINI_API_KEY` for the coach endpoint
- `GEMINI_MODEL` if you want to override the default model

4. Start the dev server:

```bash
npm run dev
```

## Build checks

```bash
npm run build
npm run lint
```

## Firestore structure

The client writes under:

- `users/{uid}/workouts/{dateString}`
- `users/{uid}/tracking/{dateString}`
- `users/{uid}/measurements/{dateString}`
- `users/{uid}/inbody_scans/{dateString}`
- `users/{uid}/goals/{autoId}`
- `users/{uid}/settings/main`
- `users/{uid}/reminders/{reminderId}`
- `users/{uid}/video_state/{dateString}`
- `users/{uid}/coach_memory/{memoryId}`
- `users/{uid}/coach_threads/{autoId}`
- `users/{uid}/notification_tokens/{tokenId}`
- `users/{uid}/settings/main`
- `users/{uid}/reminders/{reminderId}`
- `users/{uid}/video_state/{dateString}`
- `users/{uid}/coach_memory/{memoryId}`
- `users/{uid}/coach_threads/{autoId}`

Security rules live in [firestore.rules](/Users/jeffersonlegacy/JamieBurn_PWA/firestore.rules).

## Reminder push route

The app now includes a minimal server endpoint at `/api/reminders/send`.

POST a JSON body like:

```json
{
  "tokens": ["fcm-token-1", "fcm-token-2"],
  "title": "Jamie, your check-in is ready",
  "body": "Open the app and take the next easy step.",
  "link": "/",
  "kind": "daily-nudge"
}
```

The route uses Firebase Admin SDK and sends one multicast message to the tokens you provide. It does not create tokens by itself, so client-side push registration can be added later without changing the server shape.

## Vercel deployment

1. Create a Firebase project with:
   - Authentication enabled
   - Anonymous sign-in enabled
   - Firestore enabled
   - Cloud Messaging Web Push certificate (for the VAPID key)
   - A service account for Firebase Admin
2. Add the env vars from `.env.example` to the Vercel project.
3. Deploy the app to Vercel.
4. Keep [vercel.json](/Users/jeffersonlegacy/JamieBurn_PWA/vercel.json) in place so SPA deep links rewrite to `index.html` while `/api/*` still reaches Vercel Functions.
5. Use [api/reminders/send.js](/Users/jeffersonlegacy/JamieBurn_PWA/api/reminders/send.js) to send one reminder payload to one or more saved FCM tokens.
5. Make sure `/api/*` routes stay available through Vercel so reminder sends do not get caught by the SPA rewrite.

## PWA

The app is configured with `vite-plugin-pwa` and generates:

- `manifest.webmanifest`
- `sw.js`
- installable app icons

Firestore persistence is enabled so the app remains useful when connectivity is spotty.

## Push reminders

The app now supports:

- web push permission prompts from inside the UI
- FCM token storage in Firestore under each user
- a dedicated messaging service worker at `/push/firebase-messaging-sw.js`
- a Vercel API route for sending reminder notifications

Reminder delivery still needs one final policy decision before full automation:

- manual or button-triggered sends through the API route, or
- a scheduled sender that checks due reminders and posts them automatically

## AI coach

The app now includes a minimal server endpoint at `/api/coach`.

POST a JSON body like:

```json
{
  "context": {
    "day": 14,
    "workoutName": "Full Body 2",
    "phaseName": "Foundation",
    "workoutComplete": false,
    "trackingLoggedToday": false,
    "measurementsDue": false,
    "inbodyDue": false,
    "memorySummary": "Jamie usually needs help getting started at night."
  },
  "messages": [
    { "role": "user", "content": "I am tempted to skip today." }
  ]
}
```

The route returns one short supportive reply. It is designed to recognize what is true, give one next move, and keep the tone warm and direct.
