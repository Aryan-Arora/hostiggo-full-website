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

export default function Footer() {
  return (
    <footer className="mt-6">
      <div className="container-main py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10 max-w-4xl mx-auto">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-bold text-gray-900 text-[15px] mb-4">{section.title}</h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => {
                  const isInternal = link.href.startsWith("/");
                  const className =
                    "text-gray-600 hover:text-blue-600 text-[13px] transition-colors";
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

        {/* Language + socials */}
        <div className="flex items-center justify-center gap-4 pb-8">
          <button className="flex items-center gap-1.5 text-gray-800 hover:text-gray-900 text-[13px] font-semibold transition-colors underline underline-offset-2">
            <Languages className="w-4 h-4" /> English
          </button>
          <span className="text-gray-400 text-xs">•</span>
          <span className="text-gray-800 text-[13px] font-semibold">Get social</span>
          <div className="flex items-center gap-2">
            {[
              { Icon: Instagram, label: "Instagram" },
              { Icon: Linkedin, label: "LinkedIn" },
              { Icon: Twitter, label: "X" },
            ].map(({ Icon, label }) => (
              <span
                key={label}
                aria-hidden="true"
                className="w-6 h-6 bg-gray-900 text-white rounded-md flex items-center justify-center"
              >
                <Icon className="w-3.5 h-3.5" />
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar — full width */}
      <div className="bg-white border-t border-gray-100 py-6">
        <p className="text-center text-gray-500 text-[12px]">
          © 2026 Hostiggo . Travel made simple
        </p>
      </div>
    </footer>
  );
}
