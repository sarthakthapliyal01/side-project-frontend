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
    <aside className="w-24 sm:w-28 bg-[#0c0c0e]/95 backdrop-blur-xl rounded-3xl border border-[#1e1e24] shadow-2xl flex flex-col overflow-hidden shrink-0 h-full select-none">
      {/* Brand Header */}
      <div className="h-20 flex flex-col items-center justify-center border-b border-[#1e1e24] shrink-0 px-2">
        <div className="w-9 h-9 rounded-2xl bg-white flex items-center justify-center text-black font-black text-lg shadow-md">
          Q
        </div>
        <p className="text-[9px] font-extrabold uppercase tracking-widest text-white mt-1.5 leading-none">
          QMetrix
        </p>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 py-4 px-2.5 overflow-y-auto overflow-x-hidden no-scrollbar">
        <div className="flex flex-col gap-3 items-center">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full rounded-2xl flex flex-col items-center justify-center py-3 px-1.5 transition-all duration-200 group focus:outline-none cursor-pointer ${
                  active
                    ? "bg-white text-black shadow-xl shadow-white/10 scale-[1.02]"
                    : "text-[#999999] hover:bg-[#18181d] hover:text-white"
                }`}
              >
                <Icon
                  size={26}
                  strokeWidth={active ? 2.4 : 2}
                  className={`transition-colors ${active ? "text-black" : "text-[#999999] group-hover:text-white"}`}
                />
                <span
                  className={`text-[11px] leading-tight text-center mt-1.5 transition-colors ${
                    active ? "text-black font-bold" : "text-[#999999] font-semibold group-hover:text-white"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Version Status */}
      <div className="py-3 px-2 border-t border-[#1e1e24] shrink-0 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-0.5">
          <div className="w-7 h-7 rounded-full bg-[#18181d] flex items-center justify-center text-white text-[11px] font-bold shrink-0 border border-[#27272e]">
            V1
          </div>
          <p className="text-[9px] font-medium text-[#777777] leading-tight">
            Up to date
          </p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;