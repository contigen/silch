declare global {
  interface Window {
    phantom?: {
      solana: {
        isPhantom?: boolean
        connect(): Promise<{ publicKey: { toString(): string } }>
        disconnect(): Promise<void>
        signMessage(
          message: Uint8Array,
          display?: string,
        ): Promise<{ signature: Uint8Array }>
      }
    }
  }
}

function getProvider() {
  if ('phantom' in window) {
    const provider = window.phantom?.solana

    if (provider?.isPhantom) {
      return provider
    }
  }
  window.open('https://phantom.app/', '_blank')
}

export const connectWallet = async () => {
  if (typeof window?.phantom !== 'undefined') {
    try {
      const provider = getProvider()
      if (!provider) return ''
      const resp = await provider.connect()
      return { address: resp.publicKey.toString() }
    } catch {
      return ''
    }
  }
}
