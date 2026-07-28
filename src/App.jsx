import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Loader2 } from "lucide-react";

import AuthPage from "./components/AuthPage";
import Home from "./components/Home";
import Layout from "./components/Layout";
import OrganizationPage from "./Pages/OrganizationPage";
import JiraIntegration from "./components/JiraIntegration";

function App() {
  const [organizationCreated, setOrganizationCreated] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 font-sans gap-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500 animate-pulse tracking-wide">
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

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return (
          <Home user={user} logout={logout} companyName={companyName} />
        );

      case "jira":
        return <JiraIntegration />;

      case "settings":
        return (
          <div className="max-w-7xl mx-auto p-6 md:p-8 lg:p-10">
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Settings
              </h1>
              <p className="mt-2 text-slate-500 font-medium">
                Manage your account and organization settings.
              </p>
            </div>
          </div>
        );

      default:
        return null;
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