// app/admin/withdrawals/page.tsx
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "@/components/admin/withdrawal-columns"
import { getWithdrawals } from "@/lib/actions/admin/withdrawals"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import AdminWithdrawalsClient from "@/components/admin/admin-withdrawals-client"

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
    <AdminWithdrawalsClient
      withdrawals={withdrawals}
      userEmail={user?.email || ''}
      adminName={adminName}
      userId={user?.id}
      profileRole={profile?.role}
    />
  )
}