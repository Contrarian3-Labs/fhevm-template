#!/usr/bin/env node

/**
 * FHEVM SDK Node.js CLI Example - FHECounter Contract
 *
 * This example demonstrates framework-agnostic usage of the FHEVM SDK in a Node.js environment.
 * It shows how to use core actions (createInstance, encrypt, decrypt) without any framework dependencies.
 *
 * Key Concepts Demonstrated:
 * 1. Mock Chain Configuration - Using Hardhat local node (chainId 31337)
 * 2. FHEVM Instance Creation - Initializing encryption/decryption context
 * 3. Homomorphic Encryption - Encrypting plaintext values to ciphertext
 * 4. Contract Interaction - Calling encrypted methods (increment/decrement)
 * 5. Decryption - Reading and decrypting encrypted state with EIP-712 signatures
 *
 * Architecture:
 * This example uses ONLY core SDK actions, proving the SDK is truly framework-agnostic.
 * No React hooks, no Vue composables - just pure functions.
 */

import { config as loadEnv } from 'dotenv'
import { createInterface } from 'readline/promises'
import { JsonRpcProvider, Wallet, Contract, ZeroHash } from 'ethers'

// Import ONLY core SDK actions (framework-agnostic)
import {
  createFhevmConfig,
  createInstance,
  encrypt,
  decrypt,
  buildParamsFromAbi,
  getEncryptionMethod,
  createStorage,
  noopStorage,
  type FhevmInstance,
  type FhevmConfig,
} from '../../fhevm-sdk/dist/exports/index.js'

// Import auto-generated contract deployments
import { deployedContracts, getContract } from './contracts/deployedContracts.js'

/////////////////////////////////////////////////////////////////////////////////////////////////
// Configuration
/////////////////////////////////////////////////////////////////////////////////////////////////

// Load environment variables from .env file
loadEnv()

const RPC_URL = process.env.RPC_URL || 'http://localhost:8545'
const PRIVATE_KEY = process.env.PRIVATE_KEY

// Hardhat local chainId (default for Hardhat node)
const CHAIN_ID = 31337

// Get contract info from auto-generated deployedContracts
const contract = getContract(CHAIN_ID, 'FHECounter')
const CONTRACT_ADDRESS = contract.address as `0x${string}`
const FHE_COUNTER_ABI = contract.abi

/////////////////////////////////////////////////////////////////////////////////////////////////
// Application State
/////////////////////////////////////////////////////////////////////////////////////////////////

interface AppState {
  config: FhevmConfig
  instance: FhevmInstance | null
  provider: JsonRpcProvider
  wallet: Wallet
  contract: Contract
  userAddress: `0x${string}`
}

let appState: AppState | null = null

/////////////////////////////////////////////////////////////////////////////////////////////////
// Initialization
/////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Initialize the FHEVM SDK and connect to the blockchain.
 *
 * This demonstrates the core initialization flow:
 * 1. Create FHEVM config (framework-agnostic)
 * 2. Create FHEVM instance (mock chain for Hardhat)
 * 3. Connect to blockchain via ethers.js
 *
 * In a real application, you might split this into smaller functions or
 * handle errors differently, but this shows the minimal setup required.
 */
async function initializeApp(): Promise<AppState> {
  console.log('\n=== FHEVM SDK Node.js Example ===\n')

  // Validate environment variables
  if (!PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY not found in environment. Create a .env file with your private key.')
  }

  if (!CONTRACT_ADDRESS) {
    throw new Error('Contract address not found. Please run "pnpm deploy:localhost" to deploy FHECounter contract.')
  }

  console.log('1. Creating FHEVM Configuration...')
  console.log(`   Chain ID: ${CHAIN_ID} (Hardhat Local)`)
  console.log(`   RPC URL: ${RPC_URL}`)

  /**
   * Create framework-agnostic FHEVM config.
   *
   * This config uses:
   * - Mock chains: Hardhat local node (chainId 31337)
   * - No storage: We use noopStorage since CLI doesn't need persistence
   * - SSR mode: Not needed for Node.js, but shows how to disable hydration
   *
   * In a browser app, you'd use:
   * - storage: createStorage({ storage: localStorage })
   * - No ssr flag
   */
  const config = createFhevmConfig({
    chains: [CHAIN_ID] as const,
    mockChains: {
      [CHAIN_ID]: RPC_URL,
    },
    storage: noopStorage, // CLI doesn't need persistence
    ssr: false,
    autoConnect: false, // We'll create instance manually
  })

  console.log('   Config created successfully')

  console.log('\n2. Creating FHEVM Instance...')
  console.log('   This initializes the encryption/decryption context')
  console.log('   For mock chains (Hardhat), this works in Node.js without browser APIs')

  /**
   * Create FHEVM instance using core action.
   *
   * This demonstrates the Wagmi-style action pattern:
   * - First parameter: config
   * - Second parameter: action parameters
   * - Returns: Promise<Instance>
   *
   * The instance provides:
   * - createEncryptedInput(): Builder for encrypting values
   * - userDecrypt(): Method for decrypting ciphertext handles
   * - getPublicKey(): Access to public key for encryption
   */
  const instance = await createInstance(config, {
    provider: RPC_URL,
    chainId: CHAIN_ID,
  })

  console.log('   Instance created successfully')
  console.log(`   Instance type: ${instance.constructor.name}`)

  console.log('\n3. Connecting to Blockchain...')
  const provider = new JsonRpcProvider(RPC_URL)
  const wallet = new Wallet(PRIVATE_KEY, provider)
  const userAddress = (await wallet.getAddress()) as `0x${string}`

  console.log(`   Connected as: ${userAddress}`)

  console.log('\n4. Loading FHECounter Contract...')
  console.log(`   Contract Address: ${CONTRACT_ADDRESS}`)

  const contract = new Contract(CONTRACT_ADDRESS, FHE_COUNTER_ABI, wallet)

  // Verify contract is deployed
  const code = await provider.getCode(CONTRACT_ADDRESS)
  if (code === '0x') {
    throw new Error(`No contract deployed at ${CONTRACT_ADDRESS}. Please deploy FHECounter first.`)
  }

  console.log('   Contract loaded successfully')

  return {
    config,
    instance,
    provider,
    wallet,
    contract,
    userAddress,
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////////
// FHEVM Operations
/////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Get the current counter value (encrypted).
 *
 * This demonstrates:
 * 1. Reading encrypted state from contract (returns handle)
 * 2. Decrypting the handle using SDK's decrypt action
 * 3. Handling the zero handle case (uninitialized state)
 *
 * In FHEVM, contract methods return "handles" (ciphertext references), not plaintext values.
 * These handles must be decrypted using the decrypt action with user's signature.
 */
async function getCounterValue(): Promise<{ handle: string; clear: bigint | null }> {
  if (!appState) throw new Error('App not initialized')

  const { config, instance, contract, wallet, userAddress } = appState

  console.log('\nFetching counter value...')

  // Call contract method - returns encrypted handle (not plaintext!)
  const handle = await contract.getCount()

  // Convert handle to hex string if it's a bigint, or use as-is if already a string
  let handleHex: `0x${string}`
  if (typeof handle === 'bigint') {
    handleHex = `0x${handle.toString(16).padStart(64, '0')}` as `0x${string}`
  } else if (typeof handle === 'string') {
    // Already a hex string, ensure it has 0x prefix
    handleHex = (handle.startsWith('0x') ? handle : `0x${handle}`) as `0x${string}`
  } else {
    throw new Error(`Unexpected handle type: ${typeof handle}`)
  }

  console.log(`Encrypted handle: ${handleHex}`)

  // Special case: ZeroHash means counter was never initialized
  if (handleHex === ZeroHash) {
    console.log('Counter is uninitialized (zero handle)')
    return { handle: handleHex, clear: 0n }
  }

  console.log('Decrypting handle...')

  /**
   * Decrypt using core decrypt action.
   *
   * This demonstrates Wagmi-style action pattern again:
   * - First parameter: config
   * - Second parameter: decrypt parameters
   *   - instance: FHEVM instance for crypto operations
   *   - requests: Array of {handle, contractAddress} to decrypt
   *   - signer: Ethers signer for EIP-712 signature
   *   - storage: Storage for caching signatures (noopStorage = no cache)
   *
   * The decrypt action:
   * 1. Prompts user to sign EIP-712 message (if signature not cached)
   * 2. Calls FHEVM userDecrypt with signature proof
   * 3. Returns map of handle -> decrypted value
   *
   * In a browser app with localStorage, the signature would be cached for 7 days.
   * In this CLI, we use noopStorage so it prompts every time.
   */
  const results = await decrypt(config, {
    instance: instance!,
    requests: [
      {
        handle: handleHex,
        contractAddress: CONTRACT_ADDRESS!,
      },
    ],
    signer: wallet as any, // ethers v6 Wallet is compatible with JsonRpcSigner interface
    storage: config.storage,
    chainId: CHAIN_ID,
  })

  const clearValue = results[handleHex]

  console.log(`Decrypted value: ${clearValue}`)

  return {
    handle: handleHex,
    clear: typeof clearValue === 'bigint' ? clearValue : null,
  }
}

/**
 * Increment the counter by an encrypted value.
 *
 * This demonstrates:
 * 1. Encrypting a plaintext value using SDK's encrypt action
 * 2. Building contract parameters from encryption result
 * 3. Calling contract method with encrypted parameters
 * 4. Waiting for transaction confirmation
 *
 * Key FHEVM Concept:
 * The value is encrypted CLIENT-SIDE before sending to blockchain.
 * The contract NEVER sees the plaintext value, only the ciphertext.
 * All operations (addition, subtraction) happen on encrypted data.
 */
async function incrementCounter(value: number): Promise<void> {
  if (!appState) throw new Error('App not initialized')

  const { config, instance, contract, userAddress } = appState

  console.log(`\nIncrementing counter by ${value}...`)

  /**
   * Encrypt the value using core encrypt action.
   *
   * This demonstrates:
   * - Declarative encryption API (type + value pairs)
   * - Result contains handles (encrypted values) and inputProof (ZK proof)
   *
   * The encrypt action:
   * 1. Creates RelayerEncryptedInput builder
   * 2. Adds value using appropriate method (euint32 -> add32)
   * 3. Calls builder.encrypt() to produce ciphertext + proof
   *
   * Alternative: Use encryptWith() for imperative builder control
   */
  console.log('Encrypting value...')
  const encrypted = await encrypt(config, {
    instance: instance!,
    contractAddress: CONTRACT_ADDRESS!,
    userAddress,
    values: [
      {
        type: 'euint32', // Encrypted uint32 (matches FHECounter contract)
        value: value,
      },
    ],
  })

  console.log(`Encryption complete. Handles: ${encrypted.handles.length}, Proof length: ${encrypted.inputProof.length} bytes`)

  /**
   * Build contract parameters from encryption result.
   *
   * This utility function:
   * 1. Looks up function in ABI (increment)
   * 2. Maps encryption result to ABI parameter types
   * 3. Converts Uint8Array to appropriate format (hex, BigInt, etc.)
   *
   * For increment(bytes32 inputEuint32, bytes inputProof):
   * - Parameter 0: encrypted.handles[0] as bytes32
   * - Parameter 1: encrypted.inputProof as bytes
   */
  const params = buildParamsFromAbi(encrypted, FHE_COUNTER_ABI, 'increment')

  console.log('Sending transaction...')
  const tx = await contract.increment(...params)

  console.log(`Transaction hash: ${tx.hash}`)
  console.log('Waiting for confirmation...')

  const receipt = await tx.wait()

  console.log(`Transaction confirmed in block ${receipt.blockNumber}`)
  console.log(`Gas used: ${receipt.gasUsed.toString()}`)
}

/**
 * Decrement the counter by an encrypted value.
 *
 * Same pattern as incrementCounter, but calls decrement() method.
 * Shows how encryption/decryption works identically for different operations.
 */
async function decrementCounter(value: number): Promise<void> {
  if (!appState) throw new Error('App not initialized')

  const { config, instance, contract, userAddress } = appState

  console.log(`\nDecrementing counter by ${value}...`)

  console.log('Encrypting value...')
  const encrypted = await encrypt(config, {
    instance: instance!,
    contractAddress: CONTRACT_ADDRESS!,
    userAddress,
    values: [
      {
        type: 'euint32',
        value: value,
      },
    ],
  })

  console.log(`Encryption complete. Handles: ${encrypted.handles.length}, Proof length: ${encrypted.inputProof.length} bytes`)

  const params = buildParamsFromAbi(encrypted, FHE_COUNTER_ABI, 'decrement')

  console.log('Sending transaction...')
  const tx = await contract.decrement(...params)

  console.log(`Transaction hash: ${tx.hash}`)
  console.log('Waiting for confirmation...')

  const receipt = await tx.wait()

  console.log(`Transaction confirmed in block ${receipt.blockNumber}`)
  console.log(`Gas used: ${receipt.gasUsed.toString()}`)
}

/////////////////////////////////////////////////////////////////////////////////////////////////
// CLI Interface
/////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Display FHEVM Instance and system status.
 *
 * This provides visibility into the SDK state, similar to Next.js/Vue status panels.
 */
async function showStatus(): Promise<void> {
  if (!appState) throw new Error('App not initialized')

  const { config, instance, provider, wallet, userAddress, contract } = appState

  console.log('\n=== FHEVM System Status ===')
  console.log('\n🔧 FHEVM Instance:')
  console.log(`   Instance Status: ${instance ? '✅ Connected' : '❌ Disconnected'}`)
  console.log(`   Instance Type: ${instance ? instance.constructor.name : 'N/A'}`)
  console.log(`   Chain ID: ${CHAIN_ID}`)
  console.log(`   Storage: ${config.storage === noopStorage ? 'In-Memory (No persistence)' : 'Persistent'}`)

  console.log('\n📊 Connection Status:')
  console.log(`   Provider URL: ${RPC_URL}`)
  console.log(`   Network: ${(await provider.getNetwork()).name || 'Hardhat Local'}`)
  console.log(`   User Address: ${userAddress}`)
  console.log(`   Contract Address: ${CONTRACT_ADDRESS}`)

  console.log('\n💰 Wallet Status:')
  try {
    const balance = await provider.getBalance(userAddress)
    console.log(`   ETH Balance: ${balance.toString()} wei`)
  } catch (error) {
    console.log(`   ETH Balance: Error fetching`)
  }

  console.log('\n📝 Contract Status:')
  const code = await provider.getCode(CONTRACT_ADDRESS)
  console.log(`   Contract Deployed: ${code !== '0x' ? '✅ Yes' : '❌ No'}`)
  console.log(`   Code Size: ${code.length} bytes`)

  console.log('')
}

/**
 * Display the main menu and get user choice.
 */
async function showMenu(rl: any): Promise<string> {
  console.log('\n=== FHECounter Menu ===')
  console.log('1. View counter value')
  console.log('2. Increment counter')
  console.log('3. Decrement counter')
  console.log('4. View system status')
  console.log('5. Exit')
  console.log('')

  const answer = await rl.question('Choose an option (1-5): ')
  return answer.trim()
}

/**
 * Main application loop.
 *
 * Provides simple CLI menu for interacting with FHECounter:
 * - View current value (decrypt)
 * - Increment by custom amount (encrypt + call)
 * - Decrement by custom amount (encrypt + call)
 * - Exit
 */
async function main() {
  try {
    // Initialize app (config, instance, contract)
    appState = await initializeApp()

    console.log('\n=== Ready to interact with FHECounter ===')

    // Create readline interface for user input
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    // Main loop
    let running = true
    while (running) {
      try {
        const choice = await showMenu(rl)

        switch (choice) {
          case '1': {
            // View counter value
            const { clear } = await getCounterValue()
            console.log(`\nCurrent counter value: ${clear !== null ? clear.toString() : 'unknown'}`)
            break
          }

          case '2': {
            // Increment counter
            const input = await rl.question('Enter value to increment by: ')
            const value = parseInt(input.trim(), 10)

            if (isNaN(value) || value <= 0) {
              console.log('Invalid value. Please enter a positive number.')
              break
            }

            await incrementCounter(value)
            console.log(`\nCounter incremented by ${value}!`)
            break
          }

          case '3': {
            // Decrement counter
            const input = await rl.question('Enter value to decrement by: ')
            const value = parseInt(input.trim(), 10)

            if (isNaN(value) || value <= 0) {
              console.log('Invalid value. Please enter a positive number.')
              break
            }

            await decrementCounter(value)
            console.log(`\nCounter decremented by ${value}!`)
            break
          }

          case '4': {
            // View system status
            await showStatus()
            break
          }

          case '5': {
            // Exit
            console.log('\nExiting...')
            running = false
            break
          }

          default: {
            console.log('\nInvalid option. Please choose 1-5.')
            break
          }
        }
      } catch (error) {
        // Handle operation errors (don't exit, let user try again)
        console.error('\nOperation failed:', error instanceof Error ? error.message : String(error))
        console.log('You can try again or exit.')
      }
    }

    rl.close()
    console.log('\nGoodbye!')
    process.exit(0)
  } catch (error) {
    // Fatal initialization error - exit
    console.error('\nFatal error:', error instanceof Error ? error.message : String(error))
    console.error('\nStack trace:', error instanceof Error ? error.stack : 'N/A')
    process.exit(1)
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////////
// Entry Point
/////////////////////////////////////////////////////////////////////////////////////////////////

// Run main function
main()
