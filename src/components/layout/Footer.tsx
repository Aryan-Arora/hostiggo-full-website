import Link from "next/link";
import { Globe, Instagram, Linkedin } from "lucide-react";
import CopyrightBar from "./CopyrightBar";

type FooterLink = { label: string; href: string };

const footerSections: { title: string; links: FooterLink[] }[] = [
  {
    title: "Hosting",
    links: [
      { label: "Become a host", href: "/become-a-host" },
      { label: "Hosting standards", href: "/host" },
      { label: "Add-on services", href: "#" },
      { label: "Earnings & payouts", href: "/host/earnings" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help center", href: "/support" },
      { label: "Contact host support", href: "/contact" },
      { label: "Report and issue", href: "/report-issue" },
      { label: "FAQs", href: "/faq" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms & policies", href: "/terms" },
      { label: "Privacy policy", href: "/privacy" },
      { label: "Report an issue", href: "/report-issue" },
    ],
  },
  {
    title: "Download App",
    links: [
      { label: "Android", href: "#" },
      { label: "iOS", href: "#" },
    ],
  },
];

function XIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  );
}

const socials = [
  { Icon: Instagram, label: "Instagram", href: "https://instagram.com" },
  { Icon: Linkedin, label: "LinkedIn", href: "https://linkedin.com" },
  { Icon: XIcon, label: "X", href: "https://x.com" },
];

export default function Footer() {
  return (
    <footer>
      {/* Full-width divider separating page content from the footer */}
      <div className="w-full h-px bg-[#E5E7EB]" />

      {/* Main footer, figma-cream background, content in a centered 1100px container */}
      <div className="bg-figma-cream">
        <div className="mx-auto max-w-[1100px] px-6 pt-10 pb-10">
          {/* 4 columns (Hosting, Support, Legal, Download App) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-left">
            {footerSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-[18px] font-bold text-[#111827] mb-4">
                  {section.title}
                </h3>
                <ul className="space-y-3">
                  {section.links.map((link) => {
                    const isInternal = link.href.startsWith("/") && link.href !== "#";
                    const className =
                      "text-[14px] text-[#4B5563] hover:text-[#111827] transition-colors";
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
          </div>

          {/* Language + social row, centered */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <button
              type="button"
              className="flex items-center gap-2 text-[#111827] hover:text-black text-[14px] font-semibold transition-colors"
            >
              <Globe className="w-4 h-4 text-[#111827]" />
              <span>English</span>
            </button>
            <span className="hidden sm:inline text-gray-300 select-none">•</span>
            <div className="flex items-center gap-3">
              <span className="text-[#111827] text-[14px] font-semibold">Get social</span>
              <div className="flex items-center gap-2.5">
                {socials.map(({ Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center transition-all hover:scale-105 hover:bg-black"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full-width dark blue copyright bar */}
      <CopyrightBar />
    </footer>
  );
}
