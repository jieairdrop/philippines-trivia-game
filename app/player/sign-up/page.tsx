"use client"

import React, { useEffect, useState, type FormEvent, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

// 👇 Split into two components to fully fix the warning
function PlayerSignUpInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [referralCode, setReferralCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const supabase = createClient()

  // Auto-fill referral code from URL (?ref=ABC12345)
  useEffect(() => {
    const refFromUrl = searchParams.get("ref")
    if (refFromUrl && !referralCode) {
      setReferralCode(refFromUrl.toUpperCase())
    }
  }, [searchParams, referralCode])

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault()
    setError("")

    if (!firstName.trim() || !lastName.trim()) {
      setError("First and last names are required")
      return
    }

    if (!email.trim()) {
      setError("Email is required")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setLoading(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
            `${window.location.origin}/player/dashboard`,
          data: {
            role: "player",
            first_name: firstName.trim(),
            last_name: lastName.trim(),
          },
        },
      })

      if (authError) throw authError
      if (!authData?.user) throw new Error("No user data returned from authentication provider")

      const profileResponse = await fetch("/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: authData.user.id,
          email,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          referralCode: referralCode.trim() || null,
        }),
      })

      if (!profileResponse.ok) {
        let resultText = "Failed to create profile"
        try {
          const json = await profileResponse.json()
          if (json?.message) resultText = json.message
        } catch {}
        throw new Error(resultText)
      }

      if (referralCode.trim()) {
        try {
          const claimResp = await fetch("/api/referrals/claim", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              newUserId: authData.user.id,
              referralCode: referralCode.trim(),
            }),
          })

          if (!claimResp.ok) {
            let msg = "Referral code couldn't be applied"
            try {
              const j = await claimResp.json()
              if (j?.message) msg = j.message
            } catch {}
            console.warn("Referral claim failed:", msg)
          }
        } catch (err) {
          console.warn("Error claiming referral:", err)
        }
      }

      setSubmitted(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes("already registered") || msg.includes("duplicate")) {
        setError("An account with that email already exists. Try logging in instead.")
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
        </div>

        <Card className="w-full max-w-md bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700 backdrop-blur-sm relative z-10">
          <CardHeader className="space-y-3 text-center">
            <div className="flex justify-center text-4xl mb-2">✓</div>
            <CardTitle className="text-2xl text-white">Check Your Email</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-slate-300">We've sent a confirmation link to</p>
            <p className="text-accent font-semibold">{email}</p>
            <p className="text-slate-400 text-sm">
              Click the link in your email to verify your account and start playing
            </p>
            <Link href="/">
              <Button className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 to-primary/70 text-white font-semibold h-11">
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      <Card className="w-full max-w-md bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700 backdrop-blur-sm relative z-10">
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center mb-2">
            <div className="text-4xl font-bold">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                PH Trivia
              </span>
            </div>
          </div>
          <CardTitle className="text-2xl text-white">Create Account</CardTitle>
          <CardDescription className="text-slate-400">
            Join the Philippines trivia community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">First Name</label>
                <Input
                  type="text"
                  placeholder="Juan"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-primary/50 focus:ring-primary/20"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Last Name</label>
                <Input
                  type="text"
                  placeholder="Dela Cruz"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-primary/50 focus:ring-primary/20"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Email Address</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-primary/50 focus:ring-primary/20"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Referral Code (Optional)</label>
              <Input
                type="text"
                placeholder="e.g., ABC12345"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-primary/50 focus:ring-primary/20"
              />
              <p className="text-xs text-slate-500">
                Enter a friend's referral code to earn bonus points
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-primary/50 focus:ring-primary/20"
                required
              />
              <p className="text-xs text-slate-500">At least 8 characters</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Confirm Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-primary/50 focus:ring-primary/20"
                required
              />
            </div>
            {error && (
              <div className="bg-red-900/30 border border-red-700/50 text-red-300 text-sm p-3 rounded-lg">
                {error}
              </div>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 to-accent/70 text-slate-900 font-semibold h-11 transition-all"
            >
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
          <div className="mt-6 pt-6 border-t border-slate-700/50 space-y-3">
            <p className="text-center text-slate-400 text-sm">
              Already have an account?{" "}
              <Link href="/player/login" className="text-accent hover:text-accent/80 font-semibold transition">
                Sign in
              </Link>
            </p>
            <Link href="/" className="block">
              <Button variant="ghost" className="w-full text-slate-400 hover:text-slate-300 hover:bg-slate-700/50">
                Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ✅ Outer wrapper ensures useSearchParams runs inside a Suspense boundary
export default function PlayerSignUp() {
  return (
    <Suspense fallback={<div className="text-center text-slate-400 py-10">Loading...</div>}>
      <PlayerSignUpInner />
    </Suspense>
  )
}
