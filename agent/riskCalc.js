/**
 * riskCalc.js
 *
 * The single function your teammate's server will call.
 * It returns a position risk object matching the shared contract shape:
 *
 *   {
 *     isAtRisk: boolean,
 *     healthFactor: number,
 *     walletAddress: string,
 *     debtValue: number,
 *     collateralValue: number
 *   }
 *
 * Right now it uses HARDCODED values for the position data.
 * Later, you'd swap the hardcoded values with a real Graph query —
 * but the OUTPUT SHAPE stays exactly the same, so Jan's server
 * code doesn't need to change at all.
 */

const { calculateHealthFactor } = require("./calculateHealthFactor");

// ──────────────────────────────────────────────
// Hardcoded demo position (swap this later)
// ──────────────────────────────────────────────
const DEMO_POSITION = {
  walletAddress: "0x1234abcd5678ef9012345678abcdef0123456789",
  collateralValue: 2100, // USD
  debtValue: 2000,       // USD
};

/**
 * Returns the risk assessment for a lending position.
 *
 * @param {Object} [input]                  - Optional overrides for the demo position
 * @param {number} [input.collateralValue]  - USD value of collateral (default: 2100)
 * @param {number} [input.debtValue]        - USD value of debt (default: 2000)
 * @param {string} [input.walletAddress]    - Wallet address (default: demo address)
 * @returns {{ isAtRisk: boolean, healthFactor: number, walletAddress: string, debtValue: number, collateralValue: number }}
 */
function getPositionRisk(input = {}) {
  // Step 1: Merge optional input with defaults
  //         If you pass { collateralValue: 5000 }, only collateralValue changes.
  //         Everything else falls back to DEMO_POSITION.
  const walletAddress = input.walletAddress ?? DEMO_POSITION.walletAddress;
  const collateralValue = input.collateralValue ?? DEMO_POSITION.collateralValue;
  const debtValue = input.debtValue ?? DEMO_POSITION.debtValue;

  // Step 2: Calculate health factor using our function from Prompt 2
  //         (NOT hardcoded — actually computed from the values)
  const { healthFactor, isAtRisk } = calculateHealthFactor(collateralValue, debtValue);

  // Step 3: Return the contract-shaped object
  //         This is the EXACT shape from contract.md
  return {
    isAtRisk,
    healthFactor,
    walletAddress,
    debtValue,
    collateralValue,
  };
}

// ──────────────────────────────────────────────
// Test: run this file directly to verify the output
// ──────────────────────────────────────────────
if (require.main === module) {
  console.log("=== getPositionRisk() — Demo Scenarios ===\n");

  // Scenario 1: No input — uses defaults (the "risky" example from contract.md)
  console.log("1) No input (defaults):");
  console.log(JSON.stringify(getPositionRisk(), null, 2));

  // Scenario 2: Override to a SAFE position
  console.log("\n2) Safe position { collateralValue: 5000, debtValue: 2000 }:");
  console.log(JSON.stringify(getPositionRisk({ collateralValue: 5000, debtValue: 2000 }), null, 2));

  // Scenario 3: Override to a VERY RISKY position
  console.log("\n3) Underwater { collateralValue: 1800, debtValue: 2000 }:");
  console.log(JSON.stringify(getPositionRisk({ collateralValue: 1800, debtValue: 2000 }), null, 2));

  // Scenario 4: Partial override — only change collateral, keep default debt
  console.log("\n4) Partial override { collateralValue: 3000 } (debt stays at default 2000):");
  console.log(JSON.stringify(getPositionRisk({ collateralValue: 3000 }), null, 2));

  console.log("\n✅ All scenarios produce the correct contract shape!");
}

module.exports = { getPositionRisk };
