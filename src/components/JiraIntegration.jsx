import { useState } from "react";
import { Link2 } from "lucide-react";
import ProjectSelectionModal from "../components/ProjectSelectionModal";

function JiraIntegration() {
  const [formData, setFormData] = useState({
    hostName: "",
    apiToken: "",
    email: "",
  });

  const [showProjectModal, setShowProjectModal] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // This is the updated function connecting to your FastAPI backend
const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    // 1. Test the connection first
    const testResponse = await fetch(
      "http://127.0.0.1:8000/jira/test-connection",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jira_host: formData.hostName,
          jira_email: formData.email,
          jira_token: formData.apiToken,
        }),
      }
    );

    const testData = await testResponse.json();

    if (testResponse.ok && testData.connected) {
      const companyName = localStorage.getItem("companyName");

      // 2. Save Jira connection
      const saveResponse = await fetch(
        "http://127.0.0.1:8000/jira/save-connection",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyName,
            jira_host: formData.hostName,
            jira_email: formData.email,
            jira_token: formData.apiToken,
          }),
        }
      );

      if (saveResponse.ok) {
        // 3. Sync Jira projects into MongoDB
        const syncResponse = await fetch(
          `http://127.0.0.1:8000/jira/sync-projects/${companyName}`,
          {
            method: "POST",
          }
        );

        if (syncResponse.ok) {
          setShowProjectModal(true);
          
        } else {
          alert(
            "Connection saved successfully, but project sync failed."
          );
        }
      } else {
        alert(
          "Connection worked, but failed to save to database."
        );
      }
    } else {
      alert(
        `Failed to connect: ${testData.detail || "Unknown error"}`
      );
    }
  } catch (error) {
    console.error("Network or server error:", error);
    alert("Could not reach the backend server.");
  }
};

return (
  <>
    <div className="max-w-3xl mx-auto p-6 md:p-8 lg:p-10">
      <div className="bg-neutral-900 rounded-2xl border border-white/10 shadow-sm overflow-hidden">
        
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-white/10 flex items-center gap-4 bg-white/5">
          <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
            <Link2 size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Jira Integration
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-400">
              Connect your workspace to sync issues and engineering metrics.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          
          {/* Jira Organisation Name */}
          <div>
            <label htmlFor="hostName" className="block text-sm font-bold text-slate-200">
              Jira Organisation Name
            </label>
            <p className="text-[13px] font-medium text-slate-400 mt-1 mb-3 leading-relaxed">
              Get your Jira sitename from your Jira url (e.g. <span className="text-slate-300 bg-white/10 px-1 py-0.5 rounded">https://[sitename].atlassian.net</span>) and only enter the <span className="text-slate-300 font-semibold">[sitename]</span> portion.
            </p>
            <div className="relative flex items-center">
              <input
                type="text"
                id="hostName"
                name="hostName"
                value={formData.hostName}
                onChange={handleChange}
                placeholder="Enter host name"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-semibold text-white placeholder:text-slate-500 placeholder:font-medium focus:outline-none focus:ring-4 focus:ring-white/10 focus:border-white/30 transition-all"
                required
              />
              <span className="absolute right-4 text-sm font-bold text-slate-500 pointer-events-none">
                .atlassian.net
              </span>
            </div>
          </div>

          {/* API Token */}
          <div>
            <label htmlFor="apiToken" className="block text-sm font-bold text-slate-200">
              API Token
            </label>
            <p className="text-[13px] font-medium text-slate-400 mt-1 mb-3">
              Create an API token in Jira to authenticate your account.
            </p>
            <input
              type="password"
              id="apiToken"
              name="apiToken"
              value={formData.apiToken}
              onChange={handleChange}
              placeholder="••••••••••••••••"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-semibold text-white placeholder:text-slate-500 placeholder:font-medium focus:outline-none focus:ring-4 focus:ring-white/10 focus:border-white/30 transition-all"
              required
            />
          </div>

          {/* Jira Login Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-slate-200">
              Jira Login Email
            </label>
            <p className="text-[13px] font-medium text-slate-400 mt-1 mb-3">
              Enter the email address associated with your Jira account.
            </p>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="name@company.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-semibold text-white placeholder:text-slate-500 placeholder:font-medium focus:outline-none focus:ring-4 focus:ring-white/10 focus:border-white/30 transition-all"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-6 mt-8 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              className="px-5 py-2.5 text-sm font-bold text-slate-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:text-white hover:border-white/20 focus:outline-none focus:ring-4 focus:ring-white/10 transition-all"
            >
              Close
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-bold text-black bg-white border border-transparent rounded-xl hover:bg-slate-200 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-white/30 transition-all"
            >
              Connect Jira
            </button>
          </div>
          
        </form>
      </div>
    </div>

    <ProjectSelectionModal
      isOpen={showProjectModal}
      onClose={() => setShowProjectModal(false)}
    />
  </>
);
}

export default JiraIntegration;