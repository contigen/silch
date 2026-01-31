import 'server-only'
import type { Prisma } from '@/generated/prisma/client'
import { prisma } from './prisma'
import { withTryCatch } from './utils'

export async function createOrGetUser(address: string) {
  return withTryCatch(async () => {
    return prisma.user.upsert({
      where: { walletAddress: address },
      update: {},
      create: { walletAddress: address },
    })
  })
}

export type Intent = Prisma.EphemeralIntentGetPayload<{
  include: { user: true }
}>

export async function createEphemeralIntent(
  userId: string,
  data: {
    ephemeralAddress: string
    encryptedSecret: string
    expectedLamports: bigint
    expiresAt: Date
    note?: string
  },
) {
  return withTryCatch(async () => {
    return prisma.ephemeralIntent.create({
      data: {
        userId,
        ...data,
      },
    })
  })
}

export async function getEphemeralIntentById(intentId: string) {
  return withTryCatch(async () => {
    return prisma.ephemeralIntent.findUnique({
      where: { id: intentId },
      include: { user: true },
    })
  })
}

export async function updateEphemeralIntentClaimed(intentId: string) {
  return withTryCatch(async () => {
    return prisma.ephemeralIntent.update({
      where: { id: intentId },
      data: { claimed: true },
    })
  })
}

export async function updateEphemeralIntentPaid(intentId: string) {
  return withTryCatch(async () => {
    return prisma.ephemeralIntent.update({
      where: { id: intentId },
      data: { paidAt: new Date() },
    })
  })
}

export async function createZKReceiptProofRecord(
  intentId: string,
  data: {
    proof: string
    publicSignals: string
    nullifier: string
  },
) {
  return withTryCatch(async () => {
    return prisma.zkReceipt.create({
      data: {
        ...data,
        ephemeralIntentId: intentId,
      },
    })
  })
}

export async function getZKReceiptProofByIntentId(intentId: string) {
  return withTryCatch(async () => {
    return prisma.zkReceipt.findUnique({
      where: { ephemeralIntentId: intentId },
    })
  })
}
