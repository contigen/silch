import fs from 'node:fs'
import path from 'node:path'
import { groth16 } from 'snarkjs'

export async function generateZkReceiptProof(input: Record<string, string>) {
  const wasmPath = path.join(process.cwd(), 'zk/build/receipt_js/receipt.wasm')
  const zkeyPath = path.join(process.cwd(), 'zk/build/receipt_final.zkey')

  const wasmBuffer = fs.readFileSync(wasmPath)
  const zkeyBuffer = fs.readFileSync(zkeyPath)

  if (wasmBuffer.length === 0 || zkeyBuffer.length === 0) {
    throw new Error('WASM or ZKEY buffer empty')
  }
  const { proof, publicSignals } = await groth16.fullProve(
    input,
    wasmBuffer,
    zkeyBuffer,
  )

  return { proof, publicSignals }
}
