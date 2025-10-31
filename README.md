# Clicka - Better Fishing

A comprehensive fishing tracking application with real-time weather data, GPS tracking, and detailed catch analytics.

## Features

- **Session Management**: Track fishing sessions with start/end times and locations
- **Catch Recording**: Log fish catches with species, size, weight, and location
- **Real-time Weather**: Integrated weather data for each catch
- **GPS Tracking**: Automatic location tracking during fishing sessions
- **Analytics**: Detailed analysis of catches and fishing patterns
- **Multi-language**: Support for English, Polish, and German
- **PWA Support**: Install as a mobile app with offline capabilities
- **Admin Panel**: Manage users, roadmap, and weather API configuration

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Email, Google, Apple)
- **Maps**: Leaflet
- **Charts**: Chart.js
- **Styling**: Tailwind CSS
- **PWA**: Workbox

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env`
4. Run development server: `npm run dev`
5. Build for production: `npm run build`

## Database Setup

The application uses Supabase for data storage. All migrations are in `/supabase/migrations/`.

## Security

- Row Level Security (RLS) enabled on all tables
- Secure authentication with Supabase Auth
- OAuth integration for Google and Apple
- Admin role-based access control

[Edit in StackBlitz ⚡️](https://stackblitz.com/~/github.com/prosiak3/Clicka)