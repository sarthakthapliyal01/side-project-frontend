import React, { useState } from "react";
import { Filter, ChevronLeft, ChevronRight } from "lucide-react";
import DashboardCard from "./DashboardCard";

function PRsTableCard({ prs = [] }) {
  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPRs = prs.length;
  const totalPages = Math.ceil(totalPRs / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const currentPRs = prs.slice(startIndex, startIndex + pageSize);

  return (
    <DashboardCard
      title="Pull requests"
      infoText="Pull request list with author, status, and reviewer details"
      className="q-card--prs"
    >
      <div className="flex flex-col h-full justify-between overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[300px] scrollbar-thin scrollbar-thumb-white/10">
          <table className="q-table w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-ink/10 text-muted font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3">PR ID</th>
                <th className="py-2.5 px-3">TITLE</th>
                <th className="py-2.5 px-3">
                  <div className="flex items-center gap-1">
                    <span>AUTHOR</span>
                    <Filter className="w-3 h-3 text-muted cursor-pointer hover:text-ink" />
                  </div>
                </th>
                <th className="py-2.5 px-3">
                  <div className="flex items-center gap-1">
                    <span>STATUS</span>
                    <Filter className="w-3 h-3 text-muted cursor-pointer hover:text-ink" />
                  </div>
                </th>
                <th className="py-2.5 px-3">
                  <div className="flex items-center gap-1">
                    <span>MERGED</span>
                    <Filter className="w-3 h-3 text-muted cursor-pointer hover:text-ink" />
                  </div>
                </th>
                <th className="py-2.5 px-3">
                  <div className="flex items-center gap-1">
                    <span>DAYS OPEN</span>
                    <Filter className="w-3 h-3 text-muted cursor-pointer hover:text-ink" />
                  </div>
                </th>
                <th className="py-2.5 px-3">REVIEWER</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-ink">
              {currentPRs.map((pr, index) => (
                <tr key={pr.prId || index} className="hover:bg-inverse/[0.03] transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-accent cursor-pointer hover:underline">
                    {pr.prId}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-ink max-w-[220px] truncate" title={pr.title}>
                    {pr.title}
                  </td>
                  <td className="py-2.5 px-3 text-ink font-mono text-[12px]">
                    {pr.author}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[12px] font-bold ${pr.status === "open" ? "bg-success/20 text-success border border-success/30" : "bg-control text-ink"
                      }`}>
                      {pr.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-ink">
                    {pr.merged}
                  </td>
                  <td className="py-2.5 px-3 text-ink font-mono text-center">
                    {pr.daysOpen}
                  </td>
                  <td className="py-2.5 px-3 text-muted truncate max-w-[140px]" title={pr.reviewer}>
                    {pr.reviewer}
                  </td>
                </tr>
              ))}
              {currentPRs.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted">
                    No pull requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="q-table-footer">
          <div className="flex items-center gap-2">
            <span>Page Size:</span>
            <select
              aria-label="Pull requests per page" value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-control text-ink border border-ink/10 rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <span>
              {totalPRs > 0 ? `${startIndex + 1} to ${Math.min(startIndex + pageSize, totalPRs)} of ${totalPRs}` : "0 of 0"}
            </span>

            <div className="flex items-center gap-2 font-medium text-ink">
              <span>Page {currentPage} of {totalPages}</span>
              <button
                aria-label="Previous PR page" disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded-lg hover:bg-inverse/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                aria-label="Next PR page" disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 rounded-lg hover:bg-inverse/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}

export default PRsTableCard;
