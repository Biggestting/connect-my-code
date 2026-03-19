import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Mail, FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <title>Ti'Fete Terms of Service</title>

      <main className="container max-w-3xl mx-auto px-4 py-12 md:py-16">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Terms of Service
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
              Welcome to Ti'Fete. These Terms of Service ("Terms") govern your use of
              the Ti'Fete website, mobile application, and related services
              (collectively, the "Platform"). By accessing or using the Platform,
              you agree to be bound by these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              1. Use of the Platform
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Ti'Fete provides a platform that allows event organizers to create events
              and sell tickets, and allows users to discover, purchase, and manage
              tickets and event-related products.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              You agree to use the Platform only for lawful purposes and in accordance
              with these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              2. User Accounts
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              To access certain features, users may be required to create an account.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">You agree to:</p>
            <ul className="space-y-2 text-muted-foreground leading-relaxed list-disc pl-5">
              <li>Provide accurate information</li>
              <li>Maintain the security of your account</li>
              <li>Be responsible for activity under your account</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Ti'Fete reserves the right to suspend or terminate accounts that violate
              these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              3. Ticket Purchases
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Tickets purchased through Ti'Fete are issued by the event organizer.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Ti'Fete acts as a technology platform facilitating ticket transactions
              between users and event organizers.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-2">
              Event organizers are responsible for:
            </p>
            <ul className="space-y-2 text-muted-foreground leading-relaxed list-disc pl-5">
              <li>Event execution</li>
              <li>Event content</li>
              <li>Admission policies</li>
              <li>Event cancellations or changes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              4. Ticket Redemption
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Digital tickets may contain QR codes or other verification methods used
              for event entry.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Each ticket is valid for a single redemption unless otherwise specified.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              If a ticket has already been redeemed, it may not be reused for entry.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              5. Event Entry and Admission
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Possession of a valid ticket does not guarantee admission to an event.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-2">
              Event organizers and venue operators may refuse entry or remove individuals
              from events for reasons including but not limited to:
            </p>
            <ul className="space-y-2 text-muted-foreground leading-relaxed list-disc pl-5">
              <li>Safety or security concerns</li>
              <li>Venue capacity limits</li>
              <li>Violation of event rules or venue policies</li>
              <li>Intoxication or disruptive behavior</li>
              <li>Failure to comply with event staff instructions</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Event organizers and venues may also delay entry or temporarily restrict
              admission in order to maintain crowd safety or comply with local regulations.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Ti'Fete does not control venue policies, crowd management decisions, or
              admission determinations made by event organizers or venue staff.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Users acknowledge that entry decisions are made by the event organizer
              or venue and not by Ti'Fete.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              6. Ticket Resale and Fraud Prevention
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Ti'Fete may allow certain tickets to be resold through the platform. All
              resale transactions must occur through the official Ti'Fete ticket transfer
              or resale system when available.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-2">
              To protect users and event organizers from fraud:
            </p>
            <ul className="space-y-2 text-muted-foreground leading-relaxed list-disc pl-5">
              <li>
                When a ticket is resold through Ti'Fete, a new digital ticket may be
                issued to the buyer.
              </li>
              <li>
                Previously issued ticket credentials may be automatically invalidated.
              </li>
              <li>
                QR codes or digital entry credentials may be regenerated to prevent
                duplication.
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3 mb-2">
              Users may not:
            </p>
            <ul className="space-y-2 text-muted-foreground leading-relaxed list-disc pl-5">
              <li>Duplicate or distribute ticket QR codes.</li>
              <li>Sell tickets that have already been redeemed.</li>
              <li>Attempt to bypass Ti'Fete's ticket verification system.</li>
              <li>Engage in fraudulent or deceptive resale practices.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Tickets that are transferred or sold outside of the Ti'Fete platform may
              not be recognized as valid for entry.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Ti'Fete reserves the right to suspend accounts, cancel tickets, or
              restrict resale privileges if fraudulent activity is suspected.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              7. Marketplace Products and Costume Sales
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Ti'Fete may allow event organizers and vendors to list costumes, jouvert
              packages, or other event-related products for purchase through the platform.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Ti'Fete operates solely as a technology marketplace connecting buyers with
              event organizers or vendors. Ti'Fete does not manufacture, inspect, store,
              or distribute any products listed on the platform.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              All products purchased through Ti'Fete are fulfilled directly by the event
              organizer or vendor.
            </p>

            <h3 className="font-semibold text-foreground mb-2">
              Product Fulfillment
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Products sold on the platform are typically fulfilled through in-person
              pickup or in-person exchange at designated locations or events. Ti'Fete does
              not provide shipping, delivery, or product handling services.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-2">
              The event organizer or vendor is solely responsible for:
            </p>
            <ul className="space-y-2 text-muted-foreground leading-relaxed list-disc pl-5">
              <li>Product availability</li>
              <li>Product quality and condition</li>
              <li>Pickup instructions and logistics</li>
              <li>Customer communication regarding pickup times and locations</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Ti'Fete is not responsible for missed pickup times, product defects, or
              disputes between buyers and organizers regarding product fulfillment.
            </p>

            <h3 className="font-semibold text-foreground mt-4 mb-2">
              Product Listings
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Event organizers and vendors are responsible for ensuring that product
              descriptions, images, sizing details, and other listing information are
              accurate.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Ti'Fete does not guarantee the authenticity, quality, or suitability of
              products listed by third-party organizers or vendors.
            </p>

            <h3 className="font-semibold text-foreground mt-4 mb-2">
              Disputes
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Any disputes regarding product condition, sizing, pickup logistics, or
              product availability must be resolved directly between the buyer and the
              event organizer or vendor.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Ti'Fete reserves the right to remove product listings or suspend accounts if
              fraudulent or misleading product listings are detected.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              8. Event Changes and Cancellations
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Event organizers may modify or cancel events.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Refund eligibility is determined by the event organizer's refund policy.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Ti'Fete is not responsible for event cancellations, postponements, or
              changes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              9. Event Organizer Responsibility
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Ti'Fete operates solely as a technology platform that allows event
              organizers to list and sell tickets for events. Ti'Fete does not organize,
              host, sponsor, or control the events listed on the platform.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-2">
              Event organizers are solely responsible for:
            </p>
            <ul className="space-y-2 text-muted-foreground leading-relaxed list-disc pl-5">
              <li>Event planning and execution</li>
              <li>Venue safety and compliance</li>
              <li>Crowd management and security</li>
              <li>Event staffing and logistics</li>
              <li>Compliance with local laws and regulations</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Ti'Fete does not guarantee the accuracy, safety, legality, or quality of
              events listed on the platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              10. Assumption of Risk
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              By purchasing tickets or attending events discovered through the Ti'Fete
              platform, you acknowledge that participation in events involves inherent
              risks.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              You voluntarily assume all risks associated with attending events,
              including but not limited to personal injury, property damage, or other
              losses.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              To the maximum extent permitted by law, Ti'Fete shall not be liable for
              injuries, damages, or losses occurring at events hosted by third-party
              organizers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              11. Payments
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Payments on the Platform are processed through third-party payment
              providers such as Stripe.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              By making a purchase, you agree to the payment provider's terms and
              policies.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Ti'Fete does not store full payment card details.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              12. Payment Disputes and Chargebacks
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              By purchasing tickets or products through Ti'Fete, you agree that all
              sales are subject to the policies of the event organizer or vendor.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              If a user initiates a payment dispute or chargeback with their bank
              or payment provider, Ti'Fete reserves the right to investigate the
              transaction and provide relevant transaction records to the payment
              processor or financial institution.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-2">
              Such records may include:
            </p>
            <ul className="space-y-2 text-muted-foreground leading-relaxed list-disc pl-5">
              <li>Ticket purchase confirmation</li>
              <li>Ticket redemption records</li>
              <li>QR code scan logs</li>
              <li>Account activity associated with the purchase</li>
              <li>Event attendance verification</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              If a ticket has been redeemed or an event has been attended, the
              purchase may be considered fulfilled.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Users who initiate fraudulent or abusive chargebacks may have their
              accounts suspended or permanently banned from the platform.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Ti'Fete reserves the right to recover funds or restrict access to
              services in cases of suspected payment abuse or fraud.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              13. Platform Fees and Refunds
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Ti'Fete may charge platform service fees or transaction fees in connection
              with ticket purchases or product transactions.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Unless otherwise stated, platform service fees are non-refundable.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              If an event organizer cancels an event and elects to issue refunds, the
              refund amount may include the ticket price but may exclude platform
              service fees or payment processing fees.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Users acknowledge that payment processing providers may retain
              transaction fees associated with the original payment.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Refund eligibility and refund policies are determined by the event
              organizer unless otherwise required by law.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Ti'Fete reserves the right to retain applicable platform service fees in
              connection with completed transactions or administrative processing of
              refunds.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              14. User Content
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Users and organizers may submit reviews, comments, or other content.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              By submitting content, you grant Ti'Fete a non-exclusive license to display
              and distribute that content on the Platform.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Content that is abusive, fraudulent, or illegal may be removed.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              15. Prohibited Activities
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Users may not:
            </p>
            <ul className="space-y-2 text-muted-foreground leading-relaxed list-disc pl-5">
              <li>Attempt to bypass ticket verification systems</li>
              <li>Resell fraudulent tickets</li>
              <li>Interfere with platform security</li>
              <li>Use automated tools to scrape or manipulate listings</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Violation may result in account suspension.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              16. Platform Availability
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We strive to maintain reliable access to the Platform but cannot
              guarantee uninterrupted service.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Features may be updated or modified at any time.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              17. Limitation of Liability
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              To the maximum extent permitted by law, Ti'Fete shall not be liable for
              indirect, incidental, or consequential damages resulting from use of
              the Platform or attendance at events.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Event organizers are responsible for the execution and safety of their
              events.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              18. Indemnification
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree to indemnify and hold harmless Ti'Fete, its employees, and
              partners from claims arising from your use of the Platform or violation
              of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              19. Changes to the Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update these Terms from time to time. Continued use of the
              Platform constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              20. Contact
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              If you have questions about these Terms, please contact:
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
          <Link
            to="/privacy"
            className="hover:text-foreground transition-colors px-2"
          >
            Privacy
          </Link>
          <span className="hidden md:inline text-muted-foreground/50">•</span>
          <span className="text-foreground font-medium px-2">Terms</span>
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