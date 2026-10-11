import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

// Everything may be crawled, and the sitemap says what there is.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
