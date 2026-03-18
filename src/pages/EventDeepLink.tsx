import { useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { usePromoCode } from "@/hooks/use-promo-code";

/**
 * Deep-link landing page for promoter referral links.
 * URL: /e/{event_id}?promo={promoter_id}
 * 
 * Captures referral attribution and redirects to the event detail page.
 */
export default function EventDeepLink() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setReferral } = usePromoCode();

  useEffect(() => {
    const promoterId = searchParams.get("promo");
    const promoCode = searchParams.get("p");

    // Store referral attribution in localStorage (survives app install)
    if (promoterId) {
      setReferral({ promoterId, eventId: id || null });
    }
    if (promoCode) {
      setReferral({ promoCode: promoCode.toUpperCase(), eventId: id || null });
    }

    // Redirect to full event page
    navigate(`/events/${id}`, { replace: true });
  }, [id, searchParams, navigate, setReferral]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-pulse text-muted-foreground">Loading event...</div>
    </div>
  );
}
