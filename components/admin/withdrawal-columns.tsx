"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  MoreHorizontal,
  User,
  Wallet,
  Clock,
  CheckCircle,
  XCircle,
  Coins,
} from "lucide-react"
import { updateWithdrawalStatus } from "@/lib/actions/admin/withdrawals"
import { useToast } from "@/components/ui/use-toast"
import { useTransition, useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"

// ---------------------------
// TYPES
// ---------------------------
export type Withdrawal = {
  id: string
  user_id: string
  user_name: string
  amount: number
  points_deducted: number
  payment_method: string
  payment_details: any
  status: "pending" | "approved" | "rejected" | "completed"
  requested_at: string
  processed_at: string | null
}

interface RecentAttempt {
  id: string
  points_earned: number
  is_correct: boolean
  attempted_at: string
}

interface UserProfile {
  id: string
  name: string
  email: string
  created_at: string
  // fields coming from API/view or fallback:
  total_points: number // total_points (earned - used) — compatibility
  available_points?: number // explicit available_points if provided
  total_points_earned?: number
  total_points_used?: number
  games_played?: number
  wins?: number
  losses?: number
  win_rate?: number
  total_withdrawn?: number
  total_withdrawals_completed?: number
  recent_withdrawals: Withdrawal[]
  recent_attempts: RecentAttempt[]
}

// ---------------------------
// WITHDRAWAL ACTIONS CELL
// ---------------------------
function WithdrawalActionsCell({ withdrawal }: { withdrawal: Withdrawal }) {
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleViewProfile = () => {
    setSelectedUserId(withdrawal.user_id)
    setUserProfile(null)
    setLoading(false)
    setIsDialogOpen(true)
  }

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!selectedUserId || userProfile !== null || !isDialogOpen) return

      setLoading(true)
      try {
        // get current session token
        const {
          data: { session },
        } = await supabase.auth.getSession()
        const token = session?.access_token

        if (!token) throw new Error("No authentication token found. Please log in again.")

        const response = await fetch(`/api/admin/users/${selectedUserId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) {
          if (response.status === 403) throw new Error("Unauthorized: Admin access required.")
          if (response.status === 404) throw new Error("User profile not found")
          throw new Error(`Failed to fetch user profile: ${response.statusText}`)
        }

        const data = (await response.json()) as UserProfile

        // Normalize response for compatibility:
        // some APIs return total_points, some use available_points
        const normalized: UserProfile = {
          id: data.id,
          name: data.name,
          email: data.email,
          created_at: data.created_at,
          total_points:
            typeof data.total_points === "number"
              ? data.total_points
              : typeof data.available_points === "number"
              ? data.available_points
              : Number(data.total_points ?? 0),
          available_points:
            typeof data.available_points === "number"
              ? data.available_points
              : typeof data.total_points === "number"
              ? data.total_points
              : undefined,
          total_points_earned: Number(data.total_points_earned ?? 0),
          total_points_used: Number(data.total_points_used ?? 0),
          games_played: Number(data.games_played ?? 0),
          wins: Number(data.wins ?? 0),
          losses: Number(data.losses ?? 0),
          win_rate: Number(data.win_rate ?? 0),
          total_withdrawn: Number(data.total_withdrawn ?? data.total_withdrawn ?? 0),
          total_withdrawals_completed: Number(data.total_withdrawals_completed ?? 0),
          recent_withdrawals: Array.isArray(data.recent_withdrawals) ? data.recent_withdrawals : [],
          recent_attempts: Array.isArray(data.recent_attempts) ? data.recent_attempts : [],
        }

        setUserProfile(normalized)
      } catch (error) {
        console.error("Error fetching user profile:", error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load user profile",
          variant: "destructive",
        })
        setIsDialogOpen(false)
      } finally {
        setLoading(false)
      }
    }

    if (isDialogOpen && selectedUserId && userProfile === null) {
      fetchUserProfile()
    }
  }, [isDialogOpen, selectedUserId, userProfile, toast, supabase])

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setSelectedUserId(null)
    setUserProfile(null)
    setLoading(false)
  }

  const handleStatusUpdate = (newStatus: Withdrawal["status"]) => {
    startTransition(async () => {
      const result = await updateWithdrawalStatus(withdrawal.id, newStatus)
      if (result.success) {
        toast({ title: "Success", description: `Status updated to ${newStatus}` })
        // reload to refresh table data — keep existing behavior
        window.location.reload()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update status",
          variant: "destructive",
        })
      }
    })
  }

  const canApprove = withdrawal.status === "pending"
  const canReject = withdrawal.status === "pending"
  const canComplete = withdrawal.status === "approved"

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleViewProfile}>View User Profile</DropdownMenuItem>
          {canApprove && (
            <DropdownMenuItem onClick={() => handleStatusUpdate("approved")} disabled={isPending}>
              Approve
            </DropdownMenuItem>
          )}
          {canReject && (
            <DropdownMenuItem
              onClick={() => handleStatusUpdate("rejected")}
              disabled={isPending}
              className="text-red-400"
            >
              Reject
            </DropdownMenuItem>
          )}
          {canComplete && (
            <DropdownMenuItem onClick={() => handleStatusUpdate("completed")} disabled={isPending}>
              Mark as Completed
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ================================
          USER PROFILE DIALOG (merged full view)
      ================================= */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="w-full max-w-4xl bg-slate-900 border border-slate-700 text-white rounded-xl shadow-2xl overflow-hidden p-0">
          <div className="flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-800 bg-slate-800/40">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-300" />
                  {withdrawal.user_name}
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-400">
                  Profile, stats, available points, withdrawal summary and recent activity
                </DialogDescription>
              </DialogHeader>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-12 text-slate-400 animate-pulse">
                  Loading user profile...
                </div>
              ) : userProfile ? (
                <>
                  {/* Personal Info */}
                  <section className="space-y-2">
                    <h3 className="text-base font-semibold text-white border-b border-slate-700 pb-1.5">
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      <div className="p-3 bg-slate-800/40 rounded-lg">
                        <p className="text-slate-400 text-xs mb-1">Name</p>
                        <p className="font-medium">{userProfile.name}</p>
                      </div>
                      <div className="p-3 bg-slate-800/40 rounded-lg">
                        <p className="text-slate-400 text-xs mb-1">Email</p>
                        <p className="font-medium truncate">{userProfile.email}</p>
                      </div>
                      <div className="p-3 bg-slate-800/40 rounded-lg">
                        <p className="text-slate-400 text-xs mb-1">Member Since</p>
                        <p className="font-medium">{new Date(userProfile.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </section>

                  {/* Game Stats */}
                  <section className="space-y-2">
                    <h3 className="text-base font-semibold text-white border-b border-slate-700 pb-1.5">
                      Game Statistics
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {[
                        { key: "total_points", label: "Total Points", value: userProfile.total_points ?? 0, color: "text-green-400" },
                        { key: "games_played", label: "Games Played", value: userProfile.games_played ?? 0, color: "text-white" },
                        { key: "wins", label: "Wins", value: userProfile.wins ?? 0, color: "text-blue-400" },
                        { key: "losses", label: "Losses", value: userProfile.losses ?? 0, color: "text-red-400" },
                        { key: "win_rate", label: "Win Rate", value: ((userProfile.win_rate ?? 0) * 100).toFixed(1) + "%", color: "text-purple-400" },
                      ].map((stat) => (
                        <div
                          key={stat.key}
                          className="p-2.5 rounded-lg bg-slate-800/60 text-center hover:bg-slate-800 transition"
                        >
                          <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Points Summary */}
                  <section className="space-y-2">
                    <h3 className="text-base font-semibold text-white border-b border-slate-700 pb-1.5">
                      Points Summary
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-slate-800/60 rounded-lg text-center">
                        <p className="text-xl font-bold text-yellow-400">{(userProfile.total_points ?? 0).toLocaleString()}</p>
                        <p className="text-[10px] text-slate-400 uppercase mt-1">Total Points</p>
                      </div>
                      <div className="p-3 bg-slate-800/60 rounded-lg text-center">
                        <p className="text-xl font-bold text-green-400">{((userProfile.available_points ?? userProfile.total_points) ?? 0).toLocaleString()}</p>
                        <p className="text-[10px] text-slate-400 uppercase mt-1">Available Points</p>
                      </div>
                      <div className="p-3 bg-slate-800/60 rounded-lg text-center">
                        <p className="text-xl font-bold text-slate-300">{(userProfile.total_points_earned ?? 0).toLocaleString()}</p>
                        <p className="text-[10px] text-slate-400 uppercase mt-1">Points Earned</p>
                      </div>
                      <div className="p-3 bg-slate-800/60 rounded-lg text-center">
                        <p className="text-xl font-bold text-rose-400">{(userProfile.total_points_used ?? 0).toLocaleString()}</p>
                        <p className="text-[10px] text-slate-400 uppercase mt-1">Points Used</p>
                      </div>
                    </div>
                  </section>

                  {/* Withdrawal Summary */}
                  <section className="space-y-2">
                    <h3 className="text-base font-semibold text-white border-b border-slate-700 pb-1.5">
                      Withdrawal Summary
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-800/60 rounded-lg text-center">
                        <p className="text-xl font-bold text-green-400">₱{((userProfile.total_withdrawn ?? 0)).toFixed(2)}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide mt-1">Total Withdrawn</p>
                      </div>
                      <div className="p-3 bg-slate-800/60 rounded-lg text-center">
                        <p className="text-xl font-bold text-slate-300">{(userProfile.total_withdrawals_completed ?? 0)}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide mt-1">Completed Withdrawals</p>
                      </div>
                    </div>
                  </section>

                  {/* Recent Withdrawals */}
                  {userProfile.recent_withdrawals?.length > 0 && (
                    <section className="space-y-2">
                      <h3 className="text-base font-semibold text-white border-b border-slate-700 pb-1.5">
                        Recent Withdrawals
                      </h3>
                      <div className="overflow-x-auto border border-slate-800 rounded-lg">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-800/40 text-slate-300">
                            <tr>
                              <th className="text-left py-1.5 px-2">Amount</th>
                              <th className="text-left py-1.5 px-2">Points</th>
                              <th className="text-left py-1.5 px-2">Status</th>
                              <th className="text-left py-1.5 px-2">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {userProfile.recent_withdrawals.slice(0, 10).map((wd, index) => (
                              <tr key={wd.id || `${wd.requested_at}-${index}`} className="border-t border-slate-800 hover:bg-slate-800/40">
                                <td className="py-1.5 px-2 whitespace-nowrap">₱{Number(wd.amount ?? 0).toFixed(2)}</td>
                                <td className="py-1.5 px-2 text-slate-300">{Number(wd.points_deducted ?? 0).toLocaleString()}</td>
                                <td className="py-1.5 px-2">
                                  <Badge
                                    variant="secondary"
                                    className={`capitalize text-[10px] px-1.5 py-0.5 ${
                                      {
                                        pending: "bg-yellow-500/20 text-yellow-400",
                                        approved: "bg-blue-500/20 text-blue-400",
                                        rejected: "bg-red-500/20 text-red-400",
                                        completed: "bg-green-500/20 text-green-400",
                                      }[wd.status]
                                    }`}
                                  >
                                    {wd.status}
                                  </Badge>
                                </td>
                                <td className="py-1.5 px-2 text-slate-400 whitespace-nowrap">
                                  {wd.requested_at ? new Date(wd.requested_at).toLocaleString() : "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  )}

                  {/* How Points Were Added (Recent Attempts) */}
                  {userProfile.recent_attempts?.length > 0 && (
                    <section className="space-y-2">
                      <h3 className="text-base font-semibold text-white border-b border-slate-700 pb-1.5 flex items-center gap-2">
                        <Coins className="h-4 w-4 text-yellow-400" />
                        How Points Were Added
                      </h3>
                      <div className="overflow-x-auto border border-slate-800 rounded-lg">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-800/40 text-slate-300">
                            <tr>
                              <th className="text-left py-1.5 px-2">Result</th>
                              <th className="text-left py-1.5 px-2">Points Earned</th>
                              <th className="text-left py-1.5 px-2">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {userProfile.recent_attempts.slice(0, 10).map((a, index) => (
                               <tr key={a.id || `${a.attempted_at}-${index}`} className="border-t border-slate-800 hover:bg-slate-800/40">
                                <td className="py-1.5 px-2">
                                  <Badge
                                    variant="secondary"
                                    className={`text-[10px] px-1.5 py-0.5 ${
                                      a.is_correct ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                                    }`}
                                  >
                                    {a.is_correct ? "Win" : "Loss"}
                                  </Badge>
                                </td>
                                <td className="py-1.5 px-2 text-slate-300">{Number(a.points_earned ?? 0)}</td>
                                <td className="py-1.5 px-2 text-slate-400">{a.attempted_at ? new Date(a.attempted_at).toLocaleString() : "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center py-12 text-slate-400">
                  User profile not found or failed to load.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-slate-800 bg-slate-800/40 flex justify-end">
              <Button variant="secondary" onClick={handleCloseDialog}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ---------------------------
// TABLE COLUMNS
// ---------------------------
export const columns: ColumnDef<Withdrawal>[] = [
  {
    accessorKey: "user_name",
    header: "Player",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-slate-400" />
        <span className="font-medium text-white">{row.original.user_name}</span>
      </div>
    ),
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <span className="text-green-400 font-semibold">₱</span>
        <span className="font-semibold text-white">{Number(row.original.amount ?? 0).toFixed(2)}</span>
      </div>
    ),
  },
  {
    accessorKey: "points_deducted",
    header: "Points",
    cell: ({ row }) => (
      <span className="text-slate-300">{Number(row.original.points_deducted ?? 0).toLocaleString()}</span>
    ),
  },
  {
    accessorKey: "payment_method",
    header: "Method",
    cell: ({ row }) => (
      <Badge variant="secondary" className="capitalize bg-slate-800 text-slate-200">
        <Wallet className="h-3 w-3 mr-1" />
        {row.original.payment_method}
      </Badge>
    ),
  },
  {
    accessorKey: "payment_details",
    header: "Details",
    cell: ({ row }) => {
      const details =
        typeof row.original.payment_details === "object"
          ? row.original.payment_details[row.original.payment_method] ?? JSON.stringify(row.original.payment_details)
          : row.original.payment_details
      return (
        <span className="text-xs text-slate-400 font-mono truncate max-w-[150px] block">
          {details || "N/A"}
        </span>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status
      const badgeClass = {
        pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        approved: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        rejected: "bg-red-500/20 text-red-400 border-red-500/30",
        completed: "bg-green-500/20 text-green-400 border-green-500/30",
      }[status]

      const icon = {
        pending: <Clock className="h-3 w-3" />,
        approved: <CheckCircle className="h-3 w-3" />,
        rejected: <XCircle className="h-3 w-3" />,
        completed: <CheckCircle className="h-3 w-3" />,
      }[status]

      return (
        <Badge className={`flex items-center gap-1 ${badgeClass}`}>
          {icon}
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "requested_at",
    header: "Requested",
    cell: ({ row }) => (
      <span className="text-slate-400 text-sm">
        {row.original.requested_at ? new Date(row.original.requested_at).toLocaleDateString() : "—"}
      </span>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <WithdrawalActionsCell withdrawal={row.original} />,
  },
]
