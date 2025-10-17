<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { provideInMemoryStorage } from '@fhevm-sdk/vue'
import FHECounter from '@/components/FHECounter.vue'

// Provide InMemoryStorage for decryption signatures at app root
// This is cleared on page refresh (unlike localStorage)
// Matches Next.js behavior where signatures expire on app restart
provideInMemoryStorage()

// Wallet state
const isConnected = ref(false)
const account = ref<string>()
const provider = ref<any>()
const error = ref<string>()

/**
 * Connect to MetaMask wallet
 */
const connectWallet = async () => {
  try {
    // Check if MetaMask is installed
    if (!window.ethereum) {
      error.value = 'MetaMask is not installed. Please install MetaMask to use this app.'
      return
    }

    // Request account access
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })

    if (accounts.length > 0) {
      account.value = accounts[0]
      provider.value = window.ethereum
      isConnected.value = true
      error.value = undefined
    }
  } catch (err) {
    const e = err as Error
    error.value = `Failed to connect wallet: ${e.message}`
    console.error('Wallet connection error:', err)
  }
}

/**
 * Disconnect wallet
 */
const disconnectWallet = () => {
  isConnected.value = false
  account.value = undefined
  provider.value = undefined
}

/**
 * Format address for display (0x1234...5678)
 */
const formatAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// Listen for account changes
onMounted(() => {
  if (window.ethereum) {
    window.ethereum.on('accountsChanged', (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected wallet
        disconnectWallet()
      } else {
        // User switched accounts
        account.value = accounts[0]
      }
    })

    // Check if already connected
    window.ethereum.request({ method: 'eth_accounts' })
      .then((accounts: string[]) => {
        if (accounts.length > 0) {
          account.value = accounts[0]
          provider.value = window.ethereum
          isConnected.value = true
        }
      })
  }
})
</script>

<template>
  <div id="app">
    <!-- Header -->
    <header class="header">
      <div class="logo">
        <img src="/vite.svg" alt="Vite" class="logo-img" />
        <h1>FHEVM Vue Example</h1>
      </div>

      <!-- Wallet connection -->
      <div class="wallet-section">
        <button v-if="!isConnected" @click="connectWallet" class="connect-btn">
          Connect Wallet
        </button>
        <div v-else class="wallet-info">
          <span class="wallet-address">{{ formatAddress(account!) }}</span>
          <button @click="disconnectWallet" class="disconnect-btn">
            Disconnect
          </button>
        </div>
      </div>
    </header>

    <!-- Error display -->
    <div v-if="error" class="error-banner">
      {{ error }}
    </div>

    <!-- Main content -->
    <main class="main-content">
      <div v-if="!isConnected" class="welcome-card">
        <h2>Welcome to FHEVM</h2>
        <p>
          This example demonstrates Fully Homomorphic Encryption (FHE) on Ethereum using the FHEVM SDK.
        </p>
        <p>
          Connect your wallet to interact with the encrypted counter contract.
        </p>
        <button @click="connectWallet" class="connect-btn-large">
          Connect Wallet to Get Started
        </button>
      </div>

      <FHECounter v-else :provider="provider" />
    </main>

    <!-- Footer -->
    <footer class="footer">
      <p>
        Built with
        <a href="https://vuejs.org/" target="_blank">Vue 3</a> +
        <a href="https://vitejs.dev/" target="_blank">Vite</a> +
        <a href="https://docs.zama.ai/fhevm" target="_blank">FHEVM SDK</a>
      </p>
      <p class="footer-note">
        Make sure Hardhat node is running with FHEVM contracts deployed
      </p>
    </footer>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  border-bottom: 1px solid rgba(100, 108, 255, 0.2);
  flex-wrap: wrap;
  gap: 1rem;
}

.logo {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo-img {
  width: 3rem;
  height: 3rem;
}

.logo h1 {
  margin: 0;
  font-size: 1.8rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.wallet-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.connect-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.connect-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
}

.wallet-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  background-color: rgba(100, 108, 255, 0.1);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid rgba(100, 108, 255, 0.3);
}

.wallet-address {
  font-family: 'Courier New', monospace;
  color: #646cff;
  font-weight: 500;
}

.disconnect-btn {
  background-color: transparent;
  color: #888;
  border: 1px solid #888;
  padding: 0.4rem 0.8rem;
  font-size: 0.9rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.disconnect-btn:hover {
  background-color: rgba(255, 107, 107, 0.1);
  border-color: #ff6b6b;
  color: #ff6b6b;
}

.error-banner {
  background-color: rgba(255, 107, 107, 0.2);
  border: 1px solid #ff6b6b;
  color: #ff6b6b;
  padding: 1rem;
  margin: 1rem 0;
  border-radius: 8px;
  text-align: center;
}

.main-content {
  min-height: 60vh;
  padding: 2rem 0;
}

.welcome-card {
  max-width: 600px;
  margin: 4rem auto;
  padding: 3rem;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border: 1px solid rgba(100, 108, 255, 0.3);
  border-radius: 16px;
  text-align: center;
}

.welcome-card h2 {
  margin-top: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcome-card p {
  color: #888;
  line-height: 1.6;
  margin: 1rem 0;
}

.connect-btn-large {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 12px;
  cursor: pointer;
  margin-top: 1.5rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.connect-btn-large:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
}

.footer {
  margin-top: 4rem;
  padding: 2rem 0;
  border-top: 1px solid rgba(100, 108, 255, 0.2);
  text-align: center;
  color: #888;
}

.footer a {
  color: #646cff;
  text-decoration: none;
  font-weight: 500;
}

.footer a:hover {
  text-decoration: underline;
}

.footer-note {
  font-size: 0.9rem;
  margin-top: 0.5rem;
  color: #666;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    text-align: center;
  }

  .logo {
    flex-direction: column;
  }

  .logo h1 {
    font-size: 1.5rem;
  }

  .welcome-card {
    margin: 2rem auto;
    padding: 2rem;
  }
}
</style>
