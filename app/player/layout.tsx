import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Player Dashboard - PH Trivia",
  description: "Philippines Trivia Game Player Area",
}

export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">{children}</div>
}
