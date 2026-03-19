import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Mail, Accessibility } from "lucide-react";

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-background">
      <title>Ti'Fete Accessibility Statement</title>
      
      <main className="container max-w-3xl mx-auto px-4 py-12 md:py-16">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Accessibility className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Accessibility Statement
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Last Updated: February 2026
          </p>
        </div>

        <Separator className="mb-8" />

        {/* Content */}
        <article className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Our Commitment
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We are committed to making Ti'Fete accessible to all users, including 
              individuals with disabilities. We continually work to improve the 
              accessibility and usability of our website and platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              WCAG Standards
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Our goal is to follow the Web Content Accessibility Guidelines (WCAG) 
              2.1 Level AA standards wherever possible. These guidelines help ensure 
              that digital content is accessible to people with a wide range of abilities.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Ongoing Improvements
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              While we strive to make all areas of the platform fully accessible, 
              some content may not yet meet the highest accessibility standards. 
              We are actively working to improve accessibility as the platform evolves.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Contact Us
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              If you encounter any accessibility barriers or have suggestions for 
              improvement, please contact us and we will make reasonable efforts 
              to address the issue promptly.
            </p>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border">
              <Mail className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Email Support</p>
                <a 
                  href="mailto:help@tifete.com" 
                  className="text-sm text-primary hover:underline"
                >
                  help@tifete.com
                </a>
              </div>
            </div>
          </section>
        </article>

        {/* Footer Links */}
        <Separator className="my-10" />
        <footer className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-1 text-sm text-muted-foreground pb-24">
          <Link to="/privacy" className="hover:text-foreground transition-colors px-2">
            Privacy
          </Link>
          <span className="hidden md:inline text-muted-foreground/50">•</span>
          <Link to="/terms" className="hover:text-foreground transition-colors px-2">
            Terms
          </Link>
          <span className="hidden md:inline text-muted-foreground/50">•</span>
          <span className="text-foreground font-medium px-2">Accessibility</span>
        </footer>
      </main>
    </div>
  );
}