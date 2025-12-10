# Production Requirements & App Approvals

## ⚠️ Critical: Before Going Live

Both Google and Strava require app verification/approval before you can scale to real users.

---

## 🔐 Google OAuth App Verification

### Current Status: **Unverified** ⚠️

**What Happens Without Verification:**
- Users see a scary "Unverified App" warning screen
- Google shows: "This app hasn't been verified by Google"
- Users must click "Advanced" → "Go to [app] (unsafe)" to continue
- **Major trust/conversion killer** 🚫

### How to Get Verified:

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Navigate to**: APIs & Services → OAuth consent screen
3. **Verification steps**:
   - Add privacy policy URL
   - Add terms of service URL
   - Add app domain verification
   - Add logo
   - Submit for verification
4. **Verification process**:
   - Google reviews your app (1-6 weeks)
   - They check privacy policy, data usage, security
   - May require domain verification
   - May require video demo of OAuth flow

### Requirements for Verification:

**Must Have:**
- ✅ Privacy Policy page (published on your domain)
- ✅ Terms of Service page (published on your domain)
- ✅ Domain ownership verification
- ✅ App logo (512x512px)
- ✅ App description explaining why you need user data
- ✅ List of scopes you're requesting and why

**Documentation Needed:**
- Homepage URL: `https://givingthedistance.org`
- Privacy Policy: `https://givingthedistance.org/privacy`
- Terms of Service: `https://givingthedistance.org/terms`
- Support email: `givingthedistance@gmail.com`

**Timeline:**
- ⏱️ Typical review: 3-6 weeks
- ⏱️ Can take longer if flagged for additional review

### Workarounds for Testing:

**Before verification, you can:**
- ✅ Add test users in Google Console (up to 100)
- ✅ Test with those specific emails
- ✅ Deploy to beta/preview for internal testing
- ❌ Cannot scale to public users until verified

**To add test users:**
1. Google Console → OAuth consent screen
2. Scroll to "Test users"
3. Add email addresses (up to 100)
4. Those users won't see the warning screen

---

## 🏃 Strava App Approval

### Current Status: **Limited to Test Users** ⚠️

**Default Limits:**
- **Maximum users**: ~10-15 (unofficial limit)
- **Rate limits**: 100 requests per 15 minutes, 1000 per day
- Status: "Development" mode

### How to Get Approved:

1. **Build stable app** with Strava integration working
2. **Go to**: https://www.strava.com/settings/api
3. **Request Production Access**:
   - Click "Request Production Access" or similar button
   - Fill out application form

### Strava Requirements:

**Application Form:**
- App name and description
- What you're building and why
- How you'll use athlete data
- Privacy policy URL
- Terms of service URL
- Screenshots/demo of your app
- Expected number of users

**Must Have:**
- ✅ Working app deployed to production
- ✅ Privacy policy explaining Strava data usage
- ✅ Terms of service
- ✅ Proper handling of webhook events
- ✅ Respect user data deletion requests
- ✅ Display Strava branding (if showing activities publicly)

**Timeline:**
- ⏱️ Typical review: 2-4 weeks
- ⏱️ Strava team manually reviews each app

### Production Limits After Approval:

- **Users**: Unlimited ✅
- **Rate limits**: 
  - 100 requests per 15 minutes per user
  - 1000 requests per day per user
  - Higher limits available on request

### Before Approval:

**You can test with:**
- ✅ Your own account
- ✅ ~10-15 beta testers (unofficial limit)
- ✅ Development app on beta.givingthedistance.org

**You cannot:**
- ❌ Scale to hundreds of users
- ❌ Launch public marketing campaign
- ❌ Accept unlimited signups

---

## 📋 Pre-Launch Checklist

### Legal Pages Required (Both Google & Strava)

- [ ] **Privacy Policy**
  - What data you collect (Google email/name, Strava activities)
  - How you use it (sponsorship tracking, payments)
  - How you protect it (encryption, access controls)
  - User rights (data export, deletion)
  - Third-party services (Stripe, Strava, Google)

- [ ] **Terms of Service**
  - User agreement
  - Service description
  - Payment terms (when you add sponsorships)
  - Liability disclaimers
  - Account termination policy

- [ ] **Support Email**
  - `givingthedistance@gmail.com` (already have)
  - Must be monitored for data deletion requests

### App Store Pages Required

- [ ] **Homepage**: `https://givingthedistance.org`
- [ ] **About Page**: Explain what the app does
- [ ] **Privacy**: `https://givingthedistance.org/privacy`
- [ ] **Terms**: `https://givingthedistance.org/terms`
- [ ] **Contact**: `https://givingthedistance.org/contact`

### Branding Requirements

**Google:**
- [ ] App logo (512x512px)
- [ ] "Sign in with Google" button (official branding)
- [ ] App description

**Strava:**
- [ ] Use official "Connect with Strava" button/branding
- [ ] Display "Powered by Strava" if showing activities
- [ ] Follow Strava Brand Guidelines: https://developers.strava.com/guidelines/

---

## 🎯 Recommended Timeline

### Phase 1: Development (Current)
- ✅ Build app with test users (< 10 users)
- ✅ Use beta.givingthedistance.org
- ✅ Test OAuth flows with your accounts
- ✅ Build core features

### Phase 2: Soft Launch (1-2 months out)
- [ ] Create Privacy Policy & Terms of Service
- [ ] Submit Google OAuth for verification
- [ ] Submit Strava app for production approval
- [ ] Deploy to givingthedistance.org
- [ ] Invite 50-100 beta testers (using Google test users)

### Phase 3: Public Launch (2-3 months out)
- [ ] Google verification approved ✅
- [ ] Strava production approved ✅
- [ ] Remove user limits
- [ ] Public marketing campaign
- [ ] Scale to thousands of users

---

## 🛡️ Security & Compliance

### GDPR/Privacy Compliance

**User Rights to Implement:**
- [ ] **Data Export**: Let users download their data
- [ ] **Data Deletion**: Let users delete their account + data
- [ ] **Consent Management**: Clear explanation of what data you collect
- [ ] **Third-party Disclosure**: List Google, Strava, Stripe in privacy policy

### OAuth Scopes Justification

**Be prepared to explain:**

**Google Scopes:**
- `email`: "To create and identify user accounts"
- `profile`: "To personalize the user experience with name and photo"

**Strava Scopes:**
- `activity:read_all`: "To track user activities for sponsorship calculations"
- `profile:read_all`: "To display athlete information and profile"

---

## 📞 Contact Information for Reviews

### Google OAuth Review
- Form: In Google Cloud Console OAuth consent screen
- Support: https://support.google.com/cloud/

### Strava API Review
- Form: In Strava API settings
- Email: developers@strava.com
- Docs: https://developers.strava.com/docs/

---

## 🚨 Important Notes

1. **Don't launch publicly before approvals** - you'll hit user limits and create bad UX
2. **Start verification early** - both can take 4-6 weeks
3. **Keep test users under limits** - Google allows 100 test users during development
4. **Document everything** - both platforms want to see how you handle user data
5. **Plan for rejection** - first submissions often get feedback; be ready to iterate

---

## ✅ Quick Reference

### Current Limits (Unverified/Unapproved)

| Service | Current Limit | After Approval |
|---------|--------------|----------------|
| **Google OAuth** | 100 test users | Unlimited |
| **Strava API** | ~10-15 users | Unlimited |
| **Neon Postgres (Free)** | 0.5 GB storage | Same (or upgrade) |

### Timeline to Production

| Task | Duration | Blocker? |
|------|----------|----------|
| Build core features | 1-2 weeks | No |
| Create legal pages | 1-3 days | **YES** - Required for verification |
| Google verification | 3-6 weeks | **YES** - For public launch |
| Strava approval | 2-4 weeks | **YES** - For scaling |
| **Total minimum** | **~2 months** | Before public launch |

---

## 💡 Recommended Approach

1. **Now - Month 1**: Build features with < 10 test users
2. **Month 1 End**: Create Privacy Policy + Terms of Service
3. **Month 1 End**: Submit Google OAuth verification
4. **Month 1 End**: Submit Strava production approval
5. **Month 2-3**: While waiting for approvals, continue building features
6. **After Approvals**: Go live with public launch

This way you're building while approvals are in review, not blocked waiting for them.

---

**Next Steps:**
1. Finish Strava OAuth integration (almost there!)
2. Test with your accounts
3. Start drafting Privacy Policy & Terms of Service
4. Submit verification requests
5. Continue building while waiting for approvals


