# TEAMMATE (Person B — Jan) — Complete Prompt Schedule

Use Antigravity with Claude Opus, Plan Mode on, for every prompt below.  
Read each plan before approving. Test each step yourself before moving to the next.

Your folder: the project root (`server.js`, `payer-test.js`, `public/`) — don't
touch `agent/`, that's your teammate's (Jefrin, who gave you this doc).

## Where you're starting from
Your teammate already built the base server: a `/risk-alert` route that 
originally returned a hardcoded 402 response with a placeholder wallet address. 
You're continuing from there.

---

## TODAY — ✅ COMPLETED

### Prompt 1 — Make the 402 conditional on a risk object ✅

**What was asked:**
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

**What was implemented:**

In `server.js`, the `/risk-alert` route now calls `getPositionRisk(input)` 
(imported from `agent/riskCalc.js`) and branches on `risk.isAtRisk`:

```javascript
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
```

**How the branching works:**
1. The server gets the risk object from `getPositionRisk()`.
2. If `isAtRisk` is `true` → HTTP 402 response with the full risk data 
   **plus** payment instructions (price, payTo, network). This tells the 
   client "pay first, then you can access the alert data."
3. If `isAtRisk` is `false` → HTTP 200 response with risk data and a safe 
   message. No payment needed.

The route also accepts optional query parameters (`?collateral=1800&debt=2000`) 
to override the demo values, making it easy to toggle between risky and safe 
scenarios without restarting the server.

**Test results:**
- `curl http://localhost:3000/risk-alert` → 402 (default position is at risk, 
  healthFactor: 1.05)
- `curl "http://localhost:3000/risk-alert?collateral=5000&debt=2000"` → 200 
  (safe position, healthFactor: 2.50)
- Flipping between them works as expected ✅

---

### Prompt 2 — Real wallet address + payer script ✅

**What was asked:**
```
Replace the placeholder wallet address in the 402 response with my real 
Hedera testnet wallet address: 0.0.10381614.

Then write a separate script (payer-test.js) using the Hedera SDK that:
1. Calls GET /risk-alert
2. If it gets a 402 response, reads the price and payTo address
3. Automatically signs and sends that exact HBAR amount on Hedera testnet 
   using a private key from a .env file
4. Prints the resulting transaction ID

Explain what the Hedera SDK is doing at each step, beginner-friendly.
```

**What was implemented:**

1. **Wallet address** — `payTo` in `server.js` is set to `"0.0.10381614"` 
   (the real Hedera testnet account).

2. **payer-test.js** — A 5-step script:

   | Step | What it does |
   |------|-------------|
   | 1 | Calls `GET /risk-alert` to check position status |
   | 2 | If 200 → "no risk, done." If 402 → reads `price` and `payTo` |
   | 3 | Connects to Hedera testnet using `Client.forTestnet()`, loads your account ID and ECDSA private key from `.env` |
   | 4 | Builds a `TransferTransaction` that debits your account and credits the `payTo` account with the exact HBAR amount |
   | 5 | Executes the transaction, waits for the receipt, and prints the transaction ID + a HashScan verification link |

   **Key Hedera SDK concepts explained:**
   - **Client** — Your connection to the Hedera network (like a database connection pool)
   - **PrivateKey.fromStringECDSA()** — Wraps your hex private key so the SDK can sign transactions
   - **TransferTransaction** — Moves HBAR atomically from sender to receiver, no smart contract needed
   - **getReceipt()** — Waits for finalization (3-5 seconds on Hedera)

3. **`.env` file** — Contains `HEDERA_ACCOUNT_ID` and `HEDERA_PRIVATE_KEY` 
   (excluded from git via `.gitignore`).

**Test:** 
```bash
# Terminal 1: Start the server
npm start

# Terminal 2: Run the payer script
npm run pay
```
The script sends 1 HBAR and prints a HashScan link like:  
`https://hashscan.io/testnet/transaction/0.0.10381614@1725640000`  
Verify the payment on HashScan to confirm amount and recipient are correct ✅

---

## TOMORROW — ✅ COMPLETED

### Prompt 3 — Re-request with proof of payment ✅

**What was asked:**
```
Modify payer-test.js so that after sending the payment, it calls 
/risk-alert again, this time including the transaction ID as a query 
parameter (e.g. /risk-alert?tx=0.0.xxxx@xxxx).

Explain the format of a Hedera transaction ID.
```

**What was implemented:**

After the payment in Step 4, `payer-test.js` now performs a **Step 6** — 
it calls the `/risk-alert` endpoint again with the transaction ID appended 
as a query parameter:

```javascript
// Step 6: Re-request with proof of payment
const txId = txResponse.transactionId.toString();
console.log(`\n🔄 Step 6 — Re-requesting /risk-alert with payment proof...`);

const verifyUrl = `http://localhost:3000/risk-alert?tx=${encodeURIComponent(txId)}`;
const verifyResponse = await fetch(verifyUrl);
const verifyBody = await verifyResponse.json();

console.log(`   HTTP status: ${verifyResponse.status}`);
console.log(`   Response:`, JSON.stringify(verifyBody, null, 2));
```

**Hedera Transaction ID format:**
A Hedera transaction ID looks like `0.0.10381614@1725640123.456789000` — it 
combines:
- The **payer account** (`0.0.10381614`) — who initiated and paid for the tx
- An **`@` separator**
- A **timestamp** (`1725640123.456789000`) — seconds and nanoseconds since the 
  Unix epoch, which makes every transaction ID globally unique

This format is human-readable AND machine-parseable — you can extract both who 
sent it and when, just from the ID string.

**Test:**
```bash
npm run pay
```
Watch for the Step 6 output — confirm the second request includes the `?tx=` 
parameter. When the server supports verification (Prompt 4), this will return 
real data instead of another 402 ✅

---

### Prompt 4 — Verify the payment before releasing data ✅

**What was asked:**
```
Modify the /risk-alert route: when a tx query parameter is present, look 
up that transaction using Hedera's Mirror Node API to confirm it really 
happened, for the correct amount, to the correct address. If verified, 
return the real risk data instead of another 402. If not verified or 
missing, return 402 as before.

Explain what a Mirror Node is and why we check there instead of just 
trusting the client's claim that they paid.
```

**What was implemented:**

The `/risk-alert` route in `server.js` now has a **three-branch** flow:

```
Request comes in
  ├─ Has ?tx= parameter?
  │    ├─ YES → Verify via Mirror Node API
  │    │    ├─ Payment valid → 200 + real risk data (UNLOCKED)
  │    │    └─ Payment invalid → 402 + payment instructions
  │    └─ NO → Check isAtRisk
  │         ├─ At risk → 402 + payment instructions
  │         └─ Safe → 200 + safe message
```

**Mirror Node verification** — When `?tx=` is present, the server:
1. Parses the Hedera transaction ID from the query string
2. Calls the Hedera Mirror Node REST API: 
   `https://testnet.mirrornode.hedera.com/api/v1/transactions/{txId}`
3. Checks that the transaction:
   - Actually exists (wasn't fabricated)
   - Transferred the correct amount (1 HBAR = 100,000,000 tinybars)
   - Was sent to the correct `payTo` address (`0.0.10381614`)
4. If all checks pass → returns 200 with the full risk data (unlocked)
5. If any check fails → returns 402 again (access denied)

**What is a Mirror Node?**
A Mirror Node is a **read-only copy** of the Hedera network's transaction 
history. It's like a receipt archive — every transaction that has ever happened 
on Hedera is stored here and can be queried via a REST API. We verify payments 
here instead of trusting the client because:
- **Clients can lie.** Anyone could send `?tx=fake_id` and claim they paid.
- **Mirror Nodes are trustworthy.** They reflect the actual blockchain state.
- **It's free.** Mirror Node queries don't cost HBAR — they're just HTTP GETs.

**Test — Full end-to-end loop:**
```bash
# Terminal 1
npm start

# Terminal 2
npm run pay
```

Expected flow:
1. First request → 402 (position at risk, pay to access)
2. Script pays 1 HBAR on Hedera testnet
3. Second request with `?tx=...` → Server verifies via Mirror Node → 200 
   with real risk data (UNLOCKED)

**Failure case test:**
```bash
curl "http://localhost:3000/risk-alert?tx=0.0.0000@1234567890"
```
Should return 402 — fake/invalid transaction IDs are rejected ✅

---

## Integration — ✅ SYNC COMPLETE

The integration between Person A (Jefrin) and Person B (Jan) is **fully 
connected**:

| Component | Owner | File | Status |
|-----------|-------|------|--------|
| Health factor calculation | Jefrin | `agent/calculateHealthFactor.js` | ✅ Done |
| Risk position function | Jefrin | `agent/riskCalc.js` | ✅ Done |
| Graph query proof-of-concept | Jefrin | `agent/test-graph-query.js` | ✅ Done |
| Express server + /risk-alert | Jan | `server.js` | ✅ Done |
| Payment script | Jan | `payer-test.js` | ✅ Done |
| Live dashboard UI | Jefrin | `public/index.html` | ✅ Done |

**How they connect:**
```
server.js  →  imports getPositionRisk()  →  from agent/riskCalc.js
                                                ↓
                                         uses calculateHealthFactor()
                                                ↓
                                         from agent/calculateHealthFactor.js
```

The hardcoded risk object from Prompt 1 has been **replaced** with a real call 
to `getPositionRisk()` from Jefrin's agent module. The server accepts optional 
`?collateral=` and `?debt=` query parameters that flow through to the risk 
calculator, making the demo fully controllable from the URL bar or the 
dashboard's "Simulate price drop" button.

---

## Dashboard UI

The project includes a **live dashboard** at `public/index.html` served by 
Express at `http://localhost:3000`. Features:

- **Health factor display** — Large monospaced number, red when at risk, green 
  when safe
- **Visual gauge** — Bar chart with liquidation threshold markers at 1.0 and 1.1
- **Collateral / Debt values** — Formatted in USD
- **Status indicator** — Dot + text ("At risk" / "Safe") with color coding
- **Simulate button** — Toggles between "price drop" (risky) and "recovery" 
  (safe) scenarios by hitting the API with different query params
- **Payment flow log** — Animated terminal-style log showing the x402 flow 
  step by step (request → 402 → payment → verification → data unlocked)

Design: Dark theme with IBM Plex Mono + Inter fonts, smooth transitions, 
reduced-motion support.

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
This is the exact shape your teammate's `getPositionRisk()` function produces. 
Everything built today/tomorrow assumes input in this shape.

## File structure (final)
```
liquidation-alert-x402/
├── agent/                          # Jefrin's risk analysis module
│   ├── calculateHealthFactor.js    # Health factor formula + threshold
│   ├── riskCalc.js                 # getPositionRisk() — shared contract
│   └── test-graph-query.js         # Aave v3 GraphQL proof-of-concept
├── public/
│   └── index.html                  # Live dashboard UI
├── server.js                       # Express server + /risk-alert route
├── payer-test.js                   # Hedera HBAR payer script (x402 flow)
├── contract.md                     # Shared interface contract
├── jan.md                          # This file (Person B task schedule)
├── jefrin.md                       # Person A task schedule
├── package.json                    # Dependencies (express, @hashgraph/sdk, dotenv)
├── .env                            # Hedera credentials (git-ignored)
├── .gitignore                      # Excludes node_modules, .env, etc.
└── README.md                       # Getting started guide
```