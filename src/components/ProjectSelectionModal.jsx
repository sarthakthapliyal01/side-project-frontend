import { useEffect, useState } from "react";

function ProjectSelectionModal({ isOpen, onClose }) {
  const [projects, setProjects] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);

  const companyName = localStorage.getItem("companyName");

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen]);

  const fetchProjects = async () => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/jira/projects/${companyName}`
      );

      const data = await response.json();

      setProjects(data.projects || []);

      const selected = (data.projects || [])
        .filter((p) => p.isSelected)
        .map((p) => p.projectId);

      setSelectedProjects(selected);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCheckbox = (projectId) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  const saveSelection = async () => {
    try {
      await fetch(
        `http://127.0.0.1:8000/jira/select-projects/${companyName}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectIds: selectedProjects,
          }),
        }
      );

      alert("Projects saved successfully");
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50">
      <div className="bg-neutral-900 w-[700px] rounded-xl p-6 border border-white/10">

        <h2 className="text-white text-xl font-bold mb-6">
          Select Jira Projects
        </h2>

        <div className="max-h-[400px] overflow-y-auto space-y-3">
          {projects.map((project) => (
            <div
              key={project.projectId}
              className="flex items-center gap-3 p-3 border border-white/10 rounded-lg"
            >
              <input
                type="checkbox"
                checked={selectedProjects.includes(project.projectId)}
                onChange={() =>
                  handleCheckbox(project.projectId)
                }
              />

              <div>
                <p className="text-white font-medium">
                  {project.projectName}
                </p>

                <p className="text-slate-400 text-sm">
                  {project.projectKey}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-white/10 rounded-lg text-white"
          >
            Cancel
          </button>

          <button
            onClick={saveSelection}
            className="px-4 py-2 bg-white text-black rounded-lg"
          >
            Save Projects
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProjectSelectionModal;