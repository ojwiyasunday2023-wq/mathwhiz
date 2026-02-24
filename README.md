
# MATHWHIZ - Smart Math Solver

Developed by **LAMOGI PRODUCTION**.

## 🚀 Deployment Checklist for Vercel
If you are downloading files manually to upload to GitHub, ensure you include these:

### ✅ Folders TO INCLUDE
- `src/` (All application logic and UI)
- `public/` (Icons, manifest.json, PWA settings)
- `docs/` (Database structure)

### ❌ Folders DO NOT INCLUDE
- `node_modules/` (Vercel installs this automatically)
- `.next/` (This is a temporary build folder)

### 📄 Essential Root Files
- `package.json` (The most important file - tells Vercel what to install)
- `next.config.ts`
- `tailwind.config.ts`
- `tsconfig.json`
- `firestore.rules`
- `.gitignore` (Essential so you don't upload node_modules)

## 🌐 How to Deploy to Vercel (Free)
1. **Push to GitHub**:
   - Create a new repository on GitHub.
   - Upload all files (except the "DO NOT INCLUDE" folders).
2. **Connect to Vercel**:
   - Sign in to [vercel.com](https://vercel.com) with GitHub.
   - Click **"Add New"** > **"Project"**.
   - Select your `mathwhiz` repository.
3. **🔑 Environment Variables (CRITICAL)**:
   - In Vercel settings, go to **Environment Variables**.
   - Add a new variable:
     - **Key**: `GOOGLE_GENAI_API_KEY`
     - **Value**: [Your Key from Google AI Studio]
4. **Deploy**: Click **Deploy**. Vercel will give you a live URL!

## 🔐 Fixing Sign In/Sign Up Issues (CRITICAL)
If your buttons don't work after deployment, you **MUST** authorize your Vercel URL:
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project.
3. Go to **Authentication** > **Settings** > **Authorized Domains**.
4. Click **"Add Domain"**.
5. Paste your Vercel deployment URL (e.g., `mathwhiz-lamogi.vercel.app`).
6. Save. Wait 2-3 minutes, and Sign In will work!

## 🔑 How to get your AI API Key
1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Click **"Get API key"**.
3. Copy the key and paste it into the Vercel Environment Variables section as `GOOGLE_GENAI_API_KEY`.

## 🔄 How to Update the App
Updates are automatic:
1. Make changes to your local code.
2. Push the changes to GitHub.
3. Vercel will detect the push and update your live site within seconds!

## 📱 Making an APK
Use [PWABuilder.com](https://www.pwabuilder.com) with your live Vercel URL to generate your Android APK.
