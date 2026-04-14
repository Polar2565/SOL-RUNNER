const { Keypair } = require("@solana/web3.js");

const kp = Keypair.generate();

console.log("PUBLIC_KEY=");
console.log(kp.publicKey.toBase58());

console.log("\nSECRET_KEY_JSON=");
console.log(JSON.stringify(Array.from(kp.secretKey)));