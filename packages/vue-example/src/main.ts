/**
 * FHEVM Vue Example - Entry Point
 *
 * This demonstrates how to setup the FHEVM SDK in a Vue 3 application:
 * 1. Create FHEVM config with createFhevmConfig()
 * 2. Install the FhevmPlugin to provide config to all components
 * 3. Mount the Vue app
 */

// Import polyfills FIRST - must come before any SDK imports
// This provides Buffer global that the SDK needs
import './polyfills'

import { createApp } from 'vue'
import { createFhevmConfig, FhevmPlugin } from '@fhevm-sdk/vue'
import App from './App.vue'
import './style.css'

// Create FHEVM configuration
// This follows the same pattern as Wagmi's createConfig()
const fhevmConfig = createFhevmConfig({
  // Chain IDs your app supports
  chains: [31337], // Hardhat local network

  // Mock chains for development (uses fhevmjs mock mode)
  // In production, remove this to use real FHEVM gateway
  mockChains: {
    31337: import.meta.env.VITE_RPC_URL || 'http://localhost:8545'
  },

  // SSR: Vue SSR/Nuxt support
  // Set to false for client-side only apps (current version)
  // For Nuxt: initialize config in onMounted() or use mock chains
  ssr: false,
})

// Create Vue app
const app = createApp(App)

// Install FHEVM plugin to provide config to all components
// This makes useConfig() and other composables available
app.use(FhevmPlugin, {
  config: fhevmConfig,
  autoConnect: true
})

// Mount the app
app.mount('#app')
