"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface Profile {
  first_name: string
  last_name: string
}

export default function PlayerNav() {
  const router = useRouter()
  const pathname = usePathname()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const getProfile = async () => {
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push("/player/login")
        return
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", userData.user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
      }
    }

    getProfile()
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/player/login")
  }

  const isActive = (path: string) => pathname === path
  const navItems = [
    { label: "Home", href: "/player/page", icon: "🏠" },
    { label: "Play", href: "/player/categories", icon: "🎮" },
    { label: "Dashboard", href: "/player/dashboard", icon: "📊" },
    { label: "Referrals", href: "/player/referrals", icon: "🤝" },
    { label: "Settings", href: "/player/settings", icon: "⚙️" },
  ]

  return (
    <nav className="bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-b border-slate-700 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/player/page" className="text-2xl font-bold text-accent cursor-pointer">
            PH Trivia
          </Link>

          <div className="flex-1 flex justify-center gap-1 mx-4 max-md:hidden">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                  isActive(item.href)
                    ? "bg-primary/20 text-primary border border-primary/50"
                    : "text-slate-300 hover:bg-slate-700/50"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-white text-sm max-md:hidden">
              {profile ? `${profile.first_name} ${profile.last_name}` : "Loading..."}
            </span>
            <Button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white cursor-pointer" size="sm">
              Logout
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className="hidden max-md:block mt-4">
          <div className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1 rounded text-sm transition-all cursor-pointer ${
                  isActive(item.href) ? "bg-primary/20 text-primary" : "text-slate-300 hover:bg-slate-700/50"
                }`}
              >
                {item.icon} {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
