# Clicka - Better Fishing

A comprehensive fishing tracking Progressive Web Application (PWA) with real-time weather data, GPS tracking, and detailed catch analytics.

## Features

### Core Functionality
- **Session Management**: Track fishing sessions with start/end times, pause/resume functionality, and location history
- **Catch Recording**: Log fish catches with species, size, weight, location, photos, and detailed descriptions
- **Real-time Weather**: Integrated weather data from Netatmo and fallback APIs for each catch
- **GPS Tracking**: Automatic location tracking during fishing sessions with real-time trail visualization
- **Live Trail Mapping**: See your movement path on the map in real-time as you fish
- **Smart GPS Filtering**: Intelligent location tracking with distance (5m minimum) and accuracy (<100m) filters
- **Multi-source Location**: Supports GPS, network-based, and IP-based location fallback

### Analytics & Insights
- **Detailed Analytics**: Comprehensive analysis of catches, fishing patterns, and success rates
- **Weather Correlation**: Analyze how weather conditions affect your catches
- **Species Statistics**: Track most caught species, average weights, and best catches
- **Moon Phase Data**: Correlate catches with lunar cycles
- **Time-based Analysis**: Identify best fishing times and conditions

### User Experience
- **Multi-language**: Support for English, Polish, and German
- **PWA Support**: Install as a mobile app with offline capabilities and push notifications
- **Automatic Updates**: Smart update system checks for new versions every 15 minutes
- **Interactive Tutorial**: Guided onboarding for new users
- **Responsive Design**: Optimized for mobile, tablet, and desktop devices
- **Dark/Light Mode**: Customizable theme preferences

### Admin Features
- **User Management**: Admin panel to manage users and permissions
- **Fish Species Management**: Add, edit, and manage fish species database
- **Roadmap Management**: Track feature requests and development progress
- **Weather API Configuration**: Configure and manage weather data sources
- **System Monitoring**: View system health and sync status

## Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS 3
- **State Management**: Zustand
- **Routing**: React Router DOM
- **Icons**: Lucide React

### Backend & Infrastructure
- **Database**: Supabase (PostgreSQL with PostGIS)
- **Authentication**: Supabase Auth (Email/Password, OAuth: Google, Apple)
- **Storage**: Supabase Storage (for catch photos)
- **Edge Functions**: Supabase Edge Functions (Deno runtime)
- **Real-time**: Supabase Realtime subscriptions

### Maps & Visualization
- **Maps**: Leaflet + React Leaflet
- **Charts**: Chart.js + React Chart.js 2
- **Weather API**: Netatmo OAuth integration + Open-Meteo fallback

### PWA & Offline
- **Service Worker**: Workbox 7
- **Manifest**: Web App Manifest with adaptive icons
- **Caching**: Runtime caching for API calls and assets
- **Background Sync**: Queue API calls when offline

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- (Optional) Netatmo account for weather data

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd clicka-better-fishing
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run database migrations**
   - Navigate to your Supabase project dashboard
   - Go to SQL Editor
   - Execute all migration files from `/supabase/migrations/` in chronological order
   - Or use Supabase CLI: `supabase db push`

5. **Deploy Edge Functions** (optional, for Netatmo integration)
   ```bash
   # Deploy all edge functions
   supabase functions deploy netatmo-oauth-callback
   supabase functions deploy netatmo-refresh-token
   supabase functions deploy netatmo-weather-data
   ```

6. **Run development server**
   ```bash
   npm run dev
   ```

7. **Build for production**
   ```bash
   npm run build
   ```

### First Run

1. Create an admin account by signing up
2. Manually set your user role to 'admin' in the `user_profiles` table
3. Access the admin panel to configure fish species and weather APIs
4. Start your first fishing session!

## Database Setup

The application uses Supabase (PostgreSQL) for data storage with Row Level Security enabled.

### Database Tables
- `user_profiles` - User account information and preferences
- `fishing_sessions` - Fishing session records with weather and location data
- `fish_catches` - Individual catch records
- `fish_species` - Fish species database with multilingual names
- `roadmap_items` - Feature roadmap and planning
- `changelog_entries` - Version changelog tracking
- `weather_api_providers` - Weather API configuration
- `weather_oauth_config` - OAuth credentials for weather services
- `user_onboarding` - User tutorial progress tracking

All migrations are located in `/supabase/migrations/` and should be executed in chronological order.

## Security

Security is a top priority in Clicka. The application implements multiple layers of protection:

### Database Security
- **Row Level Security (RLS)**: Enabled on all database tables
- **Restrictive Policies**: Users can only access their own data
- **Admin Verification**: Admin actions require authenticated admin role
- **No Public Access**: All tables deny public access by default

### Authentication
- **Supabase Auth**: Industry-standard authentication
- **Email/Password**: Secure password hashing with bcrypt
- **OAuth Providers**: Google and Apple Sign-In integration
- **Session Management**: Secure JWT-based sessions
- **Role-Based Access Control (RBAC)**: Admin and user roles

### API Security
- **Function Search Path**: All functions use secure search_path settings
- **SQL Injection Prevention**: Parameterized queries throughout
- **CORS Configuration**: Proper CORS headers on all endpoints
- **Rate Limiting**: Built-in Supabase rate limiting

### Client Security
- **No Exposed Secrets**: All API keys server-side only
- **Secure Storage**: Encrypted local storage for sensitive data
- **HTTPS Only**: All production traffic over HTTPS
- **Content Security Policy**: Strict CSP headers

### Data Privacy
- **User Data Isolation**: Each user's data completely isolated
- **No Third-party Tracking**: No analytics or tracking scripts
- **Local-first**: Data stored locally with sync to cloud
- **Photo Privacy**: Catch photos stored in protected Supabase Storage buckets

## PWA Update System

Clicka features an intelligent PWA update system:

- **Automatic Check**: Checks for updates every 15 minutes
- **User Notification**: Beautiful notification banner when update available
- **User Control**: Users choose when to update (now or later)
- **Seamless Update**: Single-click update with automatic reload
- **Version Management**: Full version tracking in database
- **No Interruption**: Updates don't interrupt active fishing sessions

## Project Structure

```
clicka-better-fishing/
├── src/
│   ├── components/          # React components
│   │   ├── AdminPanel.tsx   # Admin functionality
│   │   ├── CatchForm.tsx    # Catch logging form
│   │   ├── Map.tsx          # Leaflet map component
│   │   ├── UpdateNotification.tsx  # PWA update UI
│   │   └── ...              # Other components
│   ├── hooks/               # Custom React hooks
│   │   ├── useGpsTracking.ts      # GPS location tracking
│   │   ├── usePWAUpdate.ts        # PWA update management
│   │   ├── useActiveSession.ts    # Active session state
│   │   └── ...              # Other hooks
│   ├── screens/             # Page-level components
│   ├── utils/               # Utility functions
│   │   ├── db.ts            # Supabase database operations
│   │   ├── weather.ts       # Weather API integration
│   │   ├── location.ts      # Location services
│   │   └── ...              # Other utilities
│   ├── types/               # TypeScript type definitions
│   ├── translations.ts      # i18n translations
│   └── App.tsx             # Main app component
├── supabase/
│   ├── migrations/          # Database migration files
│   └── functions/           # Edge Functions
│       ├── netatmo-oauth-callback/
│       ├── netatmo-refresh-token/
│       └── netatmo-weather-data/
├── public/
│   ├── icons/              # PWA icons (various sizes)
│   ├── sounds/             # Audio assets
│   └── _redirects          # Netlify routing config
├── docs/                   # Documentation files
│   ├── ANDROID_PWA_TROUBLESHOOTING.md
│   ├── NETATMO_SETUP.md
│   ├── OAUTH_SETUP.md
│   ├── PWA_*.md
│   └── SECURITY_*.md
└── vite.config.ts          # Vite configuration with PWA setup
```

## Contributing

Contributions are welcome! Please ensure:
- Code follows existing style conventions
- All new features include proper TypeScript types
- Database changes include migration files
- Security best practices are maintained
- Documentation is updated accordingly

## License

This project is proprietary software. All rights reserved.

## Support

For issues, questions, or feature requests, please refer to the roadmap in the admin panel or contact the development team.

---

**Version**: 1.0.0+
**Last Updated**: November 2025
**Status**: Production Ready