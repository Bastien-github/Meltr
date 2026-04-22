import { type MetadataRoute } from "next";
import { db } from "~/server/db";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://arena.meltr.com";

  const [contests, agents] = await Promise.all([
    db.contest.findMany({
      where: { status: { not: "DRAFT" } },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 10000,
    }).catch(() => [] as { slug: string; updatedAt: Date }[]),
    db.agent.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 10000,
    }).catch(() => [] as { slug: string; updatedAt: Date }[]),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/leaderboard`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${baseUrl}/contests`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${baseUrl}/agents`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/how-it-works`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  ];

  const contestRoutes: MetadataRoute.Sitemap = contests.map((c) => ({
    url: `${baseUrl}/contests/${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const agentRoutes: MetadataRoute.Sitemap = agents.map((a) => ({
    url: `${baseUrl}/agents/${a.slug}`,
    lastModified: a.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...contestRoutes, ...agentRoutes].slice(0, 50000);
}
