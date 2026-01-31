import fs from 'node:fs'
import path from 'node:path'
import { groth16 } from 'snarkjs'

export async function generateZkReceiptProof(input: {
  recipientCommitment: bigint
  minAmount: bigint
  amount: bigint
  secretKey: bigint
  nullifier: bigint
}) {
  const wasmPath = path.join(process.cwd(), 'zk/build/receipt_js/receipt.wasm')
  const zkeyPath = path.join(process.cwd(), 'zk/build/receipt_final.zkey')

  const wasmBuffer = fs.readFileSync(wasmPath)
  const zkeyBuffer = fs.readFileSync(zkeyPath)

  if (wasmBuffer.length === 0 || zkeyBuffer.length === 0) {
    throw new Error('WASM or ZKEY buffer empty')
  }

  const circuitInput = {
    recipientCommitment: input.recipientCommitment.toString(),
    minAmount: input.minAmount.toString(),
    amount: input.amount.toString(),
    secretKey: input.secretKey.toString(),
    nullifier: input.nullifier.toString(),
  }
  // errors out if the arguments passed are file path, suspends if buffers are passed
  const { proof, publicSignals } = await groth16.fullProve(
    circuitInput,
    wasmBuffer,
    zkeyBuffer,
  )

  return { proof, publicSignals }
}
