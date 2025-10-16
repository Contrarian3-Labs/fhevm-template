/**
 * hydrate - SSR Hydration Support
 *
 * Handles hydration of FHEVM config state for SSR environments
 * Following Wagmi's hydrate pattern
 *
 * Reference: wagmi/packages/core/src/hydrate.ts
 */

import type { FhevmConfig, State } from './createConfig.js'

export type HydrateParameters = {
  initialState?: State | undefined
  autoConnect?: boolean | undefined
}

/**
 * Hydrates FHEVM config with initial state for SSR
 *
 * @param config - FHEVM configuration object
 * @param parameters - Hydration parameters
 * @returns Object with onMount callback for component lifecycle
 *
 * @example
 * ```ts
 * const config = createFhevmConfig({ chains: [31337], ssr: true })
 * const { onMount } = hydrate(config, { initialState })
 *
 * // In React: useEffect(() => { onMount() }, [])
 * // In Vue: onMounted(() => { onMount() })
 * ```
 */
export function hydrate(config: FhevmConfig, parameters: HydrateParameters) {
  const { initialState, autoConnect } = parameters

  // Hydrate initial state if provided and not yet hydrated
  if (initialState && !config._internal.store.persist.hasHydrated()) {
    config.setState({
      ...initialState,
      // Validate chainId is configured
      chainId:
        config.chains.includes(initialState.chainId as any) ||
        (config.mockChains && Object.hasOwn(config.mockChains, initialState.chainId))
          ? initialState.chainId
          : config.chains[0],
      // Don't auto-connect unless explicitly requested
      status: autoConnect ? 'loading' : 'idle',
    })
  }

  return {
    async onMount() {
      // For SSR: rehydrate persisted state
      if (config._internal.ssr) {
        await config._internal.store.persist.rehydrate()
      }

      // Auto-connect if enabled
      if (autoConnect && config.autoConnect) {
        // TODO: Implement auto-connect logic
        // This would attempt to create an instance automatically
        // Similar to Wagmi's reconnect behavior
        console.log('[hydrate] Auto-connect not yet implemented')
      }
    },
  }
}
