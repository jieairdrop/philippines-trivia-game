"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/admin/dashboard`,
        },
      })

      if (authError) throw authError

      // Refresh session to ensure fresh user data
      const { data: { session } } = await supabase.auth.refreshSession()
      if (!session) throw new Error("Failed to refresh session")

      // Verify user
      const { data: userData, error: userError } = await supabase.auth.getUser()
      console.log('Fetched user:', userData?.user?.id) // Debug: Log user ID
      if (userError || !userData.user) throw new Error("Failed to verify user")

      // Fetch or create profile
      let { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .single()

      console.log('Fetched profile:', profile, 'Error:', profileError) // Debug: Log profile data/error

      // Fallback: Upsert admin profile if missing (remove this block if you don't want auto-creation)
      if (profileError && profileError.code === 'PGRST116') { // No rows returned
        const { error: upsertError } = await supabase
          .from("profiles")
          .upsert({
            id: userData.user.id,
            first_name: email.split('@')[0], // Placeholder; customize as needed
            last_name: '',
            role: 'admin',
            // Add other defaults like email, created_at, etc.
          })
        if (upsertError) throw upsertError

        // Re-fetch after upsert
        ({ data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userData.user.id)
          .single())
      }

      if (profileError) {
        console.error('Profile fetch error details:', profileError) // Debug
        throw new Error("Failed to fetch profile. Check RLS policies.")
      }

      if (profile?.role !== "admin") {
        console.log('Profile role mismatch:', profile?.role) // Debug
        throw new Error(`Role is '${profile?.role}' but must be 'admin' (check case/spelling in DB)`)
      }

      router.push("/admin/dashboard")
    } catch (err) {
      console.error('Login error:', err) // Debug: Full error in console
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setLoading(false)
    }
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
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">PH Trivia</span>
            </div>
          </div>
          <CardTitle className="text-2xl text-white">Admin Panel</CardTitle>
          <CardDescription className="text-slate-400">Administrator access only</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Email Address</label>
              <Input
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-primary/50 focus:ring-primary/20"
                required
              />
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
            </div>
            {error && (
              <div className="bg-red-900/30 border border-red-700/50 text-red-300 text-sm p-3 rounded-lg">{error}</div>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 to-primary/70 text-white font-semibold h-11 transition-all"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-6 pt-6 border-t border-slate-700/50">
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
