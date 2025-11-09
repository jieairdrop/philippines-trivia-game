"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, RefreshCw, Search, ArrowLeft, Users, Gift, CheckCircle, XCircle, Pencil, Trash2, ChevronDown, LayoutDashboard, Users2, LogOut, Database, HelpCircle, FolderOpen, List, Award, Settings, Wallet2 } from "lucide-react"

interface Referral {
  id: string
  referrer_id: string
  referred_user_id: string
  referral_code: string
  bonus_points_awarded: number
  is_rewarded: boolean
  created_at: string
  referrer?: {
    first_name: string
    last_name: string
    email: string
  }
  referred_user?: {
    first_name: string
    last_name: string
    email: string
  }
}

interface ReferralStats {
  totalReferrals: number
  rewardedReferrals: number
  pendingReferrals: number
  totalPointsAwarded: number
  topReferrers: { name: string; count: number }[]
}

export default function ReferralsManagementPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [filteredReferrals, setFilteredReferrals] = useState<Referral[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    rewardedReferrals: 0,
    pendingReferrals: 0,
    totalPointsAwarded: 0,
    topReferrers: []
  })
  
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentItem, setCurrentItem] = useState<Referral | null>(null)
  const [formData, setFormData] = useState<any>({})
  
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Header states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Header user data
  const [userEmail, setUserEmail] = useState("")
  const [adminName, setAdminName] = useState("")

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    return email?.substring(0, 2).toUpperCase() || "AD"
  }

  useEffect(() => {
    checkAuthAndFetch()
  }, [])

  useEffect(() => {
    filterReferrals()
    calculateStats()
  }, [searchTerm, filterStatus, referrals])

  const checkAuthAndFetch = async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      router.push("/admin/login")
      return
    }

    setUserEmail(userData.user.email || "")

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userData.user.id)
      .eq("role", "admin")
      .single()

    if (profileError || !profileData) {
      router.push("/admin/login")
      return
    }

    setAdminName(`${profileData.first_name || ""} ${profileData.last_name || ""}`.trim() || userData.user.email || "")

    await fetchReferrals()
    setLoading(false)
  }

  const fetchReferrals = async () => {
    setError("")
    try {
      const { data: referralsData, error: referralsError } = await supabase
        .from("referrals")
        .select("*")
        .order("created_at", { ascending: false })

      if (referralsError) throw referralsError

      // Fetch referrer data
      const referrerIds = [...new Set(referralsData?.map(r => r.referrer_id) || [])]
      const { data: referrersData } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .in("id", referrerIds)

      // Fetch referred user data
      const referredIds = [...new Set(referralsData?.map(r => r.referred_user_id) || [])]
      const { data: referredData } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .in("id", referredIds)

      const enrichedReferrals = referralsData?.map(referral => ({
        ...referral,
        referrer: referrersData?.find(u => u.id === referral.referrer_id),
        referred_user: referredData?.find(u => u.id === referral.referred_user_id)
      })) || []

      setReferrals(enrichedReferrals)
    } catch (err: any) {
      setError(err.message || "Failed to fetch referrals")
    }
  }

  const filterReferrals = () => {
    let filtered = referrals

    if (filterStatus === "rewarded") {
      filtered = filtered.filter(r => r.is_rewarded)
    } else if (filterStatus === "pending") {
      filtered = filtered.filter(r => !r.is_rewarded)
    }

    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.referrer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.referrer?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.referrer?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.referred_user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.referred_user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.referred_user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.referral_code?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredReferrals(filtered)
  }

  const calculateStats = () => {
    const totalReferrals = filteredReferrals.length
    const rewardedReferrals = filteredReferrals.filter(r => r.is_rewarded).length
    const pendingReferrals = totalReferrals - rewardedReferrals
    const totalPointsAwarded = filteredReferrals
      .filter(r => r.is_rewarded)
      .reduce((sum, r) => sum + r.bonus_points_awarded, 0)

    // Calculate top referrers
    const referrerCounts = new Map<string, { name: string; count: number }>()
    referrals.forEach(r => {
      if (r.referrer) {
        const name = `${r.referrer.first_name} ${r.referrer.last_name}`
        const existing = referrerCounts.get(r.referrer_id)
        if (existing) {
          existing.count++
        } else {
          referrerCounts.set(r.referrer_id, { name, count: 1 })
        }
      }
    })

    const topReferrers = Array.from(referrerCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    setStats({ totalReferrals, rewardedReferrals, pendingReferrals, totalPointsAwarded, topReferrers })
  }

  const openDialog = (item: Referral | null = null) => {
    setCurrentItem(item)
    setEditMode(!!item)
    setFormData(item || { is_rewarded: false, bonus_points_awarded: 100 })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setError("")
    setSuccess("")
    
    try {
      if (editMode && currentItem) {
        const { error } = await supabase
          .from("referrals")
          .update({
            bonus_points_awarded: formData.bonus_points_awarded,
            is_rewarded: formData.is_rewarded
          })
          .eq("id", currentItem.id)

        if (error) throw error
        setSuccess("Referral updated successfully")
      }
      
      setDialogOpen(false)
      await fetchReferrals()
    } catch (err: any) {
      setError(err.message || "Failed to save referral")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this referral?")) return

    setError("")
    setSuccess("")
    
    try {
      const { error } = await supabase.from("referrals").delete().eq("id", id)
      if (error) throw error
      
      setSuccess("Referral deleted successfully")
      await fetchReferrals()
    } catch (err: any) {
      setError(err.message || "Failed to delete referral")
    }
  }

  const toggleRewardStatus = async (referral: Referral) => {
    try {
      const { error } = await supabase
        .from("referrals")
        .update({ is_rewarded: !referral.is_rewarded })
        .eq("id", referral.id)

      if (error) throw error
      setSuccess(`Referral ${referral.is_rewarded ? 'unrewarded' : 'rewarded'} successfully`)
      await fetchReferrals()
    } catch (err: any) {
      setError("Failed to update reward status")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-slate-300">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-[32rem] h-[32rem] bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900/95 to-blue-900/95 border-b border-slate-800/50 backdrop-blur-xl shadow-2xl py-6 sticky top-0 z-50">
        <div className="max-w-[90rem] mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Referrals Management
              </h1>
              <p className="text-slate-400 text-sm mt-0.5 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                {adminName || userEmail}
              </p>
            </div>
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-700/50 hover:border-slate-600/50 hover:bg-slate-800/70 transition-all duration-300 shadow-lg"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <span className="text-white font-bold text-sm">{getInitials(adminName, userEmail)}</span>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-white">{adminName || "Admin"}</p>
                <p className="text-xs text-slate-400 truncate max-w-[120px]">{userEmail}</p>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/50 rounded-xl shadow-2xl shadow-slate-950/50 backdrop-blur-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                {/* User Info Section */}
                <div className="px-4 py-3 border-b border-slate-800/50 bg-gradient-to-r from-slate-900/50 to-transparent">
                  <p className="text-sm font-semibold text-white">{adminName || "Administrator"}</p>
                  <p className="text-xs text-slate-400 truncate mt-1">{userEmail}</p>
                </div>

                {/* Main Navigation */}
                <div className="py-2 px-2 space-y-1">
                  <Link href="/admin">
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-blue-950/50 transition-all duration-200 text-sm font-medium group">
                      <LayoutDashboard className="w-4 h-4 text-blue-400 group-hover:text-blue-300 transition-colors" />
                      Admin Home
                    </button>
                  </Link>

                  <Link href="/admin/dashboard">
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-cyan-950/50 transition-all duration-200 text-sm font-medium group">
                      <LayoutDashboard className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
                      Full Dashboard
                    </button>
                  </Link>
                </div>

                {/* Divider */}
                <div className="px-2 py-1">
                  <div className="h-px bg-slate-800/50"></div>
                </div>

                {/* Management Section */}
                <div className="px-2 py-1">
                  <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Management
                  </div>
                </div>

                <div className="py-2 px-2 space-y-1">
                  <Link href="/admin/manage">
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-purple-950/50 transition-all duration-200 text-sm font-medium group">
                      <Database className="w-4 h-4 text-purple-400 group-hover:text-purple-300 transition-colors" />
                      Database Hub
                    </button>
                  </Link>

                  <Link href="/admin/manage/users">
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-blue-950/50 transition-all duration-200 text-sm font-medium group">
                      <Users2 className="w-4 h-4 text-blue-400 group-hover:text-blue-300 transition-colors" />
                      Users
                    </button>
                  </Link>

                  <Link href="/admin/manage/categories">
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-purple-950/50 transition-all duration-200 text-sm font-medium group">
                      <FolderOpen className="w-4 h-4 text-purple-400 group-hover:text-purple-300 transition-colors" />
                      Categories
                    </button>
                  </Link>

                  <Link href="/admin/manage/questions">
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-green-950/50 transition-all duration-200 text-sm font-medium group">
                      <HelpCircle className="w-4 h-4 text-green-400 group-hover:text-green-300 transition-colors" />
                      Questions
                    </button>
                  </Link>

                  <Link href="/admin/manage/options">
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-yellow-950/50 transition-all duration-200 text-sm font-medium group">
                      <List className="w-4 h-4 text-yellow-400 group-hover:text-yellow-300 transition-colors" />
                      Options
                    </button>
                  </Link>

                  <Link href="/admin/manage/attempts">
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-orange-950/50 transition-all duration-200 text-sm font-medium group">
                      <Users className="w-4 h-4 text-orange-400 group-hover:text-orange-300 transition-colors" />
                      Attempts
                    </button>
                  </Link>

                  <Link href="/admin/manage/referrals">
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white bg-pink-950/50 transition-all duration-200 text-sm font-medium group">
                      <Gift className="w-4 h-4 text-pink-400 group-hover:text-pink-300 transition-colors" />
                      Referrals
                    </button>
                  </Link>

                  <Link href="/admin/withdrawals">
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-emerald-950/50 transition-all duration-200 text-sm font-medium group">
                      <Wallet2 className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                      Withdrawals
                    </button>
                  </Link>
                </div>

                {/* Divider */}
                <div className="px-2 py-1">
                  <div className="h-px bg-slate-800/50"></div>
                </div>

                {/* Settings & Logout */}
                <div className="py-2 px-2 space-y-1">
                  <Link href="/admin/settings">
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all duration-200 text-sm font-medium group">
                      <Settings className="w-4 h-4 text-slate-400 group-hover:text-slate-300 transition-colors" />
                      Settings
                    </button>
                  </Link>

                  <form action="/auth/logout" method="POST" className="w-full">
                    <button
                      type="submit"
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-300 hover:text-red-200 hover:bg-red-950/50 transition-all duration-200 text-sm font-medium group"
                    >
                      <LogOut className="w-4 h-4 text-red-400 group-hover:text-red-300 transition-colors" />
                      Logout
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {error && (
          <Alert className="mb-4 bg-red-900/20 border-red-700">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-200">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-900/20 border-green-700">
            <AlertDescription className="text-green-200">{success}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-blue-400" />
                <div className="text-slate-400 text-sm">Total Referrals</div>
              </div>
              <div className="text-3xl font-bold text-white">{stats.totalReferrals}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-900/20 to-green-800/20 border-green-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <div className="text-green-300 text-sm">Rewarded</div>
              </div>
              <div className="text-3xl font-bold text-green-400">{stats.rewardedReferrals}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-900/20 to-yellow-800/20 border-yellow-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-4 w-4 text-yellow-400" />
                <div className="text-yellow-300 text-sm">Pending</div>
              </div>
              <div className="text-3xl font-bold text-yellow-400">{stats.pendingReferrals}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 border-purple-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="h-4 w-4 text-purple-400" />
                <div className="text-purple-300 text-sm">Points Awarded</div>
              </div>
              <div className="text-3xl font-bold text-purple-400">{stats.totalPointsAwarded}</div>
            </CardContent>
          </Card>
        </div>

        {/* Top Referrers */}
        {stats.topReferrers.length > 0 && (
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Top Referrers</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {stats.topReferrers.map((referrer, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold">
                      #{index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{referrer.name}</p>
                      <p className="text-slate-400 text-sm">{referrer.count} referral{referrer.count > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by referrer, referred user, or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === "all" ? "default" : "outline"}
                  onClick={() => setFilterStatus("all")}
                  className={filterStatus === "all" ? "bg-primary" : "bg-slate-700/50 border-slate-600 text-white"}
                >
                  All
                </Button>
                <Button
                  variant={filterStatus === "rewarded" ? "default" : "outline"}
                  onClick={() => setFilterStatus("rewarded")}
                  className={filterStatus === "rewarded" ? "bg-green-600" : "bg-slate-700/50 border-slate-600 text-white"}
                >
                  Rewarded
                </Button>
                <Button
                  variant={filterStatus === "pending" ? "default" : "outline"}
                  onClick={() => setFilterStatus("pending")}
                  className={filterStatus === "pending" ? "bg-yellow-600" : "bg-slate-700/50 border-slate-600 text-white"}
                >
                  Pending
                </Button>
              </div>
              <Button 
                onClick={fetchReferrals} 
                variant="outline" 
                className="bg-slate-700/50 border-slate-600 text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            <div className="mb-4 text-slate-300">
              Showing {filteredReferrals.length} of {referrals.length} referrals
            </div>

            <div className="space-y-3">
              {filteredReferrals.map((referral) => (
                <Card 
                  key={referral.id} 
                  className={`border-l-4 ${
                    referral.is_rewarded 
                      ? 'bg-green-900/10 border-l-green-500' 
                      : 'bg-yellow-900/10 border-l-yellow-500'
                  } border-slate-700`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {referral.is_rewarded ? (
                            <CheckCircle className="h-5 w-5 text-green-400" />
                          ) : (
                            <XCircle className="h-5 w-5 text-yellow-400" />
                          )}
                          <span className={`font-semibold ${
                            referral.is_rewarded ? 'text-green-300' : 'text-yellow-300'
                          }`}>
                            {referral.is_rewarded ? 'Rewarded' : 'Pending'}
                          </span>
                          <span className="text-slate-500">•</span>
                          <span className="text-purple-400 font-semibold">
                            {referral.bonus_points_awarded} pts
                          </span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-400 font-mono text-sm">
                            {referral.referral_code}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                          <div>
                            <p className="text-slate-400 text-sm">Referrer:</p>
                            <p className="text-white">
                              {referral.referrer?.first_name} {referral.referrer?.last_name}
                            </p>
                            <p className="text-slate-400 text-sm">{referral.referrer?.email}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-sm">Referred User:</p>
                            <p className="text-white">
                              {referral.referred_user?.first_name} {referral.referred_user?.last_name}
                            </p>
                            <p className="text-slate-400 text-sm">{referral.referred_user?.email}</p>
                          </div>
                        </div>
                        
                        <p className="text-slate-400 text-sm">
                          Created: {new Date(referral.created_at).toLocaleString()}
                        </p>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          onClick={() => toggleRewardStatus(referral)}
                          className={referral.is_rewarded ? "bg-yellow-600 hover:bg-yellow-700" : "bg-green-600 hover:bg-green-700"}
                        >
                          {referral.is_rewarded ? "Unreward" : "Mark Rewarded"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDialog(referral)}
                          className="bg-slate-700/50 border-slate-600 text-white"
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(referral.id)}
                          className="bg-red-900/20 border-red-700 text-red-300"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredReferrals.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  No referrals found matching your criteria
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Referral</DialogTitle>
            <DialogDescription className="text-slate-400">
              Update referral details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="bonus_points_awarded" className="text-slate-300">Bonus Points</Label>
              <Input
                id="bonus_points_awarded"
                type="number"
                value={formData.bonus_points_awarded || 100}
                onChange={(e) => setFormData({...formData, bonus_points_awarded: parseInt(e.target.value) || 100})}
                className="bg-slate-700 border-slate-600 text-white"
                min="0"
              />
            </div>
            <div className="flex items-center space-x-2 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <Checkbox
                id="is_rewarded"
                checked={formData.is_rewarded ?? false}
                onCheckedChange={(checked) => setFormData({...formData, is_rewarded: checked})}
              />
              <Label htmlFor="is_rewarded" className="text-slate-300 cursor-pointer">
                Mark as rewarded
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(false)} 
              className="bg-slate-700 border-slate-600"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-primary">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}