import { execFile } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { promisify } from 'node:util'

const exec = promisify(execFile)

function getSnarkjsPath() {
  console.log('[getSnarkjsPath] process.cwd():', process.cwd())
  const possiblePaths = [
    path.join(process.cwd(), 'node_modules', 'snarkjs', 'build', 'cli.cjs'),
    // Fallback to symlink (local development)
    path.join(process.cwd(), 'node_modules', '.bin', 'snarkjs'),
    // Alternative location
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

function tmpDir(intentId: string) {
  const dir = path.join('/tmp', intentId)
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

function writeInput(dir: string, input: Record<string, string>) {
  const file = path.join(dir, 'input.json')
  fs.writeFileSync(file, JSON.stringify(input))
  return file
}

async function runProver(dir: string) {
  const circuitJs = path.join(process.cwd(), 'zk/build/receipt_js/receipt_js')

  const zkey = path.join(process.cwd(), 'zk/build/receipt_final.zkey')

  await exec('node', [
    `${circuitJs}/generate_witness.js`,
    `${circuitJs}/receipt.wasm`,
    path.join(dir, 'input.json'),
    path.join(dir, 'witness.wtns'),
  ])

  const snarkjsPath = getSnarkjsPath()
  await exec('node', [
    snarkjsPath,
    'groth16',
    'prove',
    zkey,
    path.join(dir, 'witness.wtns'),
    path.join(dir, 'proof.json'),
    path.join(dir, 'public.json'),
  ])
}

function readProof(dir: string) {
  const proof = JSON.parse(
    fs.readFileSync(path.join(dir, 'proof.json'), 'utf8'),
  )

  const publicSignals = JSON.parse(
    fs.readFileSync(path.join(dir, 'public.json'), 'utf8'),
  )

  return { proof, publicSignals }
}

export async function generateZkReceiptProofCLI(
  intentId: string,
  circuitInput: Record<string, string>,
) {
  const dir = tmpDir(intentId)

  writeInput(dir, circuitInput)
  await runProver(dir)

  return readProof(dir)
}
