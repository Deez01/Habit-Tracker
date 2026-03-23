import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY!

const isNative = Platform.OS === 'ios' || Platform.OS === 'android'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: isNative ? AsyncStorage : undefined,
    autoRefreshToken: isNative,
    persistSession: isNative,
    detectSessionInUrl: false,
  },
})