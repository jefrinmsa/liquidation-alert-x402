const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------------
// Hardcoded risk object (matches the shared contract shape).
// Flip `isAtRisk` to false and restart the server to test the other branch.
// ---------------------------------------------------------------------------
const riskData = {
  isAtRisk: true, // ← change to false to simulate "no risk"
  healthFactor: 1.05,
  walletAddress: "0x1234...",
  debtValue: 2000,
  collateralValue: 2100,
};

// GET /risk-alert — conditionally returns 402 or 200 based on risk status
app.get("/risk-alert", (req, res) => {
  // Branch 1: The wallet IS at liquidation risk.
  // We respond with 402 (Payment Required) and tell the caller how to pay
  // before they can access the full alert data.
  if (riskData.isAtRisk) {
    return res.status(402).json({
      price: "1 HBAR",
      payTo: "0.0.10381614",
      network: "hedera-testnet",
    });
  }

  // Branch 2: The wallet is NOT at risk.
  // No payment needed — just return a friendly 200 OK.
  return res.status(200).json({
    status: "ok",
    message: "no risk detected",
  });
});

app.listen(PORT, () => {
  console.log(`Liquidation Alert server running at http://localhost:${PORT}`);
});
