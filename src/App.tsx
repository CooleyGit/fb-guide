import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppStateProvider } from "./state/AppState";
import { PracticeProvider } from "./state/Practice";
import { AppShell } from "./components/shell/AppShell";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { PlaysPage } from "./pages/PlaysPage";
import { PracticePage } from "./pages/PracticePage";
import { LearnPage } from "./pages/LearnPage";
import { NotFound } from "./pages/NotFound";

export default function App() {
  return (
    <ErrorBoundary>
      <AppStateProvider>
        <PracticeProvider>
          <HashRouter>
            <Routes>
              <Route element={<AppShell />}>
                <Route index element={<Navigate to="/plays" replace />} />
                <Route path="/plays" element={<PlaysPage />} />
                <Route path="/practice" element={<PracticePage />} />
                <Route path="/learn" element={<LearnPage />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </HashRouter>
        </PracticeProvider>
      </AppStateProvider>
    </ErrorBoundary>
  );
}
