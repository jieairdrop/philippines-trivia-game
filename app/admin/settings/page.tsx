"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, ChevronDown, LayoutDashboard, LogOut, Settings, Database, Users2, FolderOpen, HelpCircle, List, Target, Gift, Wallet2, Award } from "lucide-react"

interface AdminProfile {
  id: string
  first_name: string
  last_name: string
  email: string
}

export default function AdminSettings() {
  const router = useRouter()
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
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
    const getProfile = async () => {
      const supabase = createClient()

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
      setProfile(profileData)
      setLoading(false)
    }

    getProfile()
  }, [router])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setUpdating(true)
    setError("")
    setSuccess("")

    const supabase = createClient()
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: profile.first_name.trim(),
        last_name: profile.last_name.trim()
      })
      .eq("id", profile.id)

    if (error) {
      setError(error.message)
    } else {
      setSuccess("Profile updated successfully!")
      setTimeout(() => setSuccess(""), 3000)
    }

    setUpdating(false)
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/admin/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-slate-300">Loading...</div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-slate-300">Profile not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
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
                Admin Settings
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
                      <Target className="w-4 h-4 text-orange-400 group-hover:text-orange-300 transition-colors" />
                      Attempts
                    </button>
                  </Link>

                  <Link href="/admin/manage/referrals">
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-pink-950/50 transition-all duration-200 text-sm font-medium group">
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
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white bg-slate-800/50 transition-all duration-200 text-sm font-medium group">
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
      <main className="max-w-2xl mx-auto px-4 py-12 relative z-10">
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

        <h1 className="text-3xl font-bold text-white mb-8">Admin Settings</h1>

        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm mb-6">
          <CardHeader>
            <CardTitle className="text-white">Admin Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name" className="text-slate-300">First Name</Label>
                  <Input
                    id="first_name"
                    value={profile.first_name || ""}
                    onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name" className="text-slate-300">Last Name</Label>
                  <Input
                    id="last_name"
                    value={profile.last_name || ""}
                    onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Last name"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email" className="text-slate-300">Email</Label>
                <Input
                  id="email"
                  value={profile.email}
                  disabled
                  className="bg-slate-700/50 border-slate-600 text-slate-400"
                />
                <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
              </div>
              <div>
                <Label className="text-slate-300">Role</Label>
                <p className="text-white font-semibold mt-1">Administrator</p>
                <p className="text-xs text-slate-500 mt-1">Role cannot be changed</p>
              </div>
              <Button type="submit" className="w-full" disabled={updating}>
                {updating ? "Updating..." : "Update Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm mb-6">
          <CardHeader>
            <CardTitle className="text-white">Password Change</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-400">To change your password, use the "Forgot Password" feature on the login page or contact support.</p>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button
            onClick={() => router.push("/admin/")}
            className="w-full bg-secondary hover:bg-secondary/90 text-white h-12"
          >
            Back to Dashboard
          </Button>
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="w-full h-12"
          >
            Logout
          </Button>
        </div>
      </main>
    </div>
  )
}