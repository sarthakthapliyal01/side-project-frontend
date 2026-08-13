import { useEffect, useState } from "react";

function DashboardCard({ title, children, className = "", headerRight = null, infoText = null }) {
  return (
    <div className={`bg-[#0c0c0e]/90 backdrop-blur-xl rounded-3xl p-6 md:p-7 border border-[#1e1e24] shadow-2xl hover:border-white/20 transition-all duration-300 flex flex-col h-full overflow-hidden ${className}`}>
      <h3 className="text-white text-base md:text-xl font-bold tracking-tight mb-4 flex items-center justify-between shrink-0 gap-2">
        <span className="pt-0.5 flex items-center gap-1.5 min-w-0">
          <span className="truncate">{title}</span>
          {infoText && (
            <span className="group relative cursor-pointer text-slate-400 hover:text-white transition-colors">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-[#1c1c24] text-xs text-slate-200 px-3 py-1.5 rounded-lg shadow-xl border border-white/10 whitespace-nowrap z-50">
                {infoText}
              </span>
            </span>
          )}
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

const DEFAULT_STATUS_CONFIG = [
  { key: "QA - Inprogress", label: "QA - Inprogress", color: "#4ade80", defaultCount: 4 },
  { key: "Development", label: "Development", color: "#f43f5e", defaultCount: 6 },
  { key: "Closed", label: "Closed", color: "#f97316", defaultCount: 4 },
  { key: "In-Progress", label: "In-Progress", color: "#06b6d4", defaultCount: 5 },
  { key: "To Do", label: "To Do", color: "#3b82f6", defaultCount: 5 },
];

function JiraStatusCard({ currentSprint }) {
  const [sortMode, setSortMode] = useState("default"); // 'default', 'asc', 'desc'
  const [activeSprintId, setActiveSprintId] = useState(() => {
    const saved = localStorage.getItem("selectedSprint");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return String(parsed?.sprintId || parsed?.id || "");
      } catch {}
    }
    return currentSprint || "";
  });

  const [statusCounts, setStatusCounts] = useState({
    "QA - Inprogress": 4,
    "Development": 6,
    "Closed": 4,
    "In-Progress": 5,
    "To Do": 5,
  });
  const [hoveredKey, setHoveredKey] = useState(null);

  // Listen to Topbar sprint selection changes dynamically
  useEffect(() => {
    const handleSprintSelected = (e) => {
      const sprint = e?.detail;
      if (sprint) {
        const sid = String(sprint.sprintId || sprint.id || sprint.name || "");
        setActiveSprintId(sid);
      } else {
        setActiveSprintId("");
      }
    };

    window.addEventListener("sprintSelected", handleSprintSelected);
    return () => window.removeEventListener("sprintSelected", handleSprintSelected);
  }, []);

  // Fetch Jira sprint issue status breakdown whenever active sprint changes
  useEffect(() => {
    const companyName = localStorage.getItem("companyName");
    if (!companyName) return;

    const targetSprint = activeSprintId || currentSprint;
    const url = targetSprint
      ? `http://127.0.0.1:8000/jira/db-sprint-issues/${companyName}?sprint_id=${targetSprint}`
      : `http://127.0.0.1:8000/jira/db-sprint-issues/${companyName}`;

    fetch(url)
      .then((res) => res.ok && res.json())
      .then((data) => {
        if (data?.issues && Array.isArray(data.issues)) {
          const counts = {
            "QA - Inprogress": 0,
            "Development": 0,
            "Closed": 0,
            "In-Progress": 0,
            "To Do": 0,
          };

          data.issues.forEach((issue) => {
            let statusName = "";
            if (typeof issue.status === "string") statusName = issue.status;
            else if (issue.status?.name) statusName = issue.status.name;

            const s = statusName.toLowerCase().trim();
            if (s.includes("qa") || s.includes("testing") || s.includes("test")) {
              counts["QA - Inprogress"] += 1;
            } else if (s.includes("dev") || s.includes("development") || s.includes("code review") || s.includes("review")) {
              counts["Development"] += 1;
            } else if (s.includes("close") || s.includes("done") || s.includes("resolve") || s.includes("complete")) {
              counts["Closed"] += 1;
            } else if (s.includes("in-progress") || s.includes("in progress") || s.includes("inprogress") || s.includes("wip") || s.includes("doing")) {
              counts["In-Progress"] += 1;
            } else {
              counts["To Do"] += 1;
            }
          });

          const total = Object.values(counts).reduce((a, b) => a + b, 0);

          if (total > 0) {
            setStatusCounts(counts);
          } else {
            // Fallback baseline when sprint has no issues synced yet
            setStatusCounts({
              "QA - Inprogress": 4,
              "Development": 6,
              "Closed": 4,
              "In-Progress": 5,
              "To Do": 5,
            });
          }
        }
      })
      .catch((err) => console.error("Error fetching Jira status issues:", err));
  }, [activeSprintId, currentSprint]);

  // Compute items list based on sortMode
  let items = DEFAULT_STATUS_CONFIG.map((cfg) => ({
    ...cfg,
    count: statusCounts[cfg.key] ?? cfg.defaultCount,
  }));

  if (sortMode === "asc") {
    items = [...items].sort((a, b) => a.count - b.count);
  } else if (sortMode === "desc") {
    items = [...items].sort((a, b) => b.count - a.count);
  }

  const maxVal = Math.max(...items.map((i) => i.count), 8);
  const step = Math.max(2, Math.ceil(maxVal / 4));
  const ticks = [0, step, step * 2, step * 3, step * 4];
  const maxScale = ticks[ticks.length - 1] || maxVal || 8;

  const headerRight = (
    <div className="flex items-center gap-2 shrink-0 mr-6 md:mr-8">
      <button
        onClick={() => setSortMode("default")}
        className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 ${
          sortMode === "default"
            ? "bg-white text-black shadow-md shadow-white/10"
            : "text-slate-400 hover:text-white"
        }`}
      >
        Default
      </button>
      <button
        onClick={() => setSortMode("asc")}
        className={`px-2 py-1 text-xs font-medium transition-all duration-200 ${
          sortMode === "asc"
            ? "bg-white text-black px-3 font-semibold rounded-full shadow-md shadow-white/10"
            : "text-slate-400 hover:text-white"
        }`}
      >
        ASC
      </button>
      <button
        onClick={() => setSortMode("desc")}
        className={`px-2 py-1 text-xs font-medium transition-all duration-200 ${
          sortMode === "desc"
            ? "bg-white text-black px-3 font-semibold rounded-full shadow-md shadow-white/10"
            : "text-slate-400 hover:text-white"
        }`}
      >
        DSC
      </button>
    </div>
  );

  return (
    <DashboardCard title="Jira" infoText="Sprint issue breakdown by workflow status" headerRight={headerRight} className="col-span-12 md:col-span-4 row-span-1 h-full">
      <div className="flex flex-col h-full justify-center py-2 md:py-3 pl-7 md:pl-9 pr-6 md:pr-8 gap-5 md:gap-6">
        {/* Bars Container */}
        <div className="flex flex-col gap-5 md:gap-6 my-auto">
          {items.map((item) => {
            const pct = item.count > 0 ? Math.min(100, Math.max(6, (item.count / maxScale) * 100)) : 0;
            const isHovered = hoveredKey === item.key;
            const showTooltip = isHovered || (hoveredKey === null && item.key === "Development");

            return (
              <div
                key={item.key}
                className="flex items-center group relative cursor-pointer"
                onMouseEnter={() => setHoveredKey(item.key)}
                onMouseLeave={() => setHoveredKey(null)}
              >
                {/* Status Label (Shifted Right with Left Padding) */}
                <span className="w-28 md:w-32 text-xs md:text-sm font-medium text-slate-300 shrink-0 text-left pr-3 truncate group-hover:text-white transition-colors">
                  {item.label}
                </span>

                {/* Progress Bar Track */}
                <div className="flex-1 max-w-[65%] md:max-w-[68%] relative h-2 md:h-2.5 bg-[#18181c] border border-white/5 rounded-full flex items-center">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out relative"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: item.color,
                      boxShadow: isHovered ? `0 0 12px ${item.color}aa` : "none",
                    }}
                  />

                  {/* Interactive Tooltip Badge matching black/white theme */}
                  {showTooltip && (
                    <div
                      className="absolute z-30 pointer-events-none animate-in fade-in zoom-in-95 duration-150"
                      style={{ left: `${Math.max(25, Math.min(85, pct))}%`, top: "-32px", transform: "translateX(-50%)" }}
                    >
                      <div className="bg-[#18181d] border border-white/20 text-white text-[11px] md:text-xs font-semibold px-2.5 py-0.5 rounded-md shadow-2xl flex items-center gap-1.5 whitespace-nowrap">
                        <span className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                        <span>{item.label}: {item.count}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* X-Axis Horizontal Numeric Scale */}
        <div className="flex items-center text-slate-400 text-xs font-mono font-medium pt-1">
          <div className="w-28 md:w-32 shrink-0" />
          <div className="flex-1 max-w-[65%] md:max-w-[68%] relative h-5">
            {ticks.map((t, idx) => {
              const posPct = (idx / (ticks.length - 1)) * 100;
              let transformClass = "-translate-x-1/2";
              if (idx === 0) transformClass = "translate-x-0";
              else if (idx === ticks.length - 1) transformClass = "-translate-x-full";

              return (
                <span
                  key={t}
                  className={`absolute top-0.5 select-none text-[11px] md:text-xs text-slate-400 font-medium ${transformClass}`}
                  style={{ left: `${posPct}%` }}
                >
                  {t}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}

function Home() {
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState("");
  const [sprints, setSprints] = useState([]);
  const [currentSprint, setCurrentSprint] = useState("");
  const [loadingSprints, setLoadingSprints] = useState(false);

  //Project Data
  const fetchProjects = () => {
    const companyName = localStorage.getItem("companyName");
    if (!companyName) return;

    fetch(`http://127.0.0.1:8000/jira/selected-projects/${companyName}`)
      .then((res) => res.ok && res.json())
      .then((data) => {
        const projects = data.projects || data;
        if (Array.isArray(projects)) {
          setSelectedProjects(projects);
          if (projects.length > 0) {
            const savedProject = localStorage.getItem("currentProject");
            if (savedProject && projects.some((p) => String(p.projectId) === savedProject)) {
              setCurrentProject(savedProject);
            } else {
              setCurrentProject(String(projects[0].projectId));
            }
          } else {
            setCurrentProject("");
          }
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchProjects();

    const handleUpdate = () => fetchProjects();
    window.addEventListener("jiraProjectsUpdated", handleUpdate);
    return () => window.removeEventListener("jiraProjectsUpdated", handleUpdate);
  }, []);


  //Sprint Data
  useEffect(() => {
    const companyName = localStorage.getItem("companyName");
    if (!companyName) return;

    setLoadingSprints(true);
    setSprints([]);
    setCurrentSprint("");

    const url = currentProject
      ? `http://127.0.0.1:8000/jira/sprints/${companyName}?project_id=${currentProject}`
      : `http://127.0.0.1:8000/jira/sprints/${companyName}`;

    fetch(url)
      .then((res) => res.ok && res.json())
      .then((data) => {
        if (data?.sprints?.length > 0) {
          setSprints(data.sprints);
          setCurrentSprint(String(data.sprints[0].id || data.sprints[0].name));
        }
      })
      .catch((err) => console.error("Error fetching sprints:", err))
      .finally(() => setLoadingSprints(false));
  }, [currentProject]);

  return (
    <div className="w-full h-full bg-transparent font-sans text-white px-7 md:px-8 py-5 md:py-6 flex flex-col overflow-hidden box-border">
      <div className="grid grid-cols-12 grid-rows-2 gap-x-4 md:gap-x-5 gap-y-4 md:gap-y-5 h-full w-full overflow-hidden box-border">
        <DashboardCard title="Churn" className="col-span-12 md:col-span-5 row-span-1 h-full" />
        <DashboardCard title="Capacity" className="col-span-12 md:col-span-3 row-span-1 h-full" />
        <JiraStatusCard currentSprint={currentSprint} />
        <DashboardCard title="Burndown" className="col-span-12 md:col-span-6 row-span-1 h-full" />
        <DashboardCard title="Burnup" className="col-span-12 md:col-span-6 row-span-1 h-full" />
      </div>
    </div>
  );
}

export default Home;