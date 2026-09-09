import { Navigate, Route, Routes } from 'react-router-dom';
import { GuestRoute } from '@/components/GuestRoute';
import { LocaleLayout } from '@/components/LocaleLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { detectBrowserLanguage } from '@/lib/i18n-routes';
import { DemoLayout } from '@/demo/DemoLayout';
import DemoReading from '@/demo/pages/DemoReading';
import DemoWriting from '@/demo/pages/DemoWriting';
import { TableDemoLayout } from '@/demo/table/TableDemoLayout';
import TableIntro from '@/demo/table/pages/Intro';
import TableColumns from '@/demo/table/pages/Columns';
import TableColumnGroups from '@/demo/table/pages/ColumnGroups';
import TableSorting from '@/demo/table/pages/Sorting';
import TableFiltering from '@/demo/table/pages/Filtering';
import TablePagination from '@/demo/table/pages/Pagination';
import TableVisibility from '@/demo/table/pages/Visibility';
import TablePinning from '@/demo/table/pages/Pinning';
import TableExpanding from '@/demo/table/pages/Expanding';
import TableSelection from '@/demo/table/pages/Selection';
import TableGrouping from '@/demo/table/pages/Grouping';
import TableKitchenSink from '@/demo/table/pages/KitchenSink';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Profile from '@/pages/Profile';
import Signup from '@/pages/Signup';

function App() {
  const rootRedirect = <Navigate to={`/${detectBrowserLanguage()}`} replace />;

  return (
    <div className="min-h-dvh w-full overflow-y-auto bg-neutral-50">
      <div className="flex w-full justify-center px-4 py-8">
        <Routes>
          <Route path="/" element={rootRedirect} />
          {/* public, no auth and no language prefix, for the presentation */}
          {/* TanStack Table session - wide layout of its own, all data local */}
          <Route path="/demo/table" element={<TableDemoLayout />}>
            <Route index element={<TableIntro />} />
            <Route path="columns" element={<TableColumns />} />
            <Route path="groups" element={<TableColumnGroups />} />
            <Route path="sorting" element={<TableSorting />} />
            <Route path="filtering" element={<TableFiltering />} />
            <Route path="pagination" element={<TablePagination />} />
            <Route path="visibility" element={<TableVisibility />} />
            <Route path="pinning" element={<TablePinning />} />
            <Route path="expanding" element={<TableExpanding />} />
            <Route path="selection" element={<TableSelection />} />
            <Route path="grouping" element={<TableGrouping />} />
            <Route path="kitchen-sink" element={<TableKitchenSink />} />
          </Route>
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
              path="profile"
              element={
                <ProtectedRoute>
                  <Profile />
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
