import React, { useState } from "react";
import { X, Save, Plus, Trash2 } from "lucide-react";

export default function CapacitySettingsModal({
  isOpen,
  onClose,
  roles,
  onSaveRoles,
  holidays,
  onSaveHolidays
}) {
  const [activeTab, setActiveTab] = useState("roles");
  const [localRoles, setLocalRoles] = useState(roles);
  const [localHolidays, setLocalHolidays] = useState(holidays);

  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleRate, setNewRoleRate] = useState(30);

  const [newHolidayName, setNewHolidayName] = useState("");
  const [newHolidayDate, setNewHolidayDate] = useState("");

  if (!isOpen) return null;

  const handleAddRole = () => {
    if (!newRoleName.trim()) return;
    const updated = [...localRoles, { role: newRoleName.trim(), billingRate: Number(newRoleRate) || 0 }];
    setLocalRoles(updated);
    setNewRoleName("");
    setNewRoleRate(30);
  };

  const handleRemoveRole = (index) => {
    const updated = localRoles.filter((_, idx) => idx !== index);
    setLocalRoles(updated);
  };

  const handleAddHoliday = () => {
    if (!newHolidayName.trim() || !newHolidayDate) return;
    const updated = [...localHolidays, { name: newHolidayName.trim(), date: newHolidayDate }];
    setLocalHolidays(updated);
    setNewHolidayName("");
    setNewHolidayDate("");
  };

  const handleRemoveHoliday = (index) => {
    const updated = localHolidays.filter((_, idx) => idx !== index);
    setLocalHolidays(updated);
  };

  const handleSaveAll = () => {
    onSaveRoles(localRoles);
    onSaveHolidays(localHolidays);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface border border-line rounded-2xl w-full max-w-lg overflow-hidden shadow-xl animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 border-b border-line flex items-center justify-between">
          <h2 className="text-base font-bold text-ink">Capacity Configuration Settings</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink p-1 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-line bg-canvas px-4 pt-2">
          <button
            onClick={() => setActiveTab("roles")}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${
              activeTab === "roles"
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            Role Billing Rates
          </button>
          <button
            onClick={() => setActiveTab("holidays")}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${
              activeTab === "holidays"
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            Company Holidays
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[350px] overflow-y-auto">
          {activeTab === "roles" ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Role Title (e.g. Senior Dev)"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="flex-1 bg-canvas border border-line text-ink text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
                <input
                  type="number"
                  placeholder="Hourly Rate ($)"
                  value={newRoleRate}
                  onChange={(e) => setNewRoleRate(e.target.value)}
                  className="w-28 bg-canvas border border-line text-ink text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
                <button
                  type="button"
                  onClick={handleAddRole}
                  className="bg-accent text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-accent/90"
                >
                  <Plus size={14} /> Add
                </button>
              </div>

              <div className="space-y-2">
                {localRoles.map((r, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-canvas border border-line p-2.5 rounded-lg text-xs"
                  >
                    <span className="font-semibold text-ink">{r.role}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-muted">${r.billingRate}/hr</span>
                      <button
                        onClick={() => handleRemoveRole(idx)}
                        className="text-muted hover:text-danger"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Holiday Name (e.g. New Year)"
                  value={newHolidayName}
                  onChange={(e) => setNewHolidayName(e.target.value)}
                  className="flex-1 bg-canvas border border-line text-ink text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
                <input
                  type="date"
                  value={newHolidayDate}
                  onChange={(e) => setNewHolidayDate(e.target.value)}
                  className="bg-canvas border border-line text-ink text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
                <button
                  type="button"
                  onClick={handleAddHoliday}
                  className="bg-accent text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-accent/90"
                >
                  <Plus size={14} /> Add
                </button>
              </div>

              <div className="space-y-2">
                {localHolidays.map((h, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-canvas border border-line p-2.5 rounded-lg text-xs"
                  >
                    <span className="font-semibold text-ink">{h.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-muted">{h.date}</span>
                      <button
                        onClick={() => handleRemoveHoliday(idx)}
                        className="text-muted hover:text-danger"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-line bg-canvas flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-line text-muted hover:text-ink text-xs font-bold rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveAll}
            className="px-4 py-1.5 bg-accent text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs"
          >
            <Save size={14} /> Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
