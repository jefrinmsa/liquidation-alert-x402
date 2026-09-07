const express = require("express");
const path = require("path");
const { getPositionRisk } = require("./agent/riskCalc");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve the dashboard from public/
app.use(express.static(path.join(__dirname, "public")));

// GET /risk-alert
// Accepts optional query params for demo control:
//   ?collateral=1800&debt=2000
// Returns position risk data + payment info if at risk
app.get("/risk-alert", (req, res) => {
  // Build optional input from query params
  const input = {};
  if (req.query.collateral) input.collateralValue = Number(req.query.collateral);
  if (req.query.debt) input.debtValue = Number(req.query.debt);
  if (req.query.wallet) input.walletAddress = req.query.wallet;

  const risk = getPositionRisk(input);

  if (risk.isAtRisk) {
    // 402 Payment Required — position is at risk, pay to see details
    res.status(402).json({
      ...risk,
      payment: {
        price: "1 HBAR",
        payTo: "0.0.10381614",
        network: "hedera-testnet",
      },
    });
  } else {
    // 200 OK — position is safe, no payment needed
    res.status(200).json({
      ...risk,
      message: "Position is safe — no liquidation risk detected",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Liquidation Alert server running at http://localhost:${PORT}`);
});
