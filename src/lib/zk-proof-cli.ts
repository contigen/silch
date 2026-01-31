import { execFile } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { promisify } from 'node:util'

const exec = promisify(execFile)

function getSnarkjsPath() {
  console.log('[getSnarkjsPath] process.cwd():', process.cwd())

  const possiblePaths = [
    path.join(process.cwd(), 'node_modules', 'snarkjs', 'build', 'cli.cjs'),
    path.join(process.cwd(), 'node_modules', '.bin', 'snarkjs'),
    path.join(process.cwd(), 'node_modules', 'snarkjs', 'cli.js'),
  ]

  console.log('[getSnarkjsPath] Checking paths:', possiblePaths)

  for (const snarkjsPath of possiblePaths) {
    console.log(`[getSnarkjsPath] Checking: ${snarkjsPath}, exists: ${fs.existsSync(snarkjsPath)}`)
    if (fs.existsSync(snarkjsPath)) {
      console.log(`[getSnarkjsPath] Found snarkjs at: ${snarkjsPath}`)
      return snarkjsPath
    }
  }

  // List what's actually in node_modules to debug
  try {
    const nmPath = path.join(process.cwd(), 'node_modules', 'snarkjs')
    if (fs.existsSync(nmPath)) {
      console.log('[getSnarkjsPath] Contents of node_modules/snarkjs:', fs.readdirSync(nmPath))
    } else {
      console.log('[getSnarkjsPath] node_modules/snarkjs does not exist!')
    }
  } catch (e) {
    console.error('[getSnarkjsPath] Error listing directory:', e)
  }

  console.log('[getSnarkjsPath] No snarkjs binary found, using PATH fallback')
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
