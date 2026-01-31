'use server'

import { createKeyPairFromPrivateKeyBytes } from '@solana/keys'
import {
  AccountRole,
  address,
  appendTransactionMessageInstruction,
  type Base64EncodedWireTransaction,
  createTransactionMessage,
  getBase64EncodedWireTransaction,
  type Instruction,
  pipe,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  type TransactionSigner,
} from '@solana/kit'
import { createSignerFromKeyPair } from '@solana/signers'
import bs58 from 'bs58'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from './auth'
import { decryptPrivateKey, encryptPrivateKey } from './lib/cipher'
import {
  createZKReceiptProofRecord,
  createEphemeralIntent as dbCreateEphemeralIntent,
  getEphemeralIntentById,
  getZKReceiptProofByIntentId,
  type Intent,
  updateEphemeralIntentClaimed,
  updateEphemeralIntentPaid,
} from './lib/db-queries'
import { generateZkReceiptProof } from './lib/generate-proof'
import { createClient } from './lib/solana'
import {
  generateNullifier,
  generateRecipientCommitment,
  hexToBigInt,
} from './lib/utils'
import { verifyZkReceiptProof } from './lib/verify-proof'
import { generateAndVerifyZkProofCLI } from './lib/zk-proof-cli'

function encodeTransferAmount(lamports: bigint): Uint8Array {
  const data = new Uint8Array(12)
  const view = new DataView(data.buffer)
  view.setUint32(0, 2, true)
  view.setBigInt64(4, lamports, true)
  return data
}

export async function getUserSession() {
  const session = await auth()
  if (!session) redirect('/connect')
  return session
}

export async function getUserId() {
  const session = await getUserSession()
  return session.user.id!
}

async function getBaseUrl() {
  const headersList = await headers()
  const host = headersList.get('host')
  const protocol = headersList.get('x-forwarded-proto') || 'http'
  return `${protocol}://${host}`
}

export async function createEphemeralAccount() {
  try {
    const privateKeySeed = crypto.getRandomValues(new Uint8Array(32))
    const keypair = await createKeyPairFromPrivateKeyBytes(privateKeySeed, true)
    const exportedPublicKey = await crypto.subtle.exportKey(
      'raw',
      keypair.publicKey,
    )
    const publicKeyBytes = new Uint8Array(exportedPublicKey)
    const address = bs58.encode(publicKeyBytes)

    const seedHex = Buffer.from(privateKeySeed).toString('hex')
    const encryptedSeed = encryptPrivateKey(seedHex)

    return {
      address,
      privateKey: encryptedSeed,
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to create ephemeral account: ${errorMessage}`)
  }
}

export async function createEphemeralIntent(
  expectedLamports: bigint,
  ttlMinutes = 15,
  note?: string,
) {
  const userId = await getUserId()

  const { address: ephemeralAddress, privateKey } =
    await createEphemeralAccount()
  const intent = await dbCreateEphemeralIntent(userId, {
    ephemeralAddress,
    encryptedSecret: privateKey,
    expectedLamports,
    expiresAt: new Date(Date.now() + ttlMinutes * 60_000),
    note,
  })
  if (!intent) {
    throw new Error('Failed to create payment intent')
  }
  return intent
}

export async function createPaymentLink(intentId: string) {
  const baseUrl = await getBaseUrl()
  return `${baseUrl}/pay/${intentId}`
}

export async function getEphemeralIntent(intentId: string) {
  const intent = await getEphemeralIntentById(intentId)

  if (!intent) {
    throw new Error('Payment link not found or has expired')
  }

  if (intent.expiresAt < new Date()) {
    throw new Error('Payment link has expired')
  }

  return {
    id: intent.id,
    ephemeralAddress: intent.ephemeralAddress,
    expectedLamports: intent.expectedLamports,
    expiresAt: intent.expiresAt,
    claimed: intent.claimed,
    note: intent.note,
  }
}

export async function buildPaymentTransaction(intentId: string) {
  const client = await createClient()

  const intent = await getEphemeralIntentById(intentId)

  if (!intent) throw new Error('Invalid payment link')
  if (intent.claimed) throw new Error('Already claimed')
  if (intent.expiresAt < new Date()) throw new Error('Link expired')

  try {
    const blockHashResult = await client.rpc.getLatestBlockhash().send()
    const latestBlockhash = blockHashResult.value
    if (!latestBlockhash.blockhash) {
      throw new Error('Failed to retrieve blockhash from RPC')
    }
    const { blockhash } = latestBlockhash
    return {
      success: true,
      intentId,
      recipientAddress: intent.ephemeralAddress,
      lamports: intent.expectedLamports,
      blockhash,
    }
  } catch (error) {
    console.error('[buildPaymentTransaction] Error:', error)
    throw new Error('Failed to build payment transaction')
  }
}

const SNARK_FIELD =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n

async function generatePaymentProof(
  intentId: string,
  secretKey: string,
  recipientAddress: string,
  amount: string,
) {
  const recipientCommitment = generateRecipientCommitment(recipientAddress)
  const nullifier = await generateNullifier(secretKey, recipientCommitment)

  const circuitInput = {
    recipientCommitment: (
      hexToBigInt(recipientCommitment) % SNARK_FIELD
    ).toString(),
    minAmount: '5000000',
    amount,
    secretKey: (hexToBigInt(secretKey) % SNARK_FIELD).toString(),
    nullifier: (hexToBigInt(nullifier) % SNARK_FIELD).toString(),
  }
  // errrors out if the arguments passed are file path, suspends if buffers are passed

  // const { proof, publicSignals } = await generateZkReceiptProof(circuitInput)

  // switch to CLI-based proof generation and verification
  const { proof, publicSignals } = await generateAndVerifyZkProofCLI(
    intentId,
    circuitInput,
  )
  return createZKReceiptProofRecord(intentId, {
    proof: JSON.stringify(proof),
    publicSignals: JSON.stringify(publicSignals),
    nullifier,
  })
}

async function generatePaymentProofWithTimeout(
  intentId: string,
  secretKey: string,
  recipientAddress: string,
  amount: string,
  timeoutMs = 6_000,
) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Proof generation timeout')), timeoutMs)
  })
  const proofPromise = generatePaymentProof(
    intentId,
    secretKey,
    recipientAddress,
    amount,
  )
  return Promise.race([proofPromise, timeoutPromise])
}

export async function submitPaymentTransaction(
  intentId: string,
  signedTransactionBase58: string,
) {
  const client = await createClient()
  const intent = await getEphemeralIntentById(intentId)
  if (!intent) throw new Error('Intent not found')
  if (intent.claimed) throw new Error('Already claimed')
  if (intent.expiresAt < new Date()) throw new Error('Link expired')
  try {
    const signature = await client.rpc
      .sendTransaction(signedTransactionBase58 as Base64EncodedWireTransaction)
      .send()

    console.log('[submitPaymentTransaction] Transaction successful:', signature)
    await updateEphemeralIntentPaid(intentId)

    console.log('[submitPaymentTransaction] Starting proof generation...')
    try {
      const result = await generatePaymentProofWithTimeout(
        intentId,
        decryptPrivateKey(intent.encryptedSecret),
        intent.ephemeralAddress,
        intent.expectedLamports.toString(),
      )
      console.log(
        '[submitPaymentTransaction] Proof generation successful:',
        result,
      )
    } catch (proofError) {
      console.error(
        '[submitPaymentTransaction] Proof generation failed:',
        proofError,
      )
    }
    try {
      const drainSignature = await drainEphemeralAccount(intent)
      console.log(
        '[submitPaymentTransaction] Drain successful:',
        drainSignature,
      )
    } catch (drainError) {
      console.error('[submitPaymentTransaction] Drain failed:', drainError)
    }
    await updateEphemeralIntentClaimed(intentId)
    return signature
  } catch (error) {
    console.error('[submitPaymentTransaction] Error:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to submit transaction: ${errorMessage}`)
  }
}

async function drainEphemeralAccount(intent: Intent) {
  const intentId = intent.id!
  const client = await createClient()

  const decryptedSeedHex = decryptPrivateKey(intent.encryptedSecret)
  const privateKeySeed = Buffer.from(decryptedSeedHex, 'hex')
  const keypair = await createKeyPairFromPrivateKeyBytes(privateKeySeed, true)
  const ephemeralSigner = await createSignerFromKeyPair(keypair)

  const { value: latestBlockhash } = await client.rpc
    .getLatestBlockhash()
    .send()
  const { value: balance } = await client.rpc
    .getBalance(address(intent.ephemeralAddress))
    .send()
  if (balance === 0n) throw new Error('No funds to claim')

  // Reserve lamports for transaction fee (typically ~5000 lamports)
  const transactionFee = 5000n
  const transferAmount = balance - transactionFee
  if (transferAmount <= 0n)
    throw new Error('Insufficient balance to cover transaction fee')
  const instruction: Instruction = {
    programAddress: address('11111111111111111111111111111111'),
    accounts: [
      {
        address: address(intent.ephemeralAddress),
        role: AccountRole.WRITABLE_SIGNER,
      },
      {
        address: address(intent.user.walletAddress),
        role: AccountRole.WRITABLE,
      },
    ],
    data: encodeTransferAmount(transferAmount),
  }

  const transaction = pipe(
    createTransactionMessage({ version: 0 }),
    m => setTransactionMessageFeePayerSigner(ephemeralSigner, m),
    m => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
    m => appendTransactionMessageInstruction(instruction, m),
  )

  const signedTransaction = await signTransactionMessageWithSigners(transaction)
  const base64Transaction = getBase64EncodedWireTransaction(signedTransaction)
  const transactionBytes = Buffer.from(base64Transaction, 'base64')
  const encodedTransaction = bs58.encode(transactionBytes)

  const signature = await client.rpc
    .sendTransaction(encodedTransaction as Base64EncodedWireTransaction)
    .send()

  await updateEphemeralIntentClaimed(intentId)
  return signature
}

export async function getPaymentStatus(intentId: string) {
  const intent = await getEphemeralIntentById(intentId)
  if (!intent) {
    throw new Error('Payment not found')
  }
  // Generate a unique receipt hash (deterministic but not revealing)
  const receiptHash = `0x${Buffer.from(`${intentId}-${intent.createdAt.getTime()}`).toString('hex').slice(0, 64)}`

  return {
    receiptId: intentId,
    receiptHash,
    createdAt: intent.createdAt,
    paidAt: intent.paidAt,
    claimed: intent.claimed,
    note: intent.note,
  }
}

export async function subscribeToEphemeralPayment(intentId: string) {
  const client = await createClient()
  const intent = await getEphemeralIntentById(intentId)

  if (!intent) throw new Error('Intent not found')
  if (intent.claimed) return
  if (intent.expiresAt < new Date()) return

  const ephemeralAddress = address(intent.ephemeralAddress)
  const abortController = new AbortController()

  const subscription = await client.rpcSubscriptions
    .accountNotifications(ephemeralAddress)
    .subscribe({ abortSignal: abortController.signal })

  for await (const notification of subscription) {
    const lamportsBalance = notification.value.lamports
    if (lamportsBalance < intent.expectedLamports) continue
    const fresh = await getEphemeralIntentById(intentId)
    if (fresh?.paidAt) break
    await updateEphemeralIntentPaid(intentId)
    abortController.abort()
    break
  }
}

export async function verifyPaymentProof(intentId: string) {
  const zkReceipt = await getZKReceiptProofByIntentId(intentId)
  if (!zkReceipt) {
    return { success: false, error: 'Proof not found' }
  }
  return {
    success: true,
    proof: JSON.parse(zkReceipt.proof as string),
    publicSignals: JSON.parse(zkReceipt.publicSignals as string),
    timestamp: zkReceipt.createdAt.toISOString(),
  }
}
