import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Mail, Shield } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <title>Ti'Fete Privacy Policy</title>

      <main className="container max-w-3xl mx-auto px-4 py-12 md:py-16">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Privacy Policy
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
            <p className="text-muted-foreground leading-relaxed">
              Ti'Fete ("we", "our", or "us") respects your privacy and is committed to
              protecting the personal information you share with us. This Privacy
              Policy explains how we collect, use, disclose, and safeguard your
              information when you use the Ti'Fete website, mobile application, and
              related services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              1. Information We Collect
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-foreground mb-2">Account Information</h3>
                <p className="text-muted-foreground leading-relaxed">
                  When you create an account, we may collect personal information such as
                  your name, email address, and login credentials.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-foreground mb-2">Transaction Information</h3>
                <p className="text-muted-foreground leading-relaxed">
                  When you purchase tickets or products through Ti'Fete, we collect
                  transaction information including purchase history and event
                  registrations. Payment information is processed securely through
                  third-party payment processors such as Stripe and is not stored
                  directly by Ti'Fete.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-foreground mb-2">Event Participation Information</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We collect information related to event attendance, ticket redemption,
                  and QR code scans used for event entry.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-foreground mb-2">User Content</h3>
                <p className="text-muted-foreground leading-relaxed">
                  If you submit reviews, comments, or organizer content, we collect and
                  store that information as part of the platform.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-foreground mb-2">Device and Usage Data</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We may automatically collect information about your device and how you
                  interact with the platform, including IP address, browser type, pages
                  visited, and usage patterns.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-foreground mb-2">Location Information</h3>
                <p className="text-muted-foreground leading-relaxed">
                  If you enable location services, we may collect general location
                  information to help display nearby events.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              2. How We Use Your Information
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We use the information we collect to:
            </p>
            <ul className="space-y-2 text-muted-foreground leading-relaxed list-disc pl-5">
              <li>Create and manage user accounts</li>
              <li>Process ticket purchases and transactions</li>
              <li>Provide access to events and digital tickets</li>
              <li>Enable event organizers to manage attendees</li>
              <li>Prevent fraud and unauthorized transactions</li>
              <li>Improve platform performance and user experience</li>
              <li>Communicate important service updates</li>
              <li>Provide customer support</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              3. How We Share Information
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We do not sell personal information.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We may share information with:
            </p>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-foreground mb-2">Service Providers</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Third-party services that help operate the platform, including payment
                  processors, hosting providers, and analytics tools.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-foreground mb-2">Event Organizers</h3>
                <p className="text-muted-foreground leading-relaxed">
                  When you purchase or register for an event, certain information (such
                  as name and ticket type) may be shared with the event organizer for
                  attendance management.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-foreground mb-2">Legal Requirements</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We may disclose information when required by law or to protect the
                  rights, safety, and security of Ti'Fete, our users, or others.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              4. Data Security
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We take reasonable administrative, technical, and organizational measures to
              protect your information. However, no method of transmission over the
              internet or electronic storage is completely secure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              5. Data Retention
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain personal information for as long as necessary to provide the
              service, comply with legal obligations, resolve disputes, and enforce
              agreements.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              6. Your Rights and Choices
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">You may:</p>
            <ul className="space-y-2 text-muted-foreground leading-relaxed list-disc pl-5">
              <li>Update account information within your profile</li>
              <li>Request deletion of your account</li>
              <li>Opt out of certain communications</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Requests can be submitted by contacting us at the email address below.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              7. Children's Privacy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Ti'Fete is not intended for children under the age of 13, and we do not
              knowingly collect personal information from children.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              8. Changes to This Policy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. Updates will be
              reflected by revising the "Last Updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              9. Contact Us
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              If you have questions about this Privacy Policy, please contact:
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
          <span className="text-foreground font-medium px-2">Privacy</span>
          <span className="hidden md:inline text-muted-foreground/50">•</span>
          <Link
            to="/terms"
            className="hover:text-foreground transition-colors px-2"
          >
            Terms
          </Link>
          <span className="hidden md:inline text-muted-foreground/50">•</span>
          <Link
            to="/accessibility"
            className="hover:text-foreground transition-colors px-2"
          >
            Accessibility
          </Link>
        </footer>
      </main>
    </div>
  );
}