import { useEffect, useState } from "react";
import { Building2, Plug, ArrowRight, LogOut } from "lucide-react";

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

const defaultUser = {
  name: "Jordan Avery",
  email: "jordan@qmetrix.io",
  picture: null,
};

function Home({
  user = defaultUser,
  companyName = "Lumen Robotics",
  logout = () => {},
}) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="w-full bg-slate-50/50 min-h-screen">
      {/* Constrain width to prevent infinite stretching on large monitors */}
      <div className="max-w-7xl mx-auto p-6 md:p-8 lg:p-10 space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="mt-2 text-base text-slate-500">
            Manage your engineering organization from one place.
          </p>
        </div>

        {/* Top Cards - ensure equal height using grid auto-rows and flex */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
          
          {/* Organization */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-6">
              <Building2 size={24} className="text-blue-600" />
            </div>
            
            {/* mt-auto pushes the text to the bottom if cards stretch */}
            <div className="mt-auto">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Organization
              </p>
              <h2 className="text-2xl font-bold text-slate-900 truncate">
                {companyName}
              </h2>
            </div>
          </div>

          {/* Integrations */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-6">
              <Plug size={24} className="text-blue-600" />
            </div>
            <div className="mt-auto">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Integrations
              </p>
              <h2 className="text-2xl font-bold text-slate-900">
                0 connected
              </h2>
              <button className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-blue-600 group focus:outline-none focus:ring-2 focus:ring-blue-200 rounded-md transition-colors hover:text-blue-700">
                View integrations
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>
            </div>
          </div>

          {/* User Profile */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-center gap-4">
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-slate-100"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-blue-500 flex items-center justify-center text-white font-bold text-lg ring-2 ring-slate-100">
                  {getInitials(user?.name)}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <h2 className="font-bold text-slate-900 truncate text-lg">
                  {user?.name}
                </h2>
                <p className="text-sm text-slate-500 truncate">
                  {user?.email}
                </p>
              </div>
            </div>

            <button
              onClick={() =>
                logout({
                  logoutParams: {
                    returnTo: window.location.origin,
                  },
                })
              }
              className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <LogOut size={18} className="text-slate-400" />
              Log out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;