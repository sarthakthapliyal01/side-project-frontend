import { API_BASE_URL } from "../utils/api";
import { useState, useEffect } from "react";
import axios from "axios";
import { FaGitlab } from "react-icons/fa";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

function GitLabIntegration({ companyName }) {
  const [gitlabUrl, setGitlabUrl] = useState("https://gitlab.com");
  const [gitlabOwner, setGitlabOwner] = useState("");
  const [gitlabToken, setGitlabToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState("");

  const comp = companyName || localStorage.getItem("companyName");

  useEffect(() => {
    if (!comp) return;
    axios
      .get(`${API_BASE_URL}/gitlab/connection/${comp}`)
      .then((res) => {
        if (res.data?.connected) {
          setConnected(true);
          if (res.data.gitlab_owner) {
            setGitlabOwner(res.data.gitlab_owner);
          }
          if (res.data.gitlab_url) {
            setGitlabUrl(res.data.gitlab_url);
          }
          setMessage(`Connected to GitLab account: ${res.data.gitlab_owner}`);
        }
      })
      .catch(() => {});
  }, [comp]);

  const handleConnectGitlab = async () => {
    if (!comp) {
      toast.error("Company name is missing.");
      return;
    }
    if (!gitlabToken.trim()) {
      toast.error("Please enter your Personal Access Token.");
      return;
    }

    setLoading(true);
    setMessage("");
    const toastId = toast.loading("Verifying GitLab credentials...");

    try {
      // 1. Test connection
      const testRes = await axios.post("${API_BASE_URL}/gitlab/test-connection", {
        gitlab_url: gitlabUrl.trim() || "https://gitlab.com",
        gitlab_owner: gitlabOwner.trim(),
        gitlab_token: gitlabToken.trim(),
      });

      if (!testRes.data?.connected) {
        throw new Error("Unable to verify GitLab credentials.");
      }

      // 2. Save connection
      toast.loading("Saving connection...", { id: toastId });
      await axios.post("${API_BASE_URL}/gitlab/save-connection", {
        companyName: comp,
        gitlab_url: gitlabUrl.trim() || "https://gitlab.com",
        gitlab_owner: gitlabOwner.trim(),
        gitlab_token: gitlabToken.trim(),
      });

      // 3. Sync repositories
      toast.loading("Fetching GitLab projects...", { id: toastId });
      await axios.post(`${API_BASE_URL}/gitlab/sync-repos/${comp}`).catch(() => {});

      window.dispatchEvent(new CustomEvent("gitlabConnectionUpdated"));
      window.dispatchEvent(new CustomEvent("gitlabReposUpdated"));

      setConnected(true);
      setMessage(`Connected to GitLab account: ${gitlabOwner}`);
      toast.success("GitLab connected & repositories fetched successfully!", { id: toastId });
    } catch (error) {
      setConnected(false);
      const errMsg = error.response?.data?.detail || error.message || "Failed to connect to GitLab.";
      setMessage(errMsg);
      toast.error(errMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-surface rounded-2xl shadow-none border border-line p-6 md:p-8 font-sans">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-control border border-line-strong text-[#fc6d26] text-2xl shadow-sm">
          <FaGitlab />
        </div>
        <div>
          <h2 className="text-xl font-bold text-ink tracking-tight">GitLab Integration</h2>
          <p className="text-muted text-xs mt-0.5">
            Connect your GitLab account or self-hosted instance to sync repositories and merge requests.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-2">
            GitLab Host / Server URL
          </label>
          <input
            type="text"
            value={gitlabUrl} aria-label="GitLab server URL"
            onChange={(e) => setGitlabUrl(e.target.value)}
            placeholder="https://gitlab.com"
            className="w-full rounded-xl border border-line-strong bg-control text-ink placeholder:text-muted px-4 py-3 focus:outline-none focus:border-ink text-sm transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-2">
            GitLab Owner / Group / Username <span className="text-xs text-muted font-normal lowercase">(optional)</span>
          </label>
          <input
            type="text"
            value={gitlabOwner} aria-label="GitLab owner or group"
            onChange={(e) => setGitlabOwner(e.target.value)}
            placeholder="e.g. code-crusaders or username (leave blank to auto-detect)"
            className="w-full rounded-xl border border-line-strong bg-control text-ink placeholder:text-muted px-4 py-3 focus:outline-none focus:border-ink text-sm transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-2">
            Personal Access Token (PAT)
          </label>
          <input
            type="password"
            value={gitlabToken} aria-label="GitLab personal access token"
            onChange={(e) => setGitlabToken(e.target.value)}
            placeholder="glpat-xxxxxxxxxxxxxxxxx"
            className="w-full rounded-xl border border-line-strong bg-control text-ink placeholder:text-muted px-4 py-3 focus:outline-none focus:border-ink text-sm transition-all"
          />
        </div>

        {message && (
          <div className={`flex items-center gap-2 rounded-xl px-4 py-3 border text-sm font-medium ${
            connected ? "bg-success/10 text-success border-success/30" : "bg-danger/10 text-danger border-danger/30"
          }`}>
            {connected ? <CheckCircle size={18} /> : <XCircle size={18} />}
            {message}
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={handleConnectGitlab}
            disabled={loading}
            className="w-full bg-inverse hover:bg-inverse text-on-inverse px-6 py-3 rounded-full font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-none disabled:opacity-60 disabled:cursor-not-allowed active:scale-95 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Connecting GitLab...
              </>
            ) : connected ? (
              "Reconnect GitLab"
            ) : (
              "Connect GitLab"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default GitLabIntegration;
