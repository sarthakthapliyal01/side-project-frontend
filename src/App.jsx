import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Loader2 } from "lucide-react";
import { Toaster } from "react-hot-toast";

import AuthPage from "./components/AuthPage";
import Standup from "./components/Standup";
import Layout from "./components/Layout";
import OrganizationPage from "./Pages/OrganizationPage";
import JiraIntegration from "./components/JiraIntegration";
import GitHubIntegration from "./components/GithubIntegration";
import IntegrationsPage from "./components/IntegrationsPage";
import QMetry360 from "./components/QMetry360";
import CapacityPlanning from "./Pages/CapacityPlanning";
import RolesAndBilling from "./Pages/RolesAndBilling";

function App() {
  const [organizationCreated, setOrganizationCreated] = useState(false);
  const [currentPage, setCurrentPage] = useState("standup");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeModal, setActiveModal] = useState(null);

  const { isAuthenticated, user, logout, isLoading } = useAuth0();

  // Auth & User Sync
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const companyName = localStorage.getItem("companyName");

    fetch("http://127.0.0.1:8000/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: user.name,
        email: user.email,
        picture: user.picture,
        auth0_id: user.sub,
        companyName,
      }),
    }).catch(console.error);
  }, [isAuthenticated, user]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#0f0f12] via-[#08080a] to-[#000000] font-sans gap-5 relative overflow-hidden text-white">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-white/[0.03] rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <Loader2 className="w-9 h-9 text-white animate-spin" />
          <p className="text-xs font-semibold text-[#999999] animate-pulse tracking-[0.2em] uppercase">
            Loading workspace...
          </p>
        </div>
      </div>
    );
  }

  if (!organizationCreated) {
    return <OrganizationPage onOrganizationCreated={() => setOrganizationCreated(true)} />;
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  const companyName = localStorage.getItem("companyName");

  const ComingSoon = ({ title }) => (
    <div className="max-w-7xl mx-auto p-6 md:p-8 lg:p-10">
      <div className="bg-[#0c0c0e]/90 backdrop-blur-xl rounded-3xl p-8 border border-[#1e1e24] shadow-2xl">
        <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
        <p className="mt-2 text-[#999999] font-normal leading-relaxed">This page is coming soon.</p>
      </div>
    </div>
  );

  // Main Navigation Router
  const renderPage = () => {
    switch (currentPage) {
      case "qmetry360":
        return <QMetry360 user={user} companyName={companyName} />;
      case "eng-metrics":
        return <ComingSoon title="Eng Metrics" />;
      case "standup":
        return <Standup user={user} logout={logout} companyName={companyName} onOpenCapacityDetails={() => setCurrentPage("capacity-planning")} />;
      case "capacity-planning":
        return <CapacityPlanning user={user} onBack={() => setCurrentPage("standup")} />;
      case "roles-and-billing":
        return <RolesAndBilling onBack={() => setCurrentPage("integration")} />;
      case "tech-quality":
        return <ComingSoon title="Tech Quality" />;
      case "release":
        return <ComingSoon title="Release" />;
      case "integration":
        return (
          <>
            <IntegrationsPage
              onOpenJiraModal={() => setActiveModal('jira')}
              onOpenGithubModal={() => setActiveModal('github')}
              onOpenCapacityPlanning={() => setCurrentPage("capacity-planning")}
              onOpenRolesAndBilling={() => setCurrentPage("roles-and-billing")}
            />

            {activeModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                {activeModal === 'jira' && (
                  <JiraIntegration onClose={() => setActiveModal(null)} />
                )}
                {activeModal === 'github' && (
                  <div className="relative w-full max-w-2xl bg-[#0c0c0e]/95 border border-[#1e1e24] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                    <div className="flex justify-between items-center p-5 border-b border-[#1e1e24] bg-[#141418]">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-white shadow-sm shadow-white/50" />
                        GitHub Integration
                      </h3>
                      <button
                        onClick={() => setActiveModal(null)}
                        className="text-[#999999] hover:text-white hover:bg-[#18181d] p-2 rounded-full transition-colors cursor-pointer"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="p-6 overflow-y-auto max-h-[80vh]">
                      <GitHubIntegration companyName={companyName} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        );
      case "settings":
        return (
          <div className="max-w-7xl mx-auto p-6 md:p-8 lg:p-10">
            <div className="bg-[#0c0c0e]/90 backdrop-blur-xl rounded-3xl p-8 border border-[#1e1e24] shadow-2xl">
              <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
              <p className="mt-2 text-[#999999] font-normal leading-relaxed">Manage your account and organization settings.</p>
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
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </Layout>
  );
}

export default App;
