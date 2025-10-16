/**
 * createInstance Action
 *
 * Pure function for creating FHEVM instances
 * Extracted from internal/fhevm.ts (lines 208-317)
 * Following Wagmi action pattern: (config, parameters) => Promise<Result>
 *
 * Reference: wagmi/packages/core/src/actions/readContract.ts
 */

import { isAddress, Eip1193Provider, JsonRpcProvider } from 'ethers'
import type { FhevmConfig } from '../createConfig.js'
import type { FhevmInstance } from '../fhevmTypes.js'
import { isFhevmWindowType, RelayerSDKLoader } from '../internal/RelayerSDKLoader.js'
import { publicKeyStorageGet, publicKeyStorageSet } from '../internal/PublicKeyStorage.js'
import type {
  FhevmInitSDKOptions,
  FhevmInitSDKType,
  FhevmLoadSDKType,
  FhevmWindowType,
} from '../internal/fhevmTypes.js'

/////////////////////////////////////////////////////////////////////////////////////////////////
// Types
/////////////////////////////////////////////////////////////////////////////////////////////////

export type CreateInstanceParameters = {
  provider: Eip1193Provider | string
  chainId?: number | undefined
  signal?: AbortSignal | undefined
}

export type CreateInstanceReturnType = FhevmInstance

export class FhevmAbortError extends Error {
  constructor(message = 'FHEVM operation was cancelled') {
    super(message)
    this.name = 'FhevmAbortError'
  }
}

export class FhevmError extends Error {
  code: string
  constructor(code: string, message?: string, options?: ErrorOptions) {
    super(message, options)
    this.code = code
    this.name = 'FhevmError'
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////////
// Helper Functions
/////////////////////////////////////////////////////////////////////////////////////////////////

function throwFhevmError(
  code: string,
  message?: string,
  cause?: unknown
): never {
  throw new FhevmError(code, message, cause ? { cause } : undefined)
}

function checkIsAddress(a: unknown): a is `0x${string}` {
  if (typeof a !== 'string') return false
  if (!isAddress(a)) return false
  return true
}

async function getChainId(providerOrUrl: Eip1193Provider | string): Promise<number> {
  if (typeof providerOrUrl === 'string') {
    const provider = new JsonRpcProvider(providerOrUrl)
    return Number((await provider.getNetwork()).chainId)
  }
  const chainId = await providerOrUrl.request({ method: 'eth_chainId' })
  return Number.parseInt(chainId as string, 16)
}

async function getWeb3Client(rpcUrl: string) {
  const rpc = new JsonRpcProvider(rpcUrl)
  try {
    const version = await rpc.send('web3_clientVersion', [])
    return version
  } catch (e) {
    throwFhevmError(
      'WEB3_CLIENTVERSION_ERROR',
      `The URL ${rpcUrl} is not a Web3 node or is not reachable. Please check the endpoint.`,
      e
    )
  } finally {
    rpc.destroy()
  }
}

async function tryFetchFHEVMHardhatNodeRelayerMetadata(rpcUrl: string): Promise<
  | {
      ACLAddress: `0x${string}`
      InputVerifierAddress: `0x${string}`
      KMSVerifierAddress: `0x${string}`
    }
  | undefined
> {
  const version = await getWeb3Client(rpcUrl)
  if (
    typeof version !== 'string' ||
    !version.toLowerCase().includes('hardhat')
  ) {
    return undefined
  }
  try {
    const metadata = await getFHEVMRelayerMetadata(rpcUrl)
    if (!metadata || typeof metadata !== 'object') return undefined
    if (
      !(
        'ACLAddress' in metadata &&
        typeof metadata.ACLAddress === 'string' &&
        metadata.ACLAddress.startsWith('0x')
      )
    ) {
      return undefined
    }
    if (
      !(
        'InputVerifierAddress' in metadata &&
        typeof metadata.InputVerifierAddress === 'string' &&
        metadata.InputVerifierAddress.startsWith('0x')
      )
    ) {
      return undefined
    }
    if (
      !(
        'KMSVerifierAddress' in metadata &&
        typeof metadata.KMSVerifierAddress === 'string' &&
        metadata.KMSVerifierAddress.startsWith('0x')
      )
    ) {
      return undefined
    }
    return metadata
  } catch {
    return undefined
  }
}

async function getFHEVMRelayerMetadata(rpcUrl: string) {
  const rpc = new JsonRpcProvider(rpcUrl)
  try {
    const version = await rpc.send('fhevm_relayer_metadata', [])
    return version
  } catch (e) {
    throwFhevmError(
      'FHEVM_RELAYER_METADATA_ERROR',
      `The URL ${rpcUrl} is not a FHEVM Hardhat node or is not reachable. Please check the endpoint.`,
      e
    )
  } finally {
    rpc.destroy()
  }
}

type MockResolveResult = { isMock: true; chainId: number; rpcUrl: string }
type GenericResolveResult = { isMock: false; chainId: number; rpcUrl?: string }
type ResolveResult = MockResolveResult | GenericResolveResult

async function resolve(
  providerOrUrl: Eip1193Provider | string,
  mockChains?: Record<number, string>
): Promise<ResolveResult> {
  const chainId = await getChainId(providerOrUrl)
  let rpcUrl = typeof providerOrUrl === 'string' ? providerOrUrl : undefined

  const _mockChains: Record<number, string> = {
    31337: 'http://localhost:8545',
    ...(mockChains ?? {}),
  }

  if (Object.hasOwn(_mockChains, chainId)) {
    if (!rpcUrl) {
      rpcUrl = _mockChains[chainId]
    }
    return { isMock: true, chainId, rpcUrl }
  }

  return { isMock: false, chainId, rpcUrl }
}

// Environment-safe window access helpers
const isFhevmInitialized = (): boolean => {
  if (typeof window === 'undefined') return false
  if (!isFhevmWindowType(window, console.log)) return false
  return (window as unknown as FhevmWindowType).relayerSDK.__initialized__ === true
}

const fhevmLoadSDK: FhevmLoadSDKType = () => {
  const loader = new RelayerSDKLoader({ trace: console.log })
  return loader.load()
}

const fhevmInitSDK: FhevmInitSDKType = async (options?: FhevmInitSDKOptions) => {
  if (typeof window === 'undefined') {
    throw new Error('window is not available (SSR environment)')
  }
  if (!isFhevmWindowType(window, console.log)) {
    throw new Error('window.relayerSDK is not available')
  }
  const result = await (window as unknown as FhevmWindowType).relayerSDK.initSDK(options)
  ;(window as unknown as FhevmWindowType).relayerSDK.__initialized__ = result
  if (!result) {
    throw new Error('window.relayerSDK.initSDK failed.')
  }
  return true
}

/////////////////////////////////////////////////////////////////////////////////////////////////
// Main Action
/////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates an FHEVM instance for encryption and decryption operations
 *
 * @param config - FHEVM configuration object
 * @param parameters - Instance creation parameters
 * @returns Promise resolving to FhevmInstance
 *
 * @example
 * ```ts
 * const config = createFhevmConfig({ chains: [31337] })
 * const instance = await createInstance(config, {
 *   provider: window.ethereum,
 *   chainId: 31337,
 * })
 * ```
 */
export async function createInstance<config extends FhevmConfig>(
  config: config,
  parameters: CreateInstanceParameters,
): Promise<CreateInstanceReturnType> {
  const { provider: providerOrUrl, chainId: providedChainId, signal } = parameters

  const throwIfAborted = () => {
    if (signal?.aborted) throw new FhevmAbortError()
  }

  // Resolve chainId and check if mock
  const { isMock, rpcUrl, chainId } = await resolve(
    providerOrUrl,
    config.mockChains
  )

  // Validate chainId is configured
  const isConfigured =
    config.chains.includes(chainId as any) ||
    (config.mockChains && Object.hasOwn(config.mockChains, chainId))

  if (!isConfigured) {
    throw new FhevmError(
      'CHAIN_NOT_CONFIGURED',
      `Chain ${chainId} is not configured in FHEVM config. ` +
      `Configured chains: [${config.chains.join(', ')}]` +
      `${config.mockChains ? `, mock chains: [${Object.keys(config.mockChains).join(', ')}]` : ''}`
    )
  }

  // Update config state
  config.setState((state) => ({
    ...state,
    chainId,
    status: 'loading',
    error: null,
  }))

  try {
    // Check if instance already exists in cache
    const cachedInstance = config._internal.instances.get(chainId)
    if (cachedInstance) {
      config.setState((state) => ({
        ...state,
        instance: cachedInstance,
        status: 'ready',
      }))
      return cachedInstance
    }

    if (isMock) {
      // Check if it's a FHEVM Hardhat Node
      const fhevmRelayerMetadata = await tryFetchFHEVMHardhatNodeRelayerMetadata(rpcUrl)

      if (fhevmRelayerMetadata) {
        throwIfAborted()

        // Dynamic import to avoid including fhevm-mock in production bundle
        const fhevmMock = await import('../internal/mock/fhevmMock.js')
        const mockInstance = await fhevmMock.fhevmMockCreateInstance({
          rpcUrl,
          chainId,
          metadata: fhevmRelayerMetadata,
        })

        throwIfAborted()

        // Cache and update state
        config._internal.instances.set(chainId, mockInstance)
        config.setState((state) => ({
          ...state,
          instance: mockInstance,
          status: 'ready',
        }))

        return mockInstance
      }
    }

    throwIfAborted()

    // Browser environment check for production instance
    if (typeof window === 'undefined') {
      throw new FhevmError(
        'SSR_NOT_SUPPORTED',
        'Production FHEVM instances require browser environment (window.relayerSDK). Use mock chains for SSR.'
      )
    }

    if (!isFhevmWindowType(window, console.log)) {
      // Load SDK
      await fhevmLoadSDK()
      throwIfAborted()
    }

    if (!isFhevmInitialized()) {
      // Initialize SDK
      await fhevmInitSDK()
      throwIfAborted()
    }

    const relayerSDK = (window as unknown as FhevmWindowType).relayerSDK

    // TODO: Add multi-chain support - currently hardcoded to Sepolia
    // This should be refactored to support dynamic chain configuration
    // For now, we use Sepolia config as the default, which works for Sepolia (11155111)
    // Future improvement: Add config.getNetworkConfig(chainId) method
    const networkConfig = relayerSDK.SepoliaConfig

    const aclAddress = networkConfig.aclContractAddress
    if (!checkIsAddress(aclAddress)) {
      throw new FhevmError(
        'INVALID_ACL_ADDRESS',
        `Invalid ACL contract address: ${aclAddress} for chain ${chainId}`
      )
    }

    const pub = await publicKeyStorageGet(aclAddress)
    throwIfAborted()

    const instanceConfig = {
      ...networkConfig,
      network: providerOrUrl,
      publicKey: pub.publicKey,
      publicParams: pub.publicParams,
    }

    const instance = await relayerSDK.createInstance(instanceConfig)

    // Save public key even if aborted
    await publicKeyStorageSet(
      aclAddress,
      instance.getPublicKey(),
      instance.getPublicParams(2048)
    )

    throwIfAborted()

    // Cache and update state
    config._internal.instances.set(chainId, instance)
    config.setState((state) => ({
      ...state,
      instance,
      status: 'ready',
    }))

    return instance
  } catch (error) {
    // Update state with error
    config.setState((state) => ({
      ...state,
      instance: null,
      status: 'error',
      error: error as Error,
    }))
    throw error
  }
}
