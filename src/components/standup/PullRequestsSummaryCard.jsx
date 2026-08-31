import React from "react";
import DashboardCard from "./DashboardCard";

function PullRequestsSummaryCard({ summary }) {
  const total = summary?.totalPRs || 0;
  const openCount = summary?.openPRs || 0;
  const mergedCount = summary?.mergedPRs || 0;
  const closedNoMergeCount = summary?.closedNoMerge || 0;

  const openPct = total > 0 ? (openCount / total) * 100 : 0;
  const mergedPct = total > 0 ? (mergedCount / total) * 100 : 0;
  const closedPct = total > 0 ? (closedNoMergeCount / total) * 100 : 0;

  return (
    <DashboardCard
      title="Pull Requests Summary"
      infoText="Overview of repository pull request states and merge metrics"
      className="col-span-12 lg:col-span-4 min-h-[320px]"
    >
      <div className="flex flex-col h-full justify-between gap-4 py-1">
        <div className="flex items-center justify-end gap-2 text-sm font-semibold text-slate-300">
          <span>Total PRs</span>
          <span className="text-[#3b82f6] text-xl font-extrabold">{total}</span>
        </div>

        <div className="w-full space-y-2">
          <div className="w-full h-3 bg-[#18181c] rounded-full overflow-hidden flex gap-0.5 border border-white/10 p-0.5">
            {openCount > 0 && (
              <div
                style={{ width: `${openPct}%` }}
                className="h-full bg-[#6366f1] rounded-l-full transition-all duration-500"
                title={`Open PRs: ${openCount}`}
              />
            )}
            {mergedCount > 0 && (
              <div
                style={{ width: `${mergedPct}%` }}
                className="h-full bg-[#f59e0b] transition-all duration-500"
                title={`Merged PRs: ${mergedCount}`}
              />
            )}
            {closedNoMergeCount > 0 && (
              <div
                style={{ width: `${closedPct}%` }}
                className="h-full bg-[#64748b] rounded-r-full transition-all duration-500"
                title={`Closed W/O Merge: ${closedNoMergeCount}`}
              />
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-white">{openCount}</span>
              <span className="text-slate-400 font-semibold text-[11px]">Open PRs</span>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                <span>Reviewed <strong className="text-white">{summary?.reviewed ?? 0}</strong></span>
                <span>Unreviewed <strong className="text-white">{summary?.unreviewed ?? 0}</strong></span>
              </div>
            </div>

            <div className="flex flex-col items-center border-x border-white/10 px-1">
              <span className="text-xl font-bold text-white">{mergedCount}</span>
              <span className="text-slate-400 font-semibold text-[11px]">Merged PRs</span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-white">{closedNoMergeCount}</span>
              <span className="text-slate-400 font-semibold text-[11px]">Closed W/O Merge</span>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-3 flex flex-col gap-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Average Time To Merge</span>
            <span className="text-white font-bold">{summary?.avgTimeToMerge || "0h 0m"}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">First-Time Pass Rate</span>
            <div className="flex items-center gap-1.5">
              <span className="text-white font-bold">{summary?.firstTimePassRate || "0%"}</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}

export default PullRequestsSummaryCard;
