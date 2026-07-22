import { Routes, Route } from "react-router-dom";
import NoAuthPage from "./pages/NoAuthPage";
import Layout from "./components/Layouts/Layout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import HelpPage from "./pages/HelpPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import BoardExplorerPage from "./pages/BoardExplorerPage";
import GamePage from "./pages/GamePage";
import NotFoundPage from "./pages/NotFoundPage";
import { GameCatalogProvider } from "./data/GameCatalogContext";

export default function App() {
  return (
    <GameCatalogProvider>
      <Routes>
        <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="help" element={<HelpPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="noauth" element={<NoAuthPage />} />
        <Route path="settings/profile" element={<ProfilePage />} />
        <Route path="learn/board-explorer" element={<BoardExplorerPage />} />
        <Route path="game/:gameId" element={<GamePage />} />
        <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </GameCatalogProvider>
  );
}
