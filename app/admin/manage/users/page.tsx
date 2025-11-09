"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Plus, Pencil, Trash2, RefreshCw, Search, ArrowLeft } from "lucide-react"

interface Profile {
  id: string
  email: string
  role: string
  first_name: string
  last_name: string
  referral_code: string
  referred_by_code: string
  referral_bonus_points: number
  created_at: string
}

export default function UsersManagementPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentItem, setCurrentItem] = useState<Profile | null>(null)
  const [formData, setFormData] = useState<any>({})
  
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    checkAuthAndFetch()
  }, [])

  useEffect(() => {
    filterProfiles()
  }, [searchTerm, roleFilter, profiles])

  const checkAuthAndFetch = async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      router.push("/admin/login")
      return
    }

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

    await fetchProfiles()
    setLoading(false)
  }

  const fetchProfiles = async () => {
    setError("")
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setProfiles(data || [])
    } catch (err: any) {
      setError(err.message || "Failed to fetch users")
    }
  }

  const filterProfiles = () => {
    let filtered = profiles

    if (roleFilter !== "all") {
      filtered = filtered.filter(p => p.role === roleFilter)
    }

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.referral_code?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredProfiles(filtered)
  }

  const openDialog = (item: Profile | null = null) => {
    setCurrentItem(item)
    setEditMode(!!item)
    setFormData(item || { role: "player", referral_bonus_points: 0 })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setError("")
    setSuccess("")
    
    try {
      if (editMode && currentItem) {
        const { error } = await supabase
          .from("profiles")
          .update({
            first_name: formData.first_name,
            last_name: formData.last_name,
            role: formData.role,
            referral_bonus_points: formData.referral_bonus_points
          })
          .eq("id", currentItem.id)

        if (error) throw error
        setSuccess("User updated successfully")
      }
      
      setDialogOpen(false)
      await fetchProfiles()
    } catch (err: any) {
      setError(err.message || "Failed to save user")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user? This will also delete all their game data.")) return

    setError("")
    setSuccess("")
    
    try {
      const { error } = await supabase.from("profiles").delete().eq("id", id)
      if (error) throw error
      
      setSuccess("User deleted successfully")
      await fetchProfiles()
    } catch (err: any) {
      setError(err.message || "Failed to delete user")
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
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Users Management</h1>
            <p className="text-slate-400">Manage user accounts and profiles</p>
          </div>
          <Button 
            onClick={() => router.push("/admin/dashboard")} 
            variant="outline" 
            className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

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

        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by name, email, or referral code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-48 bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="player">Players</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={fetchProfiles} 
                variant="outline" 
                className="bg-slate-700/50 border-slate-600 text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            <div className="mb-4 text-slate-300">
              Showing {filteredProfiles.length} of {profiles.length} users
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-700">
                  <tr>
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">Email</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">Name</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">Role</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">Referral Code</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">Bonus Points</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">Created</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProfiles.map((profile) => (
                    <tr key={profile.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                      <td className="py-3 px-4 text-slate-200">{profile.email}</td>
                      <td className="py-3 px-4 text-slate-200">
                        {profile.first_name || profile.last_name 
                          ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
                          : "-"}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          profile.role === 'admin' 
                            ? 'bg-red-900/30 text-red-300' 
                            : 'bg-blue-900/30 text-blue-300'
                        }`}>
                          {profile.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-200 font-mono text-sm">
                        {profile.referral_code || "-"}
                      </td>
                      <td className="py-3 px-4 text-slate-200">
                        {profile.referral_bonus_points}
                      </td>
                      <td className="py-3 px-4 text-slate-200">
                        {new Date(profile.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openDialog(profile)}
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 h-8 w-8 p-0"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(profile.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredProfiles.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  No users found matching your criteria
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription className="text-slate-400">
              Update user profile information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input
                id="email"
                value={formData.email || ""}
                disabled
                className="bg-slate-700/50 border-slate-600 text-slate-400"
              />
              <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <Label htmlFor="first_name" className="text-slate-300">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name || ""}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="last_name" className="text-slate-300">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name || ""}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="role" className="text-slate-300">Role</Label>
              <Select 
                value={formData.role || "player"} 
                onValueChange={(val) => setFormData({...formData, role: val})}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="player">Player</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="referral_bonus_points" className="text-slate-300">Referral Bonus Points</Label>
              <Input
                id="referral_bonus_points"
                type="number"
                value={formData.referral_bonus_points || 0}
                onChange={(e) => setFormData({...formData, referral_bonus_points: parseInt(e.target.value) || 0})}
                className="bg-slate-700 border-slate-600 text-white"
              />
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
    </main>
  )
}