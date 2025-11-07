import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { generateReferralCode, getReferrerIdByCode, createReferralRecord } from "@/lib/referral-helper"

export async function POST(request: Request) {
  try {
    const { userId, email, firstName, lastName, referralCode } = await request.json()

    if (!userId || !email) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
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

    // Generate unique referral code for new user
    let newReferralCode = await generateReferralCode()
    let codeExists = true
    while (codeExists) {
      const { data } = await supabase.from("profiles").select("id").eq("referral_code", newReferralCode).single()
      if (!data) {
        codeExists = false
      } else {
        newReferralCode = await generateReferralCode()
      }
    }

    // Check if referral code is valid and get referrer ID
    let referrerId = null
    if (referralCode) {
      referrerId = await getReferrerIdByCode(referralCode)
    }

    // Create or update profile
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: userId,
        email,
        first_name: firstName,
        last_name: lastName,
        referral_code: newReferralCode,
        referred_by_code: referralCode || null,
        role: "player",
      },
      { onConflict: "id" },
    )

    if (profileError) {
      console.log("[v0] Profile creation error:", profileError)
      return Response.json({ error: "Failed to create profile" }, { status: 500 })
    }

    // Create referral record if referral code was provided and valid
    if (referrerId) {
      await createReferralRecord(referrerId, userId, referralCode)
    }

    return Response.json({ success: true, referralCode: newReferralCode })
  } catch (error) {
    console.log("[v0] Sign-up route error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
