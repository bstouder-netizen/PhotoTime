import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kqipkuolxobaktvxzyhj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxaXBrdW9seG9iYWt0dnh6eWhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MDAxNDAsImV4cCI6MjA5MjQ3NjE0MH0.EZWMGbdaZ1ohP2OXkVRG58Zp-jv5Kf3ggt92SYp8jbo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
