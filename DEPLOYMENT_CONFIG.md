# Frontend Deployment Configuration

## Environment Variables

### Development (env.development)
```bash
VITE_API_BASE_URL=http://localhost:5000/api
VITE_FRONTEND_URL=http://localhost:5173
VITE_DEBUG_MODE=true
```

### Production (env.production)
```bash
VITE_API_BASE_URL=https://donor-backend-dxxd.onrender.com/api
VITE_FRONTEND_URL=https://donor-frontend1.onrender.com
VITE_DEBUG_MODE=false
```

## Configuration Files

### src/config/environment.js
```javascript
const configs = {
  development: {
    API_BASE_URL: 'http://localhost:5000/api',
    FRONTEND_URL: 'http://localhost:5173',
    DEBUG_MODE: true,
  },
  production: {
    API_BASE_URL: 'https://donor-backend-dxxd.onrender.com/api',
    FRONTEND_URL: 'https://donor-frontend1.onrender.com',
    DEBUG_MODE: false,
  }
};
```

### Backend Configuration
```javascript
// backend/config/frontend.js
module.exports = {
  FRONTEND_URL: process.env.FRONTEND_URL || "https://donor-frontend1.onrender.com",
  ENVIRONMENTS: {
    development: "http://localhost:5173",
    production: process.env.FRONTEND_URL || "https://donor-frontend1.onrender.com",
  },
};
```

## Deployment URLs

- **Frontend**: `https://donor-frontend1.onrender.com` (production)
- **Backend API**: `https://donor-backend-dxxd.onrender.com/api` (production)
- **Development**: `http://localhost:5173` (local development)
