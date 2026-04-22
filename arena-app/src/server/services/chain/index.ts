import algosdk from "algosdk";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { env } from "~/env.js";
import type { OracleResult } from "../../../../generated/prisma/index.js";

const secretsClient = new SecretsManagerClient({ region: env.AWS_REGION });

const IS_DEV = process.env.NODE_ENV !== "production";

function makeAlgodClient(): algosdk.Algodv2 {
  const url = new URL(env.ALGORAND_NODE_URL);
  const server = `${url.protocol}//${url.hostname}`;
  const port = url.port || "";
  const token = env.ALGORAND_NODE_TOKEN ?? "";
  return new algosdk.Algodv2(token, server, port);
}

async function getWalletAccount(): Promise<algosdk.Account> {
  const cmd = new GetSecretValueCommand({
    SecretId: env.ALGORAND_WALLET_MNEMONIC_SECRET_ARN,
  });
  const response = await secretsClient.send(cmd);
  const mnemonic = response.SecretString;
  if (!mnemonic) {
    throw new Error("[Chain] Algorand wallet mnemonic secret is empty");
  }
  return algosdk.mnemonicToSecretKey(mnemonic.trim());
}

export class ChainService {
  // Returns the Algorand base32 txId
  static async submitResult(oracleResult: OracleResult): Promise<string> {
    if (IS_DEV) {
      // Fake 52-char base32 txId — Algorand txIds are always 52 chars
      const fakeTxId = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
      console.log(
        `[Chain] DEV stub — skipping Algorand write for oracleResultId=${oracleResult.id}`,
      );
      return fakeTxId;
    }

    const account = await getWalletAccount();
    const algod = makeAlgodClient();
    const params = await algod.getTransactionParams().do();

    // Encode the oracle result hash + identifiers in the note field for independent verification
    const noteText = `meltr:v1:${oracleResult.hash}:${oracleResult.contestId}:${oracleResult.agentId}`;
    const note = new TextEncoder().encode(noteText);

    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: account.addr,
      receiver: account.addr,
      amount: 0,
      note,
      suggestedParams: params,
    });

    const signedTxn = txn.signTxn(account.sk);
    // txID is deterministic once the transaction is built and signed
    const txId = txn.txID();

    await algod.sendRawTransaction(signedTxn).do();
    console.log(`[Chain] submitted oracleResultId=${oracleResult.id} txId=${txId}`);

    // Fire-and-forget confirmation — OracleQueue retries indefinitely on failure
    void algosdk.waitForConfirmation(algod, txId, 4).then(() => {
      console.log(`[Chain] confirmed txId=${txId}`);
    }).catch((err: unknown) => {
      console.error(`[Chain] confirmation timeout txId=${txId}`, err);
    });

    return txId;
  }

  static async getTransactionStatus(txId: string): Promise<"pending" | "success" | "reverted"> {
    if (IS_DEV) return "success";

    const algod = makeAlgodClient();
    try {
      const info = await algod.pendingTransactionInformation(txId).do();
      const confirmedRound = info.confirmedRound;
      return confirmedRound && confirmedRound > 0 ? "success" : "pending";
    } catch {
      return "pending";
    }
  }
}
