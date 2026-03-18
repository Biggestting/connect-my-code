import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";

interface ReferralData {
  promoterId: string | null;
  promoCode: string | null;
  referralCode: string | null;
  eventId: string | null;
}

interface PromoContextType {
  promoterCode: string | null;
  referral: ReferralData;
  setPromoterCode: (code: string | null) => void;
  setReferral: (data: Partial<ReferralData>) => void;
  clearPromoCode: () => void;
}

const PromoContext = createContext<PromoContextType>({
  promoterCode: null,
  referral: { promoterId: null, promoCode: null, referralCode: null, eventId: null },
  setPromoterCode: () => {},
  setReferral: () => {},
  clearPromoCode: () => {},
});

const REFERRAL_STORAGE_KEY = "quara_referral";

function loadReferral(): ReferralData {
  try {
    const raw = localStorage.getItem(REFERRAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { promoterId: null, promoCode: null, referralCode: null, eventId: null, ...parsed };
    }
  } catch {}
  return { promoterId: null, promoCode: null, referralCode: null, eventId: null };
}

function saveReferral(data: ReferralData) {
  try {
    if (data.promoterId || data.promoCode || data.referralCode) {
      localStorage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify(data));
    } else {
      localStorage.removeItem(REFERRAL_STORAGE_KEY);
    }
  } catch {}
}

export function PromoProvider({ children }: { children: ReactNode }) {
  const [referral, setReferralState] = useState<ReferralData>(loadReferral);

  const promoterCode = referral.promoCode;

  const setPromoterCode = (code: string | null) => {
    const updated = { ...referral, promoCode: code };
    setReferralState(updated);
    saveReferral(updated);
  };

  const setReferral = (data: Partial<ReferralData>) => {
    const updated = { ...referral, ...data };
    setReferralState(updated);
    saveReferral(updated);
  };

  const clearPromoCode = () => {
    const cleared: ReferralData = { promoterId: null, promoCode: null, referralCode: null, eventId: null };
    setReferralState(cleared);
    saveReferral(cleared);
  };

  return (
    <PromoContext.Provider value={{ promoterCode, referral, setPromoterCode, setReferral, clearPromoCode }}>
      {children}
    </PromoContext.Provider>
  );
}

export function usePromoCode() {
  return useContext(PromoContext);
}

export function usePromoCapture() {
  const [searchParams] = useSearchParams();
  const { setReferral, setPromoterCode } = usePromoCode();

  useEffect(() => {
    const promoId = searchParams.get("promo");
    const promoCode = searchParams.get("p");
    const refCode = searchParams.get("ref");

    if (promoId) {
      setReferral({ promoterId: promoId });
    }
    if (promoCode) {
      setPromoterCode(promoCode.toUpperCase());
    }
    if (refCode) {
      setReferral({ referralCode: refCode });
    }
  }, [searchParams]);
}
