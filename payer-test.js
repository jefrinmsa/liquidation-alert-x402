/**
 * payer-test.js — Automatic HBAR Payer for the Liquidation Alert API
 *
 * This script demonstrates the x402-style pay-to-access flow:
 *   1. Hit the /risk-alert endpoint
 *   2. If the server says "402 Payment Required", read the price and payTo
 *   3. Send that exact amount of HBAR on Hedera testnet
 *   4. Print the transaction ID so you can verify on HashScan
 *
 * Usage:  npm run pay   (make sure the server is running first!)
 */

require("dotenv").config(); // Loads HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY from .env

const {
  Client, // The gateway to the Hedera network — like a database connection pool
  PrivateKey, // Wraps your private key so the SDK can sign transactions
  AccountId, // Represents a Hedera account in the 0.0.XXXX format
  TransferTransaction, // The transaction type for moving HBAR between accounts
  Hbar, // A helper that handles HBAR ↔ tinybar conversions for you
} = require("@hashgraph/sdk");

// ---------------------------------------------------------------------------
// Config — loaded from .env so your keys never end up in source control
// ---------------------------------------------------------------------------
const MY_ACCOUNT_ID = process.env.HEDERA_ACCOUNT_ID;
const MY_PRIVATE_KEY = process.env.HEDERA_PRIVATE_KEY;

if (!MY_ACCOUNT_ID || !MY_PRIVATE_KEY) {
  console.error("❌ Missing HEDERA_ACCOUNT_ID or HEDERA_PRIVATE_KEY in .env");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Main flow
// ---------------------------------------------------------------------------
async function main() {
  // ── Step 1: Call the /risk-alert endpoint ──────────────────────────────
  // We're asking the server "is this wallet at risk?"
  // The server will respond with either:
  //   200 → "no risk detected" (nothing to pay for)
  //   402 → "pay 1 HBAR to get the alert data"
  console.log("\n🔍 Step 1 — Calling GET http://localhost:3000/risk-alert ...\n");
  const response = await fetch("http://localhost:3000/risk-alert");
  const body = await response.json();

  console.log(`   HTTP status: ${response.status}`);
  console.log(`   Response body:`, JSON.stringify(body, null, 2));

  // ── Branch: If the server says everything is fine (200 OK) ─────────────
  if (response.status === 200) {
    console.log("\n✅ No risk detected — no payment needed. Done!");
    return;
  }

  // ── Branch: If the server asks for payment (402 Payment Required) ──────
  if (response.status !== 402) {
    console.error(`\n❌ Unexpected status ${response.status}. Exiting.`);
    process.exit(1);
  }

  // Parse the payment instructions from the 402 body.
  // The server told us: "pay this much, to this address, on this network"
  const { price, payTo, network } = body;
  console.log(`\n💰 Step 2 — Server requires payment:`);
  console.log(`   Price:   ${price}`);
  console.log(`   Pay to:  ${payTo}`);
  console.log(`   Network: ${network}`);

  // ── Step 3: Connect to Hedera testnet ──────────────────────────────────
  // The Client object is your connection to the Hedera network.
  // Think of it like connecting to a database — you tell it:
  //   - Which network (testnet vs mainnet)
  //   - Who you are (your account ID)
  //   - How to prove it (your private key, used to sign transactions)
  console.log(`\n🔗 Step 3 — Connecting to Hedera testnet ...`);

  // Create an ECDSA private key from the hex string in your .env
  // ECDSA (Elliptic Curve Digital Signature Algorithm) is the same kind of
  // key Ethereum uses — Hedera supports it alongside its native Ed25519 keys.
  const privateKey = PrivateKey.fromStringECDSA(MY_PRIVATE_KEY);

  // Set up the client for testnet and tell it to sign every transaction
  // with your account + key automatically.
  const client = Client.forTestnet();
  client.setOperator(AccountId.fromString(MY_ACCOUNT_ID), privateKey);

  console.log(`   Connected as account ${MY_ACCOUNT_ID}`);

  // ── Step 4: Build and send the HBAR transfer ──────────────────────────
  // A TransferTransaction moves HBAR from one account to another.
  // Under the hood, Hedera debits the sender and credits the receiver
  // in a single atomic operation — no smart contract needed.
  //
  // We parse the price string ("1 HBAR") to extract the numeric amount.
  const amountStr = price.split(" ")[0]; // "1 HBAR" → "1"
  const amountHbar = parseFloat(amountStr);

  console.log(`\n📤 Step 4 — Sending ${amountHbar} HBAR to ${payTo} ...`);

  const transferTx = new TransferTransaction()
    // Subtract HBAR from our account (the sender)
    .addHbarTransfer(AccountId.fromString(MY_ACCOUNT_ID), new Hbar(-amountHbar))
    // Add HBAR to the payTo account (the receiver / server operator)
    .addHbarTransfer(AccountId.fromString(payTo), new Hbar(amountHbar));

  // .execute() signs the transaction with our operator key and submits
  // it to the Hedera network. The network validates the signature,
  // checks balances, and processes the transfer — usually in 3-5 seconds.
  const txResponse = await transferTx.execute(client);

  // .getReceipt() waits for the network to finalize the transaction
  // and returns whether it succeeded or failed.
  const receipt = await txResponse.getReceipt(client);

  // ── Step 5: Print results ─────────────────────────────────────────────
  const txId = txResponse.transactionId.toString();
  console.log(`\n✅ Step 5 — Payment sent successfully!`);
  console.log(`   Transaction ID: ${txId}`);
  console.log(`   Status:         ${receipt.status.toString()}`);
  console.log(`\n🔎 Verify on HashScan:`);
  console.log(`   https://hashscan.io/testnet/transaction/${txId}`);
  console.log();
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message || err);
  process.exit(1);
});
