import { useState, useEffect } from "react";
import { Kanban, FileCode2, Layers } from "lucide-react";
import { FaGithub } from "react-icons/fa";

function IntegrationsPage({ onOpenJiraModal, onOpenGithubModal, onOpenCapacityPlanning, onOpenRolesAndBilling }) {
  const [jiraConnected, setJiraConnected] = useState(false);
  const [githubConnected, setGithubConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const companyName = localStorage.getItem("companyName") || "";

  // --- Integration Status Check ---
  const checkStatuses = async () => {
    if (!companyName) return;
    setLoading(true);
    try {
      // Check Jira
      const jiraRes = await fetch(`http://127.0.0.1:8000/jira/connection/${companyName}`).catch(() => null);
      if (jiraRes?.ok) {
        const data = await jiraRes.json();
        setJiraConnected(Boolean(data?.connected));
      }
      // Check GitHub
      const githubRes = await fetch(`http://127.0.0.1:8000/github/connection/${companyName}`).catch(() => null);
      if (githubRes?.ok) {
        const ghData = await githubRes.json();
        setGithubConnected(Boolean(ghData?.connected));
      }
    } catch (err) {
      console.error("Error checking integration status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatuses();
    const handleUpdate = () => checkStatuses();
    window.addEventListener("githubConnectionUpdated", handleUpdate);
    window.addEventListener("jiraProjectsUpdated", handleUpdate);
    return () => {
      window.removeEventListener("githubConnectionUpdated", handleUpdate);
      window.removeEventListener("jiraProjectsUpdated", handleUpdate);
    };
  }, [companyName]);

  return (
    <div className="w-full min-h-full bg-transparent text-slate-100 p-6 md:p-8 lg:p-10 font-sans">
      <div className="max-w-6xl mx-auto">

        {/* 1. Ticket Sources Section */}
        <section className="space-y-4 mb-10">
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Kanban size={20} className="text-[#999999]" />
            <span>Ticket Sources</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div 
              onClick={onOpenJiraModal}
              className={`group p-6 bg-[#0c0c0e]/90 backdrop-blur-xl border rounded-3xl transition-all duration-300 cursor-pointer shadow-2xl flex items-center justify-between ${
                jiraConnected ? "border-white/40 bg-[#141418]" : "border-[#1e1e24] hover:border-white/20 hover:bg-[#121216]"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#141418] border border-[#24242c] flex items-center justify-center text-white font-black text-2xl group-hover:scale-105 transition-transform shadow-inner shrink-0">
                  J
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Jira Software</h3>
                  <p className="text-sm text-[#999999] mt-0.5 leading-relaxed">
                    Sync issues, epics, sprint boards, and status completions
                  </p>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenJiraModal();
                }}
                className={`px-6 py-2.5 rounded-full font-bold text-xs transition-all shadow-md shrink-0 cursor-pointer ${
                  jiraConnected
                    ? "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                    : "bg-white hover:bg-neutral-200 text-black shadow-white/10 active:scale-95"
                }`}
              >
                {jiraConnected ? "Configured" : "Connect"}
              </button>
            </div>
          </div>
        </section>

        {/* 2. Code Sources Section */}
        <section className="space-y-4 mb-10">
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <FileCode2 size={20} className="text-[#999999]" />
            <span>Code Sources</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div 
              onClick={onOpenGithubModal}
              className={`group p-6 bg-[#0c0c0e]/90 backdrop-blur-xl border rounded-3xl transition-all duration-300 cursor-pointer shadow-2xl flex items-center justify-between ${
                githubConnected ? "border-white/40 bg-[#141418]" : "border-[#1e1e24] hover:border-white/20 hover:bg-[#121216]"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#141418] border border-[#24242c] flex items-center justify-center text-white text-2xl group-hover:scale-105 transition-transform shadow-inner shrink-0">
                  <FaGithub />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">GitHub Repositories</h3>
                  <p className="text-sm text-[#999999] mt-0.5 leading-relaxed">
                    Sync pull requests, commits, branches, and code metrics
                  </p>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenGithubModal();
                }}
                className={`px-6 py-2.5 rounded-full font-bold text-xs transition-all shadow-md shrink-0 cursor-pointer ${
                  githubConnected
                    ? "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                    : "bg-white hover:bg-neutral-200 text-black shadow-white/10 active:scale-95"
                }`}
              >
                {githubConnected ? "Configured" : "Connect"}
              </button>
            </div>
          </div>
        </section>

        {/* 3. Capacity Planning Section */}
        <section className="space-y-4">
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Layers size={20} className="text-[#999999]" />
            <span>Capacity Planning</span>
          </h2>

          <div className="p-6 bg-[#0c0c0e]/90 backdrop-blur-xl border border-[#1e1e24] rounded-3xl shadow-2xl flex flex-wrap items-center gap-4">
            <button
              onClick={() => onOpenCapacityPlanning?.()}
              className="px-5 py-2.5 bg-[#141418] hover:bg-[#1c1c24] border border-[#27272a] hover:border-white/30 rounded-xl text-xs md:text-sm font-semibold text-white transition-all cursor-pointer shadow-md"
            >
              Capacity Planning
            </button>

            <button
              onClick={() => onOpenRolesAndBilling?.()}
              className="px-5 py-2.5 bg-[#141418] hover:bg-[#1c1c24] border border-[#27272a] hover:border-white/30 rounded-xl text-xs md:text-sm font-semibold text-slate-300 hover:text-white transition-all cursor-pointer shadow-md"
            >
              Roles & Rate Card
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}

export default IntegrationsPage;
