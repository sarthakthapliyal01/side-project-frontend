import { PageHeader } from "../components/ui/ProductUI";
import React, { useState, useEffect } from "react";
import {
  ChurnCard,
  CapacityCard,
  JiraStatusCard,
  PullRequestsSummaryCard,
  PRsTableCard,
  SprintIssuesCard,
  ReleaseBurndownCard,
} from "../components/standup/index";

function ReleasePage({ user, companyName, onOpenCapacityDetails }) {
  const [currentProject, setCurrentProject] = useState(() => localStorage.getItem("currentProject") || "");
  const [currentRelease, setCurrentRelease] = useState(() => {
    const saved = localStorage.getItem("selectedRelease");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return String(parsed?.releaseName || parsed?.name || parsed?.id || "");
      } catch {}
    }
    return "";
  });

  const [selectedRepo, setSelectedRepo] = useState(() => localStorage.getItem("selectedRepo") || "All repositories");
  const [prData, setPrData] = useState({
    summary: {
      totalPRs: 0,
      openPRs: 0,
      reviewed: 0,
      unreviewed: 0,
      mergedPRs: 0,
      closedNoMerge: 0,
      avgTimeToMerge: "0h 0m",
      firstTimePassRate: "0%"
    },
    prs: []
  });

  useEffect(() => {
    const handleProjectSelected = (e) => {
      if (e?.detail) setCurrentProject(String(e.detail));
    };
    const handleReleaseSelected = (e) => {
      const relObj = e?.detail;
      if (relObj) {
        const rName = String(relObj.releaseName || relObj.name || relObj.id || "");
        setCurrentRelease(rName);
      }
    };
    const handleSprintSelected = (e) => {
      const obj = e?.detail;
      if (obj && obj.isRelease) {
        const rName = String(obj.releaseName || obj.name || obj.id || "");
        setCurrentRelease(rName);
      }
    };
    const handleRepoSelected = (e) => {
      const repo = e?.detail || "All repositories";
      setSelectedRepo(repo);
    };

    window.addEventListener("projectSelected", handleProjectSelected);
    window.addEventListener("releaseSelected", handleReleaseSelected);
    window.addEventListener("sprintSelected", handleSprintSelected);
    window.addEventListener("repoSelected", handleRepoSelected);

    return () => {
      window.removeEventListener("projectSelected", handleProjectSelected);
      window.removeEventListener("releaseSelected", handleReleaseSelected);
      window.removeEventListener("sprintSelected", handleSprintSelected);
      window.removeEventListener("repoSelected", handleRepoSelected);
    };
  }, []);

  const fetchPRData = () => {
    const compName = companyName || localStorage.getItem("companyName");
    if (!compName) return;

    const url = selectedRepo && selectedRepo !== "All repositories"
      ? `http://127.0.0.1:8000/github/prs/${compName}?repo_name=${encodeURIComponent(selectedRepo)}`
      : `http://127.0.0.1:8000/github/prs/${compName}`;

    fetch(url)
      .then((res) => res.ok && res.json())
      .then((data) => {
        if (data?.summary && data?.prs) {
          setPrData(data);
        }
      })
      .catch((err) => console.error("Error fetching PR data:", err));
  };

  useEffect(() => {
    fetchPRData();
    const handleUpdate = () => fetchPRData();
    window.addEventListener("githubReposUpdated", handleUpdate);
    window.addEventListener("githubPrsUpdated", handleUpdate);
    return () => {
      window.removeEventListener("githubReposUpdated", handleUpdate);
      window.removeEventListener("githubPrsUpdated", handleUpdate);
    };
  }, [selectedRepo, companyName]);

  return (
    <div className="q-page">
      <PageHeader eyebrow="Release overview" title="Release intelligence" description="Scope, capacity, and pull requests for your selected release." /><div className="q-dashboard">
        {/* 1. Release Churn Card */}
        <ChurnCard
          currentProject={currentProject}
          currentRelease={currentRelease}
          isRelease={true}
        />

        {/* 2. Release Capacity Card */}
        <CapacityCard
          currentProject={currentProject}
          currentRelease={currentRelease}
          isRelease={true}
          onOpenCapacityDetails={onOpenCapacityDetails}
        />

        {/* 3. Release Status / Issues Breakdown Card */}
        <JiraStatusCard
          currentProject={currentProject}
          currentRelease={currentRelease}
          isRelease={true}
        />

        {/* 4. Release Burndown Card (span 4) */}
        <ReleaseBurndownCard
          currentRelease={currentRelease}
          currentProject={currentProject}
        />


        {/* 4. Pull Requests Summary Card */}
        <PullRequestsSummaryCard summary={prData.summary} />

        {/* 5. PRs Table Card */}
        <PRsTableCard prs={prData.prs} />

        {/* 6. Release Issues Table Card */}
        <SprintIssuesCard
          currentProject={currentProject}
          currentRelease={currentRelease}
          isRelease={true}
          prs={prData.prs}
        />
      </div>
    </div>
  );
}

export default ReleasePage;
