# Sponsor Landing Page

## Overview

A complete landing page for prospective sponsors has been created to showcase the Giving the Distance platform and convert local businesses into sponsors.

## Pages Created

### 1. `/sponsor-landing` - Main Landing Page

**Location:** `app/sponsor-landing/page.tsx`

This is the primary entry point for prospective sponsors. It includes:

#### Section 1: Hero / Promise

- Clean, editorial design with gradient background
- Headline: "Get your business seen while doing real good."
- Subheading about sponsoring local runs & rides
- Micro-line emphasizing small business focus and charity-first approach

#### Section 2: Interactive Preview (The Star)

- Google Maps Autocomplete input (biased to NYC area)
- Real-time business search with autocomplete
- ActivityPostMock preview showing how the business appears on athlete posts
- Preview button (disabled until business selected)
- Links to the full preview page

#### Section 3: How It Works

- Three-step process with icons:
  1. Athletes log runs & rides
  2. Your business sponsors activities
  3. Your name appears on their activity
- Clear, concise explanations
- No mention of technical details like dashboards or campaigns

#### Section 4: Designed for Small Businesses

- Trust-building section emphasizing it's a community platform
- Four key benefits with checkmark icons:
  - No bidding wars against national brands
  - Local businesses are prioritized
  - Sponsorships are matched fairly
  - You control your comfort level

#### Section 5: Contact / Handoff

- Low-pressure, human tone
- Phone number field (primary, emphasized)
- Email field (secondary, optional)
- CTA button: "Get in touch →"
- Footer signal: "Built in Brooklyn. Run by real people."

### 2. `/sponsors/preview` - Sponsor Preview Page

**Location:** `app/sponsors/preview/page.tsx`

A dynamic preview page that shows what a sponsor profile would look like:

#### Features:

- **Preview Banner:** Clear indication this is a preview mode with back button
- **Dynamic Business Info:** Uses Google Maps data from the landing page
- **Mock Images:** Placeholder graphics showing where business photos would appear
- **Mock Impact Data:**
  - Sample donation amounts ($61.65 total)
  - 4 sample supported activities
  - 4 unique athletes
  - 2 charities (ASPCA, UNICEF)
- **Recent Activities Section:** Shows sample sponsored activities with athlete names, distances, and donations
- **CTA Section:** "Like what you see?" with buttons to get in touch or learn more

## Components Created

### 1. `ActivityPostMock` Component

**Location:** `components/ActivityPostMock.tsx`

A React component that replicates a Strava-style activity post with sponsor branding:

#### Props:

- `businessName` - The sponsor business name
- `businessLocation` - Business address/location
- `athleteName` - Athlete's name
- `activityType` - Type of activity (Run, Walk, Ride)
- `distance` - Distance covered
- `charityName` - Benefiting charity
- `donationAmount` - Amount donated

#### Features:

- Strava-style header with avatar and metadata
- Activity description mentioning the sponsor
- Stats grid (Distance, Steps, Time)
- Map placeholder with "Entire map hidden" label
- Prominent donation banner with sponsor branding
- Social action buttons (Like, Comment, Share)

### 2. `BusinessSearchPreview` Component

**Location:** `components/BusinessSearchPreview.tsx`

An interactive component for searching businesses and previewing sponsor profiles:

#### Features:

- Google Maps Autocomplete integration
- Restricted to US establishments
- Biased to NYC area (coordinates: 40.477399,-74.25909 to 40.917577,-73.700272)
- Real-time preview update when business selected
- Disabled/enabled button states
- Navigation to full preview page with URL parameters

## Environment Setup

Added to `.env.local`:

```
Google Maps key setup for this flow is currently paused.
```

## Dependencies Installed

```bash
npm install @googlemaps/js-api-loader
```

## Design Principles

1. **Single "Wow" Moment:** The interactive business search and preview is the only complex interaction on the page. Everything else is calm and editorial.

2. **Visual Hierarchy:**

   - Top: Inspiration and clarity
   - Middle: Interaction and imagination
   - Bottom: Explanation, trust, and human handoff

3. **Geist Design System:** Uses the same color scheme and styling as the rest of the app:

   - Primary color: `#B56DFF` (purple)
   - Secondary color: `#004e89` (blue)
   - Background gradients and consistent spacing
   - Responsive design with mobile-first approach

4. **Trust Building:**

   - Low-pressure language throughout
   - Human touch ("Built in Brooklyn. Run by real people.")
   - No technical jargon
   - Clear benefits without overwhelming details

5. **Mobile Responsive:**
   - Grid layouts that stack on mobile
   - Touch-friendly buttons
   - Properly sized text and spacing

## User Flow

1. **Land on `/sponsor-landing`**

   - Read the hero section and understand the value proposition
   - Scroll to interactive preview section

2. **Search for Business**

   - Type business name in Google Maps autocomplete
   - Select business from dropdown
   - See instant preview of how it would appear on athlete posts

3. **Preview Full Profile**

   - Click "Preview your sponsor profile" button
   - Navigate to `/sponsors/preview?name=...&location=...&placeId=...`
   - See full sponsor profile with mock data
   - Understand complete sponsor experience

4. **Convert**
   - Return to landing page via back button or footer links
   - Fill out phone number (and optionally email)
   - Submit to get in touch

## Testing

To test the pages:

1. Start the dev server: `npm run dev`
2. Navigate to `http://localhost:3000/sponsor-landing`
3. Search for a business (e.g., "Joe's Coffee Brooklyn")
4. Select from autocomplete dropdown
5. Click "Preview your sponsor profile"
6. Review the preview page
7. Use back button to return

## Next Steps (Optional Future Enhancements)

1. **Form Submission:** Connect the contact form to a backend service (e.g., email, CRM, database)
2. **Analytics:** Add tracking for business searches, preview views, and form submissions
3. **A/B Testing:** Test different headlines, CTAs, and layouts
4. **Rich Preview Data:** Pull actual business data from Google Places API (photos, ratings, hours)
5. **Email Follow-up:** Automated email sequence for form submissions
6. **Admin Dashboard:** Tool to manage sponsor inquiries

## Notes

- The Google Maps API key is set to restrict to specific domains in production
- All mock data is hardcoded for preview purposes
- Phone validation and email validation should be added before production
- Form submission currently has no action - needs backend integration
