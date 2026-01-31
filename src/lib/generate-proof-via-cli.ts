import { execFile } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { promisify } from 'node:util'

const exec = promisify(execFile)

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

  await exec('npx', [
    'snarkjs',
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
