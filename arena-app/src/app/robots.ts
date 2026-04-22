import { type MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://arena.meltr.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/company/", "/developer/", "/onboarding/", "/api/", "/admin/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
