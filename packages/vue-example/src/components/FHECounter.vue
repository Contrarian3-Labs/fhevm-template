<script setup lang="ts">
import { ref } from 'vue'
import { useFhevmInstance } from '@fhevm-sdk/vue'
import { useFHECounter } from '@/composables/useFHECounter'
import { deployedContracts } from '@/contracts/deployedContracts'

// Props
const props = defineProps<{
  provider: any
}>()

// Get contract info from auto-generated deployedContracts
const chainId = parseInt(import.meta.env.VITE_CHAIN_ID || '31337')
const contract = deployedContracts[chainId as keyof typeof deployedContracts]?.FHECounter

if (!contract) {
  throw new Error(`Contract not deployed on chain ${chainId}`)
}

const contractAddress = contract.address
const contractAbi = contract.abi

// FHEVM instance status (for status display)
const { instance: fhevmInstance, isLoading: fhevmStatus, error: fhevmError } = useFhevmInstance({
  provider: props.provider,
  chainId
})

// Input value for increment/decrement
const inputValue = ref(1)

// Use FHE Counter composable
const {
  countHandle,
  clearCount,
  message,
  isProcessing,
  isDecrypting,
  isRefreshing,
  isInstanceReady,
  canGetCount,
  canDecrypt,
  canUpdateCounter,
  isDecrypted,
  incrementCounter,
  decrementCounter,
  decryptCount,
  getCountHandle
} = useFHECounter({
  contractAddress,
  contractAbi,
  provider: props.provider,
  chainId
})

// Handlers
const handleIncrement = () => {
  incrementCounter(inputValue.value)
}

const handleDecrement = () => {
  decrementCounter(inputValue.value)
}

const handleDecrypt = () => {
  decryptCount()
}

const handleRefresh = () => {
  getCountHandle()
}
</script>

<template>
  <div class="fhe-counter">
    <!-- Header -->
    <div class="header">
      <h1>FHE Counter Demo</h1>
      <p class="description">
        Interact with the Fully Homomorphic Encryption Counter contract
      </p>
    </div>

    <!-- Count Handle Display -->
    <div class="card">
      <h3 class="card-title">🔢 Count Handle</h3>
      <div class="property-list">
        <div class="property-item">
          <span class="property-name">Encrypted Handle</span>
          <span class="property-value mono">{{ countHandle || 'No handle available' }}</span>
        </div>
        <div class="property-item">
          <span class="property-name">Decrypted Value</span>
          <span class="property-value mono">{{ isDecrypted ? clearCount : 'Not decrypted yet' }}</span>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="button-grid">
      <button
        @click="handleDecrypt"
        :disabled="!canDecrypt"
        :class="[isDecrypted ? 'btn-success' : 'btn-primary']"
      >
        {{ canDecrypt ? '🔓 Decrypt Counter' :
           isDecrypted ? `✅ Decrypted: ${clearCount}` :
           isDecrypting ? '⏳ Decrypting...' : '❌ Nothing to decrypt' }}
      </button>

      <div class="input-row">
        <label for="value-input">Value:</label>
        <input
          id="value-input"
          v-model.number="inputValue"
          type="number"
          min="1"
          max="1000"
        />
      </div>

      <button
        @click="handleIncrement"
        :disabled="!canUpdateCounter"
        class="btn-secondary"
      >
        {{ canUpdateCounter ? `➕ Increment +${inputValue}` :
           isProcessing ? '⏳ Processing...' : '❌ Cannot increment' }}
      </button>

      <button
        @click="handleDecrement"
        :disabled="!canUpdateCounter"
        class="btn-secondary"
      >
        {{ canUpdateCounter ? `➖ Decrement -${inputValue}` :
           isProcessing ? '⏳ Processing...' : '❌ Cannot decrement' }}
      </button>
    </div>

    <!-- Messages -->
    <div v-if="message" class="card">
      <h3 class="card-title">💬 Messages</h3>
      <div class="message-box">
        <p>{{ message }}</p>
      </div>
    </div>

    <!-- Status Cards -->
    <div class="status-grid">
      <!-- FHEVM Instance Status -->
      <div class="card">
        <h3 class="card-title">🔧 FHEVM Instance</h3>
        <div class="property-list">
          <div class="property-item">
            <span class="property-name">Instance Status</span>
            <span class="property-value">{{ fhevmInstance ? '✅ Connected' : '❌ Disconnected' }}</span>
          </div>
          <div class="property-item">
            <span class="property-name">Status</span>
            <span class="property-value">{{ fhevmStatus ? 'loading' : 'ready' }}</span>
          </div>
          <div class="property-item">
            <span class="property-name">Error</span>
            <span class="property-value">{{ fhevmError ? fhevmError.message : 'No errors' }}</span>
          </div>
        </div>
      </div>

      <!-- Counter Status -->
      <div class="card">
        <h3 class="card-title">📊 Counter Status</h3>
        <div class="property-list">
          <div class="property-item">
            <span class="property-name">Refreshing</span>
            <span class="property-value" :class="isRefreshing ? 'status-true' : 'status-false'">
              {{ isRefreshing ? '✓ true' : '✗ false' }}
            </span>
          </div>
          <div class="property-item">
            <span class="property-name">Decrypting</span>
            <span class="property-value" :class="isDecrypting ? 'status-true' : 'status-false'">
              {{ isDecrypting ? '✓ true' : '✗ false' }}
            </span>
          </div>
          <div class="property-item">
            <span class="property-name">Processing</span>
            <span class="property-value" :class="isProcessing ? 'status-true' : 'status-false'">
              {{ isProcessing ? '✓ true' : '✗ false' }}
            </span>
          </div>
          <div class="property-item">
            <span class="property-name">Can Get Count</span>
            <span class="property-value" :class="canGetCount ? 'status-true' : 'status-false'">
              {{ canGetCount ? '✓ true' : '✗ false' }}
            </span>
          </div>
          <div class="property-item">
            <span class="property-name">Can Decrypt</span>
            <span class="property-value" :class="canDecrypt ? 'status-true' : 'status-false'">
              {{ canDecrypt ? '✓ true' : '✗ false' }}
            </span>
          </div>
          <div class="property-item">
            <span class="property-name">Can Modify</span>
            <span class="property-value" :class="canUpdateCounter ? 'status-true' : 'status-false'">
              {{ canUpdateCounter ? '✓ true' : '✗ false' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fhe-counter {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.description {
  color: #666;
  font-size: 1rem;
}

.card {
  background: rgba(100, 108, 255, 0.05);
  border: 1px solid rgba(100, 108, 255, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.card-title {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #646cff;
  border-bottom: 1px solid rgba(100, 108, 255, 0.2);
  padding-bottom: 0.5rem;
}

.property-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.property-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
}

.property-name {
  font-weight: 500;
  color: #555;
}

.property-value {
  font-weight: 600;
  color: #333;
}

.property-value.mono {
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  background: rgba(100, 108, 255, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  word-break: break-all;
}

.status-true {
  color: #16a34a;
  background: #dcfce7;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  border: 1px solid #86efac;
}

.status-false {
  color: #dc2626;
  background: #fee2e2;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  border: 1px solid #fecaca;
}

.button-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.input-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: white;
  border: 2px solid #646cff;
  border-radius: 8px;
}

.input-row label {
  font-weight: 500;
  color: #646cff;
}

.input-row input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 1rem;
}

button {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background: linear-gradient(135deg, #FFD208 0%, #A38025 100%);
  color: #2D2D2D;
}

.btn-primary:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 16px rgba(255, 210, 8, 0.4);
}

.btn-secondary {
  background: #000;
  color: #F4F4F4;
}

.btn-secondary:hover:not(:disabled) {
  background: #1F1F1F;
}

.btn-success {
  background: #A38025;
  color: #2D2D2D;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.message-box {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 1rem;
}

.message-box p {
  margin: 0;
  color: #555;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

@media (prefers-color-scheme: light) {
  .property-name,
  .message-box p {
    color: #555;
  }

  .property-value {
    color: #333;
  }
}
</style>
