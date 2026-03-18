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
import AuthPage from "./pages/Auth";
import NotFound from "./pages/NotFound";
import EventDetail from "./pages/EventDetail";
import SearchPage from "./pages/Search";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import MyTickets from "./pages/MyTickets";
import AccountPage from "./pages/Account";
import SavedPage from "./pages/Saved";
import SavedEvents from "./pages/SavedEvents";
import ProfilePage from "./pages/Profile";
import Marketplace from "./pages/Marketplace";
import CarnivalHub from "./pages/CarnivalHub";
import OrganizerProfile from "./pages/OrganizerProfile";
import OrganizerDashboard from "./pages/OrganizerDashboard";
import RequestOrganizer from "./pages/RequestOrganizer";
import ClaimTicket from "./pages/ClaimTicket";
import JoinPromoter from "./pages/JoinPromoter";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Accessibility from "./pages/Accessibility";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ActiveProfileProvider>
            <PromoProvider>
              <AnnouncementBanner />
              <TopNav />
              <MobileHeader />
              <Routes>
                <Route path="/" element={<Discovery />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/login" element={<Navigate to="/auth" replace />} />
                <Route path="/events/:id" element={<EventDetail />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/checkout/:id" element={<Checkout />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/tickets" element={<MyTickets />} />
                <Route path="/account" element={<AccountPage />} />
                <Route path="/saved" element={<SavedPage />} />
                <Route path="/saved-events" element={<SavedEvents />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/carnivals/:slug" element={<CarnivalHub />} />
                <Route path="/organizers/:slug" element={<OrganizerProfile />} />
                <Route path="/dashboard" element={<OrganizerDashboard />} />
                <Route path="/request-organizer" element={<RequestOrganizer />} />
                <Route path="/claim-ticket" element={<ClaimTicket />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/accessibility" element={<Accessibility />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <BottomNav />
            </PromoProvider>
          </ActiveProfileProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
