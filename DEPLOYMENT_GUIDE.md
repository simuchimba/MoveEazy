# MovEazy Deployment Guide - URGENT (1 Hour Demo)

## ⚡ Quick Deployment Steps

### 1. Supabase Database Setup (5 minutes)
1. Go to [supabase.com](https://supabase.com) → Sign up/Login
2. Create new project: `moveeazy-demo`
3. Wait for initialization
4. Go to SQL Editor → Copy/paste content from `database/supabase_schema.sql` → Run
5. Go to Settings → Database → Copy connection string

### 2. Push to GitHub (3 minutes)
```bash
cd "c:\xampp\htdocs\MovEazy FINAL - Copy"
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 3. Deploy Backend on Render (10 minutes)
1. Go to [render.com](https://render.com) → Sign up/Login
2. Connect GitHub account
3. New → Web Service
4. Connect your repository
5. Settings:
   - **Name**: `moveeazy-backend`
   - **Environment**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Environment Variables**:
     - `NODE_ENV` = `production`
     - `DATABASE_URL` = `[Your Supabase connection string]`
     - `JWT_SECRET` = `your-super-secret-jwt-key-here`
     - `PORT` = `10000`

### 4. Deploy Frontend on Render (10 minutes)
1. New → Static Site
2. Connect same repository
3. Settings:
   - **Name**: `moveeazy-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`
   - **Environment Variables**:
     - `VITE_API_URL` = `https://your-backend-url.onrender.com`

### 5. Update Frontend API URL
Update `frontend/.env` or `frontend/src/config.js` with your backend URL:
```
VITE_API_URL=https://moveeazy-backend-xxxx.onrender.com
```

## 🚨 Critical Environment Variables

### Your Supabase Connection String:
```
postgresql://postgres:moveazy2025%21@db.rcxrvwreataumclzkrzd.supabase.co:5432/postgres
```

### Your Backend Environment Variables:
```
NODE_ENV=production
DATABASE_URL=postgresql://postgres:moveazy2025%21@db.rcxrvwreataumclzkrzd.supabase.co:5432/postgres
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
PORT=10000
```

### Your Deployed URLs:
- **Backend**: https://moveeazy-backend.onrender.com
- **Frontend**: [Your frontend URL from Render dashboard]

## 🔧 Quick Fixes if Something Breaks

### Database Connection Issues:
- Check Supabase connection string is correct
- Ensure SSL is enabled in production
- Verify all tables were created

### Build Failures:
- Check Node.js version (use Node 18+)
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall

### CORS Issues:
- Backend already configured for CORS
- Update frontend API URL to match backend URL

## 📱 Demo URLs
- **Frontend**: https://moveeazy-frontend-xxxx.onrender.com
- **Backend API**: https://moveeazy-backend-xxxx.onrender.com/api/health
- **Admin Panel**: https://moveeazy-frontend-xxxx.onrender.com/admin

## 🎯 Demo Features to Show
1. User registration/login
2. Driver registration/login
3. Ride booking flow
4. Real-time updates (Socket.IO)
5. Admin dashboard
6. Payment simulation

## ⏰ Timeline Breakdown
- Supabase setup: 5 min
- GitHub push: 3 min
- Backend deploy: 10 min
- Frontend deploy: 10 min
- Testing: 5 min
- **Total: ~35 minutes**

## 🆘 Emergency Contacts
If deployment fails, you can:
1. Use the health check endpoint to verify backend
2. Check Render logs for errors
3. Use browser dev tools to check API calls
4. Demo locally if needed (backup plan)

## 📋 Pre-Demo Checklist
- [ ] Both services deployed and green
- [ ] Database tables created
- [ ] Health check endpoint working
- [ ] Frontend loads without errors
- [ ] Can register a test user
- [ ] Can register a test driver
- [ ] Socket.IO connection working

Good luck with your demo! 🚀
