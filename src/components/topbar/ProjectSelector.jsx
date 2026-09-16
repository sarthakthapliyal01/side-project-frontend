import React from "react";
import { LayoutGrid } from "lucide-react";

export default function ProjectSelector({ projects, selectedBoard, onProjectChange }) {
  return (
    <div className="flex items-center gap-2">
      <LayoutGrid size={16} className="text-muted shrink-0" />
      <select
        value={selectedBoard}
        onChange={(e) => onProjectChange(e.target.value)}
        className="bg-canvas border border-line text-ink text-xs font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent/40 cursor-pointer min-w-[140px] max-w-[200px] truncate"
        aria-label="Select active project"
      >
        {projects.length === 0 ? (
          <option value="">No Projects Synced</option>
        ) : (
          projects.map((p) => {
            const val = String(p.projectId || p.projectKey || p._id);
            return (
              <option key={val} value={val}>
                {p.projectName || p.name || p.projectKey}
              </option>
            );
          })
        )}
      </select>
    </div>
  );
}
