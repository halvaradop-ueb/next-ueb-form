import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

export const createClient = () => {
    return createBrowserClient(supabaseUrl, supabaseAnonKey, {
        db: {
            schema: "public",
        },
    })
}

export const supabase = createClient()
