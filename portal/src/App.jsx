// App.jsx - Updated for traffic jam system
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { LoginPage } from "@/pages/LoginPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PublicRoute } from "@/components/PublicRoute";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Toaster } from "@/components/ui/toaster";

import { AdminsPage } from "@/pages/admin/AdminsPage";
import { CouriersPage } from "@/pages/admin/CouriersPage";
import { CustomersPage } from "@/pages/admin/CustomersPage";
import { CitiesPage } from "@/pages/admin/CitiesPage";
import { HubsPage } from "@/pages/admin/HubsPage";
import { PricingRulesPage } from "@/pages/admin/PricingRulesPage";
import { ShipmentsPage } from "@/pages/admin/ShipmentsPage";
import { ShipmentDetailsPage } from "@/pages/admin/ShipmentDetailsPage";
import { ReportsPage } from "./pages/admin/ReportsPage";

function App() {
  return (
      <BrowserRouter>
        <AuthProvider>
            <Routes>
              {/* Root route - Login Page */}
              <Route
                path="/"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />
              
              {/* Admin Dashboard Routes */}
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <DashboardLayout>
                      <Routes>
                        <Route index element={<AdminDashboard />} />
                        <Route path="admins" element={<AdminsPage />} />
                        <Route path="couriers" element={<CouriersPage />} />
                        <Route path="customers" element={<CustomersPage />} />
                        <Route path="cities" element={<CitiesPage />} />
                        <Route path="hubs" element={<HubsPage />} />
                        <Route path="pricing-rules" element={<PricingRulesPage />} />
                        <Route path="shipments" element={<ShipmentsPage />} />
                        <Route path="shipments/:id" element={<ShipmentDetailsPage />} />

                        <Route path="reports" element={<ReportsPage />} />
                      </Routes>
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
            <Toaster />
        </AuthProvider>
      </BrowserRouter>
  );
}

export default App;