---
description: Build a confidential ERC20 token with encrypted balances.
---

# Encrypted ERC20 Example

Build a privacy-preserving ERC20 token where balances and transfers are encrypted. Only token holders can decrypt their own balance.

## Overview

This example demonstrates:
- Encrypted token balances (invisible to public)
- Encrypted transfers between accounts
- Private balance queries (requires signature)
- Standard ERC20 interface with FHEVM

**Use Cases:**
- Privacy coins
- Confidential payroll
- Private rewards programs
- Anonymous voting tokens

## Smart Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhenixprotocol/contracts/FHE.sol";
import "@fhenixprotocol/contracts/access/Permissioned.sol";

contract EncryptedERC20 is Permissioned {
    string public name = "Encrypted Token";
    string public symbol = "ETKN";
    uint8 public decimals = 18;

    // Encrypted balances
    mapping(address => euint64) private balances;

    // Total supply (encrypted)
    euint64 private totalSupply;

    // Events
    event Transfer(address indexed from, address indexed to);
    event Mint(address indexed to);

    constructor() {
        // Mint 1,000,000 tokens to deployer
        euint64 initialSupply = FHE.asEuint64(1000000 * 10**18);
        balances[msg.sender] = initialSupply;
        totalSupply = initialSupply;
    }

    // Transfer encrypted amount
    function transfer(
        address to, 
        bytes calldata encryptedAmount
    ) external returns (bool) {
        euint64 amount = FHE.asEuint64(encryptedAmount);
        
        // Check sufficient balance (encrypted comparison)
        ebool hasSufficientBalance = FHE.lte(amount, balances[msg.sender]);
        
        // Revert if insufficient (reveals failure, not amount)
        FHE.req(hasSufficientBalance);

        // Perform encrypted transfer
        balances[msg.sender] = FHE.sub(balances[msg.sender], amount);
        balances[to] = FHE.add(balances[to], amount);

        emit Transfer(msg.sender, to);
        return true;
    }

    // Get encrypted balance (only owner can decrypt)
    function balanceOf(
        address account,
        Permission calldata permission
    ) 
        external 
        view 
        onlyPermitted(permission, account)
        returns (bytes memory) 
    {
        return FHE.sealoutput(balances[account], permission.publicKey);
    }

    // Get sealed encrypted balance
    function balanceOfSealed(address account) 
        external 
        view 
        returns (string memory) 
    {
        require(
            msg.sender == account, 
            "Can only view own balance"
        );
        return FHE.sealoutputTyped(balances[account], bytes32(0));
    }

    // Mint tokens (owner only in real implementation)
    function mint(
        address to,
        bytes calldata encryptedAmount
    ) external {
        euint64 amount = FHE.asEuint64(encryptedAmount);
        balances[to] = FHE.add(balances[to], amount);
        totalSupply = FHE.add(totalSupply, amount);
        emit Mint(to);
    }
}
```

## React Component

```typescript
// src/components/EncryptedERC20.tsx
import { useState, useEffect } from 'react'
import { useFhevm } from '@fhevm-sdk/react'
import { encrypt, decrypt } from '@fhevm-sdk/actions'
import { createFhevmConfig } from '@fhevm-sdk/core'
import { ethers } from 'ethers'
import { useAccount, useWalletClient } from 'wagmi'

const ERC20_ABI = [
  "function balanceOfSealed(address) view returns (string)",
  "function transfer(address, bytes) returns (bool)",
  "event Transfer(address indexed from, address indexed to)"
]

const TOKEN_ADDRESS = '0x...' // Your deployed token

const config = createFhevmConfig({
  chains: [31337],
  mockChains: { 31337: 'http://localhost:8545' }
})

export function EncryptedERC20() {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()

  const { instance, status } = useFhevm({
    provider: window.ethereum,
    chainId: 31337,
    enabled: !!address
  })

  const [balance, setBalance] = useState<string | null>(null)
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [isTransferring, setIsTransferring] = useState(false)
  const [contract, setContract] = useState<ethers.Contract | null>(null)

  // Initialize contract
  useEffect(() => {
    if (walletClient && address) {
      const provider = new ethers.BrowserProvider(window.ethereum as any)
      provider.getSigner().then(signer => {
        setContract(new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, signer))
      })
    }
  }, [walletClient, address])

  // Fetch and decrypt balance
  const fetchBalance = async () => {
    if (!instance || !contract || !address) return

    try {
      // Get sealed balance from contract
      const sealedBalance = await contract.balanceOfSealed(address)
      
      // Decrypt balance
      const provider = new ethers.BrowserProvider(window.ethereum as any)
      const signer = await provider.getSigner()

      const decrypted = await decrypt(config, {
        instance,
        requests: [{
          handle: sealedBalance,
          contractAddress: TOKEN_ADDRESS as `0x${string}`
        }],
        signer: signer as any,
        storage: config.storage
      })

      const balanceValue = decrypted[sealedBalance]
      
      if (typeof balanceValue === 'bigint') {
        // Convert from wei to tokens (18 decimals)
        const formatted = ethers.formatEther(balanceValue)
        setBalance(formatted)
      }
    } catch (err) {
      console.error('Failed to fetch balance:', err)
      alert('Failed to fetch balance: ' + (err as Error).message)
    }
  }

  // Transfer tokens
  const handleTransfer = async () => {
    if (!instance || !contract || !address) return
    if (!ethers.isAddress(recipient)) {
      alert('Invalid recipient address')
      return
    }

    try {
      setIsTransferring(true)

      // Parse amount (convert to wei)
      const amountWei = ethers.parseEther(amount)

      // Encrypt the amount
      const encrypted = await encrypt(config, {
        instance,
        contractAddress: TOKEN_ADDRESS as `0x${string}`,
        userAddress: address,
        values: [{ type: 'euint64', value: amountWei }]
      })

      // Send transfer transaction
      const tx = await contract.transfer(recipient, encrypted.handles[0])
      console.log('Transfer transaction sent:', tx.hash)

      // Wait for confirmation
      await tx.wait()
      console.log('Transfer confirmed!')

      alert(`Successfully transferred ${amount} tokens to ${recipient}`)
      
      // Refresh balance
      setAmount('')
      setTimeout(fetchBalance, 1000)
    } catch (err: any) {
      console.error('Transfer failed:', err)
      
      if (err.message?.includes('FHE.req')) {
        alert('Insufficient balance for transfer')
      } else {
        alert('Transfer failed: ' + err.message)
      }
    } finally {
      setIsTransferring(false)
    }
  }

  // Auto-fetch balance when ready
  useEffect(() => {
    if (status === 'ready' && contract) {
      fetchBalance()
    }
  }, [status, contract])

  if (!address) {
    return (
      <div className="card">
        <h2>Encrypted ERC20</h2>
        <p>Connect wallet to view your encrypted token balance</p>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="card">
        <h2>Encrypted ERC20</h2>
        <p>Loading FHEVM...</p>
      </div>
    )
  }

  return (
    <div className="card">
      <h2>Encrypted ERC20 Token</h2>

      <div className="section">
        <h3>Your Balance</h3>
        {balance !== null ? (
          <div className="balance">
            <span className="amount">{balance}</span>
            <span className="symbol">ETKN</span>
          </div>
        ) : (
          <p>Loading balance...</p>
        )}
        <button onClick={fetchBalance} disabled={status !== 'ready'}>
          Refresh Balance
        </button>
      </div>

      <div className="section">
        <h3>Transfer Tokens</h3>
        <div className="form">
          <input
            type="text"
            placeholder="Recipient address (0x...)"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            disabled={isTransferring}
          />
          <input
            type="number"
            step="0.000001"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isTransferring}
          />
          <button 
            onClick={handleTransfer}
            disabled={isTransferring || !recipient || !amount}
          >
            {isTransferring ? 'Transferring...' : 'Transfer'}
          </button>
        </div>
        <p className="hint">
          Transfer amount is encrypted. Recipient cannot see the amount on-chain.
        </p>
      </div>
    </div>
  )
}
```

## Key Features

### 1. Encrypted Balances

Balances are stored as `euint64` (encrypted uint64):

```solidity
mapping(address => euint64) private balances;
```

**Privacy guarantee:** Nobody can see your balance on-chain, including:
- Block explorers
- Other users
- Contract owner
- Blockchain validators

### 2. Encrypted Transfers

Transfer amounts are encrypted end-to-end:

```typescript
// Client encrypts amount
const encrypted = await encrypt(config, {
  instance,
  contractAddress: TOKEN_ADDRESS,
  userAddress: address,
  values: [{ type: 'euint64', value: amountWei }]
})

// Contract receives encrypted bytes
function transfer(address to, bytes calldata encryptedAmount)
```

**Privacy guarantee:** Transfer amounts are never revealed.

### 3. Encrypted Balance Checks

Contract checks balance sufficiency without decryption:

```solidity
ebool hasSufficientBalance = FHE.lte(amount, balances[msg.sender]);
FHE.req(hasSufficientBalance); // Reverts if false
```

**Result:** Transaction fails if insufficient balance, but exact amounts remain secret.

### 4. Private Balance Queries

Only the balance owner can decrypt:

```solidity
function balanceOfSealed(address account) view returns (string) {
    require(msg.sender == account, "Can only view own balance");
    return FHE.sealoutputTyped(balances[account], bytes32(0));
}
```

## Advanced Patterns

### Allowances

Implement encrypted allowances for DEX integration:

```solidity
mapping(address => mapping(address => euint64)) private allowances;

function approve(address spender, bytes calldata encryptedAmount) external {
    allowances[msg.sender][spender] = FHE.asEuint64(encryptedAmount);
}

function transferFrom(
    address from,
    address to,
    bytes calldata encryptedAmount
) external {
    euint64 amount = FHE.asEuint64(encryptedAmount);
    
    // Check allowance
    ebool hasAllowance = FHE.lte(amount, allowances[from][msg.sender]);
    FHE.req(hasAllowance);
    
    // Decrease allowance
    allowances[from][msg.sender] = FHE.sub(
        allowances[from][msg.sender], 
        amount
    );
    
    // Transfer
    balances[from] = FHE.sub(balances[from], amount);
    balances[to] = FHE.add(balances[to], amount);
}
```

### Batch Transfers

Transfer to multiple recipients in one transaction:

```typescript
const recipients = ['0xaaa...', '0xbbb...', '0xccc...']
const amounts = [100n, 200n, 300n]

// Encrypt all amounts at once
const encrypted = await encrypt(config, {
  instance,
  contractAddress: TOKEN_ADDRESS,
  userAddress: address,
  values: amounts.map(amt => ({ type: 'euint64', value: amt }))
})

// Send batch transfer
await contract.batchTransfer(recipients, encrypted.handles)
```

## Testing

Test encrypted token functionality:

```typescript
// test/EncryptedERC20.test.ts
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { createFhevmConfig } from '@fhevm-sdk/core'
import { createInstance, encrypt, decrypt } from '@fhevm-sdk/actions'

describe('EncryptedERC20', () => {
  let token: any
  let instance: any
  let config: any
  
  before(async () => {
    // Deploy contract
    const Token = await ethers.getContractFactory('EncryptedERC20')
    token = await Token.deploy()
    
    // Create FHEVM instance
    config = createFhevmConfig({
      chains: [31337],
      mockChains: { 31337: 'http://localhost:8545' }
    })
    
    instance = await createInstance(config, {
      provider: 'http://localhost:8545',
      chainId: 31337
    })
  })

  it('should transfer encrypted tokens', async () => {
    const [owner, recipient] = await ethers.getSigners()
    
    // Encrypt transfer amount
    const encrypted = await encrypt(config, {
      instance,
      contractAddress: token.address,
      userAddress: owner.address,
      values: [{ type: 'euint64', value: 1000n }]
    })
    
    // Transfer
    await token.transfer(recipient.address, encrypted.handles[0])
    
    // Verify event emitted (amounts not revealed)
    const events = await token.queryFilter(token.filters.Transfer())
    expect(events.length).to.equal(1)
    expect(events[0].args.to).to.equal(recipient.address)
  })
})
```

## Security Considerations

### 1. Balance Overflow

Use `euint64` (not `euint256`) to prevent overflow attacks:

```solidity
// Good: bounded by 2^64-1
euint64 private balance;

// Risky: 2^256-1 allows inflation attacks
euint256 private balance;
```

### 2. Access Control

Ensure only owners can decrypt their balance:

```solidity
require(msg.sender == account, "Unauthorized");
```

### 3. Front-Running

Encrypted amounts prevent front-running:
- Attacker cannot see transfer amounts
- Cannot prioritize large transfers
- MEV attacks ineffective

### 4. Side Channels

Be aware of metadata leakage:
- Transfer events reveal sender/recipient (not amounts)
- Gas usage may leak information
- Transaction timing visible

## See Also

- [Encrypted Counter](encrypted-counter.md) - Simpler example
- [Encryption API](../api-reference/actions/encrypt.md)
- [Decryption API](../api-reference/actions/decrypt.md)
- [Testing Guide](../guides/testing.md)
- [Security Best Practices](../guides/security.md)
