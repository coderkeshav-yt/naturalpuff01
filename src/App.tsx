
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import './App.css';
import Home from './pages/Home';
import About from './pages/About';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Products from './pages/Products';
import Layout from './components/layout/Layout';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Checkout from './pages/Checkout';
import Payment from './pages/Payment';
import ProcessPayment from './pages/ProcessPayment';
import HealthBenefits from './pages/HealthBenefits';
import AdminDashboard from './pages/AdminDashboard';
import EventsOffers from './pages/EventsOffers';
import AdminRoute from './components/auth/AdminRoute';
import OrderSuccess from './pages/OrderSuccess';
import FixPermissions from './pages/FixPermissions';
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="blog" element={<Blog />} />
          <Route path="blog/:id" element={<BlogPost />} />
          <Route path="products" element={<Products />} />
          <Route path="contact" element={<Contact />} />
          <Route path="signup" element={<Signup />} />
          <Route path="login" element={<Login />} />
          <Route path="profile" element={<Profile />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="payment" element={<Payment />} />
          <Route path="process-payment" element={<ProcessPayment />} />
          <Route path="health-benefits" element={<HealthBenefits />} />
          <Route path="events-offers" element={<EventsOffers />} />
          <Route path="order-success" element={<OrderSuccess />} />
          <Route path="fix-permissions" element={<FixPermissions />} />
          <Route 
            path="dashboard/admin" 
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } 
          />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
