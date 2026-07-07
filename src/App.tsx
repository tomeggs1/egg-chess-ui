import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layouts/Layout";
import HomePage from "./pages/HomePage";
import PlayPage from "./pages/PlayPage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="play" element={<PlayPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
