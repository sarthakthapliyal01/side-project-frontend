import { useState } from "react";
import { Link2 } from "lucide-react";

function JiraIntegration() {
  const [formData, setFormData] = useState({
    hostName: "",
    apiToken: "",
    email: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // This is the updated function connecting to your FastAPI backend!
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // 1. Test the connection first
      const testResponse = await fetch("http://127.0.0.1:8000/jira/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jira_host: formData.hostName,
          jira_email: formData.email,
          jira_token: formData.apiToken,
        }),
      });

      const testData = await testResponse.json();

      if (testResponse.ok && testData.connected) {
        
        // 2. If test is successful, save it to MongoDB!
        const companyName = localStorage.getItem("companyName");
        
        const saveResponse = await fetch("http://127.0.0.1:8000/jira/save-connection", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyName: companyName,
            jira_host: formData.hostName,
            jira_email: formData.email,
            jira_token: formData.apiToken,
          }),
        });

        if (saveResponse.ok) {
          alert(`Success! Found ${testData.project_count} projects and saved connection to database.`);
          // Optional: You could redirect the user back to the dashboard here!
        } else {
          alert("Connection worked, but failed to save to database.");
        }

      } else {
        alert(`Failed to connect: ${testData.detail || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Network or server error:", error);
      alert("Could not reach the backend server.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-8 lg:p-10">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <Link2 size={24} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              Jira Integration
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Connect your workspace to sync issues and engineering metrics.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          
          {/* Jira Organisation Name */}
          <div>
            <label htmlFor="hostName" className="block text-sm font-bold text-slate-800">
              Jira Organisation Name
            </label>
            <p className="text-[13px] font-medium text-slate-500 mt-1 mb-3 leading-relaxed">
              Get your Jira sitename from your Jira url (e.g. <span className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">https://[sitename].atlassian.net</span>) and only enter the <span className="text-slate-700 font-semibold">[sitename]</span> portion.
            </p>
            <div className="relative flex items-center">
              <input
                type="text"
                id="hostName"
                name="hostName"
                value={formData.hostName}
                onChange={handleChange}
                placeholder="Enter host name"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-medium focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all"
                required
              />
              <span className="absolute right-4 text-sm font-bold text-slate-400 pointer-events-none">
                .atlassian.net
              </span>
            </div>
          </div>

          {/* API Token */}
          <div>
            <label htmlFor="apiToken" className="block text-sm font-bold text-slate-800">
              API Token
            </label>
            <p className="text-[13px] font-medium text-slate-500 mt-1 mb-3">
              Create an API token in Jira to authenticate your account.
            </p>
            <input
              type="password"
              id="apiToken"
              name="apiToken"
              value={formData.apiToken}
              onChange={handleChange}
              placeholder="••••••••••••••••"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-medium focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all"
              required
            />
          </div>

          {/* Jira Login Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-slate-800">
              Jira Login Email
            </label>
            <p className="text-[13px] font-medium text-slate-500 mt-1 mb-3">
              Enter the email address associated with your Jira account.
            </p>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="name@company.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-medium focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-6 mt-8 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all"
            >
              Close
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 border border-transparent rounded-xl hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all"
            >
              Connect Jira
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
}

export default JiraIntegration;