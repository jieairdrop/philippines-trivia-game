import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { getPlayerStats, getLeaderboard } from "@/lib/db-helpers"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { User, Star, CheckCircle2, Target, Trophy, Users } from "lucide-react"

async function getPlayerData(userId: string) {
  try {
    const [stats, leaderboard] = await Promise.all([getPlayerStats(userId), getLeaderboard(10)])
    return { stats, leaderboard }
  } catch (error) {
    console.error("[v0] Error fetching player data:", error)
    return { stats: null, leaderboard: [] }
  }
}

async function getTopCategories(userId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("game_attempts")
      .select(`
        id,
        questions (
          category_id,
          categories (
            name,
            icon_emoji,
            color_code
          )
        )
      `)
      .eq("user_id", userId)
      .limit(100)

    if (error) throw error

    const categoryStats: Record<string, { name: string; icon_emoji: string; color_code: string; count: number }> = {}

    data?.forEach((attempt: any) => {
      if (attempt.questions?.categories) {
        const cat = attempt.questions.categories
        if (!categoryStats[cat.name]) {
          categoryStats[cat.name] = {
            name: cat.name,
            icon_emoji: cat.icon_emoji,
            color_code: cat.color_code,
            count: 0,
          }
        }
        categoryStats[cat.name].count++
      }
    })

    return Object.values(categoryStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
  } catch (error) {
    console.error("Error fetching categories:", error)
    return []
  }
}

export default async function PlayerDashboard() {
  const supabase = await createClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData.user) {
    redirect("/player/login")
  }

  const { data: playerProfile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", authData.user.id)
    .single()

  const { stats, leaderboard } = await getPlayerData(authData.user.id)
  const topCategories = await getTopCategories(authData.user.id)

  const userRank =
    leaderboard && leaderboard.length > 0
      ? leaderboard.findIndex(
          (entry) => entry.player_name === `${playerProfile?.first_name} ${playerProfile?.last_name}`,
        ) + 1 || "-"
      : "-"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="bg-gradient-to-r from-slate-800/80 to-blue-900/80 border-b border-slate-700 backdrop-blur-sm py-4 relative z-10">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              PH Trivia
            </h1>
            <p className="text-slate-400 text-sm mt-1 hidden sm:block">
              Welcome back, {playerProfile?.first_name} {playerProfile?.last_name}
            </p>
          </div>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-full hover:bg-slate-700/50 transition-colors">
                <User className="h-6 w-6 text-white" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-800 border border-slate-700 w-44">
              <DropdownMenuLabel className="text-slate-200">
                {playerProfile?.first_name} {playerProfile?.last_name}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem asChild>
                <Link href="/player/referrals" className="cursor-pointer text-slate-300 hover:text-white">
                  Referrals
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/player/settings" className="cursor-pointer text-slate-300 hover:text-white">
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem asChild>
                <form action="/auth/logout" method="POST" className="w-full">
                  <button
                    type="submit"
                    className="text-left w-full text-slate-300 hover:text-red-400 transition-colors"
                  >
                    Logout
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 relative z-10">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <StatCard icon={<Star className="text-yellow-400" />} label="Total Points" value={stats?.totalPoints || 0} />
          <StatCard icon={<CheckCircle2 className="text-green-400" />} label="Questions" value={stats?.totalAttempts || 0} />
          <StatCard icon={<Target className="text-blue-400" />} label="Accuracy" value={`${stats?.accuracy || 0}%`} />
          <StatCard icon={<Trophy className="text-orange-400" />} label="Rank" value={`#${userRank}`} />
          <div className="hidden md:block">
            <StatCard icon={<Users className="text-purple-400" />} label="Referrals" value={stats?.totalReferrals || 0} />
          </div>
        </div>

        {topCategories.length > 0 && (
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Your Top Categories
              </CardTitle>
              <CardDescription className="text-slate-400">Your most played trivia categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topCategories.map((category, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 bg-gradient-to-r from-slate-700/30 to-transparent p-4 rounded-lg border border-slate-700/50 hover:border-primary/30 transition"
                  >
                    <span className="text-2xl">{category.icon_emoji}</span>
                    <div className="flex-1">
                      <p className="text-white font-semibold">{category.name}</p>
                      <p className="text-slate-400 text-sm">{category.count} attempts</p>
                    </div>
                    <div className="w-2 h-8 rounded" style={{ backgroundColor: category.color_code }}></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link href="/player/categories">
            <Button className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold h-12 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5">
              Choose Category & Play
            </Button>
          </Link>
          <Link href="/player/game">
            <Button className="w-full bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-slate-900 font-semibold h-12 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5">
              Quick Play (Random)
            </Button>
          </Link>
        </div>

        {/* Leaderboard */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" /> Top Players
            </CardTitle>
            <CardDescription className="text-slate-400">Global leaderboard</CardDescription>
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
      </main>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
          {icon} {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {value}
        </div>
      </CardContent>
    </Card>
  )
}
