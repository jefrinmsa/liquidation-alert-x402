const express = require("express");
const path = require("path");
const { getPositionRisk } = require("./agent/riskCalc");

const app = express();
const PORT = process.env.PORT || 3000;

// The Hedera account that receives payments
const PAY_TO_ACCOUNT = "0.0.10381614";
// Expected payment amount in tinybars (1 HBAR = 100,000,000 tinybars)
const EXPECTED_AMOUNT_TINYBARS = 100_000_000;

// Serve the dashboard from public/
app.use(express.static(path.join(__dirname, "public")));

// ---------------------------------------------------------------------------
// Helper: Verify a Hedera transaction via the Mirror Node REST API
// ---------------------------------------------------------------------------
// A Mirror Node is a read-only copy of the Hedera ledger's transaction history.
// We verify payments here instead of trusting the client's claim because:
//   - Clients can lie — anyone could send ?tx=fake_id
//   - Mirror Nodes reflect the actual blockchain state
//   - Queries are free (just HTTP GETs, no HBAR cost)
// ---------------------------------------------------------------------------
async function verifyPayment(txIdRaw) {
  try {
    // Hedera tx IDs look like "0.0.10381614@1725640123.456789000"
    // The Mirror Node API expects the format "0.0.10381614-1725640123-456789000"
    // (@ becomes -, dots in timestamp become -)
    const txIdFormatted = txIdRaw
      .replace("@", "-")
      .replace(/\./g, "-")
      // But we need to restore the account format: "0-0-10381614" → keep as-is
      // Actually, the Mirror Node accepts the raw format with @ too in some
      // versions, but the canonical path format uses dashes.
      ;

    // Alternative: use the raw transaction ID directly (Mirror Node v1 accepts both)
    const url = `https://testnet.mirrornode.hedera.com/api/v1/transactions/${txIdFormatted}`;
    console.log(`  [Mirror Node] Checking: ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      console.log(`  [Mirror Node] HTTP ${response.status} — transaction not found`);
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
      console.log(`  [Mirror Node] Transaction result: ${tx.result} (expected SUCCESS)`);
      return false;
    }

    // Check 2: Correct amount was sent to the correct account
    // tx.transfers is an array of { account, amount } objects
    // amount is in tinybars (positive = credit, negative = debit)
    const payToTransfer = (tx.transfers || []).find(
      (t) => t.account === PAY_TO_ACCOUNT && t.amount >= EXPECTED_AMOUNT_TINYBARS
    );

    if (!payToTransfer) {
      console.log(`  [Mirror Node] No transfer of ≥${EXPECTED_AMOUNT_TINYBARS} tinybars to ${PAY_TO_ACCOUNT}`);
      return false;
    }

    console.log(`  [Mirror Node] ✅ Verified: ${payToTransfer.amount} tinybars to ${PAY_TO_ACCOUNT}`);
    return true;
  } catch (err) {
    console.error(`  [Mirror Node] Verification error: ${err.message}`);
    return false;
  }
}

// ---------------------------------------------------------------------------
// GET /risk-alert
// ---------------------------------------------------------------------------
// Three-branch flow:
//   1. ?tx= present  → verify payment via Mirror Node
//      ├─ Valid   → 200 + real risk data (UNLOCKED)
//      └─ Invalid → 402 + payment instructions
//   2. No ?tx=, isAtRisk  → 402 + payment instructions
//   3. No ?tx=, safe      → 200 + safe message
// ---------------------------------------------------------------------------
app.get("/risk-alert", async (req, res) => {
  // Build optional input from query params (for demo control)
  const input = {};
  if (req.query.collateral) input.collateralValue = Number(req.query.collateral);
  if (req.query.debt) input.debtValue = Number(req.query.debt);
  if (req.query.wallet) input.walletAddress = req.query.wallet;

  const risk = getPositionRisk(input);

  // ── Branch 1: Payment verification (tx query param present) ──────────
  if (req.query.tx) {
    console.log(`\n  [/risk-alert] Verifying payment: ${req.query.tx}`);
    const isValid = await verifyPayment(req.query.tx);

    if (isValid) {
      // Payment confirmed — release the real risk data
      return res.status(200).json({
        ...risk,
        verified: true,
        txId: req.query.tx,
        message: risk.isAtRisk
          ? "Payment verified — position is at risk of liquidation"
          : "Payment verified — position is safe",
      });
    } else {
      // Payment not verified — deny access
      return res.status(402).json({
        error: "Payment verification failed",
        message: "Transaction could not be verified. Please check your transaction ID.",
        payment: {
          price: "1 HBAR",
          payTo: PAY_TO_ACCOUNT,
          network: "hedera-testnet",
        },
      });
    }
  }

  // ── Branch 2: Position at risk, no payment yet ───────────────────────
  if (risk.isAtRisk) {
    res.status(402).json({
      ...risk,
      payment: {
        price: "1 HBAR",
        payTo: PAY_TO_ACCOUNT,
        network: "hedera-testnet",
      },
    });
  } else {
    // ── Branch 3: Position is safe ───────────────────────────────────────
    res.status(200).json({
      ...risk,
      message: "Position is safe — no liquidation risk detected",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Liquidation Alert server running at http://localhost:${PORT}`);
});
