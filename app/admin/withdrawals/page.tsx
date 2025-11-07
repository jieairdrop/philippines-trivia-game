// app/admin/withdrawals/page.tsx (updated to use regular client for own profile fetch, avoiding service role for auth check)
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "@/components/admin/withdrawal-columns"
import { getWithdrawals } from "@/lib/actions/admin/withdrawals"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export const dynamic = 'force-dynamic'

export default async function AdminWithdrawalsPage() {
  let user
  let profile
  try {
    const supabase = await createClient()
    const { data: { user: u } } = await supabase.auth.getUser()
    user = u

    if (!user) {
      console.log('No user authenticated, redirecting to login')
      redirect("/admin/login")
    }

    // Use regular client for own profile fetch (RLS allows self-access)
    const { data: p, error: profileError } = await supabase
      .from("profiles")
      .select("role, first_name, last_name")
      .eq("id", user.id)
      .single()

    console.log('Profile fetch result:', { data: p, error: profileError })

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      // If RLS or other issue, fallback to admin client
      try {
        const adminSupabase = createAdminClient()
        const { data: fallbackP, error: fallbackError } = await adminSupabase
          .from("profiles")
          .select("role, first_name, last_name")
          .eq("id", user.id)
          .single()
        if (fallbackError) {
          console.error('Admin fallback profile error:', fallbackError)
          throw new Error(`Profile fetch failed: ${fallbackError.message}`)
        }
        profile = fallbackP
      } catch (fallbackCatch) {
        console.error('Admin fallback catch:', fallbackCatch)
        throw new Error('Unable to fetch admin profile')
      }
    } else if (p?.role !== "admin") {
      console.log('User role not admin:', p?.role)
      redirect("/admin")
    } else {
      profile = p
    }
  } catch (error) {
    console.error('Critical error in admin auth/profile fetch:', error)
    // Log and redirect with details in console
    redirect("/admin")
  }

  let withdrawals = []
  try {
    withdrawals = await getWithdrawals()
  } catch (error) {
    console.error('Error fetching withdrawals:', error)
    withdrawals = []
  }

  // Enhanced Debug Logs
  console.log('User ID:', user?.id)
  console.log('Profile role:', profile?.role)
  console.log('Withdrawals count:', withdrawals.length)
  if (withdrawals.length > 0) {
    console.log('Sample withdrawal ID:', withdrawals[0].id)
  }

  const adminName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || user?.email || 'Admin' : 'Admin'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="bg-gradient-to-r from-slate-800/80 to-blue-900/80 border-b border-slate-700 backdrop-blur-sm py-6 relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Withdrawal Management
            </h1>
            <p className="text-slate-400 text-sm mt-1">{adminName}</p>
          </div>
          <form action="/auth/logout" method="POST">
            <Button
              type="submit"
              variant="outline"
              className="border-slate-600 text-white hover:bg-slate-700 bg-transparent cursor-pointer"
            >
              Logout
            </Button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Withdrawal Requests</CardTitle>
            <CardDescription className="text-slate-400">Review and process player withdrawal requests</CardDescription>
          </CardHeader>
          <CardContent>
            {withdrawals.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400 text-lg mb-2">No withdrawals found.</p>
                <p className="text-slate-500 text-sm mb-4">Check Vercel Function Logs for details on profile or data fetch issues.</p>
                <details className="text-xs text-slate-600 mt-4">
                  <summary>Debug Info</summary>
                  <ul className="mt-2 text-slate-500">
                    <li>User ID: {user?.id || 'N/A'}</li>
                    <li>Profile Role: {profile?.role || 'N/A'}</li>
                    <li>Withdrawals Count: {withdrawals.length}</li>
                  </ul>
                </details>
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
