# Deploy to Vercel (Alternative to Render)

## 🚀 **Current Status: Deployed to Render**

Your frontend is currently deployed to **Render** at:
**https://donor-frontend1.onrender.com**

## 🔄 **If You Want to Deploy to Vercel Instead**

### 1. **Environment Variables for Vercel**

```bash
# Production environment variables
VITE_API_BASE_URL=https://donor-backend-dxxd.onrender.com/api
VITE_FRONTEND_URL=https://donor-frontend1.onrender.com
VITE_DEBUG_MODE=false
VITE_NODE_ENV=production
```

### 2. **Backend CORS Update**

If you deploy to Vercel, update your backend CORS to include your Vercel domain:

```javascript
// In backend/server.js
const allowedOrigins = [
  'http://localhost:5173', // Development
  'http://localhost:3000', // Alternative development
  'https://donor-frontend1.onrender.com', // Current Render deployment
  'https://your-vercel-domain.vercel.app', // New Vercel domain
  process.env.FRONTEND_URL // Environment variable fallback
];
```

### 3. **Vercel Configuration**

```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## 🎯 **Recommendation**

**Keep your current Render deployment** as it's working perfectly with your backend. Only switch to Vercel if you have specific requirements for that platform.

## 📊 **Current Deployment Status**

- **Frontend**: ✅ https://donor-frontend1.onrender.com (Render)
- **Backend**: ✅ https://donor-backend-dxxd.onrender.com/api (Render)
- **Integration**: ✅ Fully connected and working
- **Email Verification**: ✅ Using correct frontend URLs
