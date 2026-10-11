import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";

const GROUPS = [
  {
    name: "What we build",
    links: [
      { href: "/#pos", label: "POS systems" },
      { href: "/#apps", label: "Mobile apps" },
    ],
  },
  {
    name: "SparkByte",
    links: [
      { href: "/#process", label: "How we work" },
      { href: "/#contact", label: "Contact" },
    ],
  },
];

const { email, phone, telegram } = site.contact;

const LINK = "text-mist transition-colors hover:text-white";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-ink pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto w-full max-w-360 px-5 sm:px-8 lg:px-16">
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 py-14 lg:grid-cols-12 lg:gap-x-12 lg:py-20">
          <div className="col-span-2 lg:col-span-5">
            <Link
              href="/#top"
              className="inline-flex items-center gap-3 font-display text-2xl font-medium tracking-tight"
            >
              <Image
                src="/icon-192.png"
                alt=""
                width={40}
                height={40}
                className="size-10 rounded-[10px] border border-line"
              />
              {site.name}
            </Link>
            <p className="mt-5 max-w-88 text-pretty leading-relaxed text-mist">
              {site.about} Based in {site.location}.
            </p>
            <Link
              href="/#contact"
              className="mt-7 inline-flex h-12 items-center rounded-full bg-white px-6 text-[0.9375rem] font-semibold text-ink transition-colors hover:bg-mist"
            >
              Book a demo
            </Link>
          </div>

          {GROUPS.map((group, i) => (
            <nav
              key={group.name}
              aria-label={group.name}
              className={i ? "lg:col-span-2" : "lg:col-span-2 lg:col-start-7"}
            >
              <p className="text-sm text-silver">{group.name}</p>
              <ul className="mt-4 space-y-1 text-[0.9375rem]">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`inline-block py-1.5 ${LINK}`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="col-span-2 lg:col-span-2">
            <p className="text-sm text-silver">Get in touch</p>
            <ul className="mt-4 space-y-1 text-[0.9375rem]">
              <li>
                <a
                  href={`mailto:${email}`}
                  className={`inline-block break-all py-1.5 ${LINK}`}
                >
                  {email}
                </a>
              </li>
              {telegram && (
                <li>
                  <a
                    href={`https://t.me/${telegram}`}
                    className={`inline-block py-1.5 ${LINK}`}
                  >
                    Telegram @{telegram}
                  </a>
                </li>
              )}
              {phone && (
                <li>
                  <a
                    href={`tel:${phone.replace(/[^+\d]/g, "")}`}
                    className={`inline-block py-1.5 ${LINK}`}
                  >
                    {phone}
                  </a>
                </li>
              )}
              <li className="py-1.5 text-mist">{site.location}</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-line py-6 text-sm text-silver sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {site.year} {site.name}. All rights reserved.
          </p>
          <Link href="/#top" className="w-fit py-1 transition-colors hover:text-white">
            Back to top
          </Link>
        </div>
      </div>
    </footer>
  );
}
