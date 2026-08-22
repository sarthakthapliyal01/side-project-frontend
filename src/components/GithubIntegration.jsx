import { useState, useEffect } from "react";
import axios from "axios";
import { FaGithub } from "react-icons/fa";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

function GitHubIntegration({ companyName }) {
  const [githubOwner, setGithubOwner] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState("");

  const comp = companyName || localStorage.getItem("companyName");

  useEffect(() => {
    if (!comp) return;
    axios
      .get(`http://localhost:8000/github/connection/${comp}`)
      .then((res) => {
        if (res.data?.connected) {
          setConnected(true);
          if (res.data.github_owner) {
            setGithubOwner(res.data.github_owner);
          }
          setMessage(`Connected to GitHub account: ${res.data.github_owner}`);
        }
      })
      .catch(() => {});
  }, [comp]);

  const handleConnectGithub = async () => {
    if (!comp) {
      toast.error("Company name is missing.");
      return;
    }
    if (!githubOwner.trim() || !githubToken.trim()) {
      toast.error("Please enter both GitHub Owner and Personal Access Token.");
      return;
    }

    setLoading(true);
    setMessage("");
    const toastId = toast.loading("Verifying GitHub credentials...");

    try {
      // 1. Test connection
      const testRes = await axios.post("http://localhost:8000/github/test-connection", {
        github_owner: githubOwner,
        github_token: githubToken,
      });

      if (!testRes.data?.connected) {
        throw new Error("Unable to verify GitHub credentials.");
      }

      // 2. Save connection
      toast.loading("Saving connection...", { id: toastId });
      await axios.post("http://localhost:8000/github/save-connection", {
        companyName: comp,
        github_owner: githubOwner,
        github_token: githubToken,
      });

      // 3. Sync repositories ONLY (PR data will sync when user clicks Sync button in Standup)
      toast.loading("Fetching GitHub repositories...", { id: toastId });
      await axios.post(`http://localhost:8000/github/sync-repos/${comp}`).catch(() => {});

      window.dispatchEvent(new CustomEvent("githubConnectionUpdated"));
      window.dispatchEvent(new CustomEvent("githubReposUpdated"));

      setConnected(true);
      setMessage(`Connected to GitHub account: ${githubOwner}`);
      toast.success("GitHub connected & repositories fetched successfully!", { id: toastId });
    } catch (error) {
      setConnected(false);
      const errMsg = error.response?.data?.detail || error.message || "Failed to connect to GitHub.";
      setMessage(errMsg);
      toast.error(errMsg, { id: toastId });
    } finally {
      setLoading(false);
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
            Connect your GitHub account to sync repositories and pull requests into MongoDB.
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
            placeholder="e.g. username or organization"
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
            connected ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-red-500/10 text-red-400 border-red-500/30"
          }`}>
            {connected ? <CheckCircle size={18} /> : <XCircle size={18} />}
            {message}
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={handleConnectGithub}
            disabled={loading}
            className="w-full bg-white hover:bg-neutral-200 text-black px-6 py-3 rounded-full font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-60 disabled:cursor-not-allowed active:scale-95 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Connecting GitHub...
              </>
            ) : connected ? (
              "Reconnect GitHub"
            ) : (
              "Connect GitHub"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default GitHubIntegration;
