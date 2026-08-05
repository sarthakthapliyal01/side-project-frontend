import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Loader2 } from "lucide-react";

import AuthPage from "./components/AuthPage";
import Home from "./components/Home";
import Layout from "./components/Layout";
import OrganizationPage from "./Pages/OrganizationPage";
import JiraIntegration from "./components/JiraIntegration";
import GitHubIntegration from "./components/GithubIntegration";

function App() {
  const [organizationCreated, setOrganizationCreated] = useState(true);
  const [currentPage, setCurrentPage] = useState("qmetry360"); // dashboard
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeModal, setActiveModal] = useState(null);

  const { isAuthenticated, user, logout, isLoading } = useAuth0();

  // Sync user to backend
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const companyName = localStorage.getItem("companyName");

    fetch("http://127.0.0.1:8000/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: user.name,
        email: user.email,
        picture: user.picture,
        auth0_id: user.sub,
        companyName,
      }),
    }).catch(console.error);
  }, [isAuthenticated, user]);

  // This is Loading State
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-black font-sans gap-4">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
        <p className="text-sm font-semibold text-slate-400 animate-pulse tracking-wide">
          Loading workspace...
        </p>
      </div>
    );
  }

  if (!organizationCreated) {
    return (
      <OrganizationPage
        onOrganizationCreated={() => setOrganizationCreated(true)}
      />
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  const companyName = localStorage.getItem("companyName");

  // Simple placeholder for pages not built yet, so nothing renders blank
  const ComingSoon = ({ title }) => (
    <div className="max-w-7xl mx-auto p-6 md:p-8 lg:p-10">
      <div className="bg-neutral-900 rounded-2xl p-8 border border-white/10 shadow-sm">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          {title}
        </h1>
        <p className="mt-2 text-slate-400 font-medium">
          This page is coming soon.
        </p>
      </div>
    </div>
  );

  const renderPage = () => {
    switch (currentPage) {
      case "qmetry360": // Home
        return (
          <Home user={user} logout={logout} companyName={companyName} />
        );

      case "eng-metrics":
        return <ComingSoon title="Eng Metrics" />;

      case "standup":
        return <ComingSoon title="Standup" />;

      case "tech-quality":
        return <ComingSoon title="Tech Quality" />;

      case "release":
        return <ComingSoon title="Release" />;

      case "integration": // this is the integration part of jira and github
      return (
        <div className="max-w-7xl mx-auto p-6 md:p-8 lg:p-10">
         
          <div className="flex flex-row items-center gap-8">
            
            <button 
              onClick={() => setActiveModal('jira')}
              className="flex items-center justify-center gap-3 w-48 px-6 py-4 bg-[#1e212b] hover:bg-[#272b38] border border-gray-700/50 hover:border-gray-500 rounded-xl text-white font-semibold text-lg transition-all shadow-md hover:shadow-lg"
            >
              <span className="text-blue-500 text-2xl"></span> 
              Jira
            </button>

            <button 
              onClick={() => setActiveModal('github')}
              className="flex items-center justify-center gap-3 w-48 px-6 py-4 bg-[#1e212b] hover:bg-[#272b38] border border-gray-700/50 hover:border-gray-500 rounded-xl text-white font-semibold text-lg transition-all shadow-md hover:shadow-lg"
            >
              <span className="text-white text-2xl"></span> 
              GitHub
            </button>

          </div>

          {activeModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">

              <div className="relative w-full max-w-2xl bg-[#1e212b] border border-gray-700 rounded-xl shadow-2xl overflow-hidden flex flex-col">

                <div className="flex justify-between items-center p-5 border-b border-gray-700/50">
                  <h3 className="text-lg font-bold text-white">
                    {activeModal === 'jira' ? 'Jira Integration' : 'GitHub Integration'}
                  </h3>
                  <button 
                    onClick={() => setActiveModal(null)}
                    className="text-gray-400 hover:text-white transition-colors p-1"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[80vh]">
                  {activeModal === 'jira' && <JiraIntegration />}
                  {activeModal === 'github' && <GitHubIntegration companyName={companyName} />}
                </div>
                
              </div>
            </div>
          )}
          
        </div>
      );

      case "settings":
        return (
          <div className="max-w-7xl mx-auto p-6 md:p-8 lg:p-10">
            <div className="bg-neutral-900 rounded-2xl p-8 border border-white/10 shadow-sm">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Settings
              </h1>
              <p className="mt-2 text-slate-400 font-medium">
                Manage your account and organization settings.
              </p>
            </div>
          </div>
        );

      default:
        return <ComingSoon title="Page not found" />;
    }
  };

  return (
    <Layout
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
      user={user}
    >
      {renderPage()}
    </Layout>
  );
}

export default App;