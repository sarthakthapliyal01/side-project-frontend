export function getActiveTargetParams(props = {}) {
  const companyName = localStorage.getItem("companyName") || "";
  const filterType = localStorage.getItem("selectedFilterType") || "Sprint";
  const isRelMode = Boolean(props.isRelease || filterType === "Release");

  let project = "";
  if (props.currentProject) {
    project = typeof props.currentProject === "object"
      ? String(props.currentProject.projectId || props.currentProject.id || "")
      : String(props.currentProject);
  }
  if (!project) {
    project = localStorage.getItem("currentProject") || "";
  }

  let sprint = "";
  if (!isRelMode) {
    if (props.currentSprint) {
      sprint = typeof props.currentSprint === "object"
        ? String(props.currentSprint.sprintId || props.currentSprint.id || props.currentSprint.name || "")
        : String(props.currentSprint);
    }
    if (!sprint) {
      const savedSprint = localStorage.getItem("selectedSprint");
      if (savedSprint) {
        try {
          const parsed = JSON.parse(savedSprint);
          sprint = String(parsed?.sprintId || parsed?.id || parsed?.name || savedSprint);
        } catch {
          sprint = String(savedSprint);
        }
      }
    }
  }

  let release = "";
  if (isRelMode) {
    if (props.currentRelease) {
      release = typeof props.currentRelease === "object"
        ? String(props.currentRelease.releaseName || props.currentRelease.name || props.currentRelease.id || "")
        : String(props.currentRelease);
    }
    if (!release) {
      const savedRel = localStorage.getItem("selectedRelease");
      if (savedRel) {
        try {
          const parsed = JSON.parse(savedRel);
          release = String(parsed?.releaseName || parsed?.name || parsed?.id || savedRel);
        } catch {
          release = String(savedRel);
        }
      }
    }
  }

  return { companyName, project, sprint, release, isRelMode };
}
