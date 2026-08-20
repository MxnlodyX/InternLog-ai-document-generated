export default function Topbar() {
  return (
    <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200/70 bg-white/85 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="ml-12 flex items-center gap-3 md:ml-0">
        <div>
          <p className="text-xs font-medium text-slate-400">Thursday, August 20</p>
          <h1 className="text-lg font-semibold tracking-tight text-slate-950">Overview</h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <label className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 lg:flex">
          <span className="text-sm text-slate-400" aria-hidden="true">⌕</span>
          <span className="sr-only">Search logs</span>
          <input
            type="search"
            placeholder="Search logs..."
            className="w-44 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
          <kbd className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400">⌘ K</kbd>
        </label>

        <button
          type="button"
          aria-label="Notifications"
          className="relative grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500 transition hover:bg-slate-50"
        >
          <span aria-hidden="true">●</span>
          <span className="absolute right-2 top-2 size-2 rounded-full border-2 border-white bg-rose-500" />
        </button>

        <div className="grid size-10 place-items-center rounded-full bg-amber-100 text-xs font-semibold text-amber-700 ring-2 ring-white">
          MX
        </div>
      </div>
    </header>
  );
}
