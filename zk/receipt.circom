pragma circom 2.1.4;

include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/poseidon.circom";

template ZkReceipt() {
    // ─── Public inputs (verifier sees these) ───
    signal input recipientCommitment;
    signal input minAmount;        
    signal input nullifier;             // anti-replay

    // ─── Private inputs (prover only) ───
    signal input secretKey;            
    signal input amount;        

    //  Prove control of ephemeral address
    component addrHash = Poseidon(1);
    addrHash.inputs[0] <== secretKey;
    signal ephemeralCommitment;
    ephemeralCommitment <== addrHash.out;

    component gte = GreaterEqThan(64);
    gte.in[0] <== amount;
    gte.in[1] <== minAmount;
    gte.out === 1;

    // Anti-replay nullifier
    component nullifierHash = Poseidon(2);
    nullifierHash.inputs[0] <== secretKey;
    nullifierHash.inputs[1] <== recipientCommitment;
    nullifierHash.out === nullifier;
}

component main = ZkReceipt();
