import { useEffect, useState } from "react";
import {
  Bell,
  ChevronDown,
  Building2,
  LogOut,
  RefreshCw,
} from "lucide-react";

function formatLastSynced(lastSynced, now) {
  if (!lastSynced) return "Never synced";

  const diffSec = Math.floor((now - lastSynced) / 1000);

  if (diffSec < 5) return "Synced just now";
  if (diffSec < 60) return `Synced ${diffSec}s ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Synced ${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `Synced ${diffHr}h ago`;

  return `Synced on ${lastSynced.toLocaleDateString()}`;
}

function Topbar({ user, companyName, logout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState(() => {
    const stored = localStorage.getItem("lastSyncedBoards");
    return stored ? new Date(stored) : null;
  });
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const handleSync = async () => {
    const storedCompanyName = localStorage.getItem("companyName");

    if (!storedCompanyName) {
      alert("No company selected — companyName is missing from localStorage.");
      return;
    }

    setSyncing(true);

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/jira/sync-boards/${storedCompanyName}`,
        { method: "POST" }
      );

      let data;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        console.error("Sync failed:", response.status, data);
        alert(data?.message || `Sync failed (status ${response.status})`);
        return;
      }

      const syncedAt = new Date();
      setLastSynced(syncedAt);
      localStorage.setItem("lastSyncedBoards", syncedAt.toISOString());
      alert(data?.message || "Boards synced successfully");
    } catch (error) {
      console.error("Sync request error:", error);
      alert("Failed to sync boards — check your connection or the server.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <header className="h-16 lg:h-20 bg-black border-b border-white/5 px-4 lg:px-12 shrink-0">
      <div className="h-full flex items-center justify-between">

        {/* Organization */}
        <div className="flex items-center">
          <div className="flex items-center gap-5 px-7 py-3.5 rounded-xl bg-white/5 border border-white/10 shadow-sm min-w-[260px] lg:min-w-[300px]">
            <div className="bg-white p-2 rounded-lg shadow-sm">
              <Building2 size={18} className="text-black" />
            </div>

            <div className="pr-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 leading-tight">
                Organization
              </p>

              <p className="text-base font-bold text-white leading-tight mt-0.5">
                {companyName || "Lumen Robotics"}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4 sm:gap-6">

          {/* Sync */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-xs font-medium text-slate-500 whitespace-nowrap">
              {syncing ? "Syncing…" : formatLastSynced(lastSynced, now)}
            </span>

            <button
              onClick={handleSync}
              disabled={syncing}
              className="group flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/15 bg-white/5 text-white text-sm font-semibold shadow-sm transition-all duration-200 hover:bg-white hover:text-black hover:border-white active:scale-95 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white/5 disabled:hover:text-white"
            >
              <RefreshCw
                size={16}
                className={
                  syncing
                    ? "animate-spin"
                    : "transition-transform duration-300 group-hover:rotate-180"
                }
              />
              {syncing ? "Syncing" : "Sync Boards"}
            </button>
          </div>

          {/* Notifications */}
          <button className="relative w-10 h-10 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-neutral-900">
            <Bell size={18} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-neutral-900" />
          </button>

          {/* User Menu */}
          <div className="relative">

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-3 pl-3 pr-5 py-2 rounded-full border border-white/10 hover:border-white/20 hover:shadow-sm bg-white/5 transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-neutral-900"
            >
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black text-sm font-bold shadow-inner">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}

              <div className="hidden md:block text-left max-w-[160px]">
                <p className="font-semibold text-base text-white truncate leading-tight">
                  {user?.name || "User"}
                </p>

                <p className="text-xs font-medium text-slate-400 truncate leading-tight mt-0.5">
                  {user?.email || "user@qmetrix.io"}
                </p>
              </div>

              <ChevronDown
                size={16}
                className={`text-slate-500 transition-transform ${
                  menuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl bg-neutral-900 border border-white/10 shadow-xl overflow-hidden z-50">

                <div className="px-4 py-3 border-b border-white/10">
                  <p className="text-sm font-semibold text-white truncate">
                    {user?.name}
                  </p>

                  <p className="text-xs text-slate-400 truncate">
                    {user?.email}
                  </p>
                </div>

                <button
                  onClick={() =>
                    logout?.({
                      logoutParams: {
                        returnTo: window.location.origin,
                      },
                    })
                  }
                  className="w-full px-4 py-3 flex items-center gap-3 text-left text-red-400 hover:bg-white/5 transition-colors"
                >
                  <LogOut size={16} />
                  Logout
                </button>

              </div>
            )}

          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;