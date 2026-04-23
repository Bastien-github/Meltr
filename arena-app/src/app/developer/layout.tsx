import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "~/server/db";

export default async function DeveloperLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findFirst({ where: { clerkId: userId } });
  if (!user || user.role !== "DEVELOPER") redirect("/onboarding");

  return <>{children}</>;
}
