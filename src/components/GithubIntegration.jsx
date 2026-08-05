import { useState } from "react";
import axios from "axios";
import { FaGithub } from "react-icons/fa";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

function GitHubIntegration({ companyName }) {
  const [githubOwner, setGithubOwner] = useState("");
  const [githubToken, setGithubToken] = useState("");

  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState("");

  const testConnection = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await axios.post(
        "http://localhost:8000/github/test-connection",
        {
          github_owner: githubOwner,
          github_token: githubToken,
        }
      );

      if (response.data.connected) {
        setConnected(true);
        setMessage("GitHub connection successful.");
      }
    } catch (error) {
      setConnected(false);
      setMessage(
        error.response?.data?.detail || "Unable to connect to GitHub."
      );
    }

    setLoading(false);
  };

  const saveConnection = async () => {
  const requestData = {
    companyName,
    github_owner: githubOwner,
    github_token: githubToken,
  };

  console.log("Sending data:", requestData);

  try {
    const response = await axios.post(
      "http://localhost:8000/github/save-connection",
      requestData
    );

    console.log("Response:", response.data);
    alert(response.data.message);

  } catch (error) {
    console.error("Error:", error.response?.data);

    alert(
      JSON.stringify(error.response?.data, null, 2) ||
      "Failed to save GitHub connection."
    );
  }
};

  return (
    <div className="max-w-2xl mx-auto bg-neutral-900 rounded-2xl shadow-md border border-white/10 p-8">
      <div className="flex items-center gap-3 mb-6">
        <FaGithub className="w-8 h-8 text-white" />
        <div>
          <h2 className="text-2xl font-bold text-white">
            GitHub Integration
          </h2>
          <p className="text-slate-400 text-sm">
            Connect your GitHub account to sync repositories and pull requests.
          </p>
        </div>
      </div>

      <div className="space-y-5">

        <div>
          <label className="block text-sm font-medium text-slate-200 mb-2">
            GitHub Owner
          </label>

          <input
            type="text"
            value={githubOwner}
            onChange={(e) => setGithubOwner(e.target.value)}
            placeholder="e.g. microsoft"
            className="w-full rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-slate-500 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-200 mb-2">
            Personal Access Token
          </label>

          <input
            type="password"
            value={githubToken}
            onChange={(e) => setGithubToken(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxxxxxxx"
            className="w-full rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-slate-500 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
        </div>

        {message && (
          <div
            className={`flex items-center gap-2 rounded-lg px-4 py-3 border ${
              connected
                ? "bg-green-500/10 text-green-400 border-green-500/20"
                : "bg-red-500/10 text-red-400 border-red-500/20"
            }`}
          >
            {connected ? (
              <CheckCircle size={18} />
            ) : (
              <XCircle size={18} />
            )}

            {message}
          </div>
        )}

        <div className="flex gap-4 pt-2">

          <button
            onClick={testConnection}
            disabled={loading}
            className="bg-white hover:bg-slate-200 text-black px-5 py-3 rounded-lg font-medium transition flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Testing...
              </>
            ) : (
              "Test Connection"
            )}
          </button>

          <button
            onClick={saveConnection}
            disabled={!connected}
            className={`px-5 py-3 rounded-lg font-medium transition ${
              connected
                ? "bg-green-500/90 hover:bg-green-500 text-black"
                : "bg-white/5 text-slate-500 cursor-not-allowed border border-white/10"
            }`}
          >
            Save Connection
          </button>

        </div>
      </div>
    </div>
  );
}

export default GitHubIntegration;