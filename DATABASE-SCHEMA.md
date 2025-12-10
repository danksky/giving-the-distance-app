# Database Schema - Minimal MVP

## Overview

Minimal schema to support: **Google login → Connect Strava → Store activities**

---

## Tables Overview

### Core Tables (NextAuth.js required)

1. `users` - User accounts
2. `accounts` - OAuth connections (Google + Strava)
3. `sessions` - Active sessions
4. `verification_tokens` - Email verification (if needed)

### App-Specific Tables

5. `strava_athletes` - Strava-specific athlete data
6. `activities` - Strava activities from webhooks

---

## Schema Details

### 1. `users` table

Basic user information from Google OAuth

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  image TEXT,  -- Google profile picture
  email_verified TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
```

**Fields**:

- `id` - Primary key (UUID)
- `email` - User's email from Google
- `name` - Display name from Google
- `image` - Profile picture URL from Google
- `email_verified` - When email was verified
- `created_at` / `updated_at` - Timestamps

---

### 2. `accounts` table

OAuth connections (Google for auth, Strava for activities)

```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,  -- 'google' or 'strava'
  provider_account_id VARCHAR(255) NOT NULL,  -- Google ID or Strava athlete ID
  access_token TEXT,
  refresh_token TEXT,
  expires_at BIGINT,  -- Unix timestamp
  token_type VARCHAR(50),
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(provider, provider_account_id)
);

-- Indexes
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_provider ON accounts(provider);
```

**Key Data**:

- **Google account** (provider='google'): Login credentials
- **Strava account** (provider='strava'): Activity sync credentials

**Old DynamoDB Mapping**:

- Old: Separate USER and STRAVA_ATHLETE tables
- New: Both stored in `accounts` table with different providers

---

### 3. `sessions` table

Active user sessions (NextAuth.js)

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_session_token ON sessions(session_token);
```

---

### 4. `verification_tokens` table

Email verification tokens (NextAuth.js, optional for now)

```sql
CREATE TABLE verification_tokens (
  identifier VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires TIMESTAMP NOT NULL,

  PRIMARY KEY (identifier, token)
);

-- Indexes
CREATE INDEX idx_verification_tokens_token ON verification_tokens(token);
```

---

### 5. `strava_athletes` table

Extended Strava athlete information

```sql
CREATE TABLE strava_athletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  strava_athlete_id BIGINT NOT NULL UNIQUE,  -- Strava's athlete ID
  username VARCHAR(255),
  firstname VARCHAR(255),
  lastname VARCHAR(255),
  city VARCHAR(255),
  state VARCHAR(255),
  country VARCHAR(255),
  sex VARCHAR(1),
  profile_medium TEXT,  -- Profile pic URL (medium)
  profile TEXT,  -- Profile pic URL (large)
  strava_authorized BOOLEAN DEFAULT true,
  permissions_granted TEXT,  -- Scopes granted
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_strava_athletes_user_id ON strava_athletes(user_id);
CREATE INDEX idx_strava_athletes_strava_id ON strava_athletes(strava_athlete_id);
```

**Old DynamoDB Mapping**:

```
STRAVA_ATHLETE table:
- USER_ID → user_id
- STRAVA_ID → strava_athlete_id
- STRAVA_PROFILE_PIC_URL → profile
- STRAVA_AUTHORIZED → strava_authorized
- PERMISSIONS_GRANTED → permissions_granted
```

**Why separate from `accounts`?**

- `accounts` stores OAuth tokens (security-sensitive)
- `strava_athletes` stores public profile data (cacheable)
- Easier to query/display athlete info

---

### 6. `activities` table

Strava activities received via webhooks

```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  strava_activity_id BIGINT NOT NULL UNIQUE,  -- Strava's activity ID
  name VARCHAR(255),
  type VARCHAR(50),  -- 'Run', 'Ride', 'Swim', etc.
  distance_meters NUMERIC(10, 2),
  moving_time_seconds INTEGER,
  elapsed_time_seconds INTEGER,
  total_elevation_gain NUMERIC(10, 2),
  start_date TIMESTAMP,
  start_date_local TIMESTAMP,
  timezone VARCHAR(100),
  is_manual BOOLEAN DEFAULT false,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_strava_id ON activities(strava_activity_id);
CREATE INDEX idx_activities_start_date ON activities(start_date DESC);
CREATE INDEX idx_activities_type ON activities(type);
```

**Old DynamoDB Mapping**:

```
ACTIVITY table:
- USER_ID → user_id
- STRAVA_ACTIVITY_ID → strava_activity_id
- TYPE → type
- DISTANCE_METERS → distance_meters
```

**Activity Types**: Run, Ride, Swim, Walk, Hike, etc.

---

## Queries We Need to Support

### User Management

```sql
-- Get user by email
SELECT * FROM users WHERE email = 'user@example.com';

-- Get user with Strava connection
SELECT u.*, sa.*
FROM users u
LEFT JOIN strava_athletes sa ON u.id = sa.user_id
WHERE u.id = $1;
```

### Strava Connection

```sql
-- Check if user has Strava connected
SELECT * FROM accounts
WHERE user_id = $1 AND provider = 'strava';

-- Get Strava tokens for refresh
SELECT access_token, refresh_token, expires_at
FROM accounts
WHERE user_id = $1 AND provider = 'strava';

-- Get athlete profile
SELECT * FROM strava_athletes
WHERE user_id = $1;
```

### Activities

```sql
-- Get user's recent activities
SELECT * FROM activities
WHERE user_id = $1
ORDER BY start_date DESC
LIMIT 20;

-- Get activities by type
SELECT * FROM activities
WHERE user_id = $1 AND type = 'Run'
ORDER BY start_date DESC;

-- Get total distance by user
SELECT
  user_id,
  SUM(distance_meters) as total_distance,
  COUNT(*) as activity_count
FROM activities
WHERE user_id = $1
GROUP BY user_id;
```

---

## Data Storage Summary

### What We're Storing:

**From Google OAuth**:

- ✅ User email, name, profile picture
- ✅ Google account ID (in `accounts` table)

**From Strava OAuth**:

- ✅ Athlete ID, tokens (access/refresh)
- ✅ Profile info (name, location, profile pic)
- ✅ Scopes/permissions granted

**From Strava Webhooks**:

- ✅ Activity ID, name, type
- ✅ Distance, time, elevation
- ✅ Start date/time
- ✅ Privacy settings

### What We're NOT Storing (Yet):

- ❌ Sponsorships
- ❌ Payments/Stripe data
- ❌ Donations
- ❌ Activity GPS routes/maps
- ❌ Social features (follows, comments, etc.)

---

## Migration from DynamoDB

### Old Tables → New Tables

| DynamoDB Table   | Postgres Table(s)              | Notes                                          |
| ---------------- | ------------------------------ | ---------------------------------------------- |
| `USER`           | `users` + `accounts`           | Split OAuth from user data                     |
| `STRAVA_ATHLETE` | `accounts` + `strava_athletes` | Tokens in accounts, profile in strava_athletes |
| `ACTIVITY`       | `activities`                   | Direct mapping with more fields                |
| `SPONSORSHIP`    | _(future)_                     | Not in MVP                                     |
| `STRIPE_SPONSOR` | _(future)_                     | Not in MVP                                     |
| `COMMITMENT`     | _(future)_                     | Not in MVP                                     |
| `DONATION`       | _(future)_                     | Not in MVP                                     |

---

## Questions to Validate

1. **Do we need email verification?** (verification_tokens table)

   - Or trust Google OAuth email?

2. **Activity data completeness?**

   - Do we need GPS/polyline data?
   - Do we need detailed stats (HR, power, etc.)?

3. **Activity types to support?**

   - Just runs? Or all activity types (bike, swim, etc.)?

4. **Data retention?**

   - Store all activities forever?
   - Or only recent ones?

5. **User deletion?**
   - Cascade delete all data?
   - Or anonymize activities?

---

## Next Steps

1. ✅ Review this schema
2. ⏳ Create Prisma schema file
3. ⏳ Set up Vercel Postgres
4. ⏳ Run migrations
5. ⏳ Test with seed data
