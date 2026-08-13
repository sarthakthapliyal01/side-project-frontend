import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function Layout({
  currentPage,
  setCurrentPage,
  sidebarOpen,
  setSidebarOpen,
  children,
  user,
  logout,
}) {
  return (
    <div className="h-screen bg-transparent p-2 sm:p-4 font-sans relative overflow-hidden">
      <div className="flex h-full gap-2 sm:gap-4 overflow-hidden relative z-10">
        <Sidebar
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        <div className="flex-1 flex flex-col bg-[#0c0c0e]/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-[#1e1e24] overflow-hidden">
          <Topbar
            user={user}
            companyName={localStorage.getItem("companyName") || "Organization"}
            logout={logout}
            currentPage={currentPage}
          />
          <main className={`flex-1 bg-transparent ${currentPage === "qmetry360" || currentPage === "standup" ? "overflow-hidden" : "overflow-y-auto"}`}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export default Layout;