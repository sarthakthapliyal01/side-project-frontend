import { Bell, Search, ChevronDown, Building2 } from "lucide-react";

function Topbar({ user, companyName }) {
  return (
    <header className="h-16 lg:h-20 bg-white border-b border-slate-200 px-4 lg:px-8 shrink-0">
      <div className="h-full flex items-center justify-between">
        
        {/* Left - Organization */}
        <div className="flex items-center">
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
            <div className="bg-white p-1.5 rounded-lg shadow-sm border border-slate-100">
              <Building2 size={16} className="text-blue-600" />
            </div>
            
            <div className="pr-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-tight">
                Organization
              </p>
              <p className="text-sm font-bold text-slate-800 leading-tight mt-0.5">
                {companyName || "Lumen Robotics"}
              </p>
            </div>
          </div>
        </div>

        {/* Right - Controls */}
        <div className="flex items-center gap-3 sm:gap-5">
          
          {/* Search */}
          <div className="hidden lg:flex items-center w-64 xl:w-80 bg-slate-100/80 rounded-full px-4 py-2 border border-transparent focus-within:bg-white focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100 transition-all">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              className="ml-3 bg-transparent outline-none w-full text-sm placeholder-slate-400 font-medium text-slate-700"
            />
          </div>

          {/* Notification */}
          <button className="relative w-10 h-10 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-slate-200">
            <Bell size={18} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          {/* User Dropdown */}
          <button className="flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 hover:shadow-sm bg-white transition-all focus:outline-none focus:ring-2 focus:ring-slate-200">
            {user?.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-inner">
                {user?.name?.charAt(0) || "U"}
              </div>
            )}
            
            <div className="hidden md:block text-left max-w-[130px]">
              <p className="font-semibold text-sm text-slate-800 truncate leading-tight">
                {user?.name || "User"}
              </p>
              <p className="text-[11px] font-medium text-slate-500 truncate leading-tight mt-0.5">
                {user?.email || "user@qmetrix.io"}
              </p>
            </div>
            
            <ChevronDown size={14} className="text-slate-400 ml-1" />
          </button>
          
        </div>
      </div>
    </header>
  );
}

export default Topbar;