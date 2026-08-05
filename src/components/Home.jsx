import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

const defaultUser = {
  name: "abc",
  email: "xyz@qmetrix.io",
  picture: null,
};

function DashboardCard({
  title,
  children,
  className = "",
}) {
  return (
    <div
      className={`bg-neutral-900 rounded-2xl p-6 border border-white/10 shadow-sm hover:border-white/20 transition-all ${className}`}
    >
      <h3 className="text-white text-lg font-semibold mb-4">
        {title}
      </h3>

      {children}
    </div>
  );
}

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
    <div className="w-full bg-black h-screen">
      <div className="w-full px-6 md:px-8 lg:px-10 py-6 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Welcome back, {firstName}
          </h1>

          <p className="mt-2 text-base text-slate-400">
            Manage your engineering organization from one place.
          </p>
          <p className="mt-2 text-base text-slate-400">
            adding extra space so that i can add features later here 
          </p>
          
        </div>

        {/* Dashboard Layout */}
        <div className="grid grid-cols-12 gap-4">

          {/* Churn */}
          <DashboardCard
            title="Churn"
            className="col-span-5 h-[400px]"
          />

          {/* Capacity */}
          <DashboardCard
            title="Capacity"
            className="col-span-3 h-[400px]"
          />

          {/* Jira */}
          <DashboardCard
            title="Jira"
            className="col-span-4 h-[400px]"
          />

          {/* Burndown */}
          <DashboardCard
            title="Burndown"
            className="col-span-4 h-[350px]"
          />

          {/* Burnup */}
          <DashboardCard
            title="Burnup"
            className="col-span-4 h-[350px]"
          />

        </div>
      </div>
    </div>
  );
}

export default Home;