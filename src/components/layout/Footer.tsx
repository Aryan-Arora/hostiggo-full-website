import Link from "next/link";
import { Globe, IndianRupee, Facebook, Twitter, Instagram, Home } from "lucide-react";

type FooterLink = { label: string; href: string };

const footerSections: { title: string; links: FooterLink[] }[] = [
  {
    title: "Hosting",
    links: [
      { label: "Become a host", href: "/host/list/property-type" },
      { label: "Host dashboard", href: "/host/listings" },
      { label: "Refer & earn", href: "/refer" },
      { label: "Reviews", href: "/host/reviews" },
      { label: "Earnings & payouts", href: "/host/earnings" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help centre", href: "/support" },
      { label: "Contact support", href: "mailto:support@hostiggo.com" },
      { label: "Safety information", href: "/support" },
      { label: "Report an issue", href: "/support" },
      { label: "FAQs", href: "/support" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms & policies", href: "/terms" },
      { label: "Privacy policy", href: "/privacy" },
      { label: "Cancellation & refunds", href: "/cancellation" },
      { label: "Cookie policy", href: "/cookies" },
      { label: "FAQs", href: "/support" },
    ],
  },
];

// Download badges are placeholders — the apps aren't published yet, so these
// render as non-interactive "coming soon" tiles rather than dead links.
function AppStoreBadge() {
  return (
    <div
      aria-disabled="true"
      title="Coming soon"
      className="flex items-center gap-2 bg-gray-900/70 text-white rounded-xl px-3 py-2 w-[130px] cursor-default select-none"
    >
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white flex-shrink-0">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.15-2.19 1.28-2.17 3.83.03 3.02 2.65 4.03 2.68 4.04l-.04.16c-.12.41-.41 1.43-1.22 2.59zM13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
      <div>
        <p className="text-[9px] leading-none text-gray-300">iOS</p>
        <p className="text-xs font-semibold leading-tight mt-0.5">App Store</p>
      </div>
    </div>
  );
}

function PlayStoreBadge() {
  return (
    <div
      aria-disabled="true"
      title="Coming soon"
      className="flex items-center gap-2 bg-gray-900/70 text-white rounded-xl px-3 py-2 w-[130px] cursor-default select-none"
    >
      <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none">
        <path fill="#4CAF50" d="M1.5.8 13 12.3 1.5 23.2c-.3-.2-.5-.6-.5-1V1.8c0-.5.2-.8.5-1z" />
        <path fill="#FF3D00" d="m15 14-2.4 2.4L1.5 23.2l11.1-6.4L15 14z" />
        <path fill="#FFD600" d="m22.5 12-5.2 3-2.3-2.7 2.3-2.7 5.2 3z" />
        <path fill="#37474F" d="M1.5.8 12.6 7.2 15 10l-2.4 2.3L1.5 23.2C1.2 23 1 22.6 1 22.2V1.8C1 1.4 1.2 1 1.5.8z" />
      </svg>
      <div>
        <p className="text-[9px] leading-none text-gray-300">Android</p>
        <p className="text-xs font-semibold leading-tight mt-0.5">Google Play</p>
      </div>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-6">
      <div className="container-main py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold text-gray-800 text-sm mb-4">{section.title}</h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => {
                  const isInternal = link.href.startsWith("/");
                  const className =
                    "text-gray-500 hover:text-blue-600 text-[13px] transition-colors";
                  return (
                    <li key={`${section.title}-${link.label}`}>
                      {isInternal ? (
                        <Link href={link.href} className={className}>
                          {link.label}
                        </Link>
                      ) : (
                        <a href={link.href} className={className}>
                          {link.label}
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          <div>
            <h3 className="font-semibold text-gray-800 text-sm mb-4">Download App</h3>
            <div className="space-y-2">
              <AppStoreBadge />
              <PlayStoreBadge />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
              <Home className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />
            </div>
            <p className="text-gray-400 text-xs">© 2025 Hostiggo · hostiggo.com</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-xs transition-colors">
              <Globe className="w-3.5 h-3.5" /> English
            </button>
            <button className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-xs transition-colors">
              <IndianRupee className="w-3.5 h-3.5" /> INR
            </button>
            <div className="flex items-center gap-1.5">
              {[{ Icon: Facebook, label: "Facebook" }, { Icon: Twitter, label: "Twitter" }, { Icon: Instagram, label: "Instagram" }].map(({ Icon, label }) => (
                <span key={label} aria-hidden="true" className="w-7 h-7 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center">
                  <Icon className="w-3.5 h-3.5" />
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
