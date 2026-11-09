export function EmailSkeleton() {
  return (
    <div className="px-4 py-3 mx-2 my-1 rounded-xl border border-border/60 bg-card/50 backdrop-blur-[10px] shadow-[0_8px_30px_-18px_rgba(0,0,0,0.55)]">
      <div className="flex gap-3">
        {/* Avatar skeleton */}
        <div className="w-10 h-10 rounded-full bg-muted skeleton shrink-0 border border-border/60" />

        {/* Content skeleton */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="h-4 bg-muted skeleton w-32 rounded" />
            <div className="h-3 bg-muted skeleton w-16 rounded" />
          </div>
          <div className="h-4 bg-muted skeleton w-48 rounded mb-2" />
          <div className="h-3 bg-muted skeleton w-64 rounded" />
        </div>
      </div>
    </div>
  )
}
