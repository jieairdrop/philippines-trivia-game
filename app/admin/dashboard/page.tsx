import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getAdminStats, getRecentActivity } from "@/lib/db-helpers"
import AdminDashboardClient from "@/components/admin-dashboard-client"

async function getAdminData() {
  try {
    const [stats, activity] = await Promise.all([getAdminStats(), getRecentActivity(10)])
    return { stats, activity }
  } catch (error) {
    console.error("Error fetching admin data:", error)
    return { stats: null, activity: [] }
  }
}

export default async function AdminDashboard() {
  const supabase = await createClient()

  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData.user) {
    redirect("/admin/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, first_name, last_name")
    .eq("id", authData.user.id)
    .single()

  if (profile?.role !== "admin") {
    redirect("/")
  }

  const { stats, activity } = await getAdminData()

  return (
    <AdminDashboardClient
      stats={stats}
      activity={activity}
      userEmail={authData.user.email || ""}
      adminName={`${profile?.first_name} ${profile?.last_name}`}
    />
  )
}
