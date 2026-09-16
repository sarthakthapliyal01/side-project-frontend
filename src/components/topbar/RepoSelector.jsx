import React from "react";

export default function RepoSelector({ selectedRepo, repos, onRepoChange }) {
  return (
    <select
      value={selectedRepo}
      onChange={(e) => onRepoChange(e.target.value)}
      className="bg-canvas border border-line text-ink text-xs font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent/40 cursor-pointer min-w-[130px] max-w-[180px] truncate"
      aria-label="Select active repository"
    >
      <option value="All repositories">All Repositories</option>
      {repos.map((repo) => {
        const repoName = typeof repo === "string" ? repo : repo.name || repo.fullName;
        return (
          <option key={repoName} value={repoName}>
            {repoName}
          </option>
        );
      })}
    </select>
  );
}
