# Social Authentication Setup Guide

This guide walks you through setting up Google and LinkedIn OAuth for the Cash Flow Finder platform.

## ✅ **Implemented Social Providers**

- **Google OAuth** - Most popular, essential for business users
- **LinkedIn OAuth** - Perfect for business professionals and networking
- ~~Microsoft OAuth~~ - Removed as not needed for customer base
- ~~GitHub OAuth~~ - Removed as not needed for business users

## 🔧 **Firebase Configuration**

### 1. Google OAuth Setup

**Already configured by default in Firebase Auth**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project → Authentication → Sign-in method
3. Enable "Google" provider
4. Configure OAuth consent screen in Google Cloud Console
5. Add authorized domains (your production domain)

### 2. LinkedIn OAuth Setup

1. In Firebase Console → Authentication → Sign-in method
2. Click "Add new provider" → Add custom provider (OpenID Connect)
3. Configure:
   - **Provider ID**: `oidc.linkedin`
   - **Provider name**: LinkedIn
4. Copy the callback URL provided by Firebase
5. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/)
6. Create new app:
   - **App name**: Cash Flow Finder
   - **LinkedIn Page**: Your company page
   - **App logo**: Upload your logo
   - **Products**: Select "Sign In with LinkedIn"
7. In Auth tab:
   - Add Firebase callback URL to authorized redirect URLs
   - Copy Client ID and Client Secret
8. Return to Firebase and configure:
   - **Client ID**: From LinkedIn app
   - **Client Secret**: From LinkedIn app
   - **Issuer**: `https://www.linkedin.com/oauth`

## 🔐 **Security Configuration**

### Authorized Domains
Add these domains in Firebase Console → Authentication → Settings:

**Development:**
- `localhost`
- `127.0.0.1`

**Production:**
- `yourdomain.com`
- `www.yourdomain.com`
- `app.yourdomain.com`

### OAuth Consent Screens

**Google:**
- Configure in Google Cloud Console
- Add scopes: `email`, `profile`
- Submit for verification if serving 100+ users

**LinkedIn:**
- Configured automatically during app creation
- Scopes: `openid`, `profile`, `email`

## 🚀 **Testing Authentication**

### Development Testing
1. Start your development server
2. Navigate to `/auth/login` or `/auth/signup`
3. Test each social provider
4. Verify user creation in Firebase Auth console
5. Check backend logs for successful account creation

### Production Checklist
- [ ] All OAuth consent screens approved
- [ ] Production domains added to authorized domains
- [ ] SSL certificates configured
- [ ] Environment variables set correctly
- [ ] Social provider apps published/live

## 📋 **Environment Variables**

All social auth configuration is handled through Firebase, no additional environment variables needed. The existing Firebase config covers all providers:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
# ... other Firebase config
```

## 🛠️ **Troubleshooting**

### Common Issues

**"unauthorized_client" error:**
- Check redirect URI matches exactly
- Ensure domains are authorized
- Verify client ID/secret are correct

**"access_denied" error:**
- Check OAuth consent screen configuration
- Verify required scopes are requested
- Ensure app is published/live

**"popup_closed_by_user" error:**
- Normal user behavior, handled gracefully
- Consider implementing redirect-based flow for mobile

**LinkedIn specific:**
- LinkedIn requires HTTPS in production
- Ensure OpenID Connect provider is configured correctly
- Verify scopes include `openid`

### Debug Steps
1. Check browser console for detailed error messages
2. Verify Firebase Auth logs in console
3. Test with different browsers/incognito mode
4. Check provider-specific developer consoles for logs

## 📞 **Support**

If you encounter issues:
1. Check Firebase Auth documentation for your specific provider
2. Review provider-specific OAuth documentation
3. Test authentication flow step by step
4. Verify all URLs and credentials are correct

**Provider Documentation:**
- [Google OAuth](https://developers.google.com/identity/protocols/oauth2)
- [LinkedIn OAuth](https://docs.microsoft.com/en-us/linkedin/shared/authentication/)

---

**Cash Flow Finder** - Streamlined social authentication for business professionals.