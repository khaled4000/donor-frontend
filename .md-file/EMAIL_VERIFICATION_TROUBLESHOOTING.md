# Email Verification Troubleshooting Guide

## 🔧 Recent Fixes Applied

### Issues Fixed:
1. **"Token and email are required" error**: Fixed API method call signatures
2. **"Server error. Please try again later"**: Improved error handling and debugging
3. **Duplicate components**: Removed conflicting EmailVerification component
4. **Poor error messages**: Enhanced error extraction and display

### Changes Made:

#### Frontend (`EmailVerification.jsx`):
- ✅ Fixed API method calls: `ApiService.verifyEmail(token, email)` instead of `ApiService.verifyEmail({ token, email })`
- ✅ Fixed resend verification: `ApiService.resendVerification(email)` instead of `ApiService.resendVerification({ email })`
- ✅ Improved error handling to extract messages from different error formats
- ✅ Added debug logging to help troubleshoot URL parameter issues
- ✅ Added debug info display for missing parameters

#### Backend:
- ✅ Backend routes are correctly configured
- ✅ Email service is properly implemented

## 🧪 Testing the Email Verification Flow

### 1. Start Both Servers
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### 2. Enable Debug Mode (Optional)
Open browser console and run:
```javascript
devTools.enableApiDebug()
```

### 3. Test Registration Flow
1. Go to `/register` and create a new account
2. Check the backend logs for verification email details
3. In development, emails are saved to files in `backend/temp-emails/`

### 4. Test Verification URL Format
The verification URL should look like:
```
http://localhost:5173/verify-email?token=VERIFICATION_TOKEN&email=USER_EMAIL
```

### 5. Manual Testing
If you need to test manually, you can create a test URL:
```
http://localhost:5173/verify-email?token=test123&email=test@example.com
```

## 🔍 Debugging Common Issues

### Issue: "Token and email are required"
**Cause**: URL parameters missing or malformed
**Solution**: Check the URL has both `token` and `email` parameters

### Issue: "Server error. Please try again later"
**Cause**: Backend connection issues or email service problems
**Solution**: 
1. Check backend server is running on port 5000
2. Check backend logs for detailed error messages
3. Verify database connection

### Issue: "Invalid or expired verification token"
**Cause**: Token has expired (24-hour limit) or doesn't exist
**Solution**: Use the resend verification feature

## 📧 Email Service Debug

### In Development:
- Emails are saved to `backend/temp-emails/verification-{timestamp}.html`
- Check these files for the correct verification links

### Email Service Issues:
If email service fails:
1. Check `backend/utils/emailService.js` logs
2. Verify email transporter configuration
3. In development mode, emails should still be saved to files

## 🎯 Quick Fixes for Common Scenarios

### Scenario 1: User clicks verification link but gets error
1. Check browser console for debug logs
2. Verify URL has required parameters
3. Check if token is expired in database

### Scenario 2: Resend verification fails
1. Check if user exists in database
2. Verify user's email is not already verified
3. Check rate limiting (5-minute cooldown)

### Scenario 3: Backend errors
1. Check MongoDB connection
2. Verify all required environment variables
3. Check backend console for detailed errors

## 🚀 Production Deployment Notes

Before deploying to production:
1. Remove debug console.log statements
2. Configure proper email service (SMTP)
3. Set proper environment variables
4. Update API_BASE_URL for production

## 📞 Support

If issues persist:
1. Check browser console for debug logs
2. Check backend server logs
3. Verify database state
4. Test with fresh user registration

---

**Last Updated**: After fixing API method signatures and error handling
**Status**: ✅ Ready for testing
