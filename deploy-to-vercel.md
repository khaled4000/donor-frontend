# 🚀 Deploy Frontend to Vercel - Complete Guide

## ✅ **Prerequisites**

- ✅ **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
- ✅ **GitHub Account**: Your code should be on GitHub
- ✅ **Frontend Ready**: All API calls using environment configuration

## 🚀 **Deployment Steps**

### **Step 1: Install Vercel CLI (Optional but Recommended)**

```bash
npm install -g vercel
```

### **Step 2: Build Your Frontend**

```bash
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# Verify build output
ls -la dist/
```

### **Step 3: Deploy to Vercel**

#### **Option A: Using Vercel Dashboard (Recommended for first deployment)**

1. **Go to [vercel.com](https://vercel.com)**
2. **Sign in with GitHub**
3. **Click "New Project"**
4. **Import your GitHub repository**
5. **Configure the project:**

   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend` (if your repo has both frontend/backend)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

6. **Set Environment Variables:**

   ```
   VITE_API_BASE_URL=https://donor-backend-dxxd.onrender.com/api
   VITE_FRONTEND_URL=https://your-vercel-domain.vercel.app
   VITE_DEBUG_MODE=false
   VITE_NODE_ENV=production
   ```

7. **Click "Deploy"**

#### **Option B: Using Vercel CLI**

```bash
cd frontend

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? → Yes
# - Which scope? → Select your account
# - Link to existing project? → No
# - Project name? → donor-project-frontend
# - In which directory is your code located? → ./
# - Want to override the settings? → Yes
# - Build Command: → npm run build
# - Output Directory: → dist
# - Development Command: → npm run dev
# - Install Command: → npm install
```

### **Step 4: Configure Custom Domain (Optional)**

1. **In Vercel Dashboard**: Go to your project
2. **Settings** → **Domains**
3. **Add your custom domain** (if you have one)
4. **Update DNS records** as instructed

## 🔧 **Post-Deployment Configuration**

### **Step 1: Update Backend CORS**

After deployment, update your backend's `.env` file with your Vercel domain:

```bash
# In your backend .env file
FRONTEND_URL=https://your-vercel-domain.vercel.app
```

### **Step 2: Redeploy Backend**

```bash
cd backend
git add .
git commit -m "Update CORS with Vercel frontend domain"
git push origin master
```

### **Step 3: Test Complete System**

1. **Test frontend**: Visit your Vercel URL
2. **Test API calls**: Verify they go to your Render backend
3. **Test authentication**: Login, registration, email verification
4. **Test all features**: Cases, donations, admin functions

## 🌐 **Environment Variables for Vercel**

Set these in your Vercel project settings:

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_API_BASE_URL` | `https://donor-backend-dxxd.onrender.com/api` | Your deployed backend |
| `VITE_FRONTEND_URL` | `https://your-vercel-domain.vercel.app` | Your Vercel frontend URL |
| `VITE_DEBUG_MODE` | `false` | Disable debug in production |
| `VITE_NODE_ENV` | `production` | Production environment |

## 📋 **Deployment Checklist**

- [ ] **Frontend built successfully** (`npm run build`)
- [ ] **Vercel project created**
- [ **Environment variables set**
- [ ] **Deployment successful**
- [ ] **Frontend accessible at Vercel URL**
- [ ] **API calls working to backend**
- [ ] **Backend CORS updated**
- [ ] **Complete system tested**

## 🚨 **Common Issues & Solutions**

### **Build Fails**
```bash
# Check for build errors
npm run build

# Common fixes:
npm install
npm audit fix
```

### **API Calls Fail**
- ✅ Verify `VITE_API_BASE_URL` is set correctly
- ✅ Check backend CORS configuration
- ✅ Ensure backend is running on Render

### **Routing Issues**
- ✅ Verify `vercel.json` routes configuration
- ✅ Check that all routes redirect to `index.html`

## 🎯 **Expected Results**

After successful deployment:

- ✅ **Frontend accessible** at `https://your-project.vercel.app`
- ✅ **All API calls** go to `https://donor-backend-dxxd.onrender.com/api`
- ✅ **Authentication working** (login, registration, email verification)
- ✅ **All features functional** (cases, donations, admin)
- ✅ **Performance optimized** (Vercel CDN, caching)

## 🔄 **Automatic Deployments**

Vercel will automatically deploy when you:

1. **Push to main/master branch**
2. **Create pull requests**
3. **Merge pull requests**

## 📊 **Monitoring & Analytics**

- **Vercel Analytics**: Built-in performance monitoring
- **Function Logs**: Serverless function execution logs
- **Performance**: Core Web Vitals and metrics

---

**🚀 Your frontend will be live on Vercel with automatic deployments and excellent performance!**
