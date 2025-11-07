export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Glow Orbs */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>

      {/* Spinner */}
      <div className="relative flex flex-col items-center space-y-4 z-10">
        <div className="h-14 w-14 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-slate-300 text-sm animate-pulse tracking-wide">
          Loading your dashboard...
        </p>
      </div>
    </div>
  )
}
