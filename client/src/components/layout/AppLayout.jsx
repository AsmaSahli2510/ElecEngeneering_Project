import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";

function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((collapsed) => !collapsed)}
      />
      <div
        className={`transition-[padding] duration-300 print:pl-0 ${sidebarCollapsed ? "pl-[72px]" : "pl-72"}`}>
        <Topbar sidebarCollapsed={sidebarCollapsed} />
        <main className="min-h-screen bg-background px-space-xl pb-space-2xl pt-16 print:bg-white print:p-0">
          <Outlet />
        </main>
      </div>
    </>
  );
}

export default AppLayout;
