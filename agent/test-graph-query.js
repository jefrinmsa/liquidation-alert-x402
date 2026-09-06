/**
 * test-graph-query.js
 *
 * Proves we can query REAL Aave v3 lending data from the AaveKit GraphQL API.
 * No API key needed — this is a free, public endpoint maintained by Aave.
 *
 * Run:  node agent/test-graph-query.js
 */

// Helper to send a GraphQL query to the AaveKit API
async function queryAave(query) {
  const response = await fetch("https://api.v3.aave.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const data = await response.json();
  if (data.errors) {
    throw new Error("GraphQL error: " + data.errors.map((e) => e.message).join("; "));
  }
  return data.data;
}

// ──────────────────────────────────────────────
// Query 1: Which blockchains does Aave v3 support?
// ──────────────────────────────────────────────
async function showChains() {
  const data = await queryAave(`{ chains { name chainId } }`);
  console.log("=== Aave v3 Supported Chains ===");
  data.chains.forEach((c) => console.log(`  • ${c.name} (chainId: ${c.chainId})`));
}

// ──────────────────────────────────────────────
// Query 2: Markets and reserves on Ethereum mainnet
//   Shows collateral and debt data for top tokens
// ──────────────────────────────────────────────
async function showReserves() {
  const data = await queryAave(`{
    markets(request: { chainIds: [1] }) {
      name
      totalMarketSize
      reserves {
        underlyingToken { symbol name }
        size { amount { value } usd }
        supplyInfo {
          canBeCollateral
          maxLTV { value }
          liquidationThreshold { value }
        }
        borrowInfo {
          total { amount { value } usd }
          apy { value }
        }
      }
    }
  }`);

  // Use the main AaveV3Ethereum market
  const market = data.markets.find((m) => m.name === "AaveV3Ethereum") || data.markets[0];
  console.log(`\n=== ${market.name} — Top 3 Reserves ===`);
  console.log(`  Total market size: $${market.totalMarketSize}`);

  const reserves = market.reserves.slice(0, 3);
  reserves.forEach((r) => {
    console.log(`\n  ── ${r.underlyingToken.symbol} (${r.underlyingToken.name}) ──`);
    console.log(`     Pool size:              ${r.size.amount.value} tokens ($${r.size.usd})`);
    console.log(`     Can be collateral?      ${r.supplyInfo.canBeCollateral}`);
    console.log(`     Max LTV:                ${r.supplyInfo.maxLTV?.value ?? "N/A"}`);
    console.log(`     Liquidation threshold:  ${r.supplyInfo.liquidationThreshold?.value ?? "N/A"}`);
    console.log(`     Total borrowed:         ${r.borrowInfo?.total?.amount?.value ?? "N/A"} ($${r.borrowInfo?.total?.usd ?? "N/A"})`);
    console.log(`     Borrow APY:             ${r.borrowInfo?.apy?.value ?? "N/A"}`);
  });

  console.log("\n  ─────────────────────────────────────");
  console.log("  ℹ  These are the REAL numbers for collateral & debt");
  console.log("     that a liquidation alert system would monitor.");
  console.log("     'liquidationThreshold' is the key value —");
  console.log("     when a position's debt/collateral ratio crosses");
  console.log("     this threshold, the position can be liquidated.");
}

// ──────────────────────────────────────────────
// Run everything
// ──────────────────────────────────────────────
async function main() {
  try {
    await showChains();
    await showReserves();
    console.log("\n✅ All queries succeeded — real Aave v3 data is flowing!");
    console.log("   (Your demo will use hardcoded values, but this proves the plumbing works)\n");
  } catch (err) {
    console.error("❌ Query failed:", err.message);
  }
}

main();
