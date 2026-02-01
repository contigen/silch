# Silch

Generate private, one-time payment links on Solana using one-time addresses with zero-knowledge receipts.

Silch lets people receive crypto payments **without exposing their entire wallet history**. Each payment uses an ephemeral (one-time) address, preventing address reuse and reducing unwanted financial visibility.

## The Problem

Public blockchains make payments transparent by default.

That’s great for settlement — but terrible for everyday use.

Reusing a wallet address means:

- anyone can see past and future payments
- anyone can track transaction provenance
- income patterns become public
- private relationships are exposed

This makes crypto payment impractical for creators, freelancers, and normal peer-to-peer payments.

## The Opportunity

There is growing demand for:

- creator monetisation
- freelance and remote payments
- casual crypto transfers

But **most people do not want financial transparency by default**.

Silch sits between fully public wallets and heavy privacy protocols:

- no mixers
- no new chains
- no complex cryptography for users

## Who It’s For

### Creators

Accept tips or one-off payments without publishing your full income history.

### Freelancers

Send private payment links instead of reusable wallet addresses.

### Everyday Users

Make casual transfers without permanently linking wallets.

---

## What Makes Silch Different

- (One-time) Ephemeral payment addresses
- No address reuse
- No persistent on-chain relationships
- No linkage between recipients & payers
- Standard Solana transfers
- Instant payment detection via WebSocket subscriptions

Silch improves privacy **without changing the blockchain**.

## How It Works

!["Flow for the app"](./silch-flow.png)

### Payment Flow

1. **Recipient creates a payment link** (authenticated)
   - Generates an ephemeral Solana keypair
   - Encrypts and stores the private key
   - Creates a payment intent with expected amount and expiry
   - Shares the payment link with the payer

2. **Payer completes the payment** (unauthenticated)
   - Opens the payment link (no login required)
   - Connects their wallet
   - Sends SOL to the ephemeral address
   - Transaction is verified on-chain
   - Generates zero-knowledge proof of payment (groth16 via snarkjs)

3. **Funds are claimed automatically**
   - System detects payment via WebSocket subscription
   - Drains ephemeral account to recipient's wallet
   - Payment marked as claimed

## Technical Details

### Authentication Model

Silch uses a **dual authentication model**:

- **Recipients** must authenticate to create payment links
- **Payers** do not need to authenticate — they only need the payment link

### Security Considerations

**Public server actions** (no authentication required):

- `getEphemeralIntent()` — Returns public payment details (amount, ephemeral address, expiry)
- `buildPaymentTransaction()` — Constructs transaction parameters
- `submitPaymentTransaction()` — Submits signed transaction to Solana
- `getPaymentStatus()` — Returns payment status and ZK proof

**Protected by design**:

- All functions validate that intents exist, haven't expired, and haven't been claimed
- Payers can only interact with the specific intent in the URL
- Funds always drain to the recipient's wallet address stored in the database
- One-time use enforced

**Private server actions** (authentication required):

- `createEphemeralIntent()` — Only authenticated recipients can create payment links

### Privacy Features

- **No address reuse** — Each payment uses a unique ephemeral address
- **No on-chain linkability** — Payments cannot be traced back to the recipient's main wallet
- **Zero-knowledge proofs** — Payments can be proofed without revealing transaction details
- **Minimal metadata** — Status pages show timestamps and notes, but no wallet addresses or transaction hashes

---

## Environment Setup

### Prerequisites

- Node.js/Bun
- Prisma PostgreSQL
- Phantom wallet browser extension

### Required Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# Database
# PostgreSQL connection string from Prisma
DATABASE_URL="postgresql://user:password@localhost:5432/silch"

# Encryption
# Strong random password for AES-256-GCM encryption of ephemeral private keys
# Generate with: openssl rand -base64 32
WALLET_ENCRYPTION_PASSWORD="your-secure-random-password-here"

# Solana RPC (optional)
# Alchemy API key for Solana devnet RPC
# If not provided, defaults to public Solana devnet endpoints
# Get your key from: https://www.alchemy.com/
ALCHEMY_API_KEY=""

# NextAuth
# Random string for NextAuth session encryption
# Generate with: bunx(npx) auth secret
NEXTAUTH_SECRET="your-nextauth-secret"

```

### Notes

- The application runs on Solana **devnet** by default
- You'll need devnet SOL in your Phantom wallet for testing (get from [Solana faucet](https://faucet.solana.com/))
- ZK circuit files are pre-compiled in `/zk/build` — no need to recompile unless modifying the circuit
