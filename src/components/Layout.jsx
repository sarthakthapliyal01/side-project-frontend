import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function Layout({
  currentPage,
  setCurrentPage,
  sidebarOpen,
  setSidebarOpen,
  children,
  user,
}) {
  return (
    <div className="h-screen bg-slate-100 p-2 sm:p-4 font-sans">
      <div className="flex h-full gap-2 sm:gap-4 overflow-hidden">
        <Sidebar
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        <div className="flex-1 flex flex-col bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <Topbar
            user={user}
            companyName={localStorage.getItem("companyName") || "Organization"}
          />

          {/* 
            Removed the hardcoded p-8 here so page components 
            (like Home.jsx) can control their own padding and edge-to-edge designs.
          */}
          <main className="flex-1 overflow-y-auto bg-slate-50/50">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export default Layout;