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
import { prisma } from './lib/prisma'
import { createClient } from './lib/solana'

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
) {
  const userId = await getUserId()

  const { address: ephemeralAddress, privateKey } =
    await createEphemeralAccount()

  const intent = await prisma.ephemeralIntent.create({
    data: {
      userId,
      ephemeralAddress,
      encryptedSecret: privateKey,
      expectedLamports,
      expiresAt: new Date(Date.now() + ttlMinutes * 60_000),
    },
  })
  return intent
}

export async function createPaymentLink(intentId: string) {
  const baseUrl = await getBaseUrl()
  return `${baseUrl}/pay/${intentId}`
}

export async function getEphemeralIntent(intentId: string) {
  const intent = await prisma.ephemeralIntent.findUnique({
    where: { id: intentId },
    include: { user: true },
  })
  if (!intent) {
    throw new Error('Payment link not found or has expired')
  }
  if (intent.expiresAt < new Date()) {
    throw new Error('Payment link has expired')
  }
  if (intent.claimed) {
    throw new Error('Payment link has already been used')
  }
  return {
    id: intent.id,
    ephemeralAddress: intent.ephemeralAddress,
    expectedLamports: intent.expectedLamports,
    expiresAt: intent.expiresAt,
  }
}

export async function buildPaymentTransaction(intentId: string) {
  await getUserId()
  const client = await createClient()

  const intent = await prisma.ephemeralIntent.findUnique({
    where: { id: intentId },
  })

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
    console.log('Successfully retrieved blockhash:', blockhash)
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

export async function submitPaymentTransaction(
  intentId: string,
  signedTransactionBase58: string,
) {
  await getUserId()
  const client = await createClient()
  const intent = await prisma.ephemeralIntent.findUnique({
    where: { id: intentId },
  })
  if (!intent) throw new Error('Intent not found')
  if (intent.claimed) throw new Error('Already claimed')
  try {
    console.log(
      '[submitPaymentTransaction] Received base58 length:',
      signedTransactionBase58.length,
    )
    const signature = await client.rpc
      .sendTransaction(signedTransactionBase58 as Base64EncodedWireTransaction)
      .send()

    console.log('[submitPaymentTransaction] Transaction successful:', signature)

    try {
      const drainSignature = await drainEphemeralAccount(intentId)
      console.log(
        '[submitPaymentTransaction] Drain successful:',
        drainSignature,
      )
    } catch (drainError) {
      console.error('[submitPaymentTransaction] Drain failed:', drainError)
    }
    await prisma.ephemeralIntent.update({
      where: { id: intentId },
      data: { claimed: true },
    })
    return signature
  } catch (error) {
    console.error('[submitPaymentTransaction] Error:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to submit transaction: ${errorMessage}`)
  }
}

export async function sendPrivatePayment(
  intentId: string,
  payer: TransactionSigner,
) {
  const client = await createClient()

  const intent = await prisma.ephemeralIntent.findUnique({
    where: { id: intentId },
  })

  if (!intent) throw new Error('Invalid payment link')
  if (intent.claimed) throw new Error('Already claimed')
  if (intent.expiresAt < new Date()) throw new Error('Link expired')

  const { value: latestBlockhash } = await client.rpc
    .getLatestBlockhash()
    .send()

  const instruction: Instruction = {
    programAddress: address('11111111111111111111111111111111'),
    accounts: [
      { address: payer.address, role: AccountRole.WRITABLE_SIGNER },
      { address: address(intent.ephemeralAddress), role: AccountRole.WRITABLE },
    ],
    data: encodeTransferAmount(intent.expectedLamports),
  }

  const transaction = pipe(
    createTransactionMessage({ version: 0 }),
    m => setTransactionMessageFeePayerSigner(payer, m),
    m => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
    m => appendTransactionMessageInstruction(instruction, m),
  )

  const signedTransaction = await signTransactionMessageWithSigners(transaction)
  const encodedTransaction = getBase64EncodedWireTransaction(signedTransaction)

  const signature = await client.rpc.sendTransaction(encodedTransaction).send()

  return signature
}

async function drainEphemeralAccount(intentId: string) {
  const client = await createClient()

  const intent = await prisma.ephemeralIntent.findUnique({
    where: { id: intentId },
    include: { user: true },
  })

  if (!intent) throw new Error('Intent not found')
  if (intent.claimed) throw new Error('Already claimed')

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

  await prisma.ephemeralIntent.update({
    where: { id: intentId },
    data: { claimed: true },
  })
  return signature
}

export async function generateReceipt(intent: {
  id: string
  ephemeralAddress: string
  createdAt: Date
}) {
  await getUserId()
  return {
    receiptId: intent.id,
    ephemeralAddress: intent.ephemeralAddress,
    issuedAt: intent.createdAt,
    note: 'Payment completed via one-time private address',
  }
}

export async function subscribeToEphemeralPayment(intentId: string) {
  const client = await createClient()
  const intent = await prisma.ephemeralIntent.findUnique({
    where: { id: intentId },
  })

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
    const fresh = await prisma.ephemeralIntent.findUnique({
      where: { id: intentId },
    })
    if (fresh?.paidAt) break
    await prisma.ephemeralIntent.update({
      where: { id: intentId },
      data: { paidAt: new Date() },
    })
    abortController.abort()
    break
  }
}
