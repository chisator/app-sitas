# SITAS Fitness — Store Submission Checklist

## Pre-Flight Technical Checklist

- [ ] Bundle ID confirmed: `com.sitas.fitness` (permanent — cannot change without new listing)
- [ ] `app.json` updated with `bundleIdentifier` and `package`
- [ ] `eas.json` created with `development`, `preview`, and `production` profiles
- [ ] `.env` secrets secured and NOT committed (`.gitignore` check)
- [ ] Privacy Policy generated (`docs/privacy-policy.html`)
- [ ] Support email/URL ready
- [ ] App runs without crashes on physical devices (iOS & Android)
- [ ] Deep links / URL scheme (`sitasmobile://`) working (if used)
- [ ] No placeholder/test data visible in production UI

---

## Required Accounts

| Account | Cost | URL | Status |
|---------|------|-----|--------|
| Apple Developer Program | $99/year | [developer.apple.com](https://developer.apple.com) | ⬜ |
| Google Play Console | $25 one-time | [play.google.com/console](https://play.google.com/console) | ⬜ |
| Expo Account | Free | [expo.dev](https://expo.dev) | ⬜ |

---

## App Assets — Screenshots

### iOS (Required sizes)
Upload 5–8 screenshots per size. Show real app content (classes, routines, progress), not placeholders.

| Device | Size | Notes |
|--------|------|-------|
| iPhone 6.7" Display | 1290×2796px | iPhone 15 Pro Max, 14 Pro Max |
| iPhone 6.5" Display | 1284×2778px | iPhone 14 Plus, 13 Pro Max, 12 Pro Max |
| iPhone 5.5" Display | 1242×2208px | iPhone 8 Plus, 7 Plus, 6s Plus |
| iPad Pro 12.9" (3rd gen+) | 2048×2732px | iPad Pro 12.9" M1/M2 |
| iPad Pro 12.9" (2nd gen) | 2048×2732px | iPad Pro 12.9" 2017 |

**Tip:** You can generate most of these from the 6.5" set using App Store Connect, but having dedicated screenshots is better.

### Android (Required sizes)
Upload 5–8 screenshots per device type.

| Device Type | Aspect Ratio | Min Size |
|-------------|--------------|----------|
| Phone | 16:9 or 9:16 | 1080×1920px |
| 7" Tablet | 16:9 or 9:16 | 1080×1920px |
| 10" Tablet | 16:9 or 9:16 | 1080×1920px |

---

## App Assets — Icons & Graphics

| Asset | Platform | Spec | Current Status |
|-------|----------|------|----------------|
| App Icon | iOS | 1024×1024px, no transparency, no alpha | ✅ `assets/images/icon.png` |
| App Icon | Android | 512×512px, adaptive with foreground/background | ✅ `assets/images/android-icon-*` |
| Feature Graphic | Android | 1024×500px | ⬜ **NEEDS CREATION** |
| Splash Screen | Both | 200px wide icon on solid bg | ✅ Configured in `app.json` |

---

## Store Listing Copy

Prepare the following text in advance:

### App Name (30 chars max)
`SITAS Fitness`

### Short Description (80 chars max — Android only)
`Reserva clases, sigue rutinas y registra tu progreso en el gimnasio.`

### Full Description
```
SITAS Fitness Center — tu compañero de entrenamiento.

Con la app de SITAS puedes:
• Reservar tu lugar en las clases grupales del gimnasio
• Ver tus rutinas de entrenamiento asignadas
• Registrar cada ejercicio, serie, repetición y peso
• Seguir tu progreso con estadísticas visuales
• Consultar tu historial de entrenamientos

Todo tu fitness, en un solo lugar.
```

### Keywords (100 chars max — iOS)
`fitness, gym, workout, training, exercise, routine, class booking, progress tracker`

### Support URL
`[YOUR_SUPPORT_WEBSITE_OR_EMAIL]`

### Marketing URL (optional)
`[YOUR_GYM_WEBSITE]`

---

## Content Rating Questionnaire

Both stores require you to answer questions about app content.

**For SITAS Fitness, typical answers:**
- Does the app contain violence? **No**
- Does the app contain sexual content? **No**
- Does the app contain user-generated content? **Yes** (workout logs are UGC, but private to each user)
- Does the app collect personal info? **Yes** (email, name, workout data)
- Is the app a fitness/health app that provides medical advice? **No** (general fitness tracking only, no medical claims)

**Expected rating:** Everyone / 3+ (PEGI) / E (ESRB)

---

## Category Selection

| Store | Recommended Category |
|-------|---------------------|
| App Store | **Health & Fitness** |
| Play Store | **Health & Fitness** |

---

## EAS Build Commands

### Step 1: Configure project
```bash
npx eas build:configure
```
Select:
- Android bundle identifier: `com.sitas.fitness`
- iOS bundle identifier: `com.sitas.fitness`

### Step 2: Preview build (test APK)
```bash
# Android preview APK
npx eas build --platform android --profile preview

# iOS preview (requires Apple Developer account linked)
npx eas build --platform ios --profile preview
```

### Step 3: Production build
```bash
# Android App Bundle (AAB) — required for Play Store
npx eas build --platform android --profile production

# iOS Archive (IPA) — required for App Store
npx eas build --platform ios --profile production
```

### Step 4: Submit to stores (after configuring credentials)
```bash
# Android — upload AAB to Google Play internal track
npx eas submit --platform android --profile production

# iOS — upload IPA to App Store Connect
npx eas submit --platform ios --profile production
```

---

## iOS-Specific Requirements

- [ ] Apple Developer account enrolled and paid
- [ ] App Store Connect app record created
- [ ] App ID registered with bundle ID `com.sitas.fitness`
- [ ] Distribution certificate & provisioning profile (EAS handles this automatically)
- [ ] App Privacy details filled in App Store Connect (matches privacy policy)
- [ ] No HealthKit entitlements declared (confirmed — app does not use HealthKit)
- [ ] No Sign in with Apple required (app uses Supabase email/password auth)
- [ ] TestFlight internal testing configured (optional but recommended)

### App Privacy Labels (App Store Connect)

Declare the following data types:

| Data Type | Usage | Linked to Identity? | Tracking? |
|-----------|-------|---------------------|-----------|
| Contact Info (email, name) | App functionality | Yes | No |
| User Content (workout logs) | App functionality | Yes | No |
| Health & Fitness (manually entered) | App functionality | Yes | No |

---

## Android-Specific Requirements

- [ ] Google Play Console account created and paid ($25)
- [ ] App created in Play Console with package name `com.sitas.fitness`
- [ ] Google Service Account created for EAS Submit
- [ ] Service Account JSON key downloaded and stored securely
- [ ] `serviceAccountKeyPath` in `eas.json` updated with actual path
- [ ] Android App Bundle (AAB) target API level meets Play Store requirements
- [ ] Data safety form filled in Play Console (matches privacy policy)
- [ ] Content rating questionnaire completed

### Data Safety Form (Play Console)

| Question | Answer |
|----------|--------|
| Does your app collect or share any user data? | Yes, collected |
| Is user data encrypted in transit? | Yes |
| Types of data collected: | Email, name, user-generated content (workouts, reservations) |
| Purpose: | App functionality |
| Is data collection optional? | No (required for app functionality) |
| Can users request deletion? | Yes |

---

## Review Preparation — Common Rejection Avoidance

### App Store
- [ ] App does not crash on launch or during login
- [ ] All buttons/screens are functional (no dead ends)
- [ ] App content is appropriate for all ages
- [ ] No placeholder text (Lorem Ipsum, "TODO", etc.)
- [ ] Login works with valid credentials (provide test account in review notes)
- [ ] App does not claim to diagnose/treat medical conditions
- [ ] App is useful even if user has no account? **No** — must disclose this is account-required

### Play Store
- [ ] App does not crash
- [ ] No deceptive ads or clickbait
- [ ] App description matches actual functionality
- [ ] Test account credentials provided in "App access" section
- [ ] Target API level meets current Play Store requirements (API 33+ for new apps)

---

## Test Account for Reviewers

Both Apple and Google require a demo account if login is mandatory.

Create a test user in Supabase:
- Email: `reviewer@sitas.test` (or similar)
- Password: `[STRONG_PASSWORD]`
- Assign at least one routine and one class reservation so reviewers see a populated app

Include these credentials in:
- **App Store Connect**: "App Review Information" → "User Name" / "Password"
- **Google Play Console**: "App access" → "All or some functionality is restricted" → provide credentials

---

## Estimated Timeline

| Phase | Duration |
|-------|----------|
| Account setup (Apple + Google + Expo) | 1–3 days |
| Asset creation (screenshots, feature graphic) | 2–3 days |
| Preview build & device testing | 1 day |
| Production build | 1–2 hours (EAS cloud time) |
| Store listing creation & submission | 1 day |
| Google Play review | 1–3 days |
| App Store review | 1–7 days |

**Total realistic timeline: 1–2 weeks** (assuming active work on assets)

---

## Post-Launch

- [ ] Set up crash monitoring (Sentry recommended for Expo apps)
- [ ] Monitor reviews and respond promptly
- [ ] Plan update cycle (bug fixes, new features)
- [ ] Track app analytics (Expo provides basic metrics; consider adding Amplitude/Mixpanel)

---

## Next Immediate Actions

1. ⬜ Replace `[YOUR_SUPPORT_EMAIL@EXAMPLE.COM]` and `[YOUR_GYM_ADDRESS]` in `docs/privacy-policy.html`
2. ⬜ Host privacy policy online (GitHub Pages, Netlify, or your gym's website)
3. ⬜ Create Play Store Feature Graphic (1024×500px)
4. ⬜ Create reviewer test account in Supabase
5. ⬜ Run first EAS preview build: `npx eas build --platform android --profile preview`
