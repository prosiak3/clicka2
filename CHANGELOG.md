# Changelog

All notable changes to Clicka - Better Fishing will be documented in this file.

## [Unreleased]

### Documentation
- **Enhanced Code Documentation**: Added comprehensive JSDoc comments
  - Detailed comments for PWA update system (`usePWAUpdate.ts`)
  - Complete documentation for `UpdateNotification` component
  - Function-level documentation with examples
  - Parameter descriptions and return types
- **Updated Technical Documentation**: Complete README.md overhaul
  - Expanded feature descriptions with detailed subsections
  - Detailed tech stack breakdown by category
  - Step-by-step installation and setup guide
  - Comprehensive security documentation section
  - PWA update system explanation
  - Project structure visualization
  - Contributing guidelines
- **Updated clicka.prompt**: Added PWA update system documentation
  - Complete update workflow description
  - Configuration details and code examples
  - Implementation notes and best practices

## [1.0.0+] - 2025-11-03

### Added
- **Real-time GPS Trail Tracking**: Automatic GPS tracking during active fishing sessions
  - Live trail visualization on map as you move
  - Smart distance filtering (minimum 5m between points)
  - Accuracy validation (ignores points with accuracy > 100m)
  - Respects configured tracking interval
  - Automatic pause during session pauses
  - Real-time map updates without page refresh
  - Haversine formula for accurate distance calculation
- **PWA Auto-Update System**: Complete update management system
  - Automatic check for updates every 15 minutes
  - User-friendly update notification banner with gradient design
  - User control: "Update Now" or "Later" options
  - Seamless activation with automatic page reload
  - Version tracking in database
  - Non-intrusive to active fishing sessions
  - Loading states during update process

### Removed
- Quick Count mode feature (will be reimplemented in a different way)
- `enable_quick_count` field from user profiles
- "Just Count" button from home screen

### Changed
- Optimized imports and removed unused dependencies
- Updated README with comprehensive project information
- Enhanced GPS tracking system with intelligent filtering
- Improved map component to show live movement trail
- PWA `registerType` changed from 'autoUpdate' to 'prompt' for better user experience
- Documentation structure reorganized for clarity

### Fixed
- Build optimization and cleanup
- GPS tracking now continuously updates location during active sessions
- PWA configuration corrected in technical documentation

## [1.0.0] - 2025-10-31

### Added
- Complete fishing session tracking system
- Real-time GPS location tracking
- Weather data integration (Netatmo and fallback API)
- Multi-language support (English, Polish, German)
- Fish species database with length/weight data
- Admin panel with dashboard
- User management for admins
- Roadmap and changelog management
- Weather API configuration interface
- Fish species management
- OAuth authentication (Google, Apple)
- PWA support with offline capabilities
- Push notifications
- Session auto-end with inactivity warning
- Catch photo upload support
- Map view with standard and satellite modes
- Detailed analytics and statistics
- Export functionality for location data
- Data cleanup tools for statistics

### Security
- Row Level Security (RLS) on all database tables
- Secure authentication with Supabase
- Admin role-based access control
- OAuth security implementation
- Function search path security fixes
- Performance optimization for RLS policies
