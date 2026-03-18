import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ActiveProfileProvider } from "@/hooks/use-active-profile";
import { PromoProvider } from "@/hooks/use-promo-code";
import { TopNav } from "@/components/TopNav";
import { BottomNav } from "@/components/BottomNav";
import { MobileHeader } from "@/components/MobileHeader";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import Discovery from "./pages/Discovery";
import SearchPage from "./pages/Search";
import EventDetail from "./pages/EventDetail";
import AuthPage from "./pages/Auth";
import MyTickets from "./pages/MyTickets";
import Marketplace from "./pages/Marketplace";
import Checkout from "./pages/Checkout";
import AccountPage from "./pages/Account";
import OrganizerProfile from "./pages/OrganizerProfile";
import CarnivalHub from "./pages/CarnivalHub";
import OrganizerDashboard from "./pages/OrganizerDashboard";
import CreateEvent from "./pages/CreateEvent";
import SavedPage from "./pages/Saved";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import RequestOrganizer from "./pages/RequestOrganizer";
import PromoterDashboard from "./pages/PromoterDashboard";
import ClaimTicket from "./pages/ClaimTicket";
import SignUpPage from "./pages/SignUp";
import NotFound from "./pages/NotFound";
import EventDeepLink from "./pages/EventDeepLink";
import BandStorefront from "./pages/BandStorefront";
import BandSectionPage from "./pages/BandSectionPage";
import CostumeDetail from "./pages/CostumeDetail";
import VersionDetailPage from "./pages/VersionDetailPage";
import AccessibilityPage from "./pages/Accessibility";
import PrivacyPage from "./pages/Privacy";
import TermsPage from "./pages/Terms";
import PaymentSuccess from "./pages/PaymentSuccess";
import JoinPromoter from "./pages/JoinPromoter";
import ProfilePage from "./pages/Profile";
import SavedEvents from "./pages/SavedEvents";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCarnivals from "./pages/admin/AdminCarnivals";
import AdminEventsPage from "./pages/admin/AdminEventsPage";
import AdminOrganizersPage from "./pages/admin/AdminOrganizersPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminMarketplace from "./pages/admin/AdminMarketplace";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminKillSwitches from "./pages/admin/AdminKillSwitches";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AdminOrganizerRequests from "./pages/admin/AdminOrganizerRequests";
import AdminQueues from "./pages/admin/AdminQueues";
import AdminFraudMonitoring from "./pages/admin/AdminFraudMonitoring";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ActiveProfileProvider>
        <PromoProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Admin routes - no TopNav/BottomNav */}
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/kill-switches" element={<AdminKillSwitches />} />
                <Route path="/admin/carnivals" element={<AdminCarnivals />} />
                <Route path="/admin/events" element={<AdminEventsPage />} />
                <Route path="/admin/organizers" element={<AdminOrganizersPage />} />
                <Route path="/admin/organizer-requests" element={<AdminOrganizerRequests />} />
                <Route path="/admin/orders" element={<AdminOrdersPage />} />
                <Route path="/admin/marketplace" element={<AdminMarketplace />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/announcements" element={<AdminAnnouncements />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
                <Route path="/admin/queues" element={<AdminQueues />} />
                <Route path="/admin/fraud" element={<AdminFraudMonitoring />} />

                {/* Public routes */}
                <Route path="/*" element={
                  <>
                    <AnnouncementBanner />
                    <MobileHeader />
                    <TopNav />
                    <main className="md:container">
                      <Routes>
                        <Route path="/" element={<Discovery />} />
                        <Route path="/search" element={<SearchPage />} />
                        <Route path="/events/:id" element={<EventDetail />} />
                        <Route path="/e/:id" element={<EventDeepLink />} />
                        <Route path="/events/:id/checkout" element={<Checkout />} />
                        <Route path="/checkout/:id" element={<Checkout />} />
                        <Route path="/payment-success" element={<PaymentSuccess />} />
                        <Route path="/bands/:bandId" element={<BandStorefront />} />
                        <Route path="/bands/:bandId/sections/:sectionId" element={<BandSectionPage />} />
                        <Route path="/bands/:bandId/sections/:sectionId/versions/:versionId" element={<VersionDetailPage />} />
                        <Route path="/bands/:bandId/costumes/:costumeId" element={<CostumeDetail />} />
                        <Route path="/auth" element={<AuthPage />} />
                        <Route path="/login" element={<Navigate to="/auth" replace />} />
                        <Route path="/signup" element={<SignUpPage />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/tickets" element={<MyTickets />} />
                        <Route path="/claim-ticket" element={<ClaimTicket />} />
                        <Route path="/saved" element={<SavedPage />} />
                        <Route path="/saved-events" element={<SavedEvents />} />
                        <Route path="/marketplace" element={<Marketplace />} />
                        <Route path="/account" element={<AccountPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/request-organizer" element={<RequestOrganizer />} />
                        <Route path="/promoter-dashboard" element={<PromoterDashboard />} />
                        <Route path="/join/promoter/:token" element={<JoinPromoter />} />
                        <Route path="/organizers/:slug" element={<OrganizerProfile />} />
                        <Route path="/carnivals/:slug" element={<CarnivalHub />} />
                        <Route path="/dashboard" element={<OrganizerDashboard />} />
                        <Route path="/dashboard/create-event" element={<CreateEvent />} />
                        <Route path="/dashboard/edit-event/:id" element={<CreateEvent />} />
                        <Route path="/accessibility" element={<AccessibilityPage />} />
                        <Route path="/privacy" element={<PrivacyPage />} />
                        <Route path="/terms" element={<TermsPage />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                    <BottomNav />
                  </>
                } />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </PromoProvider>
      </ActiveProfileProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
