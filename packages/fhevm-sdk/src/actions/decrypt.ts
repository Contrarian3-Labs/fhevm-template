/**
 * decrypt Action
 *
 * Pure function for decrypting FHEVM ciphertext handles
 * Extracted from react/useFHEDecrypt.ts (lines 56-123 - 67 lines of business logic)
 * Following Wagmi action pattern: (config, parameters) => Promise<Result>
 */

import type { FhevmConfig } from '../createConfig.js'
import type { FhevmInstance } from '../fhevmTypes.js'
import type { GenericStringStorage } from '../storage/GenericStringStorage.js'
import { FhevmDecryptionSignature } from '../FhevmDecryptionSignature.js'
import type { JsonRpcSigner } from 'ethers'

/////////////////////////////////////////////////////////////////////////////////////////////////
// Types
/////////////////////////////////////////////////////////////////////////////////////////////////

export type DecryptRequest = {
  handle: string
  contractAddress: `0x${string}`
}

export type DecryptParameters = {
  instance: FhevmInstance
  requests: readonly DecryptRequest[]
  signer: JsonRpcSigner
  storage: GenericStringStorage
  chainId?: number | undefined
}

export type DecryptReturnType = Record<string, string | bigint | boolean>

/////////////////////////////////////////////////////////////////////////////////////////////////
// Main Action
/////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Decrypts FHEVM ciphertext handles using user's signature
 *
 * @param config - FHEVM configuration object
 * @param parameters - Decryption parameters
 * @returns Promise resolving to decrypted values mapped by handle
 *
 * @example
 * ```ts
 * const config = createFhevmConfig({ chains: [31337] })
 * const instance = await createInstance(config, { provider })
 *
 * const decrypted = await decrypt(config, {
 *   instance,
 *   requests: [
 *     { handle: '0x...', contractAddress: '0x...' },
 *     { handle: '0x...', contractAddress: '0x...' },
 *   ],
 *   signer: await provider.getSigner(),
 *   storage: config.storage,
 * })
 *
 * console.log(decrypted['0x...']) // 42 or true or "value"
 * ```
 */
export async function decrypt<config extends FhevmConfig>(
  config: config,
  parameters: DecryptParameters,
): Promise<DecryptReturnType> {
  const { instance, requests, signer, storage, chainId } = parameters

  if (!requests || requests.length === 0) {
    return {}
  }

  try {
    // Get unique contract addresses
    const uniqueAddresses = Array.from(
      new Set(requests.map((r) => r.contractAddress))
    ) as `0x${string}`[]

    // Load or create decryption signature
    const sig: FhevmDecryptionSignature | null =
      await FhevmDecryptionSignature.loadOrSign(
        instance,
        uniqueAddresses,
        signer,
        storage
      )

    if (!sig) {
      throw new Error(
        'SIGNATURE_ERROR: Failed to create or load decryption signature'
      )
    }

    // Validate signature is not expired
    if (!sig.isValid()) {
      // Clear expired signature from storage
      throw new Error(
        'SIGNATURE_EXPIRED: Decryption signature has expired. Please refresh and try again.'
      )
    }

    // Validate signature covers all requested contract addresses
    const hasAllAddresses = uniqueAddresses.every((addr) =>
      sig.contractAddresses.includes(addr)
    )
    if (!hasAllAddresses) {
      throw new Error(
        'SIGNATURE_MISMATCH: Cached signature does not cover all requested contracts. ' +
        'This can happen if you request decryption from different contract combinations. ' +
        'Clear signature storage and retry.'
      )
    }

    // Validate handle formats
    for (const req of requests) {
      if (!req.handle || typeof req.handle !== 'string') {
        throw new Error(`Invalid handle: must be a non-empty string`)
      }
      if (!req.handle.startsWith('0x')) {
        throw new Error(`Invalid handle format: ${req.handle} (must start with 0x)`)
      }
      // Validate hex characters (fhevm-expert recommendation)
      if (!/^0x[0-9a-fA-F]+$/.test(req.handle)) {
        throw new Error(`Invalid handle format: ${req.handle} (must be valid hex string)`)
      }
      // Length check (handles are typically 66 characters: 0x + 64 hex chars)
      if (req.handle.length !== 66) {
        console.warn(`Handle ${req.handle} has unexpected length ${req.handle.length}, expected 66`)
      }
    }

    // Call FHEVM userDecrypt with signature
    const mutableReqs = requests.map((r) => ({
      handle: r.handle,
      contractAddress: r.contractAddress,
    }))

    let results: Record<string, string | bigint | boolean> = {}

    try {
      results = await instance.userDecrypt(
        mutableReqs,
        sig.privateKey,
        sig.publicKey,
        sig.signature,
        sig.contractAddresses,
        sig.userAddress,
        sig.startTimestamp,
        sig.durationDays
      )
    } catch (e) {
      const err = e as unknown as { name?: string; message?: string }
      const code =
        err && typeof err === 'object' && 'name' in err
          ? (err as any).name
          : 'DECRYPT_ERROR'
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? (err as any).message
          : 'Decryption failed'

      throw new Error(`${code}: ${msg}`)
    }

    return results
  } catch (error) {
    const err = error as Error
    throw new Error(
      `FHEVM_DECRYPT_ERROR: ${err.message}`,
      { cause: error }
    )
  }
}

/**
 * Get or create a decryption signature for specified contract addresses
 *
 * @param config - FHEVM configuration object
 * @param parameters - Signature parameters
 * @returns Promise resolving to FhevmDecryptionSignature or null
 *
 * @example
 * ```ts
 * const signature = await getDecryptionSignature(config, {
 *   instance,
 *   contractAddresses: ['0x...', '0x...'],
 *   signer: await provider.getSigner(),
 *   storage: config.storage,
 * })
 * ```
 */
export async function getDecryptionSignature<config extends FhevmConfig>(
  config: config,
  parameters: {
    instance: FhevmInstance
    contractAddresses: `0x${string}`[]
    signer: JsonRpcSigner
    storage: GenericStringStorage
  },
): Promise<FhevmDecryptionSignature | null> {
  const { instance, contractAddresses, signer, storage } = parameters

  return FhevmDecryptionSignature.loadOrSign(
    instance,
    contractAddresses,
    signer,
    storage
  )
}
