# MATHWHIZ - Smart Math Solver

Developed by **LAMOGI PRODUCTION**.

## 🚀 Deployment Checklist for Vercel
If you are downloading files manually to upload to GitHub, ensure you include these:

### 1. Folders
- `src/` (All application code)
- `public/` (Icons, manifest.json)
- `docs/` (backend.json)

### 2. Root Files
- `package.json`
- `next.config.ts`
- `tailwind.config.ts`
- `postcss.config.js`
- `tsconfig.json`
- `components.json`
- `firestore.rules`

## 🌐 How to Deploy to Vercel (Free)
1. **Push to GitHub**:
   - Create a new repository on GitHub.
   - Run these commands in your project folder:
     ```bash
     git init
     git add .
     git commit -m "Initial commit of MATHWHIZ"
     git branch -M main
     git remote add origin https://github.com/YOUR_USERNAME/mathwhiz.git
     git push -u origin main
     ```
2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com).
   - Click **"Add New"** > **"Project"**.
   - Select your `mathwhiz` repository.
3. **Environment Variables**:
   - In the Vercel setup, find the **Environment Variables** section.
   - Add `GEMINI_API_KEY` with your Google AI key.
4. **Deploy**: Click **Deploy**. Vercel will give you a live URL!

## 🔄 How to Update the App
Updates are automatic:
1. Make changes to your local code.
2. Push to GitHub: `git add .`, `git commit -m "Update"`, `git push`.
3. Vercel will detect the push and update your live site within seconds!

## 📱 Making an APK
Use [PWABuilder.com](https://www.pwabuilder.com) with your live Vercel URL to generate your Android APK.
