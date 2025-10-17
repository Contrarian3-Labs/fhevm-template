/**
 * useFHECounter - Vue Composable for FHE Counter Contract
 *
 * This composable demonstrates the complete FHEVM workflow in Vue 3:
 * 1. Create FHEVM instance with useFhevmInstance()
 * 2. Read encrypted count handle from contract
 * 3. Encrypt inputs with useEncrypt()
 * 4. Write encrypted values to contract (increment/decrement)
 * 5. Decrypt handle to plaintext with useDecrypt()
 *
 * Mirrors the React hook implementation but uses Vue Composition API patterns
 */

import { ref, computed, watch, type Ref } from 'vue'
import { BrowserProvider, Contract, type Eip1193Provider } from 'ethers'
import {
  useFhevmInstance,
  useDecrypt,
  useConfig,
  useFHEEncryption,
  useInMemoryStorage,
  type FhevmInstance
} from '@fhevm-sdk/vue'
import { buildParamsFromAbi } from '@fhevm-sdk'

export type UseFHECounterParameters = {
  contractAddress: string
  contractAbi: any[]
  provider: Eip1193Provider | undefined
  chainId?: number
}

export type UseFHECounterReturnType = {
  // State
  countHandle: Ref<string | undefined>
  clearCount: Ref<bigint | undefined>
  message: Ref<string>
  isProcessing: Ref<boolean>
  isDecrypting: Ref<boolean>
  isRefreshing: Ref<boolean>
  isInstanceReady: Ref<boolean>

  // Capabilities (matches Next.js useFHECounterWagmi)
  canGetCount: Ref<boolean>
  canDecrypt: Ref<boolean>
  canUpdateCounter: Ref<boolean>
  isDecrypted: Ref<boolean>

  // Actions
  getCountHandle: () => Promise<void>
  incrementCounter: (value: number) => Promise<void>
  decrementCounter: (value: number) => Promise<void>
  decryptCount: () => Promise<void>
}

/**
 * Vue composable for interacting with the FHE Counter contract
 *
 * @example
 * ```vue
 * <script setup>
 * import { useFHECounter } from '@/composables/useFHECounter'
 * import CONTRACT_ABI from '@/contracts/FHECounter.json'
 *
 * const { clearCount, incrementCounter, decryptCount, message } = useFHECounter({
 *   contractAddress: '0x...',
 *   contractAbi: CONTRACT_ABI.abi,
 *   provider: window.ethereum,
 *   chainId: 31337
 * })
 * </script>
 * ```
 */
export function useFHECounter(parameters: UseFHECounterParameters): UseFHECounterReturnType {
  const { contractAddress, contractAbi, provider, chainId } = parameters

  // FHEVM SDK composables
  const config = useConfig()
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage()
  const { instance, isLoading: isInstanceLoading, error: instanceError } = useFhevmInstance({
    provider,
    chainId
  })
  const { decrypt, data: decryptedData, isLoading: isDecrypting } = useDecrypt()

  // Local state
  const countHandle = ref<string | undefined>()
  const message = ref<string>('Ready')
  const isProcessing = ref<boolean>(false)
  const isRefreshing = ref<boolean>(false)
  const ethersSigner = ref<any>(undefined)

  // Initialize ethers signer
  watch([provider], async ([providerValue]) => {
    if (providerValue) {
      try {
        const ethersProvider = new BrowserProvider(providerValue as any)
        ethersSigner.value = await ethersProvider.getSigner()
      } catch (error) {
        console.error('Failed to get signer:', error)
      }
    }
  }, { immediate: true })

  // Encryption composable (mirrors React's useFHEEncryption)
  const { canEncrypt, encryptWith } = useFHEEncryption({
    instance,
    ethersSigner,
    contractAddress: contractAddress as `0x${string}`
  })

  // Computed properties (matching Next.js useFHECounterWagmi)
  const isInstanceReady = computed(() => Boolean(instance.value && !isInstanceLoading.value))

  const clearCount = computed(() => {
    if (!countHandle.value || !decryptedData.value) return undefined
    return decryptedData.value[countHandle.value]
  })

  const canGetCount = computed(() =>
    Boolean(provider && contractAddress && !isRefreshing.value)
  )

  const canDecrypt = computed(() =>
    Boolean(instance.value && ethersSigner.value && countHandle.value && !isDecrypting.value)
  )

  const canUpdateCounter = computed(() =>
    Boolean(instance.value && ethersSigner.value && contractAddress && !isProcessing.value)
  )

  const isDecrypted = computed(() =>
    Boolean(countHandle.value && clearCount.value !== undefined)
  )

  // Watch for instance errors
  watch(instanceError, (error) => {
    if (error) {
      message.value = `FHEVM Instance Error: ${error.message}`
    }
  })

  /**
   * Get contract with provider (read) or signer (write)
   */
  const getContract = async (mode: 'read' | 'write'): Promise<Contract> => {
    if (!provider) {
      throw new Error('Provider not available')
    }

    const ethersProvider = new BrowserProvider(provider as any)

    if (mode === 'read') {
      return new Contract(contractAddress, contractAbi, ethersProvider)
    } else {
      const signer = await ethersProvider.getSigner()
      return new Contract(contractAddress, contractAbi, signer)
    }
  }

  /**
   * Read the encrypted count handle from the contract
   */
  const getCountHandle = async () => {
    isRefreshing.value = true
    try {
      message.value = 'Reading encrypted count from contract...'

      const contract = await getContract('read')
      const handle = await contract.getCount()

      countHandle.value = handle
      message.value = 'Count handle retrieved. Click "Decrypt" to view value.'
    } catch (error) {
      const err = error as Error
      message.value = `Failed to read count: ${err.message}`
      console.error('getCountHandle error:', error)
    } finally {
      isRefreshing.value = false
    }
  }

  /**
   * Encrypt a value and increment the counter
   */
  const incrementCounter = async (value: number) => {
    if (!canEncrypt.value) {
      message.value = 'Encryption not ready (missing instance, signer, or contract address)'
      return
    }

    if (value <= 0) {
      message.value = 'Value must be positive'
      return
    }

    isProcessing.value = true

    try {
      message.value = `Encrypting value ${value}...`

      // Encrypt the value using useFHEEncryption composable
      const encrypted = await encryptWith((builder: any) => {
        builder.add32(value)
      })

      if (!encrypted) {
        message.value = 'Encryption failed'
        return
      }

      message.value = 'Sending transaction...'

      // Get contract with signer
      const contract = await getContract('write')

      // Build parameters from encryption result
      const params = buildParamsFromAbi(encrypted, contractAbi, 'increment')

      // Call increment with encrypted value and proof
      const tx = await contract.increment(...params)

      message.value = 'Waiting for transaction confirmation...'
      await tx.wait()

      message.value = `Counter incremented by ${value}!`

      // Refresh count handle
      await getCountHandle()
    } catch (error) {
      const err = error as Error
      message.value = `Increment failed: ${err.message}`
      console.error('incrementCounter error:', error)
    } finally {
      isProcessing.value = false
    }
  }

  /**
   * Encrypt a value and decrement the counter
   */
  const decrementCounter = async (value: number) => {
    if (!canEncrypt.value) {
      message.value = 'Encryption not ready (missing instance, signer, or contract address)'
      return
    }

    if (value <= 0) {
      message.value = 'Value must be positive'
      return
    }

    isProcessing.value = true

    try {
      message.value = `Encrypting value ${value}...`

      // Encrypt the value using useFHEEncryption composable
      const encrypted = await encryptWith((builder: any) => {
        builder.add32(value)
      })

      if (!encrypted) {
        message.value = 'Encryption failed'
        return
      }

      message.value = 'Sending transaction...'

      // Get contract with signer
      const contract = await getContract('write')

      // Build parameters from encryption result
      const params = buildParamsFromAbi(encrypted, contractAbi, 'decrement')

      // Call decrement with encrypted value and proof
      const tx = await contract.decrement(...params)

      message.value = 'Waiting for transaction confirmation...'
      await tx.wait()

      message.value = `Counter decremented by ${value}!`

      // Refresh count handle
      await getCountHandle()
    } catch (error) {
      const err = error as Error
      message.value = `Decrement failed: ${err.message}`
      console.error('decrementCounter error:', error)
    } finally {
      isProcessing.value = false
    }
  }

  /**
   * Decrypt the count handle to get plaintext value
   */
  const decryptCount = async () => {
    if (!instance.value) {
      message.value = 'FHEVM instance not ready'
      return
    }

    if (!countHandle.value) {
      message.value = 'No count handle to decrypt. Read count first.'
      return
    }

    try {
      message.value = 'Requesting decryption permission...'

      // Get signer for decryption signature
      if (!provider) throw new Error('Provider not available')
      const ethersProvider = new BrowserProvider(provider as any)
      const signer = await ethersProvider.getSigner()

      // Decrypt the handle using InMemoryStorage (matches Next.js behavior)
      await decrypt({
        instance: instance.value,
        requests: [{ handle: countHandle.value as `0x${string}`, contractAddress: contractAddress as `0x${string}` }],
        signer,
        storage: fhevmDecryptionSignatureStorage,
        chainId
      })

      message.value = 'Count decrypted successfully!'
    } catch (error) {
      const err = error as Error
      message.value = `Decryption failed: ${err.message}`
      console.error('decryptCount error:', error)
    }
  }

  // Auto-fetch count handle when instance is ready
  watch(isInstanceReady, (ready) => {
    if (ready) {
      getCountHandle()
    }
  }, { immediate: true })

  return {
    // State
    countHandle,
    clearCount,
    message,
    isProcessing,
    isDecrypting,
    isRefreshing,
    isInstanceReady,

    // Capabilities (matches Next.js useFHECounterWagmi)
    canGetCount,
    canDecrypt,
    canUpdateCounter,
    isDecrypted,

    // Actions
    getCountHandle,
    incrementCounter,
    decrementCounter,
    decryptCount
  }
}
