import bs58 from 'bs58'
import { buildPoseidon } from 'circomlibjs'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function withTryCatch<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn()
  } catch (err) {
    console.error(err)
    return null
  }
}

export function hexToBigInt(hex: string) {
  return BigInt(hex.startsWith('0x') ? hex : `0x${hex}`)
}

export function bigintToDecimalString(v: bigint) {
  return v.toString()
}
const poseidon = await buildPoseidon()

export function generateRecipientCommitment(recipientAddress: string) {
  const F = poseidon.F
  const addrBytes = Buffer.from(bs58.decode(recipientAddress))
  // Reduce to a single bigint (mod p) — the Poseidon field
  let acc = 0n
  for (const b of addrBytes) {
    acc = (acc << 8n) + BigInt(b)
  }
  const commitment = poseidon([acc])
  return `0x${F.toString(commitment, 16)}`
}

export async function generateNullifier(
  secretKey: string,
  recipientCommitment: string,
) {
  const F = poseidon.F
  const secretBytes = Buffer.from(secretKey, 'hex')
  let secret = 0n
  for (const b of secretBytes) {
    secret = (secret << 8n) + BigInt(b)
  }
  const recipient = BigInt(
    recipientCommitment.startsWith('0x')
      ? recipientCommitment
      : `0x${recipientCommitment}`,
  )
  const nullifier = poseidon([secret, recipient])
  return `0x${F.toString(nullifier, 16)}`
}
