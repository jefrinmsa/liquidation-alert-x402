/**
 * calculateHealthFactor.js
 *
 * Calculates the health factor for a lending position.
 *
 * Formula:  healthFactor = collateralValue / debtValue
 *
 * - Above 1.1  → Safe (well-collateralized)
 * - Below 1.1  → At risk of liquidation
 * - Below 1.0  → Underwater (debt exceeds collateral)
 * - If debt is 0 → Infinity (no risk — nothing is borrowed)
 */

const AT_RISK_THRESHOLD = 1.1;

/**
 * @param {number} collateralValue - USD value of deposited collateral
 * @param {number} debtValue       - USD value of borrowed amount
 * @returns {{ healthFactor: number, isAtRisk: boolean }}
 */
function calculateHealthFactor(collateralValue, debtValue) {
  // If there's no debt, there's no risk — you can't be liquidated
  // if you haven't borrowed anything.
  if (debtValue === 0) {
    return { healthFactor: 999, isAtRisk: false };
  }

  const healthFactor = collateralValue / debtValue;
  const isAtRisk = healthFactor < AT_RISK_THRESHOLD;

  return { healthFactor, isAtRisk };
}

// ──────────────────────────────────────────────
// Test it with several scenarios
// ──────────────────────────────────────────────
if (require.main === module) {
  const testCases = [
    { collateral: 3000, debt: 2000, label: "Safe position" },
    { collateral: 2100, debt: 2000, label: "Barely at risk (matches contract example)" },
    { collateral: 2200, debt: 2000, label: "Just above threshold" },
    { collateral: 1900, debt: 2000, label: "Underwater — debt > collateral" },
    { collateral: 5000, debt: 0,    label: "No debt at all" },
    { collateral: 0,    debt: 0,    label: "Empty position" },
  ];

  console.log("=== Health Factor Test Results ===\n");
  console.log("  Collateral  |  Debt    |  HF     |  At Risk?  |  Scenario");
  console.log("  ------------|----------|---------|------------|----------------------------");

  testCases.forEach(({ collateral, debt, label }) => {
    const { healthFactor, isAtRisk } = calculateHealthFactor(collateral, debt);
    const hfDisplay = healthFactor === Infinity ? "∞" : healthFactor.toFixed(4);
    const riskIcon = isAtRisk ? "⚠️  YES" : "✅  no";
    console.log(
      `  $${String(collateral).padEnd(10)} |  $${String(debt).padEnd(6)} |  ${hfDisplay.padEnd(7)} |  ${riskIcon.padEnd(10)} |  ${label}`
    );
  });

  console.log(`\n  Threshold: ${AT_RISK_THRESHOLD} (below this = at risk)`);
}

module.exports = { calculateHealthFactor, AT_RISK_THRESHOLD };
