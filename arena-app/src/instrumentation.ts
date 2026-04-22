// Runs once when the Next.js server starts. Initializes BullMQ workers and
// registers graceful shutdown handlers for SIGTERM/SIGINT.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { contestWorker, gracefulShutdown: shutdownContest } = await import(
      "./server/queue/workers/contest-worker"
    );
    const { runnerWorker, gracefulShutdown: shutdownRunner } = await import(
      "./server/queue/workers/runner-worker"
    );
    const { oracleWorker, gracefulShutdown: shutdownOracle } = await import(
      "./server/queue/workers/oracle-worker"
    );
    const { benchmarkWorker, gracefulShutdown: shutdownBenchmark } = await import(
      "./server/queue/workers/benchmark-worker"
    );

    console.log(
      "[Arena] BullMQ workers started:",
      contestWorker.name,
      runnerWorker.name,
      oracleWorker.name,
      benchmarkWorker.name,
    );

    const shutdown = async () => {
      console.log("[Arena] Graceful shutdown — closing workers...");
      await Promise.allSettled([
        shutdownContest(),
        shutdownRunner(),
        shutdownOracle(),
        shutdownBenchmark(),
      ]);
      console.log("[Arena] All workers closed.");
    };

    process.once("SIGTERM", shutdown);
    process.once("SIGINT", shutdown);
    process.once("beforeExit", shutdown);
  }
}
