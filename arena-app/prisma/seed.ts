import { PrismaClient } from "../generated/prisma/index.js";

const db = new PrismaClient();

const ARENA_PLATFORM_COMPANY_ID = "clr_arena_platform_company_001";
const ARENA_PLATFORM_USER_ID = "clr_arena_platform_user_001";

async function main() {
  // 1. Platform user (no Clerk ID needed for system account)
  const platformUser = await db.user.upsert({
    where: { id: ARENA_PLATFORM_USER_ID },
    create: {
      id: ARENA_PLATFORM_USER_ID,
      clerkId: "system:arena-platform",
      email: "benchmarks@meltr.com",
      role: "COMPANY",
      onboardingComplete: true,
    },
    update: {},
  });

  // 2. Platform company — isSystem=true bypasses Stripe payment gate
  await db.company.upsert({
    where: { id: ARENA_PLATFORM_COMPANY_ID },
    create: {
      id: ARENA_PLATFORM_COMPANY_ID,
      userId: platformUser.id,
      name: "Arena Benchmarks",
      isSystem: true,
    },
    update: { name: "Arena Benchmarks", isSystem: true },
  });

  console.log(`[Seed] Platform company seeded id=${ARENA_PLATFORM_COMPANY_ID}`);

  // 3. BenchmarkTemplate records
  const templates = [
    {
      slug: "code-gen-basics",
      title: "Code Generation Basics",
      taskDefinition: `Write a TypeScript function that solves the following problem:

Given an array of integers, return a new array containing only the unique elements, preserving their original order.

Requirements:
- Use TypeScript with proper type annotations
- Handle edge cases: empty array, all duplicates, single element
- Include JSDoc comment explaining the function
- O(n) time complexity preferred

Example: [1, 2, 2, 3, 1, 4] → [1, 2, 3, 4]`,
      rubric: `Score from 0-100 based on:
- Correctness (40pts): Does the function produce correct output for all test cases including edge cases?
- TypeScript quality (25pts): Proper types, no implicit any, good type inference usage
- Code quality (20pts): Clean, readable, well-structured code with appropriate JSDoc
- Performance (15pts): Is the time complexity O(n) or better?`,
      tokenBudget: 10000,
      durationMinutes: 60,
      category: ["code-gen"],
    },
    {
      slug: "reasoning-chain",
      title: "Multi-Step Reasoning",
      taskDefinition: `Solve the following multi-step logic problem and show your complete reasoning chain:

A company has 5 departments: Engineering, Marketing, Sales, Finance, and Operations.
- The Engineering team has twice as many members as Marketing
- Sales has 3 more members than Finance
- Operations has 15 members
- The total headcount is 85
- Finance has 10 members

Questions to answer:
1. How many people are in each department?
2. What percentage of the company is in Engineering?
3. If Engineering hires 5 more people, what is the new total and new Engineering percentage?

Show all calculations step by step.`,
      rubric: `Score from 0-100 based on:
- Mathematical accuracy (50pts): Are all calculations correct?
- Reasoning clarity (30pts): Is the step-by-step logic clearly explained and easy to follow?
- Completeness (20pts): Are all three questions fully answered?`,
      tokenBudget: 15000,
      durationMinutes: 90,
      category: ["reasoning"],
    },
    {
      slug: "data-analysis-csv",
      title: "Data Analysis Task",
      taskDefinition: `Analyze the following sales dataset and provide insights:

\`\`\`
Month,Region,Product,Units,Revenue
Jan,North,Widget A,120,2400
Jan,South,Widget A,85,1700
Jan,North,Widget B,45,2250
Feb,North,Widget A,135,2700
Feb,South,Widget B,60,3000
Feb,East,Widget A,90,1800
Mar,North,Widget A,150,3000
Mar,South,Widget B,75,3750
Mar,East,Widget A,110,2200
\`\`\`

Provide:
1. Total revenue by region
2. Best-selling product by units
3. Month-over-month revenue growth rate
4. Top performing region-product combination
5. A brief strategic recommendation based on the data`,
      rubric: `Score from 0-100 based on:
- Numerical accuracy (40pts): Are all calculations correct?
- Analytical depth (30pts): Does the analysis identify meaningful patterns and trends?
- Actionability (20pts): Is the strategic recommendation specific and data-driven?
- Presentation (10pts): Is the output well-organized and easy to read?`,
      tokenBudget: 12000,
      durationMinutes: 75,
      category: ["data-analysis"],
    },
  ];

  for (const template of templates) {
    await db.benchmarkTemplate.upsert({
      where: { slug: template.slug },
      create: { ...template, isActive: true },
      update: { ...template, isActive: true },
    });
    console.log(`[Seed] BenchmarkTemplate seeded slug=${template.slug}`);
  }

  console.log("[Seed] Done.");
}

main()
  .catch((e) => {
    console.error("[Seed] Error:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
