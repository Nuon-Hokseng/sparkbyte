/**
 * The site's one address, with no slash at its end: what search engines are
 * told is the real home of every page (the canonical link, the sitemap, the
 * share images, the structured data). It is NEXT_PUBLIC_SITE_URL if that is
 * set, which it should be once the site has a domain of its own; failing that,
 * the production address Vercel gives the project; and on a developer's own
 * machine, localhost.
 */
function address() {
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (vercel ? `https://${vercel}` : "http://localhost:3000");
  // A site built for the public that thinks it lives on localhost tells
  // search engines the wrong address for everything. Say so in the build log.
  if (process.env.NODE_ENV === "production" && url.includes("localhost")) {
    console.warn(
      "SEO: no public address is set, so links for search engines point at localhost. Set NEXT_PUBLIC_SITE_URL to the site's real address.",
    );
  }
  return url.replace(/\/+$/, "");
}

/**
 * The site's identity, in one place. Used by the page metadata, the
 * structured data, the web app manifest, robots.txt and the sitemap.
 */
export const site = {
  name: "SparkByte",
  /** The page's title in search results and browser tabs: the name first. */
  title: "SparkByte | POS systems and mobile apps in Cambodia",
  /** What search engines show under the title. About 150 characters. */
  description:
    "SparkByte builds point-of-sale systems and mobile apps for shops, cafés and restaurants in Cambodia. Book a demo and see it set up for your business.",
  /** What people might type when they are looking for us. */
  keywords: [
    "SparkByte",
    "Spark Byte",
    "SparkByte Cambodia",
    "SparkByte POS",
    "POS system Cambodia",
    "point of sale Cambodia",
    "restaurant POS",
    "mobile app development Cambodia",
    "TilomNov",
  ],
  url: address(),
  /** The page background; also the browser chrome colour on phones. */
  themeColor: "#050506",
  /** What we do, in a sentence, for the footer. */
  about:
    "Point-of-sale systems and mobile apps.",
  /** Where we are based, and that country's two-letter code. */
  location: "Cambodia",
  country: "KH",
  /**
   * The addresses of our pages elsewhere (Facebook, Telegram channel,
   * LinkedIn and so on). Search engines use them to tell that those pages and
   * this site are the same SparkByte.
   */
  profiles: [] as string[],
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
