# CONTRACT.md — Shared Interface Between Person A and Person B

This is the one document both of you must agree on before changing. It defines 
the exact shape of data passed between your two halves of the project. As long 
as both sides match this shape, your code will plug together without surprises.

**Rule:** If either of you needs to add, remove, or rename a field, that's a 
30-second message to the other person first, then a one-line edit here — never 
a silent change made alone.

---

## The object

Person A's `agent/riskCalc.js` (specifically the `getPositionRisk()` function) 
produces this object. Person B's `server/index.js` (the `/risk-alert` route) 
consumes it to decide what to respond with.

```json
{
  "isAtRisk": true,
  "healthFactor": 1.05,
  "walletAddress": "0x1234...",
  "debtValue": 2000,
  "collateralValue": 2100
}
```

## Field definitions

| Field | Type | Meaning |
|---|---|---|
| `isAtRisk` | boolean | `true` if this position should be gated behind a paid alert, `false` if it's safe |
| `healthFactor` | number | Roughly `collateralValue / debtValue`, adjusted for protocol-specific safety rules. Below ~1.1 counts as at risk |
| `walletAddress` | string | The (real or demo) address whose position this is |
| `debtValue` | number | USD value of the borrowed amount |
| `collateralValue` | number | USD value of the deposited collateral |

## How each side uses it

**Person A delivers:**
```javascript
getPositionRisk(optionalInput)
// returns an object matching the shape above
// optionalInput example: { collateralValue: 2100, debtValue: 2000 }
// if no input given, returns a sensible default example
```

**Person B consumes it like this:**
```javascript
const risk = getPositionRisk();

if (risk.isAtRisk) {
  // respond with HTTP 402, price + payTo + network JSON body
} else {
  // respond with HTTP 200, { status: "ok", message: "no risk detected" }
}
```

## What the x402 payment response looks like (Person B owns this shape)

When `isAtRisk` is `true`, the server's 402 response body looks like:
```json
{
  "price": "1 HBAR",
  "payTo": "0.0.xxxxxx",
  "network": "hedera-testnet"
}
```

## What the verified real-data response looks like (after payment is confirmed)

```json
{
  "status": "ok",
  "healthFactor": 1.05,
  "walletAddress": "0x1234...",
  "message": "Position is at risk of liquidation"
}
```

## Change log

| Date | Changed by | What changed | Why |
|---|---|---|---|
| (fill in as you go) | | | |

---

*Keep this file in the repo root. Both of you should re-check it before starting 
work each day, and update the change log any time the shape changes.*