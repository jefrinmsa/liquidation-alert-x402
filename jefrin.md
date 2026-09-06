# YOU (Person A) — Today & Tomorrow Prompt Schedule

Use Antigravity with Claude Opus, Plan Mode on, for every prompt below. 
Read each plan before approving. Test each step yourself before moving to the next.

Your folder: `agent/` — don't touch `server/`, that's your teammate's.

---

## TODAY

### Prompt 1 — Get real Graph access
```
Help me sign up for a Graph API key at thegraph.com and find an existing 
public Subgraph for Aave v3 (or a similar major lending protocol). 
Explain what a Subgraph is, what "querying" it looks like, and show me 
a simple example query that returns a single lending position's 
collateral and debt values. Beginner-friendly explanation, please.
```
**Test:** Actually run the example query once and see real data come back, 
even though your demo will use fake data later. This just proves the 
plumbing works and that you understand the real data shape.

### Prompt 2 — Health factor calculation
```
Write a JavaScript function called calculateHealthFactor(collateralValue, debtValue) 
that returns a health factor number, where a value below 1.1 is considered "at risk". 
Explain the formula in simple terms and why a threshold like 1.1 (not exactly 1.0) 
is used in real lending protocols as a safety buffer.
```
**Test:** Call it with a few different numbers yourself (e.g. collateral 2100, 
debt 2000 vs. collateral 3000, debt 2000) and confirm the true/false and 
number outputs make sense to you.

---

## TOMORROW

### Prompt 3 — Build your final output function
```
Write a function called getPositionRisk() in agent/riskCalc.js that returns 
a hardcoded example position object matching this exact shape:
{
  "isAtRisk": true,
  "healthFactor": 1.05,
  "walletAddress": "0x1234...",
  "debtValue": 2000,
  "collateralValue": 2100
}
Use the calculateHealthFactor function from the previous step to actually 
compute healthFactor and isAtRisk rather than hardcoding those two fields. 
Explain how this function could later be swapped to pull a real position 
from the Graph query instead of a hardcoded one, without changing its output shape.
```
**Test:** Run a standalone Node script that calls `getPositionRisk()` and 
prints the result. Confirm the field names and types match the contract 
below exactly — this is what your teammate will plug into their server.

### Prompt 4 — Make it demo-controllable
```
Modify getPositionRisk() so it accepts an optional input, like 
getPositionRisk({ collateralValue: 2100, debtValue: 2000 }), so I can 
manually control the demo scenario instead of always getting the same 
hardcoded numbers. If no input is given, fall back to the default example. 
Explain why this makes live demos safer and more reliable than hardcoding 
everything.
```
**Test:** Call it with a few different manual inputs and confirm you get 
different `isAtRisk`/`healthFactor` results as expected — this is your 
"make the position go risky on demand" button for the actual demo.

---

## Shared contract (do not change without telling your teammate)
```json
{
  "isAtRisk": true,
  "healthFactor": 1.05,
  "walletAddress": "0x1234...",
  "debtValue": 2000,
  "collateralValue": 2100
}
```

## End of tomorrow — sync point
Push your branch (`feature/risk-agent`), sit with your teammate, and 
plug `getPositionRisk()` into their server together. Confirm the full 
flow works end to end using your function's output instead of their 
placeholder data.