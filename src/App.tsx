import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { SessionProvider } from './context/SessionContext';
import { HelmetProvider } from 'react-helmet-async';
import { Navbar, Footer } from './components/Navigation';
import { LandingPage } from './pages/LandingPage';
import { ExplorePage } from './pages/ExplorePage';
import { TopicPage } from './pages/TopicPage';
import { SummaryPage } from './pages/SummaryPage';
import { ResultsPage } from './pages/ResultsPage';
import { AboutPage } from './pages/AboutPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ContactPage } from './pages/ContactPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AuthPage } from './pages/AuthPage';
import { PricingPage } from './pages/PricingPage';
import { ProfilePage } from './pages/ProfilePage';
import { SuccessPage } from './pages/SuccessPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { BattleModePage } from './pages/BattleModePage';
import { ConfessionsPage } from './pages/ConfessionsPage';
import { AnimatePresence } from 'motion/react';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppContent() {
  const location = useLocation();
  const isSessionPage = location.pathname.startsWith('/session') || location.pathname.startsWith('/topic');
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col relative">
      <ScrollToTop />
      {!isSessionPage && !isAdminPage && <Navbar />}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <Routes location={location}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/session" element={<TopicPage />} />
            <Route path="/topic/:id" element={<TopicPage />} />
            <Route path="/summary" element={<SummaryPage />} />
            <Route path="/results/:id" element={<ResultsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/success" element={<SuccessPage />} />
            <Route path="/battle" element={<BattleModePage />} />
            <Route path="/confessions" element={<ConfessionsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AnimatePresence>
      </main>
      {!isSessionPage && !isAdminPage && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <SessionProvider>
        <Router>
          <AppContent />
        </Router>
      </SessionProvider>
    </HelmetProvider>
  );
}
