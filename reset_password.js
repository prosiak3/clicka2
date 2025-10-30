import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://czopkukjtdwpesebelcp.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6b3BrdWtqdGR3cGVzZWJlbGNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTc3MjE1MywiZXhwIjoyMDc3MzQ4MTUzfQ.LkHtGmEDJhkx9y8VzJNnAHpG_zVBqJVG9Y-s1SqfW_g';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetPassword() {
  try {
    const { data, error } = await supabase.auth.admin.updateUserById(
      '4e622369-18a7-4b04-85ee-3fc6cee02c61',
      { password: 'nowehaslo123' }
    );
    
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Success! Password reset for test@example.com');
      console.log('New password: nowehaslo123');
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

resetPassword();
