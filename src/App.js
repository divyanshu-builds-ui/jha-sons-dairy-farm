import React, { lazy, Suspense, useState } from 'react';
import SplashScreen from './components/SplashScreen';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import PublicLayout from './components/layout/PublicLayout';
import TopProgressBar from './components/TopProgressBar';
import OfflineBanner from './components/OfflineBanner';
import { AuthProvider, useAuth } from './context/AuthContext';

function ProtectedRoute({ children }) {
  const mockUser = localStorage.getItem('mockUser');
  if (!mockUser) return <Navigate to="/login" replace />;
  return children;
}

const PublicHome  = lazy(() => import('./pages/public/Home'));
const MilkPage    = lazy(() => import('./pages/public/Milk'));
const SchemesPage = lazy(() => import('./pages/public/Schemes'));
const GauSevaPage = lazy(() => import('./pages/public/GauSeva'));
const AboutPage   = lazy(() => import('./pages/public/AboutContact').then(m => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('./pages/public/AboutContact').then(m => ({ default: m.ContactPage })));
const EnquiryPage = lazy(() => import('./pages/public/EnquiryPage'));
const DeliveryAreasPage = lazy(() => import('./pages/public/DeliveryAreasPage'));
const UpdatesPage = lazy(() => import('./pages/public/UpdatesPage'));
const MockLoginPage = lazy(() => import('./pages/auth/MockLoginPage'));
const CustomerDashboard = lazy(() => import('./pages/dashboard/CustomerDashboard'));
const AdminDashboard = lazy(() => import('./pages/dashboard/AdminDashboard'));
const NotFound  = lazy(() => import('./pages/NotFound'));

const Fallback = () => (
  <div className="flex items-center justify-center min-h-[40vh]">
    <div className="w-5 h-5 border-2 border-stone-200 border-t-brand-600 rounded-full animate-spin" />
  </div>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true,      element: <Suspense fallback={<Fallback />}><PublicHome /></Suspense> },
      { path: 'milk',     element: <Suspense fallback={<Fallback />}><MilkPage /></Suspense> },
      { path: 'schemes',  element: <Suspense fallback={<Fallback />}><SchemesPage /></Suspense> },
      { path: 'gau-seva', element: <Suspense fallback={<Fallback />}><GauSevaPage /></Suspense> },
      { path: 'about',    element: <Suspense fallback={<Fallback />}><AboutPage /></Suspense> },
      { path: 'contact',  element: <Suspense fallback={<Fallback />}><ContactPage /></Suspense> },
      { path: 'enquiry',         element: <Suspense fallback={<Fallback />}><EnquiryPage /></Suspense> },
      { path: 'delivery-areas',  element: <Suspense fallback={<Fallback />}><DeliveryAreasPage /></Suspense> },
      { path: 'updates',          element: <Suspense fallback={<Fallback />}><UpdatesPage /></Suspense> },
    ],
  },
  { path: '/login', element: <Suspense fallback={<Fallback />}><MockLoginPage /></Suspense> },
  { path: '/dashboard', element: <ProtectedRoute><Suspense fallback={<Fallback />}><CustomerDashboard /></Suspense></ProtectedRoute> },
  { path: '/admin', element: <ProtectedRoute><Suspense fallback={<Fallback />}><AdminDashboard /></Suspense></ProtectedRoute> },
  { path: '*', element: <Suspense fallback={<Fallback />}><NotFound /></Suspense> },
]);

export default function App() {
  const [splash, setSplash] = useState(true);

  function handleSplashDone() {
    setSplash(false);
  }

  return (
    <AuthProvider>
      {splash && <SplashScreen onDone={handleSplashDone} />}
      <TopProgressBar />
      <RouterProvider router={router} />
      <OfflineBanner />
    </AuthProvider>
  );
}
