import React from "react";
import { User, Trash2 } from "lucide-react";

export default function CapacityMemberTable({
  members,
  roles,
  storyPointHrs,
  onUpdateMember,
  onRemoveMember,
  searchQuery,
  onSearchChange
}) {
  const filteredMembers = members.filter((m) =>
    (m.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.role || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-surface border border-line rounded-xl overflow-hidden shadow-2xs">
      <div className="p-4 border-b border-line flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <User size={18} className="text-muted" />
          <h2 className="text-sm font-bold text-ink">Team Member Allocation</h2>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-canvas border border-line text-ink text-xs rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent/40 w-48"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-ink">
          <thead className="bg-canvas text-muted text-2xs uppercase tracking-wider border-b border-line">
            <tr>
              <th className="py-3 px-4 font-semibold">Member</th>
              <th className="py-3 px-4 font-semibold">Role</th>
              <th className="py-3 px-4 font-semibold text-center">Daily Hrs</th>
              <th className="py-3 px-4 font-semibold text-center">Days Off</th>
              <th className="py-3 px-4 font-semibold text-right">Net Hrs</th>
              <th className="py-3 px-4 font-semibold text-right">Net SP</th>
              <th className="py-3 px-4 font-semibold text-center w-12">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted font-medium">
                  No team members found. Click "+ Add Member" to allocate capacity.
                </td>
              </tr>
            ) : (
              filteredMembers.map((m, idx) => {
                const dailyHrs = Number(m.dailyHrs) || 8;
                const daysOff = Number(m.daysOff) || 0;
                const workingDays = Number(m.workingDays) || 10;
                const netDays = Math.max(0, workingDays - daysOff);
                const netHrs = netDays * dailyHrs;
                const netSP = storyPointHrs > 0 ? (netHrs / storyPointHrs).toFixed(1) : "0.0";

                return (
                  <tr key={m.id || m.email || idx} className="hover:bg-hover/50 transition-colors">
                    <td className="py-3 px-4 font-medium flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-accent/10 text-accent font-bold flex items-center justify-center text-2xs">
                        {(m.name || "U").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="block text-ink font-semibold">{m.name}</span>
                        {m.email && <span className="block text-2xs text-muted">{m.email}</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={m.role || "Developer"}
                        onChange={(e) => onUpdateMember(m.id, "role", e.target.value)}
                        className="bg-canvas border border-line text-ink text-xs rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-accent"
                      >
                        {roles.map((r) => (
                          <option key={r.role || r} value={r.role || r}>
                            {r.role || r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="number"
                        min="0"
                        max="24"
                        value={m.dailyHrs}
                        onChange={(e) => onUpdateMember(m.id, "dailyHrs", Number(e.target.value))}
                        className="w-14 bg-canvas border border-line text-ink text-xs text-center rounded-md py-1 focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="number"
                        min="0"
                        max={workingDays}
                        value={m.daysOff}
                        onChange={(e) => onUpdateMember(m.id, "daysOff", Number(e.target.value))}
                        className="w-14 bg-canvas border border-line text-ink text-xs text-center rounded-md py-1 focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-ink">{netHrs} hrs</td>
                    <td className="py-3 px-4 text-right font-bold text-accent">{netSP} SP</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => onRemoveMember(m.id)}
                        className="text-muted hover:text-danger p-1 rounded-md transition-colors"
                        title="Remove member"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
