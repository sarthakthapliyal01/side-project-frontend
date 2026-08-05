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
    <div className="h-screen bg-black p-2 sm:p-4 font-sans">
      <div className="flex h-full gap-2 sm:gap-4 overflow-hidden">
        <Sidebar
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        <div className="flex-1 flex flex-col bg-black rounded-2xl sm:rounded-3xl shadow-sm border border-white/5 overflow-hidden">
          <Topbar
            user={user}
            companyName={localStorage.getItem("companyName") || "Organization"}
            logout={logout}
          />
          <main className="flex-1 overflow-hidden bg-black">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export default Layout;