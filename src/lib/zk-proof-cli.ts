import { execFile } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { promisify } from 'node:util'

const exec = promisify(execFile)

function getSnarkjsPath() {
  const possiblePaths = [
    // This is where snarkjs actually is (works on both local and Lambda)
    path.join(process.cwd(), 'node_modules', 'snarkjs', 'build', 'cli.cjs'),
    // Fallback to symlink (local development)
    path.join(process.cwd(), 'node_modules', '.bin', 'snarkjs'),
    // Alternative location
    path.join(process.cwd(), 'node_modules', 'snarkjs', 'cli.js'),
  ]

  for (const snarkjsPath of possiblePaths) {
    if (fs.existsSync(snarkjsPath)) {
      console.log(`[getSnarkjsPath] Found snarkjs at: ${snarkjsPath}`)
      return snarkjsPath
    }
  }
  console.log('[getSnarkjsPath] No snarkjs binary found, using PATH')
  return 'snarkjs'
}

export async function generateAndVerifyZkProofCLI(
  intentId: string,
  circuitInput: Record<string, string>,
) {
  const baseDir = path.join('/tmp', intentId)
  fs.mkdirSync(baseDir, { recursive: true })
  try {
    const inputPath = path.join(baseDir, 'input.json')
    const witnessPath = path.join(baseDir, 'witness.wtns')
    const proofPath = path.join(baseDir, 'proof.json')
    const publicPath = path.join(baseDir, 'public.json')

    fs.writeFileSync(inputPath, JSON.stringify(circuitInput))

    const circuitJs = path.join(process.cwd(), 'zk/build/receipt_js')
    const zkey = path.join(process.cwd(), 'zk/build/receipt_final.zkey')
    const vkey = path.join(process.cwd(), 'zk/build/verification_key.json')

    await exec('node', [
      `${circuitJs}/generate_witness.js`,
      `${circuitJs}/receipt.wasm`,
      inputPath,
      witnessPath,
    ])

    const snarkjsPath = getSnarkjsPath()
    await exec('node', [
      snarkjsPath,
      'groth16',
      'prove',
      zkey,
      witnessPath,
      proofPath,
      publicPath,
    ])

    await exec('node', [
      snarkjsPath,
      'groth16',
      'verify',
      vkey,
      publicPath,
      proofPath,
    ])
    const proof = JSON.parse(fs.readFileSync(proofPath, 'utf8'))
    const publicSignals = JSON.parse(fs.readFileSync(publicPath, 'utf8'))
    return { proof, publicSignals }
  } finally {
    cleanupZkTempDir(intentId)
  }
}

function cleanupZkTempDir(intentId: string) {
  const dir = path.join('/tmp', intentId)
  try {
    if (!fs.existsSync(dir)) return

    fs.rmSync(dir, {
      recursive: true,
      force: true,
    })
  } catch (err) {
    console.warn('Failed to cleanup temp dir:', {
      intentId,
      error: err instanceof Error ? err.message : err,
    })
  }
}
