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

  //GitHub Connection 
  const testConnection = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await axios.post(
        "http://localhost:8000/github/test-connection",
        { github_owner: githubOwner, github_token: githubToken }
      );

      if (response.data.connected) {
        setConnected(true);
        setMessage("GitHub connection successful.");
      }
    } catch (error) {
      setConnected(false);
      setMessage(error.response?.data?.detail || "Unable to connect to GitHub.");
    } finally {
      setLoading(false);
    }
  };

  const saveConnection = async () => {
    try {
      const response = await axios.post("http://localhost:8000/github/save-connection", {
        companyName,
        github_owner: githubOwner,
        github_token: githubToken,
      });

      alert(response.data.message);
    } catch (error) {
      alert(error.response?.data?.detail || "Failed to save GitHub connection.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-[#1e1e1e] rounded-2xl shadow-2xl border border-[#2a2a2a] p-6 md:p-8 font-sans">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-[#262626] border border-[#333333] text-white text-2xl shadow-sm">
          <FaGithub />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">GitHub Integration</h2>
          <p className="text-[#a1a1a1] text-xs mt-0.5">
            Connect your GitHub account to sync repositories and pull requests.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-white mb-2">
            GitHub Owner
          </label>
          <input
            type="text"
            value={githubOwner}
            onChange={(e) => setGithubOwner(e.target.value)}
            placeholder="e.g. microsoft"
            className="w-full rounded-xl border border-[#333333] bg-[#262626] text-white placeholder:text-[#777777] px-4 py-3 focus:outline-none focus:border-white text-sm transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-white mb-2">
            Personal Access Token
          </label>
          <input
            type="password"
            value={githubToken}
            onChange={(e) => setGithubToken(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxxxxxxx"
            className="w-full rounded-xl border border-[#333333] bg-[#262626] text-white placeholder:text-[#777777] px-4 py-3 focus:outline-none focus:border-white text-sm transition-all"
          />
        </div>

        {message && (
          <div className={`flex items-center gap-2 rounded-xl px-4 py-3 border text-sm font-medium ${
            connected ? "bg-white/10 text-white border-white/20" : "bg-red-500/10 text-red-400 border-red-500/30"
          }`}>
            {connected ? <CheckCircle size={18} /> : <XCircle size={18} />}
            {message}
          </div>
        )}

        <div className="flex gap-4 pt-2">
          <button
            onClick={testConnection}
            disabled={loading}
            className="bg-white hover:bg-neutral-200 text-black px-6 py-3 rounded-full font-bold text-sm transition-all flex items-center gap-2 shadow-md disabled:opacity-60 disabled:cursor-not-allowed active:scale-95 cursor-pointer"
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
            className={`px-6 py-3 rounded-full font-bold text-sm transition-all ${
              connected
                ? "bg-white hover:bg-neutral-200 text-black shadow-md active:scale-95 cursor-pointer"
                : "bg-[#262626] text-[#777777] cursor-not-allowed border border-[#333333]"
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
