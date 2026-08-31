import React from "react";

function DashboardCard({ title, children, className = "", headerRight = null, infoText = null }) {
  return (
    <div className={`bg-[#0c0c0e]/90 backdrop-blur-xl rounded-3xl p-6 md:p-7 border border-[#1e1e24] shadow-2xl hover:border-white/20 transition-all duration-300 flex flex-col h-full overflow-hidden ${className}`}>
      <h3 className="text-white text-base md:text-xl font-bold tracking-tight mb-4 flex items-center justify-between shrink-0 gap-2">
        <span className="pt-0.5 flex items-center gap-1.5 min-w-0">
          <span className="truncate">{title}</span>
        </span>
        {headerRight ? (
          <div className="shrink-0 flex items-center">{headerRight}</div>
        ) : (
          <span className="w-2.5 h-2.5 rounded-full bg-white shadow-sm shadow-white/50 shrink-0" />
        )}
      </h3>
      <div className="flex-1 w-full overflow-hidden flex flex-col justify-center">{children}</div>
    </div>
  );
}

export default DashboardCard;
