# 🚨 Troubleshooting Guide for Donor Project

## Common Issues and Solutions

### 1. Server Crashing and Excessive API Calls

**Problem**: Server crashes or excessive API calls to `/api/admin/users` every second.

**Root Causes**:
- Duplicate MongoDB index definitions
- Excessive frontend polling
- Memory leaks in React components
- Missing cleanup in useEffect hooks

**Solutions Applied**:
- ✅ Fixed duplicate `caseId` index in `Case.js` model
- ✅ Cleaned up `AdminDashboard.jsx` - removed commented code
- ✅ Reduced API polling intervals (30s → 2-3 minutes)
- ✅ Added proper cleanup in useEffect hooks
- ✅ Implemented API request throttling

### 2. MongoDB Duplicate Index Warning

**Problem**: 
```
Warning: Duplicate schema index on {"caseId":1} found. 
This is often due to declaring an index using both "index: true" and "schema.index()".
```

**Solution**: 
- Removed `unique: true` from schema definition
- Kept only `caseSchema.index({ caseId: 1 }, { unique: true })`

**Files Modified**:
- `backend/models/Case.js` - Line 269

### 3. Excessive Frontend API Polling

**Problem**: Multiple components making API calls every 30-60 seconds.

**Solutions**:
- **HomePage**: 30s → 2 minutes, 60s → 3 minutes
- **AdminDashboard**: Added proper throttling (1 second between requests)
- **Data Refresh**: Set to 30 seconds only when needed

### 4. Code Organization Issues

**Problem**: Large files with commented code and complex logic.

**Solutions**:
- ✅ Cleaned `AdminDashboard.jsx` (removed ~2000 lines of commented code)
- ✅ Created clean, modern CSS
- ✅ Simplified component logic
- ✅ Added proper error handling

## 🧹 Clean Restart Process

### Option 1: Use the Clean Restart Script
```bash
# From project root
node clean-restart.js
```

### Option 2: Manual Clean Restart
```bash
# 1. Stop all Node processes
taskkill /F /IM node.exe
taskkill /F /IM nodemon.exe

# 2. Clear npm cache
npm cache clean --force

# 3. Remove node_modules (optional)
rm -rf node_modules
rm -rf backend/node_modules
rm -rf frontend/node_modules

# 4. Reinstall dependencies
npm install
cd backend && npm install
cd ../frontend && npm install

# 5. Start server
cd ../backend
npm run dev
```

## 🔧 Quick Fixes

### Fix MongoDB Index Issue
```javascript
// In backend/models/Case.js
// REMOVE this line:
caseId: {
  type: String,
  required: false,
  unique: true,  // ← Remove this
},

// KEEP this line:
caseSchema.index({ caseId: 1 }, { unique: true });
```

### Fix API Polling
```javascript
// In frontend components, change intervals:
// FROM:
setInterval(fetchData, 30000); // 30 seconds

// TO:
setInterval(fetchData, 120000); // 2 minutes
```

### Fix Memory Leaks
```javascript
useEffect(() => {
  const interval = setInterval(fetchData, 30000);
  
  // Always return cleanup function
  return () => clearInterval(interval);
}, []);
```

## 📊 Performance Monitoring

### Check API Request Frequency
```bash
# Monitor backend logs for excessive requests
# Look for patterns like:
# GET /api/admin/users - every second
# GET /api/stats - every 30 seconds
```

### Monitor Memory Usage
```bash
# Check for memory leaks
# Look for increasing memory usage over time
```

## 🚀 Best Practices

### 1. API Request Management
- Use throttling (minimum 1 second between requests)
- Implement proper error handling
- Add request deduplication

### 2. React Component Cleanup
- Always return cleanup functions from useEffect
- Clear intervals and timeouts
- Handle component unmounting

### 3. Database Optimization
- Avoid duplicate index definitions
- Use compound indexes when possible
- Monitor query performance

### 4. Frontend Performance
- Reduce unnecessary re-renders
- Implement proper memoization
- Use lazy loading for large components

## 🔍 Debugging Commands

### Check Running Processes
```bash
# Windows
tasklist /FI "IMAGENAME eq node.exe"
tasklist /FI "IMAGENAME eq nodemon.exe"

# Kill processes
taskkill /F /IM node.exe
taskkill /F /IM nodemon.exe
```

### Check Port Usage
```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000

# Kill process using specific port
taskkill /PID <PID> /F
```

### Monitor Logs
```bash
# Backend logs
cd backend && npm run dev

# Frontend logs
cd frontend && npm run dev
```

## 📝 Maintenance Checklist

### Daily
- [ ] Check server logs for errors
- [ ] Monitor API response times
- [ ] Check for memory leaks

### Weekly
- [ ] Review and clean up console logs
- [ ] Check for unused dependencies
- [ ] Review API endpoint performance

### Monthly
- [ ] Update dependencies
- [ ] Review and optimize database queries
- [ ] Clean up old code and comments

## 🆘 Emergency Procedures

### Server Won't Start
1. Kill all Node processes
2. Clear npm cache
3. Remove node_modules and reinstall
4. Check for port conflicts
5. Verify environment variables

### Database Connection Issues
1. Check MongoDB connection string
2. Verify network connectivity
3. Check MongoDB service status
4. Review authentication credentials

### Frontend Not Loading
1. Check browser console for errors
2. Verify API endpoints are accessible
3. Check CORS configuration
4. Verify authentication tokens

## 📞 Getting Help

If you continue to experience issues:

1. **Check the logs** - Look for specific error messages
2. **Review recent changes** - What was modified before the issue?
3. **Test in isolation** - Try to reproduce the issue in a simple test case
4. **Check dependencies** - Ensure all packages are compatible
5. **Review this guide** - Many common issues are covered here

## 🎯 Success Metrics

After implementing fixes, you should see:
- ✅ No more duplicate index warnings
- ✅ API calls reduced to reasonable intervals
- ✅ Server stability improved
- ✅ Memory usage remains stable
- ✅ Faster page load times
- ✅ Better user experience

---

**Last Updated**: August 18, 2025  
**Version**: 1.0  
**Status**: ✅ Issues Identified and Fixed
