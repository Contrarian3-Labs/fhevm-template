/**
 * Browser Polyfills for Node.js APIs
 *
 * Vite doesn't automatically polyfill Node.js APIs like Next.js does.
 * This file provides the Buffer global that the FHEVM SDK needs.
 */

import { Buffer } from 'buffer'

// Make Buffer available globally for the SDK
window.Buffer = Buffer
globalThis.Buffer = Buffer
