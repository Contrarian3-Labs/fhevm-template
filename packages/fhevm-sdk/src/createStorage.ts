import type { PartializedState } from './createConfig.js'
import type { Compute } from './types/utils.js'

/////////////////////////////////////////////////////////////////////////////////////////////////
// Storage Types
/////////////////////////////////////////////////////////////////////////////////////////////////

// key-values for loose autocomplete and typing
export type StorageItemMap = {
  state: PartializedState
  'decryption-signature': string
  'public-key': string
}

export type Storage<
  itemMap extends Record<string, unknown> = Record<string, unknown>,
  ///
  storageItemMap extends StorageItemMap = StorageItemMap & itemMap,
> = {
  key: string
  getItem<
    key extends keyof storageItemMap,
    value extends storageItemMap[key],
    defaultValue extends value | null | undefined,
  >(
    key: key,
    defaultValue?: defaultValue | undefined,
  ):
    | (defaultValue extends null ? value | null : value)
    | Promise<defaultValue extends null ? value | null : value>
  setItem<
    key extends keyof storageItemMap,
    value extends storageItemMap[key] | null,
  >(key: key, value: value): void | Promise<void>
  removeItem(key: keyof storageItemMap): void | Promise<void>
}

export type BaseStorage = {
  getItem(
    key: string,
  ): string | null | undefined | Promise<string | null | undefined>
  setItem(key: string, value: string): void | Promise<void>
  removeItem(key: string): void | Promise<void>
}

export type CreateStorageParameters = {
  deserialize?: (<type>(value: string) => type | unknown) | undefined
  key?: string | undefined
  serialize?: (<type>(value: type | any) => string) | undefined
  storage?: Compute<BaseStorage> | undefined
}

/////////////////////////////////////////////////////////////////////////////////////////////////
// Create Storage
/////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a storage abstraction following Wagmi's pattern
 * Reference: wagmi/packages/core/src/createStorage.ts lines 50-84
 */
export function createStorage<
  itemMap extends Record<string, unknown> = Record<string, unknown>,
  storageItemMap extends StorageItemMap = StorageItemMap & itemMap,
>(parameters: CreateStorageParameters): Compute<Storage<storageItemMap>> {
  const {
    deserialize = defaultDeserialize,
    key: prefix = 'fhevm',
    serialize = defaultSerialize,
    storage = noopStorage,
  } = parameters

  function unwrap<type>(value: type): type | Promise<type> {
    if (value instanceof Promise) return value.then((x) => x).catch(() => null)
    return value
  }

  return {
    ...storage,
    key: prefix,
    async getItem(key, defaultValue) {
      const value = storage.getItem(`${prefix}.${key as string}`)
      const unwrapped = await unwrap(value)
      if (unwrapped) return deserialize(unwrapped) ?? null
      return (defaultValue ?? null) as any
    },
    async setItem(key, value) {
      const storageKey = `${prefix}.${key as string}`
      if (value === null) await unwrap(storage.removeItem(storageKey))
      else await unwrap(storage.setItem(storageKey, serialize(value)))
    },
    async removeItem(key) {
      await unwrap(storage.removeItem(`${prefix}.${key as string}`))
    },
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////////
// Default Implementations
/////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * No-op storage for SSR or environments without storage
 * Reference: wagmi/packages/core/src/createStorage.ts lines 86-90
 */
export const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
} satisfies BaseStorage

/**
 * Get default storage (localStorage in browser, noopStorage in Node.js)
 * Reference: wagmi/packages/core/src/createStorage.ts lines 92-113
 */
export function getDefaultStorage(): BaseStorage {
  const storage = (() => {
    // Check for window and localStorage (browser environment)
    if (typeof window !== 'undefined' && window.localStorage)
      return window.localStorage
    return noopStorage
  })()

  return {
    getItem(key) {
      return storage.getItem(key)
    },
    removeItem(key) {
      storage.removeItem(key)
    },
    setItem(key, value) {
      try {
        storage.setItem(key, value)
        // silence errors by default (QuotaExceededError, SecurityError, etc.)
      } catch {}
    },
  } satisfies BaseStorage
}

/////////////////////////////////////////////////////////////////////////////////////////////////
// Serialization Helpers
/////////////////////////////////////////////////////////////////////////////////////////////////

function defaultSerialize<type>(value: type): string {
  return JSON.stringify(value, (_, v) => {
    // Handle BigInt serialization
    if (typeof v === 'bigint') return `bigint::${v.toString()}`
    // Handle Uint8Array serialization
    if (v instanceof Uint8Array) return `uint8array::${Array.from(v).join(',')}`
    return v
  })
}

function defaultDeserialize<type>(value: string): type | unknown {
  return JSON.parse(value, (_, v) => {
    // Handle BigInt deserialization
    if (typeof v === 'string' && v.startsWith('bigint::')) {
      return BigInt(v.slice(8))
    }
    // Handle Uint8Array deserialization
    if (typeof v === 'string' && v.startsWith('uint8array::')) {
      const nums = v.slice(12).split(',').map(Number)
      return new Uint8Array(nums)
    }
    return v
  })
}
