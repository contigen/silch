import fs from 'node:fs'
import path from 'node:path'
import { type Groth16Proof, groth16, type PublicSignals } from 'snarkjs'

export async function verifyZkReceiptProof(
  proof: Groth16Proof,
  publicSignals: PublicSignals,
) {
  const vkey = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), 'zk/build/verification_key.json'),
      'utf8',
    ),
  )
  return groth16.verify(vkey, publicSignals, proof)
}
