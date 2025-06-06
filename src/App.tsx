
import React, { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import './App.css';
import Layout from './components/layout/Layout';
import AdminRoute from './components/auth/AdminRoute';
import { Toaster } from "@/components/ui/toaster";

// Eagerly loaded components (critical for initial render)
import Home from './pages/Home';

// Lazy loaded components
const About = lazy(() => import('./pages/About'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Contact = lazy(() => import('./pages/Contact'));
const SalesTeam = lazy(() => import('./pages/SalesTeam'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Signup = lazy(() => import('./pages/Signup'));
const Login = lazy(() => import('./pages/Login'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const ResetPasswordError = lazy(() => import('./pages/ResetPasswordError'));
const Profile = lazy(() => import('./pages/Profile'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Payment = lazy(() => import('./pages/Payment'));
const ProcessPayment = lazy(() => import('./pages/ProcessPayment'));
const HealthBenefits = lazy(() => import('./pages/HealthBenefits'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ShiprocketAdmin = lazy(() => import('./pages/admin/ShiprocketAdmin'));
const EventsOffers = lazy(() => import('./pages/EventsOffers'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const FixPermissions = lazy(() => import('./pages/FixPermissions'));
const PaymentVerificationPage = lazy(() => import('./pages/PaymentVerificationPage'));

// Loading component to show while lazy components are loading
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
  </div>
);

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Home is eagerly loaded for better initial load experience */}
          <Route index element={<Home />} />
          
          {/* All other routes are lazy loaded */}
          <Route path="about" element={
            <Suspense fallback={<LoadingFallback />}>
              <About />
            </Suspense>
          } />
          <Route path="blog" element={
            <Suspense fallback={<LoadingFallback />}>
              <Blog />
            </Suspense>
          } />
          <Route path="blog/:id" element={
            <Suspense fallback={<LoadingFallback />}>
              <BlogPost />
            </Suspense>
          } />
          <Route path="products" element={
            <Suspense fallback={<LoadingFallback />}>
              <Products />
            </Suspense>
          } />
          <Route path="product/:slug" element={
            <Suspense fallback={<LoadingFallback />}>
              <ProductDetail />
            </Suspense>
          } />
          <Route path="contact" element={
            <Suspense fallback={<LoadingFallback />}>
              <Contact />
            </Suspense>
          } />
          <Route path="sales-team" element={
            <Suspense fallback={<LoadingFallback />}>
              <SalesTeam />
            </Suspense>
          } />
          <Route path="signup" element={
            <Suspense fallback={<LoadingFallback />}>
              <Signup />
            </Suspense>
          } />
          <Route path="login" element={
            <Suspense fallback={<LoadingFallback />}>
              <Login />
            </Suspense>
          } />
          <Route path="reset-password" element={
            <Suspense fallback={<LoadingFallback />}>
              <ResetPassword />
            </Suspense>
          } />
          <Route path="reset-password-error" element={
            <Suspense fallback={<LoadingFallback />}>
              <ResetPasswordError />
            </Suspense>
          } />
          <Route path="profile" element={
            <Suspense fallback={<LoadingFallback />}>
              <Profile />
            </Suspense>
          } />
          <Route path="checkout" element={
            <Suspense fallback={<LoadingFallback />}>
              <Checkout />
            </Suspense>
          } />
          <Route path="payment" element={
            <Suspense fallback={<LoadingFallback />}>
              <Payment />
            </Suspense>
          } />
          <Route path="process-payment" element={
            <Suspense fallback={<LoadingFallback />}>
              <ProcessPayment />
            </Suspense>
          } />
          <Route path="payment-verification" element={
            <Suspense fallback={<LoadingFallback />}>
              <PaymentVerificationPage />
            </Suspense>
          } />
          <Route path="health-benefits" element={
            <Suspense fallback={<LoadingFallback />}>
              <HealthBenefits />
            </Suspense>
          } />
          <Route path="events-offers" element={
            <Suspense fallback={<LoadingFallback />}>
              <EventsOffers />
            </Suspense>
          } />
          <Route path="order-success" element={
            <Suspense fallback={<LoadingFallback />}>
              <OrderSuccess />
            </Suspense>
          } />
          <Route path="fix-permissions" element={
            <Suspense fallback={<LoadingFallback />}>
              <FixPermissions />
            </Suspense>
          } />
          <Route 
            path="dashboard/admin" 
            element={
              <AdminRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <AdminDashboard />
                </Suspense>
              </AdminRoute>
            } 
          />
          <Route 
            path="dashboard/shiprocket" 
            element={
              <AdminRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <ShiprocketAdmin />
                </Suspense>
              </AdminRoute>
            } 
          />
          <Route path="*" element={
            <Suspense fallback={<LoadingFallback />}>
              <NotFound />
            </Suspense>
          } />
        </Route>
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
