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
} as const;
