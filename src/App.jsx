import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Auth Pages
import Login from './pages/auth/Login';
import Setup from './pages/auth/Setup';

// Main Pages
import Dashboard from './pages/dashboard/Dashboard';
import StaffList from './pages/staff/StaffList';
import ClientList from './pages/clients/ClientList';
import TreatmentList from './pages/treatments/TreatmentList';
import ChickenManagement from './pages/chicken/ChickenManagement';
import ProductList from './pages/products/ProductList';
import PointOfSale from './pages/sales/PointOfSale';
import SalesList from './pages/sales/SalesList';
import DiscountRequests from './pages/sales/DiscountRequests';
import RefundList from './pages/refunds/RefundList';
import StockManagement from './pages/stock/StockManagement';
import Profile from './pages/profile/Profile';
import JumiaPOS from './pages/jumia/JumiaPOS';
import JumiaSales from './pages/jumia/JumiaSales';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/setup" element={<Setup />} />

          {/* Protected Routes */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard - Admin Only */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute adminOnly>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Staff Management - Admin Only */}
            <Route
              path="/staff"
              element={
                <ProtectedRoute adminOnly>
                  <StaffList />
                </ProtectedRoute>
              }
            />

            {/* Clients - Admin Only */}
            <Route
              path="/clients"
              element={
                <ProtectedRoute adminOnly>
                  <ClientList />
                </ProtectedRoute>
              }
            />

            {/* Treatments - Admin Only */}
            <Route
              path="/treatments"
              element={
                <ProtectedRoute adminOnly>
                  <TreatmentList />
                </ProtectedRoute>
              }
            />

            {/* Chicken Management - Admin Only */}
            <Route
              path="/chicken"
              element={
                <ProtectedRoute adminOnly>
                  <ChickenManagement />
                </ProtectedRoute>
              }
            />

            {/* Products */}
            <Route path="/products" element={<ProductList />} />

            {/* Point of Sale */}
            <Route path="/pos" element={<PointOfSale />} />

            {/* Jumia - Admin Only */}
            <Route
              path="/jumia"
              element={
                <ProtectedRoute adminOnly>
                  <JumiaPOS />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jumia/sales"
              element={
                <ProtectedRoute adminOnly>
                  <JumiaSales />
                </ProtectedRoute>
              }
            />

            {/* Sales History */}
            <Route path="/sales" element={<SalesList />} />

            {/* Discount Requests - Admin Only */}
            <Route
              path="/discount-requests"
              element={
                <ProtectedRoute adminOnly>
                  <DiscountRequests />
                </ProtectedRoute>
              }
            />

            {/* Refunds */}
            <Route path="/refunds" element={<RefundList />} />

            {/* Stock Management - Admin Only */}
            <Route
              path="/stock"
              element={
                <ProtectedRoute adminOnly>
                  <StockManagement />
                </ProtectedRoute>
              }
            />

            {/* Profile */}
            <Route path="/profile" element={<Profile />} />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/pos" replace />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/pos" replace />} />
        </Routes>
      </Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </AuthProvider>
  );
}

export default App;
