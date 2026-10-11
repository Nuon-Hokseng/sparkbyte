/**
 * The site's identity, in one place. Used by the page metadata, the web app
 * manifest, robots.txt and the sitemap.
 */
export const site = {
  name: "SparkByte",
  // TODO: replace with a real one-line description before launch; search
  // engines show it under the title.
  description: "SparkByte",
  /** Set NEXT_PUBLIC_SITE_URL in the environment for anything but local dev. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  /** The page background; also the browser chrome colour on phones. */
  themeColor: "#050506",
  /** What we do, in a sentence, for the footer. */
  about:
    "Point-of-sale systems and mobile apps.",
  /** Where we are based. */
  location: "Cambodia",
  /** The year in the footer's copyright line. */
  year: 2026,
  /**
   * How to reach us. The contact form writes its email to `email`. Leave
   * `phone` or `telegram` empty and the site does not show it.
   */
  contact: {
    // TODO: replace before launch. This address cannot receive mail.
    email: "hello@sparkbyte.example",
    /** As it should be read, e.g. "+855 12 345 678". */
    phone: "" as string,
    /** The username, without the @. */
    telegram: "" as string,
  },
} as const;
