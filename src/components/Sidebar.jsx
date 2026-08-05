import {
  Home,
  LineChart,
  Users,
  Shield,
  Rocket,
  Plug,
  Settings,
} from "lucide-react";

function Sidebar({ currentPage, setCurrentPage }) {
  const menuItems = [
    { id: "qmetry360", label: "QMetry360", icon: Home },
    { id: "eng-metrics", label: "Eng Metrics", icon: LineChart },
    { id: "standup", label: "Standup", icon: Users },
    { id: "tech-quality", label: "Tech Quality", icon: Shield },
    { id: "release", label: "Release", icon: Rocket },
    { id: "integration", label: "Integration", icon: Plug },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-24 sm:w-[104px] bg-black rounded-2xl sm:rounded-3xl border border-white/5 shadow-sm flex flex-col overflow-hidden shrink-0 h-full">
      
      {/* Header section */}
      <div className="h-16 lg:h-20 flex items-center justify-center border-b border-white/5 shrink-0 relative">
        <div className="flex flex-col items-center justify-center gap-1">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-black font-bold shadow-sm">
            Q
          </div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 leading-none">
            QMetrix
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6 overflow-y-auto overflow-x-hidden no-scrollbar">
        <div className="flex flex-col gap-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-20 mx-auto rounded-xl flex flex-col items-center justify-center py-3 px-2 transition-all duration-200 group focus:outline-none ${
                  active
                    ? "bg-white text-black shadow-md"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon
                  size={24}
                  strokeWidth={active ? 2.5 : 2}
                  className={`mb-1 ${
                    active
                      ? "text-black"
                      : "text-slate-500 group-hover:text-white"
                  } transition-colors`}
                />

                <span
                  className={`text-[11px] font-medium text-center leading-tight ${
                    active ? "text-black" : "text-slate-400"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/5 shrink-0 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-1">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-xs font-bold shrink-0 border border-white/10">
            V1
          </div>
          <p className="text-[10px] font-medium text-slate-500 leading-tight">
            Up to date
          </p>
        </div>
      </div>
      
    </aside>
  );
}

export default Sidebar;