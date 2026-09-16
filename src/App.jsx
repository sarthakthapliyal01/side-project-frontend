import { Modal, PlaceholderPage } from "./components/ui/ProductUI";
import { useEffect, useLayoutEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Loader2, X } from "lucide-react";
import { Toaster, ToastBar, toast } from "react-hot-toast";

import AuthPage from "./components/AuthPage";
import Standup from "./components/Standup";
import Layout from "./components/Layout";
import OrganizationPage from "./Pages/OrganizationPage";
import JiraIntegration from "./components/JiraIntegration";
import AzureBoardsIntegration from "./components/AzureBoardsIntegration";
import GitHubIntegration from "./components/GithubIntegration";
import GitLabIntegration from "./components/GitlabIntegration";
import IntegrationsPage from "./components/IntegrationsPage";
import QMetry360 from "./components/QMetry360";
import CapacityPlanning from "./Pages/CapacityPlanning";
import { API_BASE_URL } from "./utils/api";

function App() {
  const [organizationCreated, setOrganizationCreated] = useState(() => Boolean(localStorage.getItem("companyName")));
  const [devBypass, setDevBypass] = useState(() => localStorage.getItem("devBypass") === "true" || Boolean(localStorage.getItem("companyName")));
  const [currentPage, setCurrentPage] = useState("standup");
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("qmetrix-theme") === "light" ? "light" : "dark"; }
    catch { return "dark"; }
  });
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("qmetrix-theme", theme); }
    catch { /* A theme can still be selected without persistent storage. */ }
  }, [theme]);
  const [activeModal, setActiveModal] = useState(null);

  const { isAuthenticated, user, logout, isLoading } = useAuth0();

  const handleDevBypass = () => {
    localStorage.setItem("companyName", "Demo Workspace");
    localStorage.setItem("devBypass", "true");
    setOrganizationCreated(true);
    setDevBypass(true);
  };

  const handleSwitchOrganization = () => {
    localStorage.removeItem("companyName");
    localStorage.removeItem("devBypass");
    localStorage.removeItem("currentProject");
    localStorage.removeItem("selectedSprint");
    localStorage.removeItem("selectedRelease");
    setOrganizationCreated(false);
    setDevBypass(false);
  };

  useEffect(() => {
    const handleSwitch = () => handleSwitchOrganization();
    window.addEventListener("switchOrganization", handleSwitch);
    return () => window.removeEventListener("switchOrganization", handleSwitch);
  }, []);

  // Auth & User Sync
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const companyName = localStorage.getItem("companyName");

    fetch(`${API_BASE_URL}/users`, {
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
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-b from-surface via-canvas to-canvas font-sans gap-5 relative overflow-hidden text-ink">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-inverse/[0.03] rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <Loader2 className="w-9 h-9 text-ink animate-spin" />
          <p className="text-xs font-semibold text-muted animate-pulse tracking-[0.2em] uppercase">
            Loading workspace...
          </p>
        </div>
      </div>
    );
  }

  if (!organizationCreated) {
    return (
      <OrganizationPage
        onOrganizationCreated={() => setOrganizationCreated(true)}
        onDevBypass={handleDevBypass}
      />
    );
  }

  if (!isAuthenticated && !devBypass) {
    return <AuthPage onDevBypass={() => setDevBypass(true)} />;
  }

  const companyName = localStorage.getItem("companyName");
  const activeUser = user || {
    name: "Demo User",
    email: "demo@localhost",
    picture: "",
  };

  const ComingSoon = PlaceholderPage;

  // Main Navigation Router
  const renderPage = () => {
    switch (currentPage) {
      case "qmetry360":
        return <QMetry360 user={user} companyName={companyName} />;
      case "eng-metrics":
        return <ComingSoon title="Eng Metrics" />;
      case "standup":
        return <Standup user={activeUser} logout={logout} companyName={companyName} onOpenCapacityDetails={() => setCurrentPage("capacity-planning")} />;
      case "capacity-planning":
        return <CapacityPlanning user={activeUser} onBack={() => setCurrentPage("standup")} />;
      case "roles-and-billing":
        return <RolesAndBilling onBack={() => setCurrentPage("integration")} />;
      case "tech-quality":
        return <ComingSoon title="Tech Quality" />;
      case "integration":
        return (
          <>
            <IntegrationsPage
              onOpenJiraModal={() => setActiveModal('jira')}
              onOpenAzureBoardsModal={() => setActiveModal('azure-boards')}
              onOpenGithubModal={() => setActiveModal('github')}
              onOpenGitlabModal={() => setActiveModal('gitlab')}
              onOpenCapacityPlanning={() => setCurrentPage("capacity-planning")}
              onOpenRolesAndBilling={() => setCurrentPage("roles-and-billing")}
            />

            {activeModal && <Modal title={{jira:"Jira connection","azure-boards":"Azure Boards connection",github:"GitHub connection",gitlab:"GitLab connection"}[activeModal]} onClose={() => setActiveModal(null)}>
              <div className="q-connection">
                {activeModal === 'jira' && <JiraIntegration embedded onClose={() => setActiveModal(null)} />}
                {activeModal === 'azure-boards' && <AzureBoardsIntegration embedded onClose={() => setActiveModal(null)} />}
                {activeModal === 'github' && <GitHubIntegration companyName={companyName} />}
                {activeModal === 'gitlab' && <GitLabIntegration companyName={companyName} />}
              </div>
            </Modal>}
          </>
        );
      case "settings":
        return <PlaceholderPage title="Settings" description="Account and organization settings will be available here." />;
      default:
        return <ComingSoon title="Page not found" />;
    }
  };


  return (
    <Layout
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      theme={theme}
      onToggleTheme={() => setTheme(value => value === "dark" ? "light" : "dark")}
      user={activeUser}
    >
      {renderPage()}
      <Toaster
        position="bottom-right"
        containerStyle={{
          bottom: 24,
          right: 24,
          zIndex: 9999,
        }}
        toastOptions={{
          duration: 3500,
          className: "q-toast",
          style: {
            background: "var(--bg-surface)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-default)",
            borderRadius: "12px",
            boxShadow: "0 16px 36px -6px rgba(0, 0, 0, 0.45), 0 0 0 1px var(--border-default)",
            fontFamily: "var(--font-sans)",
            fontSize: "14px",
            fontWeight: 500,
            padding: "11px 15px",
            maxWidth: "420px",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          },
          success: {
            className: "q-toast q-toast-success",
            iconTheme: {
              primary: "var(--color-success)",
              secondary: "var(--bg-surface)",
            },
          },
          error: {
            className: "q-toast q-toast-error",
            iconTheme: {
              primary: "var(--color-danger)",
              secondary: "var(--bg-surface)",
            },
          },
          loading: {
            className: "q-toast q-toast-loading",
            iconTheme: {
              primary: "var(--color-accent)",
              secondary: "var(--bg-surface)",
            },
          },
        }}
      >
        {(t) => (
          <ToastBar
            toast={t}
            style={{
              ...t.style,
              animation: t.visible
                ? "q-toast-enter 220ms var(--ease) forwards"
                : "q-toast-exit 180ms var(--ease) forwards",
            }}
          >
            {({ icon, message }) => (
              <>
                {icon}
                <div className="q-toast-message">{message}</div>
                {t.type !== "loading" && (
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="q-toast-close"
                    aria-label="Close notification"
                  >
                    <X size={14} />
                  </button>
                )}
              </>
            )}
          </ToastBar>
        )}
      </Toaster>
    </Layout>
  );
}

export default App;
