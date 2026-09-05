import type { MetadataRoute } from "next";

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "titunge.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/browse", "/product", "/shop", "/business", "/sell", "/pricing", "/about", "/contact"],
        // Everything else is either a private tenant ERP page (behind auth,
        // subdomain-scoped) or a checkout/account flow with no reason to be indexed.
        disallow: ["/dashboard", "/settings", "/orders", "/customers", "/inventory", "/finance", "/admin", "/checkout", "/account", "/api"],
      },
    ],
    sitemap: `https://${APP_DOMAIN}/sitemap.xml`,
  };
}
