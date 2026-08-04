import Link from "next/link";
import { Languages, Instagram, Linkedin, Twitter } from "lucide-react";

type FooterLink = { label: string; href: string };

const footerSections: { title: string; links: FooterLink[] }[] = [
  {
    title: "Hosting",
    links: [
      { label: "Become a host", href: "/host/list/property-type" },
      { label: "Hosting standards", href: "/support" },
      { label: "Add-on services", href: "/support" },
      { label: "Earnings & payouts", href: "/host/earnings" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help center", href: "/support" },
      { label: "Contact host support", href: "mailto:support@hostiggo.com" },
      { label: "Report and issue", href: "/support" },
      { label: "FAQs", href: "/support" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms & policies", href: "/terms" },
      { label: "Privacy policy", href: "/privacy" },
      { label: "Report an issue", href: "/support" },
    ],
  },
  {
    title: "Download App",
    links: [
      { label: "Android", href: "/support" },
      { label: "iOS", href: "/support" },
    ],
  },
];

const socials = [
  { Icon: Instagram, label: "Instagram" },
  { Icon: Linkedin, label: "LinkedIn" },
  { Icon: Twitter, label: "X" },
];

export default function Footer() {
  return (
    <footer>
      {/* Full-width divider separating page content from the footer */}
      <div className="w-full h-px bg-[#E5E7EB]" />

      {/* Main footer — white background, content in a centered 1100px container */}
      <div className="bg-white">
        <div className="mx-auto max-w-[1100px] px-6 pt-10 pb-10">
          {/* 4 columns → 2 on tablet → 1 (centered) on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center sm:text-left">
            {footerSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-[18px] font-bold text-[#111827] mb-4">
                  {section.title}
                </h3>
                <ul className="space-y-3">
                  {section.links.map((link) => {
                    const isInternal = link.href.startsWith("/");
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

          {/* Language + social row — centered, 28px above */}
          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="flex items-center gap-1.5 text-[#111827] hover:text-black text-[14px] font-semibold transition-colors">
              <Languages className="w-4 h-4" /> English
            </button>
            <span className="hidden sm:inline text-gray-400 text-xs">•</span>
            <span className="text-[#111827] text-[14px] font-semibold">Get social</span>
            <div className="flex items-center gap-2.5">
              {socials.map(({ Icon, label }) => (
                <span
                  key={label}
                  aria-hidden="true"
                  className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center transition-transform hover:scale-105"
                >
                  <Icon className="w-4 h-4" />
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Full-width dark blue copyright bar */}
      <div className="w-full h-16 bg-[#0B4D78] flex items-center justify-center px-4">
        <p className="text-white text-[13px] font-medium text-center">
          © 2026 Hostiggo. Travel made simple.
        </p>
      </div>
    </footer>
  );
}
