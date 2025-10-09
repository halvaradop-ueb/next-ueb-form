import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

/**
 * @deprecated
 */
export const createClient = async () => {
    return createBrowserClient(supabaseUrl, supabaseAnonKey, {
        db: {
            schema: "public",
        },
    })
}

export const supabase = await createClient()
