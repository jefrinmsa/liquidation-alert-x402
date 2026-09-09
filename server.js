const express = require("express");
const path = require("path");
const { getPositionRisk } = require("./agent/riskCalc");
const { verifyPayment } = require("./jan-agent/paymentVerifier");
const {
  PAY_TO_ACCOUNT,
  PRICE_DISPLAY,
  NETWORK,
} = require("./jan-agent/paymentConfig");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve the dashboard from public/
app.use(express.static(path.join(__dirname, "public")));

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
        message:
          "Transaction could not be verified. Please check your transaction ID.",
        payment: {
          price: PRICE_DISPLAY,
          payTo: PAY_TO_ACCOUNT,
          network: NETWORK,
        },
      });
    }
  }

  // ── Branch 2: Position at risk, no payment yet ───────────────────────
  if (risk.isAtRisk) {
    res.status(402).json({
      ...risk,
      payment: {
        price: PRICE_DISPLAY,
        payTo: PAY_TO_ACCOUNT,
        network: NETWORK,
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
