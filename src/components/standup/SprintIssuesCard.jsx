import React, { useState, useEffect, useCallback } from "react";
import { Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { getActiveTargetParams } from "../../utils/targetHelper";

function SprintIssuesCard({ currentSprint, currentProject, currentRelease, isRelease, prs = [] }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadIssues = useCallback((signal) => {
    const { companyName, project: targetProject, sprint: targetSprint, release: relName, isRelMode } = getActiveTargetParams({
      currentSprint,
      currentProject,
      currentRelease,
      isRelease
    });

    if (!companyName) {
      setIssues([]);
      return;
    }

    setLoading(true);

    const params = new URLSearchParams();
    if (isRelMode) {
      if (relName) params.append("release_name", relName);
    } else {
      if (targetSprint) params.append("sprint_id", targetSprint);
    }
    if (targetProject) params.append("project_id", targetProject);
    params.append("_t", String(Date.now()));

    const queryString = params.toString();
    const primaryUrl = `http://127.0.0.1:8000/jira/sprint-issues/${companyName}?${queryString}`;

    fetch(primaryUrl, { signal })
      .then((res) => res.ok && res.json())
      .then((data) => {
        if (signal?.aborted) return;
        if (data?.issues && Array.isArray(data.issues)) {
          setIssues(data.issues);
        } else {
          setIssues([]);
        }
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setIssues([]);
      })
      .finally(() => {
        if (!signal?.aborted) {
          setLoading(false);
        }
      });
  }, [currentSprint, currentProject, currentRelease, isRelease]);

  useEffect(() => {
    let controller = new AbortController();
    loadIssues(controller.signal);

    const handleJiraUpdated = () => {
      controller.abort();
      controller = new AbortController();
      loadIssues(controller.signal);
    };

    window.addEventListener("sprintSelected", handleJiraUpdated);
    window.addEventListener("releaseSelected", handleJiraUpdated);
    window.addEventListener("projectSelected", handleJiraUpdated);
    window.addEventListener("filterTypeChanged", handleJiraUpdated);
    window.addEventListener("jiraProjectsUpdated", handleJiraUpdated);
    window.addEventListener("jiraIssuesUpdated", handleJiraUpdated);
    window.addEventListener("jiraSyncCompleted", handleJiraUpdated);

    return () => {
      controller.abort();
      window.removeEventListener("sprintSelected", handleJiraUpdated);
      window.removeEventListener("releaseSelected", handleJiraUpdated);
      window.removeEventListener("projectSelected", handleJiraUpdated);
      window.removeEventListener("filterTypeChanged", handleJiraUpdated);
      window.removeEventListener("jiraProjectsUpdated", handleJiraUpdated);
      window.removeEventListener("jiraIssuesUpdated", handleJiraUpdated);
      window.removeEventListener("jiraSyncCompleted", handleJiraUpdated);
    };
  }, [loadIssues]);

  const getIssueCategory = (iss) => {
    let s = "";
    if (typeof iss === "string") s = iss;
    else if (typeof iss?.status === "string") s = iss.status;
    else if (iss?.status?.name) s = iss.status.name;
    s = (s || "").toLowerCase().trim();

    if (s.includes("qa ready") || s.includes("ready for qa")) {
      return "QA Ready";
    } else if (s.includes("closed") || s.includes("done") || s.includes("resolved") || s.includes("completed")) {
      return "Closed";
    } else if (s.includes("dev") || s.includes("development") || s.includes("code review") || s.includes("review")) {
      return "Development";
    } else if (s.includes("qa") || s.includes("testing") || s.includes("test")) {
      return "QA - Inprogress";
    } else if (s.includes("in-progress") || s.includes("in progress") || s.includes("inprogress") || s.includes("wip")) {
      return "In-Progress";
    }
    return "To Do";
  };

  const statusCounts = {
    Closed: 0,
    Development: 0,
    "To Do": 0,
    "QA - Inprogress": 0,
    "In-Progress": 0,
    "QA Ready": 0,
  };

  issues.forEach((iss) => {
    const cat = getIssueCategory(iss);
    if (statusCounts[cat] !== undefined) {
      statusCounts[cat] += 1;
    }
  });

  const matchStatusFilter = (iss, filterKey) => {
    if (filterKey === "ALL") return true;
    const cat = getIssueCategory(iss);
    return cat === filterKey;
  };

  const filteredIssues = issues.filter((iss) => matchStatusFilter(iss, statusFilter));

  const totalRecords = filteredIssues.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const currentIssues = filteredIssues.slice(startIndex, startIndex + pageSize);

  const formatDueDate = (dateVal) => {
    if (!dateVal) return "N/A";
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      return d.toISOString().split("T")[0];
    } catch {
      return String(dateVal);
    }
  };

  const findPrId = (issKey) => {
    if (!issKey || !prs.length) return "NA";
    const keyLower = String(issKey).toLowerCase();
    const matched = prs.find((p) => (p.title || "").toLowerCase().includes(keyLower) || (p.prId || "").toLowerCase().includes(keyLower));
    return matched ? matched.prId : "NA";
  };

  const handlePillToggle = (key) => {
    if (statusFilter === key && key !== "ALL") {
      setStatusFilter("ALL");
    } else {
      setStatusFilter(key);
    }
    setCurrentPage(1);
  };

  const STATUS_PILLS = [
    { key: "ALL", label: `All (${issues.length})`, count: issues.length, dotBg: "bg-hover", border: "border-line", text: "text-ink" },
    { key: "Closed", label: "Closed", count: statusCounts.Closed, dotBg: "bg-success", border: "border-success/30", text: "text-success" },
    { key: "Development", label: "Development", count: statusCounts.Development, dotBg: "bg-purple", border: "border-purple/30", text: "text-purple" },
    { key: "To Do", label: "To Do", count: statusCounts["To Do"], dotBg: "bg-warning", border: "border-warning/30", text: "text-warning" },
    { key: "QA - Inprogress", label: "QA - Inprogress", count: statusCounts["QA - Inprogress"], dotBg: "bg-cyan", border: "border-cyan/30", text: "text-cyan" },
    { key: "In-Progress", label: "In-Progress", count: statusCounts["In-Progress"], dotBg: "bg-accent", border: "border-accent/30", text: "text-accent" },
    { key: "QA Ready", label: "QA Ready", count: statusCounts["QA Ready"], dotBg: "bg-warning", border: "border-warning/30", text: "text-warning" },
  ];

  const renderStatusBadge = (iss) => {
    const cat = getIssueCategory(iss);
    if (cat === "QA Ready") {
      return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-warning/10 text-warning border border-warning/20 whitespace-nowrap">QA Ready</span>;
    } else if (cat === "Closed") {
      return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-success/10 text-success border border-success/20 whitespace-nowrap">Closed</span>;
    } else if (cat === "Development") {
      return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple/10 text-purple border border-purple/20 whitespace-nowrap">Development</span>;
    } else if (cat === "QA - Inprogress") {
      return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan/10 text-cyan border border-cyan/20 whitespace-nowrap">QA - Inprogress</span>;
    } else if (cat === "In-Progress") {
      return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-accent/10 text-accent border border-accent/20 whitespace-nowrap">In-Progress</span>;
    }
    return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-warning/10 text-warning border border-warning/20 whitespace-nowrap">To Do</span>;
  };

  const renderTypeBadge = (typeName) => {
    const t = String(typeName || "").toLowerCase();
    if (t.includes("bug")) {
      return <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-danger/10 text-danger border border-danger/20">Bug</span>;
    } else if (t.includes("story")) {
      return <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-success/10 text-success border border-success/20">Story</span>;
    }
    return <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">Task</span>;
  };

  return (
    <div className="bg-surface/90  rounded-2xl p-5 md:p-6 border border-line shadow-none col-span-12 w-full font-sans overflow-hidden">
      {/* Top Status Pills Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-ink/10 pb-4">
        <div className="flex flex-wrap items-center gap-2.5">
          {STATUS_PILLS.map((pill) => {
            const isActive = statusFilter === pill.key;
            return (
              <button
                key={pill.key}
                onClick={() => handlePillToggle(pill.key)}
                className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-2 transition-all duration-200 cursor-pointer select-none active:scale-95 ${isActive
                  ? "bg-inverse text-on-inverse border-ink shadow-none font-bold scale-105"
                  : `${pill.border} bg-raised text-ink hover:border-ink/40 hover:bg-hover`
                  }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${pill.dotBg} shadow-sm`} />
                <span>
                  {pill.key === "ALL" ? (
                    <span className="font-bold">All ({issues.length})</span>
                  ) : (
                    <>
                      <span className={isActive ? "text-on-inverse font-bold" : "text-ink font-bold"}>
                        {pill.count}
                      </span>{" "}
                      <span className={isActive ? "text-muted" : "text-ink"}>{pill.label}</span>
                    </>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {statusFilter !== "ALL" && (
          <button
            onClick={() => setStatusFilter("ALL")}
            className="text-xs font-medium text-muted hover:text-ink underline transition cursor-pointer"
          >
            Clear Status Filter
          </button>
        )}
      </div>

      {/* Issues Table */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 min-h-[280px]">
        <table className="q-table w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-ink/10 text-ink font-bold uppercase tracking-wider bg-control/60 h-10">
              <th className="py-3.5 px-4 min-w-[90px]">ID</th>
              <th className="py-3.5 px-4 min-w-[110px]">
                <div className="flex items-center gap-1.5">
                  <span>TYPE</span>
                  <Filter className="w-3 h-3 text-muted cursor-pointer hover:text-ink" />
                </div>
              </th>
              <th className="py-3.5 px-4 min-w-[90px]">
                <div className="flex items-center gap-1.5">
                  <span>PR ID</span>
                  <Filter className="w-3 h-3 text-muted cursor-pointer hover:text-ink" />
                </div>
              </th>
              <th className="py-3.5 px-4 min-w-[120px]">
                <div className="flex items-center gap-1.5">
                  <span>DUE DATE</span>
                  <Filter className="w-3 h-3 text-muted cursor-pointer hover:text-ink" />
                </div>
              </th>
              <th className="py-3.5 px-4 min-w-[150px] text-center">{isRelease ? "RELEASE OUTCOMES" : "SPRINT OUTCOMES"}</th>
              <th className="py-3.5 px-4 min-w-[140px]">
                <div className="flex items-center gap-1.5">
                  <span>STATUS</span>
                  <Filter className="w-3 h-3 text-muted cursor-pointer hover:text-ink" />
                </div>
              </th>
              <th className="py-3.5 px-4 min-w-[280px]">SUMMARY</th>
              <th className="py-3.5 px-4 min-w-[150px]">
                <div className="flex items-center gap-1.5">
                  <span>ASSIGNED TO</span>
                  <Filter className="w-3 h-3 text-muted cursor-pointer hover:text-ink" />
                </div>
              </th>
              <th className="py-3.5 px-4 min-w-[110px]">
                <div className="flex items-center gap-1.5">
                  <span>BLOCKER</span>
                  <Filter className="w-3 h-3 text-muted cursor-pointer hover:text-ink" />
                </div>
              </th>
              <th className="py-3.5 px-4 min-w-[100px]">
                <div className="flex items-center gap-1.5">
                  <span>PRIORITY</span>
                  <Filter className="w-3 h-3 text-muted cursor-pointer hover:text-ink" />
                </div>
              </th>
              <th className="py-3.5 px-4 min-w-[100px] text-right">STORY POINTS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-ink">
            {currentIssues.map((iss, index) => {
              const issueKey = iss.key || iss.issueKey || (iss.issueId ? String(iss.issueId) : "");
              const issueType = typeof iss.type === "string" ? iss.type : iss.type?.name || "Task";
              const issueStatus = typeof iss.status === "string" ? iss.status : iss.status?.name || "To Do";
              const issueAssignee = iss.assignee || "Unassigned";
              const issuePriority = iss.priority || "Medium";
              const prId = findPrId(issueKey);
              const isBlocker = (iss.priority || "").toLowerCase() === "blocker" || (iss.priority || "").toLowerCase() === "highest";

              return (
                <tr key={iss.issueId || issueKey || index} className="hover:bg-inverse/[0.03] transition-colors h-12">
                  <td className="py-3.5 px-4 font-semibold text-accent cursor-pointer hover:underline whitespace-nowrap">
                    {issueKey}
                  </td>
                  <td className="py-3.5 px-4">
                    {renderTypeBadge(issueType)}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium text-ink">
                    {prId}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-success font-mono whitespace-nowrap">
                    {formatDueDate(iss.duedate)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="w-3 h-3 rounded-full bg-purple shadow-[0_0_8px_#a855f7] inline-block" title={isRelease ? "Release outcome" : "Sprint outcome"} />
                  </td>
                  <td className="py-3.5 px-4">
                    {renderStatusBadge(iss)}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-ink max-w-[320px] truncate" title={iss.summary}>
                    {iss.summary}
                  </td>
                  <td className="py-3.5 px-4 text-ink font-medium whitespace-nowrap">
                    {issueAssignee}
                  </td>
                  <td className="py-3.5 px-4 text-ink">
                    {isBlocker ? (
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-danger/20 text-danger border border-danger/30">Blocker</span>
                    ) : (
                      <span className="text-muted">No blocker</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-ink font-medium">
                    {issuePriority.toLowerCase() === "highest" || issuePriority.toLowerCase() === "high" ? (
                      <span className="text-danger font-bold">{issuePriority}</span>
                    ) : issuePriority.toLowerCase() === "medium" ? (
                      <span className="text-warning font-medium">{issuePriority}</span>
                    ) : (
                      <span className="text-muted">{issuePriority}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-ink text-right font-mono">
                    {iss.storyPoints ?? 0}
                  </td>
                </tr>
              );
            })}
            {currentIssues.length === 0 && (
              <tr>
                <td colSpan={11} className="py-12 text-center text-muted text-xs font-medium">
                  {loading ? "Loading issues from MongoDB..." : `No issues found matching status "${statusFilter}".`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-wrap items-center justify-between border-t border-ink/10 pt-3 mt-3 text-xs text-muted gap-3">
        <div>
          <span>Total Records: <strong className="text-ink font-bold">{totalRecords}</strong></span>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 min-w-0">
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap">Page Size:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-control text-ink border border-ink/10 rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer text-xs"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <span>
            {totalRecords > 0 ? `${startIndex + 1} to ${Math.min(startIndex + pageSize, totalRecords)} of ${totalRecords}` : "0 of 0"}
          </span>

          <div className="flex items-center gap-1.5 font-medium text-ink">
            <button
              title="First Page"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              className="p-1 rounded-lg hover:bg-inverse/10 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              title="Previous Page"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1 rounded-lg hover:bg-inverse/10 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-1.5 font-semibold text-xs">Page {currentPage} of {totalPages}</span>
            <button
              title="Next Page"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1 rounded-lg hover:bg-inverse/10 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              title="Last Page"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="p-1 rounded-lg hover:bg-inverse/10 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SprintIssuesCard;
