import {
  LayoutDashboard,
  Link2,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

function Sidebar({
  currentPage,
  setCurrentPage,
  sidebarOpen,
  setSidebarOpen,
}) {
  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "jira",
      label: "Jira Integration",
      icon: Link2,
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
    },
  ];

  return (
    <aside
      className={`${
        sidebarOpen ? "w-64" : "w-20"
      } bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden transition-all duration-300 shrink-0`}
    >
      {/* Header */}
      <div
        className={`h-16 lg:h-20 flex items-center ${
          sidebarOpen ? "justify-between px-5" : "justify-center"
        } border-b border-slate-200 shrink-0 transition-all`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="min-w-[40px] w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white font-bold shadow-sm">
            Q
          </div>

          {sidebarOpen && (
            <div className="whitespace-nowrap animate-in fade-in duration-300">
              <h1 className="font-bold text-slate-900 text-lg leading-tight">
                QMetrix
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-tight">
                Engineering
              </p>
            </div>
          )}
        </div>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors ${
            !sidebarOpen ? "hidden" : "flex"
          }`}
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6 px-3 sm:px-4 overflow-y-auto overflow-x-hidden">
        {sidebarOpen && (
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">
            Navigation
          </p>
        )}

        <div className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                title={!sidebarOpen ? item.label : ""} // Tooltip for collapsed state
                className={`relative w-full flex items-center ${
                  sidebarOpen ? "justify-start px-4" : "justify-center px-0"
                } py-3.5 rounded-2xl transition-all duration-200 group ${
                  active
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {active && sidebarOpen && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-white opacity-80" />
                )}

                <Icon
                  size={20}
                  strokeWidth={active ? 2.5 : 2}
                  className={`shrink-0 ${
                    active ? "text-white" : "text-slate-400 group-hover:text-blue-600"
                  } transition-colors`}
                />

                {sidebarOpen && (
                  <span className="font-semibold ml-3.5 whitespace-nowrap">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer / Toggle fallback when closed */}
      <div
        className={`p-4 border-t border-slate-200 shrink-0 flex items-center ${
          sidebarOpen ? "justify-start gap-3" : "justify-center cursor-pointer hover:bg-slate-50 transition-colors"
        }`}
        onClick={!sidebarOpen ? () => setSidebarOpen(true) : undefined}
        title={!sidebarOpen ? "Expand Sidebar" : ""}
      >
        {!sidebarOpen ? (
          <ChevronRight size={20} className="text-slate-400" />
        ) : (
          <>
            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold shrink-0 border border-slate-200">
              V1
            </div>
            <div className="whitespace-nowrap overflow-hidden">
              <p className="text-sm font-bold text-slate-800 leading-tight">
                System
              </p>
              <p className="text-xs font-medium text-slate-500 leading-tight mt-0.5">
                Up to date
              </p>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;