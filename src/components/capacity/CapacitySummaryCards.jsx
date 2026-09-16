import React from "react";
import { Users, Clock, Target, Calendar } from "lucide-react";

export default function CapacitySummaryCards({
  memberCount,
  totalCapacityHrs,
  totalCapacitySP,
  workingDays,
  storyPointHrs,
  onStoryPointHrsChange
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Team Members */}
      <div className="bg-surface border border-line rounded-xl p-4 flex items-center gap-4 shadow-2xs">
        <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
          <Users size={20} />
        </div>
        <div>
          <span className="text-2xs font-semibold text-muted uppercase tracking-wider block">Team Members</span>
          <span className="text-xl font-bold text-ink">{memberCount}</span>
        </div>
      </div>

      {/* 2. Working Days */}
      <div className="bg-surface border border-line rounded-xl p-4 flex items-center gap-4 shadow-2xs">
        <div className="w-10 h-10 rounded-lg bg-success/10 text-success flex items-center justify-center shrink-0">
          <Calendar size={20} />
        </div>
        <div>
          <span className="text-2xs font-semibold text-muted uppercase tracking-wider block">Sprint Working Days</span>
          <span className="text-xl font-bold text-ink">{workingDays} Days</span>
        </div>
      </div>

      {/* 3. Total Capacity */}
      <div className="bg-surface border border-line rounded-xl p-4 flex items-center gap-4 shadow-2xs">
        <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
          <Clock size={20} />
        </div>
        <div>
          <span className="text-2xs font-semibold text-muted uppercase tracking-wider block">Total Capacity</span>
          <span className="text-xl font-bold text-ink">
            {totalCapacityHrs} hrs <span className="text-xs text-muted font-normal">({totalCapacitySP} SP)</span>
          </span>
        </div>
      </div>

      {/* 4. Hours per Story Point */}
      <div className="bg-surface border border-line rounded-xl p-4 flex items-center gap-4 shadow-2xs">
        <div className="w-10 h-10 rounded-lg bg-warning/10 text-warning flex items-center justify-center shrink-0">
          <Target size={20} />
        </div>
        <div className="flex-1">
          <span className="text-2xs font-semibold text-muted uppercase tracking-wider block">Hours / SP</span>
          <div className="flex items-center gap-2 mt-0.5">
            <input
              type="number"
              min="1"
              max="24"
              value={storyPointHrs}
              onChange={(e) => onStoryPointHrsChange(Number(e.target.value) || 8)}
              className="w-16 bg-canvas border border-line text-ink text-sm font-bold rounded-md px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
            <span className="text-xs text-muted font-medium">hrs = 1 SP</span>
          </div>
        </div>
      </div>
    </div>
  );
}
