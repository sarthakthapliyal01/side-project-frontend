import React from "react";

export default function SprintReleaseSelector({
  selectedFilterType,
  onFilterTypeChange,
  sprints,
  selectedSprintId,
  onSprintChange,
  releases,
  selectedReleaseName,
  onReleaseChange
}) {
  return (
    <div className="flex items-center gap-2">
      {/* Filter type switcher: Sprint vs Release */}
      <div className="flex items-center bg-canvas border border-line rounded-lg p-0.5">
        <button
          type="button"
          onClick={() => onFilterTypeChange("Sprint")}
          className={`px-2.5 py-1 text-2xs font-bold rounded-md transition-colors ${
            selectedFilterType === "Sprint"
              ? "bg-accent text-white shadow-xs"
              : "text-muted hover:text-ink"
          }`}
        >
          Sprint
        </button>
        <button
          type="button"
          onClick={() => onFilterTypeChange("Release")}
          className={`px-2.5 py-1 text-2xs font-bold rounded-md transition-colors ${
            selectedFilterType === "Release"
              ? "bg-accent text-white shadow-xs"
              : "text-muted hover:text-ink"
          }`}
        >
          Release
        </button>
      </div>

      {/* Target Dropdown */}
      {selectedFilterType === "Sprint" ? (
        <select
          value={selectedSprintId}
          onChange={(e) => onSprintChange(e.target.value)}
          className="bg-canvas border border-line text-ink text-xs font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent/40 cursor-pointer min-w-[140px] max-w-[200px] truncate"
          aria-label="Select active sprint"
        >
          {sprints.length === 0 ? (
            <option value="">No Sprints Found</option>
          ) : (
            sprints.map((s) => {
              const sid = String(s.sprintId || s.id || s._id);
              return (
                <option key={sid} value={sid}>
                  {s.name || s.sprintName || `Sprint ${sid}`}
                </option>
              );
            })
          )}
        </select>
      ) : (
        <select
          value={selectedReleaseName}
          onChange={(e) => onReleaseChange(e.target.value)}
          className="bg-canvas border border-line text-ink text-xs font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent/40 cursor-pointer min-w-[140px] max-w-[200px] truncate"
          aria-label="Select active release"
        >
          {releases.length === 0 ? (
            <option value="">No Releases Found</option>
          ) : (
            releases.map((r) => {
              const rName = String(r.releaseName || r.name || r.id);
              return (
                <option key={rName} value={rName}>
                  {rName}
                </option>
              );
            })
          )}
        </select>
      )}
    </div>
  );
}
