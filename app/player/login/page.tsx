"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function PlayerLogin() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          // User is already logged in, redirect to player page
          router.push("/player")
        }
      } catch (err) {
        console.error("Auth check error:", err)
      } finally {
        setChecking(false)
      }
    }

    checkAuth()
  }, [router])

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
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/player`,
        },
      })

      if (authError) throw authError

      router.push("/player")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setLoading(false)
    }
  }

  // Show loading state while checking authentication
  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
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
          <CardTitle className="text-2xl text-white">Welcome Back</CardTitle>
          <CardDescription className="text-slate-400">Sign in to continue playing</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
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
          <div className="mt-6 pt-6 border-t border-slate-700/50 space-y-3">
            <p className="text-center text-slate-400 text-sm">
              Don't have an account?{" "}
              <Link href="/player/sign-up" className="text-accent hover:text-accent/80 font-semibold transition">
                Create one
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