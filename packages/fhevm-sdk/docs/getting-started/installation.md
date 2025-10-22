---
description: Install the FHEVM SDK and configure peer dependencies for your framework.
---

# Installation

## Package Installation

Install the FHEVM SDK using your preferred package manager:

{% tabs %}
{% tab title="npm" %}
```bash
npm install @fhevm-sdk
```
{% endtab %}

{% tab title="pnpm" %}
```bash
pnpm add @fhevm-sdk
```
{% endtab %}

{% tab title="yarn" %}
```bash
yarn add @fhevm-sdk
```
{% endtab %}
{% endtabs %}

## Peer Dependencies

The FHEVM SDK requires several peer dependencies depending on your use case:

### Required for All Users

```bash
npm install ethers@^6.13.4
```

The SDK uses **ethers v6** for Ethereum provider interactions and EIP-712 signature generation.

### For React Applications

```bash
npm install react@^18.0.0
# or
npm install react@^19.0.0
```

React 18 and 19 are both fully supported.

### For Vue Applications

```bash
npm install vue@^3.0.0
```

Vue 3 with Composition API is required.

### Optional: Mock Chain Support

For local development with Hardhat or Ganache:

```bash
npm install @fhevm/mock-utils@^0.1.0
```

This enables mock FHEVM chains for faster local testing without real cryptographic operations.

## Complete Installation Examples

### React Project

{% tabs %}
{% tab title="npm" %}
```bash
npm install @fhevm-sdk ethers@^6.13.4 react@^18.0.0
```
{% endtab %}

{% tab title="pnpm" %}
```bash
pnpm add @fhevm-sdk ethers@^6.13.4 react@^18.0.0
```
{% endtab %}

{% tab title="yarn" %}
```bash
yarn add @fhevm-sdk ethers@^6.13.4 react@^18.0.0
```
{% endtab %}
{% endtabs %}

### Vue Project

{% tabs %}
{% tab title="npm" %}
```bash
npm install @fhevm-sdk ethers@^6.13.4 vue@^3.0.0
```
{% endtab %}

{% tab title="pnpm" %}
```bash
pnpm add @fhevm-sdk ethers@^6.13.4 vue@^3.0.0
```
{% endtab %}

{% tab title="yarn" %}
```bash
yarn add @fhevm-sdk ethers@^6.13.4 vue@^3.0.0
```
{% endtab %}
{% endtabs %}

### Vanilla JavaScript / Node.js

{% tabs %}
{% tab title="npm" %}
```bash
npm install @fhevm-sdk ethers@^6.13.4
```
{% endtab %}

{% tab title="pnpm" %}
```bash
pnpm add @fhevm-sdk ethers@^6.13.4
```
{% endtab %}

{% tab title="yarn" %}
```bash
yarn add @fhevm-sdk ethers@^6.13.4
```
{% endtab %}
{% endtabs %}

## Version Compatibility

| FHEVM SDK | React | Vue | ethers | Node.js |
|-----------|-------|-----|--------|---------|
| 0.1.x     | 18, 19 | 3.x | 6.13+ | 20+ |

{% hint style="info" %}
**Node.js Requirement**: Node.js 20 or higher is required due to modern JavaScript features used in the SDK.
{% endhint %}

## TypeScript Configuration

The SDK is written in TypeScript and includes full type definitions. For the best experience, ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  }
}
```

{% hint style="warning" %}
**Module Resolution**: Use `"moduleResolution": "bundler"` (recommended) or `"node16"` to properly resolve subpath exports like `@fhevm-sdk/core` and `@fhevm-sdk/react`.
{% endhint %}

## Verify Installation

After installation, verify that the SDK is correctly installed:

```typescript
import { createFhevmConfig } from '@fhevm-sdk/core'

const config = createFhevmConfig({
  chains: [31337]
})

console.log('FHEVM SDK installed successfully!')
```

If this code runs without errors, your installation is complete.

## Troubleshooting

### Peer Dependency Warnings

If you see peer dependency warnings during installation, ensure you have the correct versions installed:

```bash
npm ls ethers react vue
```

### Module Not Found Errors

If you encounter "Module not found" errors:

1. **Check TypeScript config**: Ensure `moduleResolution` is set correctly
2. **Restart TypeScript server**: In VS Code, run "TypeScript: Restart TS Server"
3. **Clear cache**: Delete `node_modules` and reinstall

```bash
rm -rf node_modules package-lock.json
npm install
```

### React 19 Peer Dependency Warnings

Some packages may show warnings about React 19 compatibility. You can safely suppress these warnings by creating a `.npmrc` file:

```ini
# .npmrc
strict-peer-dependencies=false
auto-install-peers=true
```

{% hint style="success" %}
**Installation Complete!** Proceed to the [Quick Start guide](quick-start-react.md) to build your first encrypted dApp.
{% endhint %}

## Next Steps

- [Quick Start (React)](quick-start-react.md) - Build a React app with FHEVM
- [Quick Start (Vue)](quick-start-vue.md) - Build a Vue app with FHEVM
- [Quick Start (Vanilla JS)](quick-start-vanilla.md) - Use core actions directly
- [Architecture Overview](architecture-overview.md) - Understand the SDK design
