import type { Eip1193Provider } from 'ethers'
import { persist, subscribeWithSelector } from 'zustand/middleware'
import { createStore, type Mutate, type StoreApi } from 'zustand/vanilla'

import type { FhevmInstance } from './fhevmTypes.js'
import {
  createStorage,
  getDefaultStorage,
  type Storage,
} from './createStorage.js'
import type { Compute } from './types/utils.js'

/////////////////////////////////////////////////////////////////////////////////////////////////
// Create Config
/////////////////////////////////////////////////////////////////////////////////////////////////

export function createFhevmConfig<
  const chains extends readonly [number, ...number[]],
>(
  parameters: CreateFhevmConfigParameters<chains>,
): FhevmConfig<chains> {
  const {
    storage = createStorage({
      storage: getDefaultStorage(),
    }),
    ssr = false,
    autoConnect = true,
    ...rest
  } = parameters

  /////////////////////////////////////////////////////////////////////////////////////////////////
  // Set up chains and instances
  /////////////////////////////////////////////////////////////////////////////////////////////////

  const chainsStore = createStore(() => rest.chains)

  // Instance cache (similar to Wagmi's clients Map, createConfig.ts line 117)
  const instances = new Map<number, FhevmInstance>()

  function getInstance<chainId extends chains[number]>(
    config: { chainId?: chainId | chains[number] | undefined } = {},
  ): FhevmInstance | null {
    const chainId = config.chainId ?? store.getState().chainId
    return instances.get(chainId) ?? null
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////
  // Create store
  /////////////////////////////////////////////////////////////////////////////////////////////////

  function getInitialState(): State<chains> {
    return {
      chainId: chainsStore.getState()[0],
      status: 'idle',
      instance: null,
      error: null,
    }
  }

  // Create Zustand store (Wagmi pattern from createConfig.ts lines 205-263)
  const store = createStore(
    subscribeWithSelector(
      // only use persist middleware if storage exists
      storage
        ? persist(getInitialState, {
            name: 'fhevm.store',
            version: 1,
            partialize(state) {
              // Only persist "critical" store properties to preserve storage size
              return {
                chainId: state.chainId,
                // Don't persist instance (too large and not serializable)
                // Don't persist error (not useful to persist)
                // Don't persist status (should always start fresh)
              } satisfies PartializedState<chains>
            },
            merge(persistedState, currentState) {
              // Validate persisted chainId
              const chainId = validatePersistedChainId(
                persistedState,
                currentState.chainId,
              )
              return {
                ...currentState,
                ...(persistedState as object),
                chainId,
                // Always reset these on hydration
                instance: null,
                error: null,
                status: 'idle' as const,
              }
            },
            skipHydration: ssr,
            storage: storage as Storage<Record<string, unknown>>,
          })
        : getInitialState,
    ),
  )

  function validatePersistedChainId(
    persistedState: unknown,
    defaultChainId: number,
  ): number {
    return persistedState &&
      typeof persistedState === 'object' &&
      'chainId' in persistedState &&
      typeof persistedState.chainId === 'number' &&
      chainsStore.getState().some((x) => x === persistedState.chainId)
      ? persistedState.chainId
      : defaultChainId
  }

  return {
    get chains() {
      return chainsStore.getState() as chains
    },
    get state() {
      return store.getState()
    },
    setState(value) {
      let newState: State<chains>
      if (typeof value === 'function') newState = value(store.getState())
      else newState = value

      // Reset state if it got set to something not matching the base state
      const initialState = getInitialState()
      if (typeof newState !== 'object') newState = initialState
      const isCorrupt = Object.keys(initialState).some((x) => !(x in newState))
      if (isCorrupt) newState = initialState

      store.setState(newState, true)
    },
    subscribe(selector, listener, options) {
      return store.subscribe(
        selector as unknown as (state: State<chains>) => any,
        listener,
        options,
      )
    },
    getInstance,
    storage,
    _internal: {
      store,
      instances,
      ssr: Boolean(ssr),
      chains: {
        setState(value) {
          const nextChains = (
            typeof value === 'function' ? value(chainsStore.getState()) : value
          ) as chains
          if (nextChains.length === 0) return
          return chainsStore.setState(nextChains, true)
        },
        subscribe(listener) {
          return chainsStore.subscribe(listener)
        },
      },
    },
    autoConnect,
    mockChains: rest.mockChains,
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////////
// Types
/////////////////////////////////////////////////////////////////////////////////////////////////

export type CreateFhevmConfigParameters<
  chains extends readonly [number, ...number[]] = readonly [
    number,
    ...number[],
  ],
> = Compute<{
  chains: chains
  mockChains?: Record<number, string> | undefined
  storage?: Storage | null | undefined
  ssr?: boolean | undefined
  autoConnect?: boolean | undefined
}>

export type FhevmConfig<
  chains extends readonly [number, ...number[]] = readonly [
    number,
    ...number[],
  ],
> = {
  readonly chains: chains
  readonly storage: Storage | null
  readonly mockChains: Record<number, string> | undefined
  readonly autoConnect: boolean

  readonly state: State<chains>
  setState(
    value: State<chains> | ((state: State<chains>) => State<chains>),
  ): void
  subscribe<state>(
    selector: (state: State<chains>) => state,
    listener: (state: state, previousState: state) => void,
    options?:
      | {
          emitImmediately?: boolean | undefined
          equalityFn?: ((a: state, b: state) => boolean) | undefined
        }
      | undefined,
  ): () => void

  getInstance<chainId extends chains[number]>(parameters?: {
    chainId?: chainId | chains[number] | undefined
  }): FhevmInstance | null

  /**
   * Not part of versioned API, proceed with caution.
   * @internal
   */
  _internal: Internal<chains>
}

type Internal<
  chains extends readonly [number, ...number[]] = readonly [
    number,
    ...number[],
  ],
> = {
  readonly store: Mutate<StoreApi<any>, [['zustand/persist', any]]>
  readonly instances: Map<number, FhevmInstance>
  readonly ssr: boolean
  chains: {
    setState(
      value:
        | readonly [number, ...number[]]
        | ((state: readonly [number, ...number[]]) => readonly [number, ...number[]]),
    ): void
    subscribe(
      listener: (
        state: readonly [number, ...number[]],
        prevState: readonly [number, ...number[]],
      ) => void,
    ): () => void
  }
}

export type State<
  chains extends readonly [number, ...number[]] = readonly [
    number,
    ...number[],
  ],
> = {
  chainId: chains[number]
  instance: FhevmInstance | null
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: Error | null
}

export type PartializedState<
  chains extends readonly [number, ...number[]] = readonly [
    number,
    ...number[],
  ],
> = Compute<{
  chainId?: chains[number] | undefined
}>
