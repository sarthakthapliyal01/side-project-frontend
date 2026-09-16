import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Save, Trash2, Loader2, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

function RolesAndBilling({ onBack }) {
  const companyName = localStorage.getItem("companyName") || "Trigent";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState([
    { role: "Developer", billingRate: 30 },
    { role: "Manager", billingRate: 30 },
    { role: "Tester", billingRate: 20 },
    { role: "DB team", billingRate: 10 },
  ]);

  useEffect(() => {
    // Check localStorage first
    const savedLocal =
      localStorage.getItem(`roles_and_billing_${companyName}`) ||
      localStorage.getItem("roles_and_billing_global");

    if (savedLocal) {
      try {
        const parsed = JSON.parse(savedLocal);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRoles(parsed);
        }
      } catch (e) {
        console.error(e);
      }
    }

    // Fetch from backend API
    fetch(`http://127.0.0.1:8000/jira/roles-billing/${companyName}`)
      .then((res) => res.ok && res.json())
      .then((data) => {
        if (data?.roles && Array.isArray(data.roles) && data.roles.length > 0) {
          // If backend has saved custom roles, update state & localStorage
          setRoles(data.roles);
          localStorage.setItem(`roles_and_billing_${companyName}`, JSON.stringify(data.roles));
          localStorage.setItem("roles_and_billing_global", JSON.stringify(data.roles));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [companyName]);

  const handleRoleChange = (index, field, value) => {
    setRoles((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: field === "billingRate" ? (value === "" ? "" : Number(value)) : value,
      };
      return copy;
    });
  };

  const handleAddRow = () => {
    setRoles((prev) => [
      ...prev,
      { role: "", billingRate: 0 }
    ]);
  };

  const handleDeleteRow = (index) => {
    setRoles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    const toastId = toast.loading("Saving roles & billing rate card...");

    // Clean and sanitize role items
    const cleaned = roles
      .map((r, i) => ({
        role: r.role?.trim() || `Role ${i + 1}`,
        billingRate: Number(r.billingRate) || 0,
      }))
      .filter((r) => r.role !== "");

    setRoles(cleaned);
    
    // Save to both company-specific key and global key for complete reliability
    localStorage.setItem(`roles_and_billing_${companyName}`, JSON.stringify(cleaned));
    localStorage.setItem("roles_and_billing_global", JSON.stringify(cleaned));

    // Dispatch global event for instant UI sync
    window.dispatchEvent(new CustomEvent("rolesUpdated"));

    try {
      const res = await fetch(`http://127.0.0.1:8000/jira/roles-billing/${companyName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles: cleaned }),
      });
      if (res.ok) {
        toast.success("Roles & Billing Rates saved successfully!", { id: toastId });
      } else {
        toast.success("Roles saved locally!", { id: toastId });
      }
    } catch (err) {
      console.error("Error saving roles to backend:", err);
      toast.success("Roles saved locally!", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="q-page">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Top Header & Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-line">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2.5 bg-control hover:bg-line border border-line hover:border-ink/30 rounded-xl text-xs font-bold text-ink hover:text-ink transition-all cursor-pointer shadow-none"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div>
              <h1 className="text-3xl font-semibold text-ink tracking-tight flex items-center gap-2.5">
                <ShieldCheck className="w-6 h-6 text-accent" />
                Roles & Rate Card
              </h1>
              <p className="text-xs text-muted mt-0.5 font-medium">
                Configure custom team roles and their default hourly billing rates
              </p>
            </div>
          </div>
        </div>

        {/* Main Card Container */}
        <div className="bg-surface/90  border border-line rounded-2xl p-6 md:p-8 shadow-none space-y-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-muted">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
              <span className="font-semibold text-xs tracking-wider uppercase">Loading Roles & Billing Config...</span>
            </div>
          ) : (
            <>
              {/* Table Header Row */}
              <div className="hidden md:grid grid-cols-12 gap-4 items-center bg-control text-xs font-bold text-muted uppercase tracking-wider rounded-2xl px-6 py-4 border border-line">
                <div className="col-span-6">Role Name</div>
                <div className="col-span-4">Billing Rate ($ / hr)</div>
                <div className="col-span-2 text-center">Actions</div>
              </div>

              {/* Rows List */}
              <div className="space-y-3.5">
                {roles.length === 0 ? (
                  <div className="text-center py-12 text-muted text-sm">
                    No roles configured. Click <span className="text-ink font-bold">+ Add Row</span> to create one.
                  </div>
                ) : (
                  roles.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-control/60 hover:bg-control border border-line hover:border-line rounded-2xl p-4 md:px-6 md:py-3.5 transition-all duration-200 shadow-sm"
                    >
                      {/* Role Input */}
                      <div className="md:col-span-6">
                        <label className="block md:hidden text-[12px] uppercase tracking-wider text-muted mb-1 font-bold">Role Name</label>
                        <input
                          type="text"
                          value={item.role}
                          onChange={(e) => handleRoleChange(idx, "role", e.target.value)}
                          placeholder="e.g. Senior Developer, QA Analyst"
                          className="w-full bg-canvas border border-line focus:border-accent/80 rounded-xl px-4 py-3 text-sm text-ink placeholder-muted font-medium focus:outline-none transition-colors shadow-none"
                        />
                      </div>

                      {/* Billing Rate Input */}
                      <div className="md:col-span-4">
                        <label className="block md:hidden text-[12px] uppercase tracking-wider text-muted mb-1 font-bold">Billing Rate ($ / hr)</label>
                        <div className="relative flex items-center">
                          <span className="absolute left-4 text-muted font-bold text-sm">$</span>
                          <input
                            type="number"
                            value={item.billingRate}
                            onChange={(e) => handleRoleChange(idx, "billingRate", e.target.value)}
                            placeholder="0"
                            className="w-full bg-canvas border border-line focus:border-accent/80 rounded-xl pl-8 pr-4 py-3 text-sm text-ink placeholder-muted font-bold focus:outline-none transition-colors shadow-none"
                          />
                        </div>
                      </div>

                      {/* Action Delete Button */}
                      <div className="md:col-span-2 flex justify-end md:justify-center">
                        <button
                          onClick={() => handleDeleteRow(idx)}
                          className="w-10 h-10 rounded-xl bg-danger/10 hover:bg-danger/20 text-danger border border-danger/20 flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
                          title="Delete Role"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Action Buttons Footer */}
              <div className="pt-6 border-t border-line flex flex-wrap items-center justify-end gap-4">
                <button
                  onClick={handleAddRow}
                  className="flex items-center gap-2 px-6 py-3 bg-hover hover:bg-hover border border-line hover:border-ink/30 text-ink font-bold text-xs rounded-xl transition-all cursor-pointer shadow-none tracking-wider uppercase active:scale-95"
                >
                  <Plus className="w-4 h-4 text-accent" />
                  Add Row
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="q-button q-button--primary"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving ? "Saving..." : "Save Config"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default RolesAndBilling;
