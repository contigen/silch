import { buildPoseidon } from 'circomlibjs'

const poseidon = await buildPoseidon()

const secretKey = 123456789n
const recipientCommitment = 987654321n

const nullifier = poseidon([secretKey, recipientCommitment])
console.log(poseidon.F.toString(nullifier))
