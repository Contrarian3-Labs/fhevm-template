# Table of Contents

* [Overview](README.md)

## Getting Started

* [Installation](getting-started/installation.md)
* [Quick Start (React)](getting-started/quick-start-react.md)
* [Quick Start (Vue)](getting-started/quick-start-vue.md)
* [Quick Start (Vanilla JS)](getting-started/quick-start-vanilla.md)
* [Architecture Overview](getting-started/architecture-overview.md)

## Core Concepts

* [Overview](core-concepts/README.md)
* [Configuration](core-concepts/configuration.md)
* [FHEVM Instance](core-concepts/fhevm-instance.md)
* [Encryption](core-concepts/encryption.md)
* [Decryption](core-concepts/decryption.md)
* [Storage](core-concepts/storage.md)
* [Error Handling](core-concepts/error-handling.md)
* [TypeScript Types](core-concepts/typescript-types.md)

## API Reference

* [Overview](api-reference/README.md)

### Core

* [Overview](api-reference/core/README.md)
* [createFhevmConfig()](api-reference/core/createFhevmConfig.md)
* [createStorage()](api-reference/core/createStorage.md)
* [hydrate()](api-reference/core/hydrate.md)
* [Types](api-reference/core/types.md)

### Actions

* [Overview](api-reference/actions/README.md)
* [createInstance()](api-reference/actions/createInstance.md)
* [encrypt()](api-reference/actions/encrypt.md)
* [encryptWith()](api-reference/actions/encryptWith.md)
* [decrypt()](api-reference/actions/decrypt.md)
* [getDecryptionSignature()](api-reference/actions/getDecryptionSignature.md)
* [publicDecrypt()](api-reference/actions/publicDecrypt.md)
* [Helper Functions](api-reference/actions/helpers.md)

### React

* [Overview](api-reference/react/README.md)
* [FhevmProvider](api-reference/react/FhevmProvider.md)
* [useConfig()](api-reference/react/useConfig.md)
* [useFhevmInstance()](api-reference/react/useFhevmInstance.md)
* [useEncrypt()](api-reference/react/useEncrypt.md)
* [useDecrypt()](api-reference/react/useDecrypt.md)
* [usePublicDecrypt()](api-reference/react/usePublicDecrypt.md)
* [hydrate()](api-reference/react/hydrate.md)
* [Legacy Hooks (Deprecated)](api-reference/react/legacy-hooks.md)

### Vue

* [Overview](api-reference/vue/README.md)
* [FhevmPlugin](api-reference/vue/FhevmPlugin.md)
* [useConfig()](api-reference/vue/useConfig.md)
* [useFhevmInstance()](api-reference/vue/useFhevmInstance.md)
* [useEncrypt()](api-reference/vue/useEncrypt.md)
* [useDecrypt()](api-reference/vue/useDecrypt.md)
* [usePublicDecrypt()](api-reference/vue/usePublicDecrypt.md)
* [useInMemoryStorage()](api-reference/vue/useInMemoryStorage.md)

### Types

* [Overview](api-reference/types/README.md)
* [Config Types](api-reference/types/config-types.md)
* [Instance Types](api-reference/types/instance-types.md)
* [Encryption Types](api-reference/types/encryption-types.md)
* [Decryption Types](api-reference/types/decryption-types.md)
* [Storage Types](api-reference/types/storage-types.md)
* [Utility Types](api-reference/types/utility-types.md)

## Framework Guides

* [Overview](framework-guides/README.md)

### React

* [Overview](framework-guides/react/README.md)
* [Setup](framework-guides/react/setup.md)
* [Basic Usage](framework-guides/react/basic-usage.md)
* [SSR with Next.js](framework-guides/react/ssr-nextjs.md)
* [State Management](framework-guides/react/state-management.md)
* [Testing](framework-guides/react/testing.md)

### Vue

* [Overview](framework-guides/vue/README.md)
* [Setup](framework-guides/vue/setup.md)
* [Basic Usage](framework-guides/vue/basic-usage.md)
* [SSR with Nuxt](framework-guides/vue/ssr-nuxt.md)
* [Composition API Patterns](framework-guides/vue/composition-api.md)
* [Testing](framework-guides/vue/testing.md)

### Vanilla JavaScript

* [Overview](framework-guides/vanilla/README.md)
* [Basic Usage](framework-guides/vanilla/basic-usage.md)
* [State Subscriptions](framework-guides/vanilla/state-subscriptions.md)
* [Node.js Usage](framework-guides/vanilla/nodejs.md)

## Examples

* [Overview](examples/README.md)

### Basic

* [Counter App](examples/basic/counter-app.md)
* [Encrypt/Decrypt Flow](examples/basic/encrypt-decrypt-flow.md)
* [Signature Caching](examples/basic/signature-caching.md)

### Intermediate

* [Encrypted ERC20 Token](examples/intermediate/encrypted-erc20.md)
* [Multi-Chain Support](examples/intermediate/multi-chain.md)
* [Batch Operations](examples/intermediate/batch-operations.md)

### Advanced

* [Custom Storage](examples/advanced/custom-storage.md)
* [Error Recovery](examples/advanced/error-recovery.md)
* [Performance Optimization](examples/advanced/performance-optimization.md)
* [CLI Decrypt Tool](examples/advanced/cli-decrypt.md)

### Full Applications

* [Confidential Voting dApp](examples/full-applications/confidential-voting.md)
* [Private Auction](examples/full-applications/private-auction.md)

## Migration Guides

* [Overview](migration-guides/README.md)
* [From Legacy Hooks](migration-guides/from-legacy-hooks.md)
* [Breaking Changes](migration-guides/breaking-changes.md)
* [Upgrade Checklist](migration-guides/upgrade-checklist.md)

## Guides

* [Overview](guides/README.md)
* [Choosing Storage](guides/choosing-storage.md)
* [Security Best Practices](guides/security-best-practices.md)
* [Performance Tips](guides/performance-tips.md)
* [Debugging](guides/debugging.md)
* [Testing Strategies](guides/testing-strategies.md)
* [Deployment](guides/deployment.md)

## Troubleshooting

* [Overview](troubleshooting/README.md)
* [Common Errors](troubleshooting/common-errors.md)
* [Signature Issues](troubleshooting/signature-issues.md)
* [Instance Creation Failures](troubleshooting/instance-creation-failures.md)
* [Encryption Errors](troubleshooting/encryption-errors.md)
* [Framework-Specific Issues](troubleshooting/framework-specific-issues.md)

## Advanced Topics

* [Overview](advanced/README.md)
* [Architecture Deep Dive](advanced/architecture-deep-dive.md)
* [Wagmi Comparison](advanced/wagmi-comparison.md)
* [Zustand Internals](advanced/zustand-internals.md)
* [Custom Actions](advanced/custom-actions.md)
* [Contributing](advanced/contributing.md)

## Reference

* [Overview](reference/README.md)
* [Encryption Types](reference/encryption-types.md)
* [Error Codes](reference/error-codes.md)
* [Storage Interface](reference/storage-interface.md)
* [EIP-712 Signature](reference/eip-712-signature.md)
* [Changelog](reference/changelog.md)
* [FAQ](reference/faq.md)
