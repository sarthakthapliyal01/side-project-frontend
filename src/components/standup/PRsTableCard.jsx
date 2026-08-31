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
      title="PRs"
      infoText="Pull request list with author, status, and reviewer details"
      className="col-span-12 lg:col-span-8 min-h-[320px]"
    >
      <div className="flex flex-col h-full justify-between overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[300px] scrollbar-thin scrollbar-thumb-white/10">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3">PR ID</th>
                <th className="py-2.5 px-3">TITLE</th>
                <th className="py-2.5 px-3">
                  <div className="flex items-center gap-1">
                    <span>AUTHOR</span>
                    <Filter className="w-3 h-3 text-slate-500 cursor-pointer hover:text-white" />
                  </div>
                </th>
                <th className="py-2.5 px-3">
                  <div className="flex items-center gap-1">
                    <span>STATUS</span>
                    <Filter className="w-3 h-3 text-slate-500 cursor-pointer hover:text-white" />
                  </div>
                </th>
                <th className="py-2.5 px-3">
                  <div className="flex items-center gap-1">
                    <span>MERGED</span>
                    <Filter className="w-3 h-3 text-slate-500 cursor-pointer hover:text-white" />
                  </div>
                </th>
                <th className="py-2.5 px-3">
                  <div className="flex items-center gap-1">
                    <span>DAYS OPEN</span>
                    <Filter className="w-3 h-3 text-slate-500 cursor-pointer hover:text-white" />
                  </div>
                </th>
                <th className="py-2.5 px-3">REVIEWER</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {currentPRs.map((pr, index) => (
                <tr key={pr.prId || index} className="hover:bg-white/[0.03] transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-[#3b82f6] cursor-pointer hover:underline">
                    {pr.prId}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-white max-w-[220px] truncate" title={pr.title}>
                    {pr.title}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 font-mono text-[11px]">
                    {pr.author}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${pr.status === "open" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-neutral-800 text-slate-300"
                      }`}>
                      {pr.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-white">
                    {pr.merged}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 font-mono text-center">
                    {pr.daysOpen}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 truncate max-w-[140px]" title={pr.reviewer}>
                    {pr.reviewer}
                  </td>
                </tr>
              ))}
              {currentPRs.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No pull requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Page Size:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-[#18181c] text-white border border-white/10 rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
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

            <div className="flex items-center gap-2 font-medium text-slate-300">
              <span>Page {currentPage} of {totalPages}</span>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
