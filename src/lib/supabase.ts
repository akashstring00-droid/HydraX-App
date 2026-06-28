import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export let supabase: any;

const isConfigured = !!(supabaseUrl && supabaseAnonKey);

if (isConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log("Supabase Bio-Intelligence Database client initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize Supabase client. Running in Mock Database mode.", error);
    setupMockClient();
  }
} else {
  console.warn("Supabase URL and Anon Key are missing from environment. Running in persistent Client-Side Mock Database mode.");
  setupMockClient();
}

function setupMockClient() {
  supabase = {
    auth: {
      signUp: async ({ email }: any) => {
        await new Promise(r => setTimeout(r, 800));
        const mockUid = 'mock-uid-' + Math.random().toString(36).substring(2, 11);
        const mockUser = { id: mockUid, email };
        return { data: { user: mockUser }, error: null };
      },
      signInWithPassword: async ({ email }: any) => {
        await new Promise(r => setTimeout(r, 800));
        if (email === 'error@hydrax.com') {
          return { data: { user: null }, error: { message: 'Invalid credentials. User not found.' } };
        }
        const mockUser = { id: 'mock-uid-123', email };
        return { data: { user: mockUser }, error: null };
      },
      signOut: async () => {
        await new Promise(r => setTimeout(r, 300));
        return { error: null };
      }
    },
    from: (table: string) => {
      return {
        select: (columns: string) => {
          return {
            eq: (field: string, value: any) => {
              return {
                single: async () => {
                  await new Promise(r => setTimeout(r, 400));
                  if (typeof window !== 'undefined') {
                    try {
                      const dbStr = window.localStorage.getItem('hydrax_mock_supabase_profiles') || '{}';
                      const db = JSON.parse(dbStr);
                      if (db[value]) {
                        return { data: db[value], error: null };
                      }
                    } catch (e) {
                      console.error('Mock database select failed', e);
                    }
                  }
                  return { data: null, error: { message: 'Profile dossier not found' } };
                }
              };
            }
          };
        },
        upsert: async (data: any) => {
          await new Promise(r => setTimeout(r, 500));
          if (typeof window !== 'undefined') {
            try {
              const id = data.id || data.uid;
              const dbStr = window.localStorage.getItem('hydrax_mock_supabase_profiles') || '{}';
              const db = JSON.parse(dbStr);
              db[id] = { ...db[id], ...data, updated_at: new Date().toISOString() };
              window.localStorage.setItem('hydrax_mock_supabase_profiles', JSON.stringify(db));
              return { data: db[id], error: null };
            } catch (e: any) {
              return { data: null, error: { message: e.message || 'Mock database save failed' } };
            }
          }
          return { data: null, error: { message: 'Window local storage unavailable' } };
        }
      };
    }
  };
}
