# Security Configuration

This document describes security configurations that need to be enabled at the Supabase project level.

## Leaked Password Protection

**Status:** Requires manual configuration in Supabase Dashboard

**Why it matters:**
Supabase Auth can check user passwords against the HaveIBeenPwned.org database to prevent users from using compromised passwords. This significantly enhances account security.

**How to enable:**

### Via Supabase Dashboard:
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Click on **Email** provider
4. Scroll to **Password Protection** section
5. Enable **"Check if password has been leaked"**
6. Save changes

### Via Supabase CLI:
```bash
supabase secrets set AUTH_PASSWORD_REQUIRED_CHARACTERS=abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789
```

### Via API:
You can also configure this via the Supabase Management API by updating the auth configuration:

```bash
curl -X PATCH 'https://api.supabase.com/v1/projects/{ref}/config/auth' \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "SECURITY_PASSWORD_MIN_LENGTH": 8,
    "SECURITY_PASSWORD_REQUIRE_UPPERCASE": true,
    "SECURITY_PASSWORD_REQUIRE_LOWERCASE": true,
    "SECURITY_PASSWORD_REQUIRE_NUMBERS": true,
    "SECURITY_PASSWORD_REQUIRE_SYMBOLS": false,
    "SECURITY_PASSWORD_HIBP_ENABLED": true
  }'
```

## Security Issues Fixed (via Migration)

The following security issues have been automatically fixed via database migration:

### ✅ Unused Indexes Removed
All unused indexes have been dropped to reduce maintenance overhead and attack surface:
- `idx_fish_species_code`
- `idx_fish_species_group`
- `idx_roadmap_items_status`
- `idx_roadmap_items_phase`
- `idx_changelog_entries_version`
- `idx_weather_api_providers_priority`
- `idx_weather_api_providers_enabled`
- `idx_weather_api_keys_provider`
- `idx_user_profiles_provider`
- `idx_user_profiles_role`

These indexes can be recreated when the features that require them are implemented.

### ✅ SECURITY DEFINER View Fixed
The `index_usage_stats` view has been recreated with `SECURITY INVOKER` instead of `SECURITY DEFINER` to prevent potential privilege escalation vulnerabilities.

## Best Practices

1. **Password Policy:**
   - Minimum 8 characters
   - Require uppercase and lowercase letters
   - Require numbers
   - Enable HIBP (HaveIBeenPwned) checking

2. **Regular Security Audits:**
   - Review unused indexes quarterly
   - Monitor for SECURITY DEFINER functions/views
   - Check RLS policies for proper restrictions

3. **Index Management:**
   - Only create indexes when needed
   - Monitor index usage via `index_usage_stats` view
   - Remove indexes that remain unused for 90+ days
