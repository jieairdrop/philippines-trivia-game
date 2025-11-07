import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { User, Wallet, TrendingUp, ArrowDownCircle, DollarSign } from "lucide-react"
import WithdrawalForm from "@/components/withdrawal-form"
import WithdrawalHistory from "@/components/withdrawal-history"

export const dynamic = 'force-dynamic';  // New: Prevents caching for fresh data

async function getWithdrawalData(userId: string) {
  try {
    const supabase = await createClient()
    
    // Fetch user withdrawal stats
    const { data: stats, error: statsError } = await supabase
      .from('user_withdrawal_stats')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (statsError) {
      console.error('Error fetching stats:', statsError)
    }

    // Fetch withdrawal history
    const { data: withdrawals, error: withdrawalsError } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', userId)
      .order('requested_at', { ascending: false })
    
    if (withdrawalsError) {
      console.error('Error fetching withdrawals:', withdrawalsError)
    }

    return {
      stats: stats || {
        total_points_earned: 0,
        total_points_used: 0,
        available_points: 0,
        total_amount_withdrawn: 0,
        total_withdrawals_completed: 0
      },
      withdrawals: withdrawals || []
    }
  } catch (error) {
    console.error('Error fetching withdrawal data:', error)
    return {
      stats: {
        total_points_earned: 0,
        total_points_used: 0,
        available_points: 0,
        total_amount_withdrawn: 0,
        total_withdrawals_completed: 0
      },
      withdrawals: []
    }
  }
}

export default async function WithdrawalPage() {
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

  const { stats, withdrawals } = await getWithdrawalData(authData.user.id)

  // Conversion rate: 100 points = ₱1.00
  const POINTS_TO_PHP_RATE = 100
  const availableInPHP = (stats.available_points / POINTS_TO_PHP_RATE).toFixed(2)
  const totalEarningsInPHP = (stats.total_points_earned / POINTS_TO_PHP_RATE).toFixed(2)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="bg-gradient-to-r from-slate-800/80 to-blue-900/80 border-b border-slate-700 backdrop-blur-sm py-4 relative z-10">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <div>
            <Link href="/player/dashboard">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity">
                PH Trivia
              </h1>
            </Link>
            <p className="text-slate-400 text-sm mt-1 hidden sm:block">
              Withdrawal Center - {playerProfile?.first_name} {playerProfile?.last_name}
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
                <Link href="/player/dashboard" className="cursor-pointer text-slate-300 hover:text-white">
                  Dashboard
                </Link>
              </DropdownMenuItem>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            icon={<Wallet className="text-purple-400" />} 
            label="Total Points" 
            value={stats.total_points_earned.toLocaleString()} 
            subtitle="All-time earned"
          />
          <StatCard 
            icon={<TrendingUp className="text-green-400" />} 
            label="Available Points" 
            value={stats.available_points.toLocaleString()} 
            subtitle={`≈ ₱${availableInPHP}`}
          />
          <StatCard 
            icon={<DollarSign className="text-blue-400" />} 
            label="Total Earnings" 
            value={`₱${totalEarningsInPHP}`} 
            subtitle="Lifetime earnings"
          />
          <StatCard 
            icon={<ArrowDownCircle className="text-orange-400" />} 
            label="Total Withdrawn" 
            value={`₱${stats.total_amount_withdrawn.toFixed(2)}`} 
            subtitle={`${stats.total_withdrawals_completed || 0} withdrawals`}
          />
        </div>

        {/* Withdrawal Form and History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Withdrawal Form */}
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" />
                Request Withdrawal
              </CardTitle>
              <CardDescription className="text-slate-400">
                Convert your points to cash
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WithdrawalForm 
                availablePoints={stats.available_points}
                userId={authData.user.id}
              />
            </CardContent>
          </Card>

          {/* Withdrawal History */}
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <ArrowDownCircle className="w-5 h-5 text-accent" />
                Withdrawal History
              </CardTitle>
              <CardDescription className="text-slate-400">
                Track your withdrawal requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WithdrawalHistory withdrawals={withdrawals} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

function StatCard({ 
  icon, 
  label, 
  value, 
  subtitle 
}: { 
  icon: React.ReactNode
  label: string
  value: string | number
  subtitle?: string 
}) {
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
        {subtitle && (
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}
