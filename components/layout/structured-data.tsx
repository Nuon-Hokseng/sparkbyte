import { site } from "@/lib/site";

const { email, phone, telegram } = site.contact;
// An address that cannot receive mail is not one to give to search engines.
const reachable = !email.endsWith(".example");

const profiles = [
  ...site.profiles,
  ...(telegram ? [`https://t.me/${telegram}`] : []),
];

// Who we are and which site is ours, in the vocabulary search engines read
// (schema.org). The organisation and the site point at each other by @id.
const data = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${site.url}/#organization`,
      name: site.name,
      alternateName: "Spark Byte",
      url: site.url,
      logo: {
        "@type": "ImageObject",
        url: `${site.url}/icon-512.png`,
        width: 512,
        height: 512,
      },
      image: `${site.url}/opengraph-image.png`,
      description: site.description,
      address: { "@type": "PostalAddress", addressCountry: site.country },
      areaServed: { "@type": "Country", name: site.location },
      knowsAbout: [
        "Point-of-sale systems",
        "Mobile app development",
        "Restaurant and retail software",
      ],
      ...(reachable && { email }),
      ...(phone && { telephone: phone.replace(/[^+\d]/g, "") }),
      ...(profiles.length > 0 && { sameAs: profiles }),
    },
    {
      "@type": "WebSite",
      "@id": `${site.url}/#website`,
      // The name search engines show for the site above each result.
      name: site.name,
      alternateName: ["Spark Byte", "SparkByte Cambodia"],
      url: site.url,
      description: site.description,
      inLanguage: "en",
      publisher: { "@id": `${site.url}/#organization` },
    },
  ],
};

/**
 * Tells search engines, in a form they read directly, that this is the
 * official site of SparkByte: its name, logo, country and other pages.
 * Renders a script that browsers ignore.
 */
export function StructuredData() {
  return (
    <script
      type="application/ld+json"
      // A "<" in the data must not be able to close the script.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
