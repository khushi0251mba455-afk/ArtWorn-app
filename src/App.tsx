import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthModal } from './components/AuthModal';
import { CartDrawer } from './components/CartDrawer';
import { CookieBanner } from './components/CookieBanner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { OfflineIndicator } from './components/OfflineIndicator';
import { WhatsAppFloat } from './components/WhatsAppFloat';
import { AuthProvider } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AboutPage } from './pages/AboutPage';
import { AccountPage } from './pages/AccountPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { ContactPage } from './pages/ContactPage';
import { CustomStudioPage } from './pages/CustomStudioPage';
import { GalleryPage } from './pages/GalleryPage';
import { HomePage } from './pages/HomePage';
import { LegalPage } from './pages/LegalPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { PreOrderPage } from './pages/PreOrderPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { ShopPage } from './pages/ShopPage';
import { SurveyPage } from './pages/SurveyPage';

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <StoreProvider>
              <BrowserRouter>
                <div className="min-h-screen flex flex-col bg-[#FAF6F0] text-[#1F1D1B] dark:bg-[#141210] dark:text-[#F5EFE6]">
                  <Navbar />
                  <main className="flex-1">
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/shop" element={<ShopPage />} />
                      <Route path="/product/:productId" element={<ProductDetailPage />} />
                      <Route path="/custom-studio" element={<CustomStudioPage />} />
                      <Route path="/gallery" element={<GalleryPage />} />
                      <Route path="/about" element={<AboutPage />} />
                      <Route path="/contact" element={<ContactPage />} />
                      <Route path="/legal/:docType" element={<LegalPage />} />
                      <Route path="/survey" element={<SurveyPage />} />
                      <Route path="/pre-order" element={<PreOrderPage />} />
                      <Route path="/account" element={<AccountPage />} />
                      <Route path="/checkout" element={<CheckoutPage />} />
                      <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
                      <Route path="/admin" element={<AdminDashboardPage />} />
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </main>
                  <Footer />
                  <CartDrawer />
                  <AuthModal />
                  <WhatsAppFloat />
                  <CookieBanner />
                  <OfflineIndicator />
                </div>
              </BrowserRouter>
            </StoreProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
