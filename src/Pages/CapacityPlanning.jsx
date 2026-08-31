import { useState, useEffect } from "react";
import { ArrowLeft, Search, Plus, Save, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

function CapacityPlanning({ onBack, user }) {
  const companyName = localStorage.getItem("companyName") || "Trigent";

  const getInitialSprint = () => {
    const savedSprint = localStorage.getItem("selectedSprint");
    if (savedSprint) {
      try {
        const parsed = JSON.parse(savedSprint);
        return String(parsed?.sprintId || parsed?.id || parsed?.name || "");
      } catch {}
    }
    return localStorage.getItem("currentSprint") || "";
  };

  const [selectedProjects, setSelectedProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(() => localStorage.getItem("currentProject") || "");
  const [sprints, setSprints] = useState([]);
  const [currentSprint, setCurrentSprint] = useState(getInitialSprint);

  const [storyPointHrs, setStoryPointHrs] = useState(8);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  // Fetch Projects (matching Standup page)
  useEffect(() => {
    if (!companyName) return;

    fetch(`http://127.0.0.1:8000/jira/selected-projects/${companyName}`)
      .then((res) => res.ok && res.json())
      .then((data) => {
        const projects = data.projects || data;
        if (Array.isArray(projects)) {
          setSelectedProjects(projects);
          if (projects.length > 0 && !currentProject) {
            setCurrentProject(String(projects[0].projectId || projects[0].projectKey));
          }
        }
      })
      .catch(console.error);
  }, [companyName]);

  // Fetch Sprints when currentProject changes and preserve active sprint selection if valid
  useEffect(() => {
    if (!companyName) return;

    const url = currentProject
      ? `http://127.0.0.1:8000/jira/sprints/${companyName}?project_id=${currentProject}`
      : `http://127.0.0.1:8000/jira/sprints/${companyName}`;

    fetch(url)
      .then((res) => res.ok && res.json())
      .then((data) => {
        if (data?.sprints?.length > 0) {
          setSprints(data.sprints);
          const savedSprintStr = localStorage.getItem("selectedSprint");
          let savedId = currentSprint;
          if (savedSprintStr) {
            try {
              const parsed = JSON.parse(savedSprintStr);
              savedId = String(parsed?.sprintId || parsed?.id || parsed?.name || "");
            } catch {}
          }
          const match = data.sprints.find(
            (s) => String(s.id || s.sprintId || s.name) === savedId
          );
          if (match) {
            const matchId = String(match.id || match.sprintId || match.name);
            setCurrentSprint(matchId);
          } else {
            const firstSprintId = String(data.sprints[0].id || data.sprints[0].sprintId || data.sprints[0].name || "");
            setCurrentSprint(firstSprintId);
            localStorage.setItem("selectedSprint", JSON.stringify(data.sprints[0]));
          }
        } else {
          setSprints([]);
          setCurrentSprint("");
        }
      })
      .catch(console.error);
  }, [companyName, currentProject]);

  const [configuredRoles, setConfiguredRoles] = useState([
    { role: "Developer", billingRate: 30 },
    { role: "Manager", billingRate: 30 },
    { role: "Tester", billingRate: 20 },
    { role: "DB team", billingRate: 10 },
  ]);

  const loadRoles = () => {
    if (!companyName) return;
    const savedLocal =
      localStorage.getItem(`roles_and_billing_${companyName}`) ||
      localStorage.getItem("roles_and_billing_global");

    if (savedLocal) {
      try {
        const parsed = JSON.parse(savedLocal);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setConfiguredRoles(parsed);
        }
      } catch (e) {
        console.error(e);
      }
    }

    fetch(`http://127.0.0.1:8000/jira/roles-billing/${companyName}`)
      .then((res) => res.ok && res.json())
      .then((data) => {
        if (data?.roles && Array.isArray(data.roles) && data.roles.length > 0) {
          setConfiguredRoles(data.roles);
          localStorage.setItem(`roles_and_billing_${companyName}`, JSON.stringify(data.roles));
          localStorage.setItem("roles_and_billing_global", JSON.stringify(data.roles));
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadRoles();
    const handleRolesUpdated = () => loadRoles();
    window.addEventListener("rolesUpdated", handleRolesUpdated);
    return () => {
      window.removeEventListener("rolesUpdated", handleRolesUpdated);
    };
  }, [companyName]);

  const [teamMembers, setTeamMembers] = useState([]);

  // Fetch Jira Capacity Data specifically for currentProject + currentSprint
  const fetchCapacityData = () => {
    if (!companyName || !currentProject || !currentSprint) return;

    setLoading(true);
    const params = new URLSearchParams();
    if (currentProject) params.append("project_id", currentProject);
    if (currentSprint) params.append("sprint_id", currentSprint);
    params.append("_t", String(Date.now()));

    // Parallel fetch real Jira sprint issues + capacity endpoint
    Promise.all([
      fetch(`http://127.0.0.1:8000/jira/db-sprint-issues/${companyName}?${params.toString()}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch(`http://127.0.0.1:8000/jira/capacity-data/${companyName}?${params.toString()}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ])
      .then(([issuesData, capacityData]) => {
        let totalSprintSP = 0;
        if (issuesData?.issues && Array.isArray(issuesData.issues)) {
          issuesData.issues.forEach((issue) => {
            let sp = issue.storyPoints ?? issue.story_points ?? issue.customfield_10016 ?? issue.customfield_10026 ?? issue.sp ?? 0;
            if (typeof sp === "string") sp = parseFloat(sp) || 0;
            totalSprintSP += Number(sp) || 0;
          });
        }
        totalSprintSP = Math.round(totalSprintSP);

        const rawMembers = capacityData?.members || [];
        if (rawMembers.length > 0) {
          const formattedMembers = rawMembers.map((m) => {
            let role = m.role || "Developer";
            let roleObj = configuredRoles.find((r) => r.role?.toLowerCase() === role.toLowerCase());
            if (!roleObj && configuredRoles.length > 0) {
              roleObj = configuredRoles[0];
              role = roleObj.role;
            }

            const defaultRate = roleObj ? Number(roleObj.billingRate) || 0 : 0;
            const billingRate = m.billingRate !== undefined && m.billingRate !== null ? Number(m.billingRate) : defaultRate;

            const allocatedCapacity = Number(m.allocatedCapacity) || 0;
            const availableCapacity = m.availableCapacity !== undefined && m.availableCapacity !== null ? Number(m.availableCapacity) : 0;
            const leaves = m.leaves !== undefined && m.leaves !== null ? Number(m.leaves) : (m.leave !== undefined ? Number(m.leave) : 0);
            const netAvailableCapacity = m.netAvailableCapacity !== undefined && m.netAvailableCapacity !== null ? Number(m.netAvailableCapacity) : (availableCapacity - leaves);
            const remainingCapacity = netAvailableCapacity - allocatedCapacity;
            const totalBillingRate = billingRate * allocatedCapacity;
            const email = m.email || "";

            return {
              ...m,
              email,
              billingRate,
              availableCapacity,
              leaves,
              netAvailableCapacity,
              allocatedCapacity,
              remainingCapacity,
              totalBillingRate,
              role,
              allocationType: m.allocationType || "Full",
              fromJira: m.fromJira !== undefined ? m.fromJira : true,
            };
          });

          setTeamMembers(formattedMembers);
          saveLocally(formattedMembers);
        } else {
          setTeamMembers([]);
        }
      })
      .catch((err) => {
        console.error("Error loading Jira capacity data:", err);
        setTeamMembers([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCapacityData();
  }, [companyName, currentProject, currentSprint]);

  // Sync configured role billing rates to team members and clean up deleted roles
  useEffect(() => {
    if (teamMembers.length === 0 || configuredRoles.length === 0) return;

    const defaultRoleObj = configuredRoles[0];
    const defaultRoleName = defaultRoleObj?.role || "Developer";
    const defaultBillingRate = Number(defaultRoleObj?.billingRate) || 0;

    let hasChanges = false;
    const updatedMembers = teamMembers.map((m) => {
      const roleMatch = configuredRoles.find((r) => r.role?.toLowerCase() === m.role?.toLowerCase());
      if (roleMatch) {
        const targetRate = Number(m.billingRate) > 0 ? Number(m.billingRate) : (Number(roleMatch.billingRate) || 0);
        const alloc = Number(m.allocatedCapacity) || 0;
        const total = targetRate * alloc;
        if (m.billingRate !== targetRate || m.totalBillingRate !== total) {
          hasChanges = true;
          return {
            ...m,
            billingRate: targetRate,
            totalBillingRate: total,
          };
        }
        return m;
      } else {
        // Role was deleted from configuredRoles! Reassign member to the first configured role
        hasChanges = true;
        const alloc = Number(m.allocatedCapacity) || 0;
        return {
          ...m,
          role: defaultRoleName,
          billingRate: defaultBillingRate,
          totalBillingRate: defaultBillingRate * alloc,
        };
      }
    });

    if (hasChanges) {
      setTeamMembers(updatedMembers);
      if (companyName && currentProject && currentSprint) {
        const savedKey = `capacity_${companyName}_${currentProject}_${currentSprint}`;
        localStorage.setItem(savedKey, JSON.stringify(updatedMembers));
      }
    }
  }, [configuredRoles]);

  // Only use roles configured in Roles & Rate Card
  const rawRolesList = configuredRoles.map((r) => r.role).filter(Boolean);

  const rolesList = [];
  const seenLower = new Set();
  for (const r of rawRolesList) {
    const lower = String(r).trim().toLowerCase();
    if (!seenLower.has(lower)) {
      seenLower.add(lower);
      rolesList.push(String(r).trim());
    }
  }

  if (rolesList.length === 0) {
    rolesList.push("Developer", "Manager", "Tester", "DB team");
  }

  const allocationTypes = ["Full", "Part Time", "50%", "Contract"];

  const saveLocally = (members) => {
    if (!companyName || !currentProject || !currentSprint) return;
    const sprintObj = sprints.find((s) => String(s.id || s.sprintId || s.name) === String(currentSprint));
    const sprintName = sprintObj?.name || "";

    const cleanedMembers = members.map((m) => {
      const avail = m.availableCapacity === "" ? 0 : Number(m.availableCapacity) || 0;
      const leaves = m.leaves === "" ? 0 : Number(m.leaves) || 0;
      const netAvail = avail - leaves;
      const alloc = m.allocatedCapacity === "" ? 0 : Number(m.allocatedCapacity) || 0;
      const rate = m.billingRate === "" ? 0 : Number(m.billingRate) || 0;
      return {
        ...m,
        availableCapacity: avail,
        leaves: leaves,
        netAvailableCapacity: netAvail,
        allocatedCapacity: alloc,
        billingRate: rate,
        remainingCapacity: netAvail - alloc,
        totalBillingRate: rate * alloc,
      };
    });

    const dataStr = JSON.stringify(cleanedMembers);
    localStorage.setItem(`capacity_${companyName}_${currentProject}_${currentSprint}`, dataStr);
    if (sprintName) localStorage.setItem(`capacity_${companyName}_${currentProject}_${sprintName}`, dataStr);
    localStorage.setItem(`capacity_${companyName}__${currentSprint}`, dataStr);
    if (sprintName) localStorage.setItem(`capacity_${companyName}__${sprintName}`, dataStr);

    window.dispatchEvent(new CustomEvent("capacityUpdated"));
  };

  const handleMemberChange = (id, field, value) => {
    setTeamMembers((prev) => {
      const nextMembers = prev.map((m) => {
        if (m.id === id) {
          const updated = { ...m, [field]: value };

          // If role changed, look up configured billing rate for this role
          if (field === "role") {
            const roleMatch = configuredRoles.find((r) => r.role?.toLowerCase() === value?.toLowerCase());
            if (roleMatch) {
              updated.billingRate = Number(roleMatch.billingRate) || 0;
            }
          }

          const avail = updated.availableCapacity === "" ? 0 : (Number(updated.availableCapacity) || 0);
          const leaves = updated.leaves === "" ? 0 : (Number(updated.leaves) || 0);
          const netAvail = avail - leaves;
          const alloc = updated.allocatedCapacity === "" ? 0 : (Number(updated.allocatedCapacity) || 0);
          const rate = updated.billingRate === "" ? 0 : (Number(updated.billingRate) || 0);

          updated.netAvailableCapacity = netAvail;

          // Recalculate remaining capacity: Net Available Capacity - Allocated Capacity (allow negative)
          updated.remainingCapacity = netAvail - alloc;

          // Recalculate total billing: Billing Rate X Allocated Capacity
          updated.totalBillingRate = rate * alloc;

          return updated;
        }
        return m;
      });

      saveLocally(nextMembers);
      return nextMembers;
    });
  };

  const handleAddUser = () => {
    const newId = Date.now();
    const defaultRole = rolesList[0] || "Developer";
    const roleObj = configuredRoles.find((r) => r.role?.toLowerCase() === defaultRole.toLowerCase());
    const defaultRate = roleObj ? Number(roleObj.billingRate) || 0 : 0;

    setTeamMembers((prev) => {
      const nextMembers = [
        ...prev,
        {
          id: newId,
          name: "",
          email: "",
          role: defaultRole,
          allocationType: "Full",
          availableCapacity: 0,
          leaves: 0,
          netAvailableCapacity: 0,
          allocatedCapacity: 0,
          remainingCapacity: 0,
          billingRate: defaultRate,
          totalBillingRate: 0.0,
          fromJira: false,
        },
      ];
      saveLocally(nextMembers);
      return nextMembers;
    });
  };

  const handleSave = () => {
    const toastId = toast.loading("Saving capacity planning data...");

    const sprintObj = sprints.find((s) => String(s.id || s.sprintId || s.name) === String(currentSprint));
    const sprintName = sprintObj?.name || "";

    const cleanedMembers = teamMembers.map((m) => {
      const avail = m.availableCapacity === "" ? 0 : Number(m.availableCapacity) || 0;
      const leaves = m.leaves === "" ? 0 : Number(m.leaves) || 0;
      const netAvail = avail - leaves;
      const alloc = m.allocatedCapacity === "" ? 0 : Number(m.allocatedCapacity) || 0;
      const rate = m.billingRate === "" ? 0 : Number(m.billingRate) || 0;
      return {
        ...m,
        availableCapacity: avail,
        leaves: leaves,
        netAvailableCapacity: netAvail,
        allocatedCapacity: alloc,
        billingRate: rate,
        remainingCapacity: netAvail - alloc,
        totalBillingRate: rate * alloc,
      };
    });

    setTeamMembers(cleanedMembers);
    saveLocally(cleanedMembers);

    fetch(`http://127.0.0.1:8000/jira/save-capacity/${companyName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sprint_id: currentSprint,
        project_id: currentProject,
        storyPointHrs: storyPointHrs,
        members: cleanedMembers,
      }),
    })
      .then((res) => res.json())
      .then(() => toast.success("Capacity planning data saved successfully to MongoDB!", { id: toastId }))
      .catch((err) => {
        console.error("Error saving capacity to backend:", err);
        toast.error("Error saving capacity data to MongoDB", { id: toastId });
      });
  };

  return (
    <div className="w-full min-h-screen bg-[#09090b] text-white p-8 md:p-12 font-sans tracking-wide">
      {/* Top Header & Back Button */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => {
            saveLocally(teamMembers);
            onBack();
          }}
          className="flex items-center gap-3 text-sm font-semibold text-[#a1a1aa] hover:text-white transition-colors cursor-pointer rounded-none border border-[#27272a] bg-[#121215] px-5 py-3 shadow-lg"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to StandUp Page
        </button>
      </div>

      {/* Controls Header Row */}
      <div className="bg-[#121215] border border-[#27272a] rounded-none p-6 md:p-8 mb-10 flex flex-wrap items-center justify-between gap-8 shadow-2xl">
        <div className="flex flex-wrap items-center gap-6 md:gap-8 text-sm font-medium">
          {/* Company Display */}
          <div className="bg-[#18181d] border border-[#3f3f46] rounded-none px-5 py-3 text-white font-semibold">
            <span className="text-[#a1a1aa] mr-3">Company:</span>
            <span>{companyName}</span>
          </div>

          {/* Project Select */}
          <div className="flex items-center gap-3">
            <span className="text-[#a1a1aa] font-semibold">Project:</span>
            <select
              value={currentProject}
              onChange={(e) => {
                const newProj = e.target.value;
                setCurrentProject(newProj);
                localStorage.setItem("currentProject", newProj);
                window.dispatchEvent(new CustomEvent("projectSelected", { detail: newProj }));
              }}
              className="bg-[#18181d] border border-[#3f3f46] rounded-none px-5 py-3 text-white focus:outline-none focus:border-blue-500 cursor-pointer max-w-[280px] truncate font-semibold"
            >
              {selectedProjects.length > 0 ? (
                selectedProjects.map((p) => (
                  <option key={p.projectId || p.id} value={String(p.projectId || p.projectKey)}>
                    {p.projectName || p.name || p.projectKey}
                  </option>
                ))
              ) : (
                <option value={currentProject}>{currentProject || "Select Project"}</option>
              )}
            </select>
          </div>

          {/* Sprint Select */}
          <div className="flex items-center gap-3">
            <span className="text-[#a1a1aa] font-semibold">Sprint:</span>
            <select
              value={currentSprint}
              onChange={(e) => {
                const newSprintId = e.target.value;
                setCurrentSprint(newSprintId);
                const foundSprint = sprints.find((s) => String(s.id || s.sprintId || s.name) === String(newSprintId));
                if (foundSprint) {
                  localStorage.setItem("selectedSprint", JSON.stringify(foundSprint));
                  localStorage.setItem("currentSprint", newSprintId);
                  window.dispatchEvent(new CustomEvent("sprintSelected", { detail: foundSprint }));
                } else {
                  localStorage.setItem("currentSprint", newSprintId);
                }
                window.dispatchEvent(new CustomEvent("capacityUpdated"));
              }}
              className="bg-[#18181d] border border-[#3f3f46] rounded-none px-5 py-3 text-white focus:outline-none focus:border-blue-500 cursor-pointer max-w-[300px] truncate font-semibold"
            >
              {sprints.length > 0 ? (
                sprints.map((s) => (
                  <option key={s.id || s.sprintId} value={String(s.id || s.sprintId || s.name)}>
                    {s.name} {s.state ? `(${s.state})` : ""}
                  </option>
                ))
              ) : (
                <option value={currentSprint}>{currentSprint || "Select Sprint"}</option>
              )}
            </select>
          </div>

          {/* 1 Story Point = X hrs */}
          <div className="flex items-center gap-3 bg-[#18181d] border border-[#3f3f46] rounded-none px-5 py-2.5">
            <span className="text-[#a1a1aa] whitespace-nowrap font-semibold">1 Story Point</span>
            <input
              type="number"
              value={storyPointHrs}
              onChange={(e) => setStoryPointHrs(Number(e.target.value))}
              className="w-16 bg-[#27272a] text-center text-white border border-[#52525b] rounded-none py-1.5 focus:outline-none focus:border-blue-500 font-bold text-base"
            />
            <span className="text-[#a1a1aa] font-semibold">hrs</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-5">
          <button
            onClick={handleAddUser}
            className="flex items-center gap-2.5 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-none transition-colors cursor-pointer shadow-lg tracking-wider uppercase"
          >
            <Plus className="w-5 h-5" />
            Add Users
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2.5 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-none transition-colors cursor-pointer shadow-lg tracking-wider uppercase"
          >
            <Save className="w-5 h-5" />
            Save Data
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-[#0f0f12] border border-[#27272a] rounded-none overflow-hidden shadow-2xl">
        <div className="overflow-x-auto overflow-y-hidden max-w-full pb-6 scrollbar-thin scrollbar-thumb-zinc-700">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-[#a1a1aa]">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-sm font-semibold tracking-wider uppercase">Loading Jira Capacity Data...</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm border-collapse min-w-[2400px]">
              <thead>
                <tr className="bg-[#18181d] border-b-2 border-[#3f3f46] text-[#a1a1aa] font-bold uppercase tracking-wider text-xs">
                  <th className="py-6 px-8 w-80 sticky left-0 bg-[#18181d] z-20 border-r-2 border-[#3f3f46] shadow-xl">
                    <div className="flex items-center justify-between gap-3">
                      <span>TEAM MEMBER</span>
                      <Search className="w-4 h-4 text-[#71717a]" />
                    </div>
                  </th>
                  <th className="py-6 px-8 w-80">EMAIL</th>
                  <th className="py-6 px-8 w-64">ROLE</th>
                  <th className="py-6 px-8 w-56">ALLOCATION TYPE</th>
                  <th className="py-6 px-8 w-60">AVAILABLE CAPACITY</th>
                  <th className="py-6 px-8 w-60 text-center">NET AVAILABLE CAPACITY</th>
                  <th className="py-6 px-8 w-56 text-center">ALLOCATED CAPACITY</th>
                  <th className="py-6 px-8 w-56 text-center">REMAINING CAPACITY</th>
                  <th className="py-6 px-8 w-52 text-center">BILLING RATE ($)</th>
                  <th className="py-6 px-8 w-60 text-center">TOTAL BILLING RATE ($)</th>
                  <th className="py-6 px-8 w-48 text-center">LEAVE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#202026]">
                {teamMembers.length > 0 ? (
                  teamMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-[#18181d]/80 transition-colors text-white group">
                      {/* Team Member Name (Read-only if from Jira) */}
                      <td className="py-6 px-8 font-semibold w-80 sticky left-0 bg-[#0f0f12] group-hover:bg-[#18181d] z-10 border-r-2 border-[#27272a] shadow-xl">
                        {member.fromJira ? (
                          <span className="text-white font-semibold text-sm truncate">{member.name || "Member"}</span>
                        ) : (
                          <input
                            type="text"
                            placeholder="Enter member name"
                            value={member.name}
                            onChange={(e) => handleMemberChange(member.id, "name", e.target.value)}
                            className="bg-[#141418] border border-[#27272a] rounded-none px-4 py-3 text-sm text-[#52525b] focus:outline-none focus:border-blue-500 w-full font-medium"
                          />
                        )}
                      </td>

                      {/* Email Input (User Inputted for all members) */}
                      <td className="py-6 px-8 w-80">
                        <input
                          type="email"
                          placeholder="Enter email"
                          value={member.email || ""}
                          onChange={(e) => handleMemberChange(member.id, "email", e.target.value)}
                          className="bg-[#141418] border border-[#27272a] rounded-none px-4 py-3 text-sm text-white placeholder-[#52525b] focus:outline-none focus:border-blue-500 w-full"
                        />
                      </td>

                      {/* Role Selector */}
                      <td className="py-6 px-8 w-64">
                        <select
                          value={member.role}
                          onChange={(e) => handleMemberChange(member.id, "role", e.target.value)}
                          className="bg-[#141418] border border-[#27272a] rounded-none px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 w-full cursor-pointer font-medium"
                        >
                          {rolesList.map((r) => (
                            <option key={r} value={r === "Select Role" ? "" : r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Allocation Type Selector */}
                      <td className="py-6 px-8 w-56">
                        <select
                          value={member.allocationType}
                          onChange={(e) => handleMemberChange(member.id, "allocationType", e.target.value)}
                          className="bg-[#141418] border border-[#27272a] rounded-none px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 w-full cursor-pointer font-medium"
                        >
                          {allocationTypes.map((a) => (
                            <option key={a} value={a}>
                              {a}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Available Capacity (User Input) */}
                      <td className="py-6 px-8 w-60">
                        <input
                          type="number"
                          value={member.availableCapacity}
                          onChange={(e) => handleMemberChange(member.id, "availableCapacity", e.target.value)}
                          onBlur={(e) => {
                            if (e.target.value === "") {
                              handleMemberChange(member.id, "availableCapacity", 0);
                            }
                          }}
                          className="bg-[#141418] border border-[#27272a] rounded-none px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 w-32 font-bold text-center"
                        />
                      </td>

                      {/* Net Available Capacity (Calculated: Available Capacity - Leave) */}
                      <td className="py-6 px-8 w-60 text-center font-bold text-base text-emerald-400">
                        <span className="inline-block bg-[#18181d] border border-emerald-500/30 px-4 py-2 text-emerald-400 font-bold text-base rounded-none">
                          {member.netAvailableCapacity !== undefined && member.netAvailableCapacity !== null
                            ? member.netAvailableCapacity
                            : ((Number(member.availableCapacity) || 0) - (Number(member.leaves) || 0))}
                        </span>
                      </td>

                      {/* Allocated Capacity (Read-only if from Jira) */}
                      <td className="py-6 px-8 w-56 text-center font-bold text-base text-blue-400">
                        {member.fromJira ? (
                          <span className="inline-block bg-[#18181d] border border-blue-500/30 px-4 py-2 text-blue-400 font-bold text-base rounded-none">
                            {member.allocatedCapacity}
                          </span>
                        ) : (
                          <input
                            type="number"
                            value={member.allocatedCapacity}
                            onChange={(e) => handleMemberChange(member.id, "allocatedCapacity", e.target.value)}
                            onBlur={(e) => {
                              if (e.target.value === "") {
                                handleMemberChange(member.id, "allocatedCapacity", 0);
                              }
                            }}
                            className="bg-[#141418] border border-[#27272a] rounded-none px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 w-28 font-bold text-center"
                          />
                        )}
                      </td>

                      {/* Remaining Capacity */}
                      <td className={`py-6 px-8 w-56 text-center font-bold text-base ${Number(member.remainingCapacity) < 0 ? "text-rose-400 font-extrabold" : "text-[#a1a1aa]"}`}>
                        {member.remainingCapacity}
                      </td>

                      {/* Billing Rate Input ($) */}
                      <td className="py-6 px-8 w-52 text-center font-bold text-base text-[#a1a1aa]">
                        <input
                          type="number"
                          value={member.billingRate}
                          onChange={(e) => handleMemberChange(member.id, "billingRate", e.target.value)}
                          onBlur={(e) => {
                            if (e.target.value === "") {
                              handleMemberChange(member.id, "billingRate", 0);
                            }
                          }}
                          className="bg-[#141418] border border-[#27272a] rounded-none px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 w-28 font-bold text-center"
                        />
                      </td>

                      {/* Total Billing Rate (Billing Rate X Allocated Capacity) */}
                      <td className="py-6 px-8 w-60 text-center font-bold text-base text-emerald-400">
                        ${(Number(member.totalBillingRate) || 0).toFixed(2)}
                      </td>

                      {/* Leave Input (User Inputted Manually at End) */}
                      <td className="py-6 px-8 w-48 text-center">
                        <input
                          type="number"
                          value={member.leaves !== undefined && member.leaves !== null ? member.leaves : (member.leave || 0)}
                          onChange={(e) => handleMemberChange(member.id, "leaves", e.target.value)}
                          onBlur={(e) => {
                            if (e.target.value === "") {
                              handleMemberChange(member.id, "leaves", 0);
                            }
                          }}
                          className="bg-[#141418] border border-[#27272a] rounded-none px-4 py-3 text-sm text-amber-400 focus:outline-none focus:border-amber-500 w-28 font-bold text-center"
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-[#71717a] font-medium">
                      No team members found for this project/sprint. Click "Add Users" above to add team members manually.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Pagination Bar */}
        <div className="bg-[#18181d] px-8 py-5 border-t border-[#27272a] rounded-none flex flex-wrap items-center justify-between gap-6 text-sm font-semibold text-[#a1a1aa]">
          <div className="flex items-center gap-3">
            <span>Page Size:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-[#121215] border border-[#27272a] rounded-none px-4 py-2 text-white focus:outline-none cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex items-center gap-6">
            <span>
              1 to {teamMembers.length} of {teamMembers.length}
            </span>
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 rounded-none bg-[#121215] border border-[#27272a] text-[#71717a] cursor-not-allowed font-bold">
                &lt;
              </button>
              <span className="px-4 py-2 text-white font-bold">Page 1 of 1</span>
              <button className="px-4 py-2 rounded-none bg-[#121215] border border-[#27272a] text-[#71717a] cursor-not-allowed font-bold">
                &gt;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CapacityPlanning;


