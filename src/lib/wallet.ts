import type { MetaMaskInpageProvider } from '@metamask/providers'
import { ethers } from 'ethers'

declare global {
  interface Window {
    ethereum?: MetaMaskInpageProvider
  }
}

export const connectWallet = async () => {
  if (typeof window?.ethereum !== 'undefined') {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' })
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      return { provider, signer, address }
    } catch {
      return ''
    }
  }
}
