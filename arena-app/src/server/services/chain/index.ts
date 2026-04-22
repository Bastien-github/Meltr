import {
  createWalletClient,
  createPublicClient,
  http,
  encodeFunctionData,
  type Hash,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia, base } from "viem/chains";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { env } from "~/env.js";
import type { OracleResult } from "../../../../generated/prisma/index.js";

const secretsClient = new SecretsManagerClient({ region: env.AWS_REGION });

const RECORD_RESULT_ABI = [
  {
    name: "recordResult",
    type: "function",
    inputs: [
      { name: "hash", type: "bytes32" },
      { name: "contestId", type: "string" },
      { name: "agentId", type: "string" },
      { name: "tokensUsed", type: "uint256" },
      { name: "qualityScore", type: "uint256" },
      { name: "timestamp", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

const IS_DEV = process.env.NODE_ENV !== "production";

async function getWalletPrivateKey(): Promise<`0x${string}`> {
  const cmd = new GetSecretValueCommand({
    SecretId: env.PLATFORM_WALLET_KEY_SECRET_ARN,
  });
  const response = await secretsClient.send(cmd);
  const key = response.SecretString;
  if (!key) {
    throw new Error("[Chain] Platform wallet key secret is empty");
  }
  return key.startsWith("0x") ? (key as `0x${string}`) : `0x${key}`;
}

export class ChainService {
  static async submitResult(oracleResult: OracleResult): Promise<Hash> {
    if (IS_DEV) {
      const fakeTxHash: Hash = `0x${"0".repeat(64)}`;
      console.log(
        `[Chain] DEV stub — skipping Base L2 write for oracleResultId=${oracleResult.id}`,
      );
      return fakeTxHash;
    }

    const privateKey = await getWalletPrivateKey();
    const account = privateKeyToAccount(privateKey);

    const chain = env.BASE_RPC_URL.includes("sepolia") ? baseSepolia : base;
    const transport = http(env.BASE_RPC_URL);

    const walletClient = createWalletClient({ account, chain, transport });
    const publicClient = createPublicClient({ chain, transport });

    const hashBytes = `0x${oracleResult.hash.padEnd(64, "0")}` as `0x${string}`;
    const timestamp = BigInt(Math.floor(oracleResult.signedAt.getTime() / 1000));

    const data = encodeFunctionData({
      abi: RECORD_RESULT_ABI,
      functionName: "recordResult",
      args: [
        hashBytes as `0x${string}` & { length: 66 },
        oracleResult.contestId,
        oracleResult.agentId,
        BigInt(oracleResult.tokensUsed),
        BigInt(oracleResult.qualityScore),
        timestamp,
      ],
    });

    const txHash = await walletClient.sendTransaction({
      to: env.CONTEST_RESULTS_CONTRACT as `0x${string}`,
      data,
    });

    console.log(
      `[Chain] submitted oracleResultId=${oracleResult.id} txHash=${txHash}`,
    );

    // Fire-and-forget receipt wait — caller handles retry if needed
    void publicClient.waitForTransactionReceipt({ hash: txHash }).then((receipt) => {
      console.log(
        `[Chain] confirmed txHash=${txHash} block=${receipt.blockNumber} status=${receipt.status}`,
      );
    });

    return txHash;
  }

  static async getTransactionStatus(txHash: Hash): Promise<"pending" | "success" | "reverted"> {
    if (IS_DEV) return "success";

    const chain = env.BASE_RPC_URL.includes("sepolia") ? baseSepolia : base;
    const publicClient = createPublicClient({ chain, transport: http(env.BASE_RPC_URL) });

    try {
      const receipt = await publicClient.getTransactionReceipt({ hash: txHash });
      return receipt.status === "success" ? "success" : "reverted";
    } catch {
      return "pending";
    }
  }
}
