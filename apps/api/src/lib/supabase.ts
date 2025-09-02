import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL as string
const supabaseServiceKey = process.env.SUPABASE_ANON_KEY as string

console.log("Supabase URL:", supabaseUrl)
console.log("Supabase Anon Key:", supabaseServiceKey)

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY")
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    db: { schema: "public" },
})
