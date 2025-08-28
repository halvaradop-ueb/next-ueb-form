import { cookies } from 'next/headers';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const createClient = async () => {
  const cookiesStore = await cookies();
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookiesStore.getAll();
      },
      setAll(cookies) {
        try {
          cookies.forEach(({ name, value, options }) => {
            cookiesStore.set(name, value, options);
          });
        } catch (error) {
          console.error('Error setting cookies:', error);
        }
      },
    },
    db: {
      schema: 'public',
    },
  });
};

export const supabase = await createClient();
