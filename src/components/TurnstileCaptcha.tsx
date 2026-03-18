import { useEffect, useRef, useState } from "react";

interface TurnstileCaptchaProps {
  onVerify: (token: string) => void;
  siteKey?: string;
}

export default function TurnstileCaptcha({ onVerify, siteKey }: TurnstileCaptchaProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Turnstile placeholder - actual widget requires Cloudflare sitekey
    const key = siteKey || "0x4AAAAAAA_placeholder";
    if (typeof (window as any).turnstile !== "undefined" && ref.current) {
      (window as any).turnstile.render(ref.current, {
        sitekey: key,
        callback: onVerify,
      });
      setLoaded(true);
    }
  }, [onVerify, siteKey]);

  return (
    <div ref={ref} className="my-4">
      {!loaded && (
        <p className="text-xs text-muted-foreground text-center">Loading verification...</p>
      )}
    </div>
  );
}
