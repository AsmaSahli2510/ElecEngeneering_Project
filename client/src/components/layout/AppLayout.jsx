import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import OnboardingTour from "../onboarding/OnboardingTour.jsx";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";

function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, setOnboardingDone } = useAuth();
  const navigate = useNavigate();
  // Guide de bienvenue : affiché d'office tant que le compte ne l'a pas vu, ou relancé à la demande.
  const [tourRequested, setTourRequested] = useState(false);
  const showTour = tourRequested || (user && !user.onboardingDone);

  const openTour = () => setTourRequested(true);
  const closeTour = () => {
    setTourRequested(false);
    if (!user?.onboardingDone) setOnboardingDone(true);
  };

  return (
    <>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((collapsed) => !collapsed)}
      />
      <div
        className={`transition-[padding] duration-300 print:pl-0 ${sidebarCollapsed ? "pl-[72px]" : "pl-72"}`}>
        <Topbar onHelp={openTour} sidebarCollapsed={sidebarCollapsed} />
        <main className="min-h-screen bg-background px-space-xl pb-space-2xl pt-16 print:bg-white print:p-0">
          <Outlet context={{ openTour }} />
        </main>
      </div>
      {showTour && (
        <OnboardingTour
          onClose={closeTour}
          onStart={() => {
            closeTour();
            navigate("/projects/new");
          }}
        />
      )}
    </>
  );
}

export default AppLayout;
