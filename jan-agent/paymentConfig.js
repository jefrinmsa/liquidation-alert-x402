/**
 * jan-agent/paymentConfig.js
 *
 * Centralized payment configuration for the x402 payment-gated flow.
 * Both the server (verification) and the payer script reference these
 * values, so keeping them in one place prevents drift.
 */

module.exports = {
  // The Hedera testnet account that receives payments
  PAY_TO_ACCOUNT: "0.0.10381614",

  // Expected payment: 1 HBAR expressed in tinybars
  // (1 HBAR = 100,000,000 tinybars)
  EXPECTED_AMOUNT_TINYBARS: 100_000_000,

  // Human-readable price string returned in 402 responses
  PRICE_DISPLAY: "1 HBAR",

  // Network identifier
  NETWORK: "hedera-testnet",

  // Hedera Mirror Node base URL (testnet)
  MIRROR_NODE_BASE: "https://testnet.mirrornode.hedera.com",
};
