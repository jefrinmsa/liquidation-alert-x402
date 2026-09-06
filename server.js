const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

// GET /risk-alert — returns a hardcoded JSON response
app.get("/risk-alert", (req, res) => {
  res.status(402).json({
    price: "1 HBAR",
    payTo: "PLACEHOLDER_WALLET_ADDRESS",
    network: "hedera-testnet",
  });
});

app.listen(PORT, () => {
  console.log(`Liquidation Alert server running at http://localhost:${PORT}`);
});
