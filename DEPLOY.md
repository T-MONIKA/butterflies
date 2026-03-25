# Deployment Guide (Render + Vercel)

## 1) Deploy Backend (Render)

1. Go to Render and create a new **Web Service** from this GitHub repo.
2. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. Add environment variables from `backend/.env.example`:
   - Required minimum: `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL`
   - Add payment/mail/cloudinary keys if your app uses those features.
4. Deploy and copy backend URL, for example:
   - `https://your-backend.onrender.com`

## 2) Deploy Frontend (Vercel)

1. Go to Vercel and import this GitHub repo.
2. Configure:
   - **Root Directory**: `frontend`
   - Framework preset should detect Create React App.
3. Add env var:
   - `REACT_APP_API_URL=https://your-backend.onrender.com/api`
4. Deploy and copy frontend URL, for example:
   - `https://your-frontend.vercel.app`

## 3) Connect Frontend URL in Backend

1. Return to Render service settings.
2. Set:
   - `FRONTEND_URL=https://your-frontend.vercel.app`
3. Redeploy backend.

## 4) Verify

1. Open frontend URL.
2. Test:
   - Register/Login
   - Product list loading
   - Cart and checkout flow
   - Admin image upload (Cloudinary recommended in production)

## Important Notes

- `backend/.env` is not committed (correct and secure).
- If Cloudinary keys are missing, accessory upload processing can fall back to local disk; many hosts (including Render) have ephemeral disk, so uploaded files may not persist.
