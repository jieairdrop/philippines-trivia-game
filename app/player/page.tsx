"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Play, BarChart3, Users, LogOut, Loader2, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"

interface Profile {
  id: string
  first_name: string
  last_name: string
  email: string
  // Add more fields if available, e.g., avatar_url: string
}

interface LeaderboardEntry {
  player_name: string
  total_points: number
  accuracy_percentage: number
}

export default function PlayerHome() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const getData = async () => {
      const supabase = createClient()

      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData.user) {
        setError("Authentication failed. Redirecting to login...")
        router.push("/player/login")
        return
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userData.user.id)
        .single()

      if (profileError) {
        console.error("[v0] Error fetching profile:", profileError)
        setError("Failed to load profile. Redirecting to login...")
        router.push("/player/login")
        return
      }

      setProfile(profileData)

      // Fetch leaderboard from server API (bypasses RLS, matches dashboard)
      try {
        const response = await fetch("/api/leaderboard?limit=10")
        if (!response.ok) throw new Error("Failed to fetch leaderboard")
        const { data: leaderboardData } = await response.json()

        const mappedData = (leaderboardData || []).map((entry: any) => ({
          player_name: entry.player_name || entry.email || 'Anonymous',  // Use name if available, fallback to email
          total_points: Number(entry.total_points) || 0,
          accuracy_percentage: Number(entry.accuracy_percentage) || 0
        }))
        setLeaderboard(mappedData)
        console.log('Leaderboard fetched:', mappedData)  // Debug: Verify 5+ entries in console
      } catch (lbError) {
        console.error("Error fetching leaderboard:", lbError)
        setLeaderboard([])
      }

      setLoading(false)
    }

    getData()
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Logout error:", error)
    }
    router.push("/player/login")
  }

  const handleCardClick = (path: string) => {
    router.push(path)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
        {/* Glow Orbs */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>

        {/* Spinner */}
        <div className="relative flex flex-col items-center space-y-4 z-10">
          <div className="h-14 w-14 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-slate-300 text-sm animate-pulse tracking-wide">
            Loading your profile...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6 text-center text-slate-400">
            {error}
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        {/* Enhanced Header with Prominent Logout */}
        <div className="flex justify-between items-center mb-12">
          <div className="animate-fade-in">
            <h1 className="text-4xl font-bold text-white mb-2">
              Welcome back, <span className="text-accent">{profile?.first_name} {profile?.last_name}</span>
            </h1>
            <p className="text-slate-400">Ready to test your knowledge?</p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 border-red-600 text-white shadow-md hover:shadow-red-500/20 transition-all duration-300 font-medium"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4 text-white" />
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card
            className={cn(
              "bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm hover:border-primary/50 cursor-pointer transition-all duration-300 transform hover:scale-105 group",
              "relative overflow-hidden shadow-lg hover:shadow-primary/20"
            )}
            onClick={() => handleCardClick("/player/categories")}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent -z-10" />
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/20 rounded-xl group-hover:bg-primary/30 transition-all duration-300">
                  <Play className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-white text-xl mb-1">Play Now</CardTitle>
                  <p className="text-xs text-slate-500">Quick start</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-slate-400 text-sm leading-relaxed">Start a new trivia game and challenge yourself with exciting questions.</p>
            </CardContent>
          </Card>

          <Card
            className={cn(
              "bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm hover:border-accent/50 cursor-pointer transition-all duration-300 transform hover:scale-105 group",
              "relative overflow-hidden shadow-lg hover:shadow-accent/20"
            )}
            onClick={() => handleCardClick("/player/dashboard")}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-accent/10 to-transparent -z-10" />
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-accent/20 rounded-xl group-hover:bg-accent/30 transition-all duration-300">
                  <BarChart3 className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-white text-xl mb-1">Dashboard</CardTitle>
                  <p className="text-xs text-slate-500">Your stats</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-slate-400 text-sm leading-relaxed">View your stats, progress, and achievements to track your trivia mastery.</p>
            </CardContent>
          </Card>

          <Card
            className={cn(
              "bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm hover:border-secondary/50 cursor-pointer transition-all duration-300 transform hover:scale-105 group",
              "relative overflow-hidden shadow-lg hover:shadow-secondary/20"
            )}
            onClick={() => handleCardClick("/player/referrals")}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-secondary/10 to-transparent -z-10" />
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-secondary/20 rounded-xl group-hover:bg-secondary/30 transition-all duration-300">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white text-xl mb-1">Referrals</CardTitle>
                  <p className="text-xs text-slate-500">Share & earn</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-slate-400 text-sm leading-relaxed">Invite friends to join and earn exclusive rewards for every successful referral.</p>
            </CardContent>
          </Card>
        </div>

        <Button
          onClick={() => handleCardClick("/player/categories")}
          className="w-full bg-primary hover:bg-primary/90 text-white h-14 font-semibold text-lg shadow-xl hover:shadow-primary/30 transition-all duration-300 flex items-center justify-center gap-2 mb-8"
          aria-label="Start playing trivia game"
        >
          <Play className="h-5 w-5" />
          Start Playing Now
        </Button>

        {/* Leaderboard Section */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Top Players Leaderboard
            </CardTitle>
            <CardDescription className="text-slate-400">See who's leading the trivia challenge</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {leaderboard && leaderboard.length > 0 ? (
                leaderboard.map((entry, idx) => (
                  <div
                    key={entry.player_name}
                    className="flex justify-between items-center bg-gradient-to-r from-slate-700/30 to-transparent p-3 rounded-lg border border-slate-700/50 hover:border-primary/50 hover:bg-slate-700/50 transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-bold w-6 group-hover:scale-110 transition-transform">
                        #{idx + 1}
                      </span>
                      <span className="text-white group-hover:text-accent transition-colors">{entry.player_name}</span>
                    </div>
                    <div className="text-right">
                      <p className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-bold">
                        {entry.total_points} pts
                      </p>
                      <p className="text-slate-400 text-sm">{entry.accuracy_percentage}% accuracy</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400">No leaderboard data yet. Play some games to appear on the leaderboard!</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </main>
  )
}
