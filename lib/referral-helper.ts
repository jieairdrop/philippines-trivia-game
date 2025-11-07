import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// Helper function to create a Supabase server client
async function getSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    },
  )
}

export async function generateReferralCode(): Promise<string> {
  const supabase = await getSupabaseClient()
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""
  let isUnique = false
  let attempts = 0
  const maxAttempts = 10

  while (!isUnique && attempts < maxAttempts) {
    // Generate a random 8-character code
    code = ""
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    // Check if code already exists
    const { data, error } = await supabase
      .from("profiles")
      .select("referral_code")
      .eq("referral_code", code)
      .maybeSingle()

    if (error) {
      console.error("Error checking referral code uniqueness:", error)
      attempts++
      continue
    }

    isUnique = !data
    attempts++
  }

  if (!isUnique) {
    throw new Error("Failed to generate unique referral code after multiple attempts")
  }

  return code
}

export async function getReferrerIdByCode(code: string): Promise<string | null> {
  const supabase = await getSupabaseClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("referral_code", code)
    .single()

  if (error) {
    console.error("Error fetching referrer by code:", error)
    return null
  }
  
  return data?.id || null
}

export async function createReferralRecord(
  referrerId: string,
  referredUserId: string,
  referralCode: string
): Promise<boolean> {
  const supabase = await getSupabaseClient()

  const { error } = await supabase.from("referrals").insert({
    referrer_id: referrerId,
    referred_user_id: referredUserId,
    referral_code: referralCode,
  })

  if (error) {
    console.error("Error creating referral record:", error)
    return false
  }

  return true
}
