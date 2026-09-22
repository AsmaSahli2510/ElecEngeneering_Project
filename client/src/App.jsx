import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout.jsx";
import Assets from "./pages/Assets.jsx";
import AssetDetailsPage from "./pages/asset/AssetDetailsPage.jsx";
import AssetMaintenancePage from "./pages/asset/AssetMaintenancePage.jsx";
import AssetPage from "./pages/asset/AssetPage.jsx";
import AssetTicketsPage from "./pages/asset/AssetTicketsPage.jsx";
import BomPage from "./pages/BomPage.jsx";
import CabinetStep from "./pages/CabinetStep.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import DepartsStep from "./pages/DepartsStep.jsx";
import FeederCalculation from "./pages/FeederCalculation.jsx";
import HistoryPage from "./pages/HistoryPage.jsx";
import InstallationPage from "./pages/InstallationPage.jsx";
import Maintenance from "./pages/Maintenance.jsx";
import MainFeederPage from "./pages/MainFeederPage.jsx";
import NewProject from "./pages/NewProject.jsx";
import PowerBalancePage from "./pages/PowerBalancePage.jsx";
import ProjectOverview from "./pages/ProjectOverview.jsx";
import ProjectPickerPage from "./pages/ProjectPickerPage.jsx";
import Projects from "./pages/Projects.jsx";
import QrCodes from "./pages/QrCodes.jsx";
import QuotationPage from "./pages/QuotationPage.jsx";
import Settings from "./pages/Settings.jsx";
import Standards from "./pages/Standards.jsx";
import Tickets from "./pages/Tickets.jsx";
import "./App.css";

// Cycle de vie complet, connecté de bout en bout :
// Projet → Armoire → Départs → Calculs → Bilan → Départ général → Nomenclature → Devis
// → Installation → Actif (garantie, QR code) → Maintenance → Tickets → Historique.
// Le câble fait partie du calcul de chaque départ : il n'y a pas de page « Câbles » séparée.
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/new" element={<NewProject />} />

          <Route path="projects/:projectId" element={<ProjectOverview />} />
          <Route path="projects/:projectId/cabinet" element={<CabinetStep />} />
          <Route path="projects/:projectId/history" element={<HistoryPage />} />
          <Route path="projects/:projectId/cabinets/:cabinetId/feeders" element={<DepartsStep />} />
          <Route
            path="projects/:projectId/cabinets/:cabinetId/feeders/:feederId/calculation"
            element={<FeederCalculation />}
          />
          <Route path="projects/:projectId/cabinets/:cabinetId/balance" element={<PowerBalancePage />} />
          <Route path="projects/:projectId/cabinets/:cabinetId/main-feeder" element={<MainFeederPage />} />
          <Route path="projects/:projectId/cabinets/:cabinetId/bom" element={<BomPage />} />
          <Route path="projects/:projectId/cabinets/:cabinetId/quotation" element={<QuotationPage />} />
          <Route path="projects/:projectId/cabinets/:cabinetId/installation" element={<InstallationPage />} />

          <Route path="assets" element={<Assets />} />
          <Route path="assets/:assetId" element={<AssetPage />} />
          <Route path="assets/:assetId/details" element={<AssetDetailsPage />} />
          <Route path="assets/:assetId/maintenance" element={<AssetMaintenancePage />} />
          <Route path="assets/:assetId/tickets" element={<AssetTicketsPage />} />
          <Route path="qr-codes" element={<QrCodes />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="tickets" element={<Tickets />} />

          {/* Entrées de menu « ingénierie » : ces modules font partie du cycle d'un projet, on choisit donc d'abord le projet. */}
          <Route
            path="cabinet-configurator"
            element={<ProjectPickerPage description="La configuration de l'armoire est la 2e étape du cycle de vie d'un projet." title="Configurateur d'armoire" />}
          />
          <Route
            path="cable-sizing"
            element={<ProjectPickerPage description="Le câble fait partie du calcul de chaque départ : ouvrez un projet, puis « Calculer » sur le départ voulu." title="Dimensionnement des câbles" />}
          />
          <Route
            path="power-balance"
            element={<ProjectPickerPage description="Le bilan se construit automatiquement à partir des départs calculés d'un projet." title="Bilan de puissance" />}
          />
          <Route
            path="bom-quotation"
            element={<ProjectPickerPage description="La nomenclature et le devis sont générés depuis les calculs d'un projet." title="Nomenclature et devis" />}
          />
          <Route path="standards" element={<Standards />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
