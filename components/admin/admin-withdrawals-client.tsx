"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "@/components/admin/withdrawal-columns"
import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import {
  Award,
  Settings,
  LayoutDashboard,
  Users2,
  LogOut,
  ChevronDown,
  Wallet2,
  Database,
  HelpCircle,
  FolderOpen,
  List,
  Gift,
  Target,
} from "lucide-react"

interface AdminWithdrawalsClientProps {
  withdrawals: any[]
  userEmail: string
  adminName?: string
  userId?: string
  profileRole?: string
}

export default function AdminWithdrawalsClient({
  withdrawals,
  userEmail,
  adminName,
  userId,
  profileRole,
}: AdminWithdrawalsClientProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Wallet2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Withdrawal Management
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
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
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
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-emerald-950/70 border border-emerald-800/30 text-emerald-200 hover:text-white hover:bg-emerald-900/70 transition-all duration-200 text-sm font-medium group">
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
      <main className="max-w-[90rem] mx-auto px-6 py-8 relative z-10">
        <Card className="bg-gradient-to-br from-slate-900/60 to-slate-950/60 border-slate-800/40 backdrop-blur-sm shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white text-xl">Withdrawal Requests</CardTitle>
            <CardDescription className="text-slate-400">Review and process player withdrawal requests</CardDescription>
          </CardHeader>
          <CardContent>
            {withdrawals.length === 0 ? (
              <div className="text-center py-12">
                <Wallet2 className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-400 text-lg font-medium mb-2">No withdrawals found.</p>
                <p className="text-slate-500 text-sm mb-4">No withdrawal requests are currently at this time.</p>
              </div>
            ) : (
              <DataTable columns={columns} data={withdrawals} />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}