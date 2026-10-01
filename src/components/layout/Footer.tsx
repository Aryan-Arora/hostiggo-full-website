import Link from "next/link";
import CopyrightBar from "./CopyrightBar";

type FooterLink = { label: string; href: string; soon?: boolean };

const footerSections: { title: string; links: FooterLink[] }[] = [
  {
    title: "Company",
    links: [
      { label: "About us", href: "/about" },
      { label: "Contact us", href: "/contact" },
    ],
  },
  {
    title: "Hosting",
    links: [
      { label: "Become a host", href: "/become-a-host" },
      { label: "Hosting guides", href: "/help" },
      { label: "Add-on services", href: "/help/add-ons" },
      { label: "Earnings & payouts", href: "/help/payouts" },
      { label: "Verify your identity", href: "/help/verify-identity" },
      { label: "Removing a listing", href: "/help/delisting" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help centre", href: "/help" },
      { label: "Chat guidelines", href: "/help/chat-guidelines" },
      { label: "Refunds explained", href: "/help/refunds" },
      { label: "Contact host support", href: "/contact" },
      { label: "Safety information", href: "/safety" },
      { label: "Report an issue", href: "/report-issue" },
      { label: "FAQs", href: "/faq" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms & policies", href: "/terms" },
      { label: "Privacy policy", href: "/privacy" },
      { label: "Cancellation & refunds", href: "/cancellation" },
      { label: "Shipping policy", href: "/shipping-policy" },
      { label: "Cookie policy", href: "/cookies" },
    ],
  },
  {
    title: "Download App",
    links: [
      { label: "Android", href: "#", soon: true },
      { label: "iOS", href: "#", soon: true },
    ],
  },
];


export default function Footer() {
  return (
    <footer>
      {/* Full-width divider separating page content from the footer */}
      <div className="w-full h-px bg-[#E5E7EB]" />

      {/* Main footer, figma-cream background, content in a centered 1100px container */}
      <div className="bg-figma-cream">
        <div className="mx-auto max-w-[1100px] px-6 pt-10 pb-10">
          {/* 5 columns (Company, Hosting, Support, Legal, Download App) → wraps down on smaller screens */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 text-left">
            {footerSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-[18px] font-bold text-[#111827] mb-4">
                  {section.title}
                </h3>
                <ul className="space-y-3">
                  {section.links.map((link) => {
                    const className =
                      "text-[14px] text-[#4B5563] hover:text-[#111827] transition-colors";
                    if (link.soon) {
                      return (
                        <li key={`${section.title}-${link.label}`}>
                          <span
                            aria-disabled="true"
                            title="Coming soon"
                            className="text-[14px] text-[#9CA3AF] cursor-default select-none inline-flex items-center gap-1.5"
                          >
                            {link.label}
                            <span className="text-[10px] font-semibold uppercase tracking-wide bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">
                              Soon
                            </span>
                          </span>
                        </li>
                      );
                    }
                    return (
                      <li key={`${section.title}-${link.label}`}>
                        <Link href={link.href} className={className}>
                          {link.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Full-width dark blue copyright bar */}
      <CopyrightBar />
    </footer>
  );
}
