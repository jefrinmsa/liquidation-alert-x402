# TEAMMATE (Person B) — Today & Tomorrow Prompt Schedule

Use Antigravity with Claude Opus, Plan Mode on, for every prompt below. 
Read each plan before approving. Test each step yourself before moving to the next.

Your folder: `server/` — don't touch `agent/`, that's your teammate's (the person 
who gave you this doc).

## Where you're starting from
Your teammate already built the base server: a `/risk-alert` route that currently 
always returns a hardcoded 402 response with a placeholder wallet address. You're 
continuing from there today.

---
o
## TODAY

### Prompt 1 — Make the 402 conditional on a risk object
```
Modify the /risk-alert route so that, instead of always returning 402, 
it first checks a hardcoded object (for now) shaped like:
{ "isAtRisk": true, "healthFactor": 1.05, "walletAddress": "0x...", 
  "debtValue": 2000, "collateralValue": 2100 }

If isAtRisk is true: respond with 402 and the existing payment JSON body.
If isAtRisk is false: respond with 200 and { "status": "ok", 
  "message": "no risk detected" }.

Explain the if/else logic clearly, since I want to understand exactly 
how the branching works.
```
**Test:** Manually flip the hardcoded `isAtRisk` value between true and 
false, restart the server each time, and confirm you get a 402 in one 
case and a plain 200 "no risk detected" in the other.

### Prompt 2 — Real wallet address + payer script
```
Replace the placeholder wallet address in the 402 response with my real 
Hedera testnet wallet address: [YOUR ADDRESS].

Then write a separate script (payer-test.js) using the Hedera SDK that:
1. Calls GET /risk-alert
2. If it gets a 402 response, reads the price and payTo address
3. Automatically signs and sends that exact HBAR amount on Hedera testnet 
   using a private key from a .env file
4. Prints the resulting transaction ID

Explain what the Hedera SDK is doing at each step, beginner-friendly.
```
**Test:** Run the script for real. Confirm the payment actually shows up 
on HashScan (hashscan.io/testnet) with the right amount and address.

---

## TOMORROW

### Prompt 3 — Re-request with proof of payment
```
Modify payer-test.js so that after sending the payment, it calls 
/risk-alert again, this time including the transaction ID as a query 
parameter (e.g. /risk-alert?tx=0.0.xxxx@xxxx).

Explain the format of a Hedera transaction ID.
```
**Test:** Run it and confirm the second request actually includes the 
transaction ID — check this with a console.log or by watching the request.

### Prompt 4 — Verify the payment before releasing data
```
Modify the /risk-alert route: when a tx query parameter is present, look 
up that transaction using Hedera's Mirror Node API to confirm it really 
happened, for the correct amount, to the correct address. If verified, 
return the real risk data instead of another 402. If not verified or 
missing, return 402 as before.

Explain what a Mirror Node is and why we check there instead of just 
trusting the client's claim that they paid.
```
**Test:** Run the full loop: hit the route, get 402, run payer-test.js, 
get real data back automatically. Then test that it FAILS safely — try 
sending a fake or missing tx ID and confirm you still get a 402, not the 
real data. This failure case matters as much as the success case.

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
This is the exact shape your teammate's `getPositionRisk()` function will 
produce. Everything you build today/tomorrow should assume input in this shape.

## End of tomorrow — sync point
Pull your teammate's branch (`feature/risk-agent`), replace your hardcoded 
risk object with a real call to their `getPositionRisk()` function, and 
confirm the full flow works end to end using their real (demo-controllable) 
data instead of your placeholder.