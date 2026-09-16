import { EmptyState } from "../ui/ProductUI";
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

  if (!total) return <DashboardCard title="Pull request summary" className="q-card--summary"><EmptyState title="No pull requests yet" description="Connect a code source in Integrations to see pull request activity." /></DashboardCard>;

  return (
    <DashboardCard
      title="Pull Requests Summary"
      infoText="Overview of repository pull request states and merge metrics"
      className="q-card--summary"
    >
      <div className="flex flex-col h-full justify-between gap-4 py-1">
        <div className="flex items-center justify-end gap-2 text-sm font-semibold text-ink">
          <span>Total PRs</span>
          <span className="text-accent text-xl font-semibold">{total}</span>
        </div>

        <div className="w-full space-y-2">
          <div className="w-full h-3 bg-control rounded-full overflow-hidden flex gap-0.5 border border-ink/10 p-0.5">
            {openCount > 0 && (
              <div
                style={{ width: `${openPct}%` }}
                className="h-full bg-purple rounded-l-full transition-all duration-500"
                title={`Open PRs: ${openCount}`}
              />
            )}
            {mergedCount > 0 && (
              <div
                style={{ width: `${mergedPct}%` }}
                className="h-full bg-warning transition-all duration-500"
                title={`Merged PRs: ${mergedCount}`}
              />
            )}
            {closedNoMergeCount > 0 && (
              <div
                style={{ width: `${closedPct}%` }}
                className="h-full bg-muted rounded-r-full transition-all duration-500"
                title={`Closed W/O Merge: ${closedNoMergeCount}`}
              />
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-ink">{openCount}</span>
              <span className="text-muted font-semibold text-[12px]">Open PRs</span>
              <div className="flex items-center gap-2 text-[12px] text-muted mt-1">
                <span>Reviewed <strong className="text-ink">{summary?.reviewed ?? 0}</strong></span>
                <span>Unreviewed <strong className="text-ink">{summary?.unreviewed ?? 0}</strong></span>
              </div>
            </div>

            <div className="flex flex-col items-center border-x border-ink/10 px-1">
              <span className="text-xl font-bold text-ink">{mergedCount}</span>
              <span className="text-muted font-semibold text-[12px]">Merged PRs</span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-ink">{closedNoMergeCount}</span>
              <span className="text-muted font-semibold text-[12px]">Closed W/O Merge</span>
            </div>
          </div>
        </div>

        <div className="border-t border-ink/10 pt-3 flex flex-col gap-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted font-medium">Average Time To Merge</span>
            <span className="text-ink font-bold">{summary?.avgTimeToMerge || "0h 0m"}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted font-medium">First-Time Pass Rate</span>
            <div className="flex items-center gap-1.5">
              <span className="text-ink font-bold">{summary?.firstTimePassRate || "0%"}</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}

export default PullRequestsSummaryCard;
