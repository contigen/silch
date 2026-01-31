import { execFile } from 'node:child_process'
import path from 'node:path'
import { promisify } from 'node:util'

const exec = promisify(execFile)

export async function verifyProofCLI(
  proofPath: string,
  publicPath: string,
): Promise<boolean> {
  try {
    await exec('snarkjs', [
      'groth16',
      'verify',
      path.join(process.cwd(), 'zk/build/verification_key.json'),
      publicPath,
      proofPath,
    ])
    return true
  } catch {
    return false
  }
}
