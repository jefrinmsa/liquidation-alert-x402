/**
 * jan-agent/paymentVerifier.js
 *
 * Verifies Hedera payments via the Mirror Node REST API.
 *
 * A Mirror Node is a read-only copy of the Hedera ledger's transaction
 * history. We verify payments here instead of trusting the client's
 * claim because:
 *   - Clients can lie — anyone could send ?tx=fake_id
 *   - Mirror Nodes reflect the actual blockchain state
 *   - Queries are free (just HTTP GETs, no HBAR cost)
 */

const {
  PAY_TO_ACCOUNT,
  EXPECTED_AMOUNT_TINYBARS,
  MIRROR_NODE_BASE,
} = require("./paymentConfig");

/**
 * Verify a Hedera transaction via the Mirror Node REST API.
 *
 * @param {string} txIdRaw - Raw Hedera transaction ID (e.g. "0.0.10381614@1725640123.456789000")
 * @returns {Promise<boolean>} true if payment is valid, false otherwise
 */
async function verifyPayment(txIdRaw) {
  try {
    // Hedera tx IDs look like "0.0.10381614@1725640123.456789000"
    // The Mirror Node API expects the format "0.0.10381614-1725640123-456789000"
    // (@ becomes -, dots in the timestamp part become -)
    const txIdFormatted = txIdRaw.replace("@", "-").replace(/\./g, "-");

    const url = `${MIRROR_NODE_BASE}/api/v1/transactions/${txIdFormatted}`;
    console.log(`  [Mirror Node] Checking: ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      console.log(
        `  [Mirror Node] HTTP ${response.status} — transaction not found`
      );
      return false;
    }

    const data = await response.json();
    const transactions = data.transactions || [];

    if (transactions.length === 0) {
      console.log(`  [Mirror Node] No transactions returned`);
      return false;
    }

    const tx = transactions[0];

    // Check 1: Transaction succeeded
    if (tx.result !== "SUCCESS") {
      console.log(
        `  [Mirror Node] Transaction result: ${tx.result} (expected SUCCESS)`
      );
      return false;
    }

    // Check 2: Correct amount was sent to the correct account
    // tx.transfers is an array of { account, amount } objects
    // amount is in tinybars (positive = credit, negative = debit)
    const payToTransfer = (tx.transfers || []).find(
      (t) =>
        t.account === PAY_TO_ACCOUNT && t.amount >= EXPECTED_AMOUNT_TINYBARS
    );

    if (!payToTransfer) {
      console.log(
        `  [Mirror Node] No transfer of ≥${EXPECTED_AMOUNT_TINYBARS} tinybars to ${PAY_TO_ACCOUNT}`
      );
      return false;
    }

    console.log(
      `  [Mirror Node] ✅ Verified: ${payToTransfer.amount} tinybars to ${PAY_TO_ACCOUNT}`
    );
    return true;
  } catch (err) {
    console.error(`  [Mirror Node] Verification error: ${err.message}`);
    return false;
  }
}

module.exports = { verifyPayment };
