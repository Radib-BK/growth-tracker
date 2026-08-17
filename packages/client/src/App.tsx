import { Navigate, Route, Routes } from 'react-router-dom';
import { GuestRoute } from '@/components/GuestRoute';
import { LocaleLayout } from '@/components/LocaleLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { detectBrowserLanguage } from '@/lib/i18n-routes';
import { DemoLayout } from '@/demo/DemoLayout';
import DemoReading from '@/demo/pages/DemoReading';
import DemoWriting from '@/demo/pages/DemoWriting';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';

function App() {
  const rootRedirect = <Navigate to={`/${detectBrowserLanguage()}`} replace />;

  return (
    <div className="min-h-dvh w-full overflow-y-auto bg-neutral-50">
      <div className="flex w-full justify-center px-4 py-8">
        <Routes>
          <Route path="/" element={rootRedirect} />
          {/* public, no auth and no language prefix, for the presentation */}
          <Route path="/demo" element={<DemoLayout />}>
            <Route index element={<DemoReading />} />
            <Route path="writing" element={<DemoWriting />} />
          </Route>
          <Route path="/:lang" element={<LocaleLayout />}>
            <Route
              index
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="login"
              element={
                <GuestRoute>
                  <Login />
                </GuestRoute>
              }
            />
            <Route
              path="signup"
              element={
                <GuestRoute>
                  <Signup />
                </GuestRoute>
              }
            />
          </Route>
          <Route path="*" element={rootRedirect} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
