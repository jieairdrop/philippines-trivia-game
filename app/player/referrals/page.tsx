"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, Gift, Copy, Link as LinkIcon, User } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ReferredUser {
  id: string
  firstName: string
  lastName: string
  createdAt: string
  bonusPoints: number
}

interface ReferralStats {
  referralCode: string
  totalReferrals: number
  totalBonusPoints: number
  referredUsers: ReferredUser[]
}

export default function ReferralsPage() {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [playerProfile, setPlayerProfile] = useState<{ first_name: string; last_name: string } | null>(null)

  useEffect(() => {
    async function fetchReferralStats() {
      try {
        const supabase = createClient()
        const { data: userData, error: userError } = await supabase.auth.getUser()
        if (userError || !userData.user) {
          setError("Please log in to view referrals")
          setLoading(false)
          return
        }

        // Fetch player profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("first_name, last_name, referral_code")
          .eq("id", userData.user.id)
          .single()
        if (profileError) throw new Error("Failed to load profile")

        setPlayerProfile({ first_name: profileData.first_name, last_name: profileData.last_name })

        if (!profileData?.referral_code) {
          setError("You don't have a referral code yet")
          setLoading(false)
          return
        }

        // Fetch referrals
        const { data: referralData, error: referralError } = await supabase
          .from("referrals")
          .select("referred_user_id, bonus_points_awarded, created_at")
          .eq("referrer_id", userData.user.id)
          .order("created_at", { ascending: false })
        if (referralError) throw new Error("Failed to load referrals")

        if (!referralData || referralData.length === 0) {
          setStats({
            referralCode: profileData.referral_code,
            totalReferrals: 0,
            totalBonusPoints: 0,
            referredUsers: [],
          })
          setLoading(false)
          return
        }

        const referredUserIds = referralData.map((r) => r.referred_user_id).filter(Boolean)
        let profilesData: any[] = []

        if (referredUserIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, created_at")
            .in("id", referredUserIds)
          if (profilesError) console.warn("Error fetching referred user profiles:", profilesError)
          else profilesData = profiles || []
        }

        const profilesMap = new Map(profilesData.map((p) => [p.id, p]))

        const referredUsers: ReferredUser[] = referralData.map((r) => {
          const profile = profilesMap.get(r.referred_user_id)
          return {
            id: r.referred_user_id,
            firstName: profile?.first_name || "User",
            lastName: profile?.last_name || "",
            createdAt: profile?.created_at || r.created_at,
            bonusPoints: r.bonus_points_awarded || 0,
          }
        })

        const totalReferrals = referredUsers.length
        const totalBonusPoints = referralData.reduce((sum, r) => sum + (r.bonus_points_awarded || 0), 0)

        setStats({
          referralCode: profileData.referral_code,
          totalReferrals,
          totalBonusPoints,
          referredUsers,
        })
        setError(null)
      } catch (err) {
        console.error("Error fetching referral stats:", err)
        setError(err instanceof Error ? err.message : "Failed to load referral data")
      } finally {
        setLoading(false)
      }
    }
    fetchReferralStats()
  }, [])

  const copyToClipboard = async () => {
    if (!stats?.referralCode) return
    try {
      const referralLink = `${window.location.origin}/player/sign-up?ref=${stats.referralCode}`
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  if (loading) return <Loading />

  const referralLink = `${typeof window !== "undefined" ? window.location.origin : ""}/player/sign-up?ref=${
    stats?.referralCode || ""
  }`

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
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
                <Link href="/player/dashboard" className="cursor-pointer text-slate-300 hover:text-white">
                  Dashboard
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

      {/* Page content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 mt-4">
        {error && (
          <Alert variant="destructive" className="bg-red-900/50 border-red-700">
            <AlertDescription className="text-white">{error}</AlertDescription>
          </Alert>
        )}

        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-accent" />
              Your Referral Program
            </CardTitle>
            <CardDescription className="text-slate-400">
              Share your link and earn bonus points
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {stats?.referralCode && (
              <>
                <div className="space-y-3">
                  <p className="text-slate-300 flex items-center gap-1">
                    <LinkIcon className="w-4 h-4 text-accent" /> Your Referral Link:
                  </p>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 bg-slate-700/50 border border-slate-600 rounded-lg p-4 text-white font-mono text-sm sm:text-base truncate">
                      {referralLink}
                    </div>
                    <Button
                      onClick={copyToClipboard}
                      className="bg-accent hover:bg-accent/90 text-slate-900 font-semibold flex items-center gap-1"
                    >
                      <Copy className="w-4 h-4" />
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-700/30 rounded-lg p-4 text-center">
                    <p className="text-slate-400 text-sm flex justify-center items-center gap-1">
                      <Users className="w-4 h-4 text-accent" /> Total Referrals
                    </p>
                    <p className="text-3xl font-bold text-accent">{stats.totalReferrals}</p>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-4 text-center">
                    <p className="text-slate-400 text-sm flex justify-center items-center gap-1">
                      <Gift className="w-4 h-4 text-primary" /> Bonus Points Earned
                    </p>
                    <p className="text-3xl font-bold text-primary">{stats.totalBonusPoints}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {stats && stats.referredUsers.length > 0 && (
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm mt-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-accent" /> People You've Referred
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.referredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between bg-slate-700/30 rounded-lg p-4"
                  >
                    <div>
                      <p className="text-white font-semibold">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-slate-400 text-sm">
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-accent font-semibold">+{user.bonusPoints} pts</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// ✨ Reusable Loading Component (same as PlayerSettings)
function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Glow Orbs */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>

      {/* Spinner */}
      <div className="relative flex flex-col items-center space-y-4 z-10">
        <div className="h-14 w-14 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-slate-300 text-sm animate-pulse tracking-wide">
          Loading your referrals...
        </p>
      </div>
    </div>
  )
}
