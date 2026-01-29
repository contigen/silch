import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  type Rpc,
  type RpcSubscriptions,
  type SolanaRpcApi,
  type SolanaRpcSubscriptionsApi,
} from '@solana/kit'

const SOLANA_RPC_URL = process.env.ALCHEMY_API_KEY
  ? `https://solana-devnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
  : 'https://api.devnet.solana.com'

const SOLANA_WS_URL = process.env.ALCHEMY_API_KEY
  ? `wss://solana-devnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
  : 'wss://api.devnet.solana.com'

export type Client = {
  rpc: Rpc<SolanaRpcApi>
  rpcSubscriptions: RpcSubscriptions<SolanaRpcSubscriptionsApi>
}

let client: Client | undefined
export async function createClient(): Promise<Client> {
  if (!client) {
    const rpc = createSolanaRpc(SOLANA_RPC_URL)
    const rpcSubscriptions = createSolanaRpcSubscriptions(SOLANA_WS_URL)

    client = { rpc, rpcSubscriptions }
  }
  return client
}
