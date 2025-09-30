
## Protocol v0.8 Reference (Cursor-ready)

- **Scope**: Configuration, Supported types, Operations on encrypted types (casting, random), Encrypted inputs, ACL (+examples, reorgs), Logics (branching/conditions/error handling), Decryption.
- **Audience**: Solidity developers integrating FHEVM.
- **Key libs**: `@fhevm/solidity/lib/FHE.sol`, `@fhevm/solidity/config/ZamaConfig.sol`.

### 1. Configuration
- **Goal**: Wire contracts to FHEVM coprocessor, ACL, KMS verifier, input verifier, and decryption oracle.
- **Approach**: Inherit network config (e.g., `SepoliaConfig`) to auto-call `FHE.setCoprocessor(...)` and set oracle.
- **Utility**: `FHE.isInitialized(T v) -> bool` to guard uninitialized encrypted vars.
- **Sepolia (example addresses)**: see `Contract addresses` in the PDF. Use `.env` for `RELAYER_URL`, executor, ACL, KMS, InputVerifier, Oracle.
- **Example**:
```solidity
pragma solidity ^0.8.24;
import { FHE } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
contract MyContract is SepoliaConfig {
  euint32 counter;
  constructor() { counter = FHE.asEuint32(0); FHE.allowThis(counter); }
}
```

### 2. Supported types
- **Encrypted integers**: `euint8/16/32/64/128/256` (wrap on overflow; unchecked to avoid side-channel leaks). Future: overflow-checked variants.
- **Encrypted boolean/address**: `ebool`, `eaddress`.
- **External input handles**: `externalEbool`, `externalEuintXX`, `externalEaddress`.
- **Representation**: ciphertext handles; manipulated only via `FHE` APIs.

### 3. Operations on encrypted types
- **Arithmetic**: `FHE.add/sub/mul/min/max/neg/div/rem` (div/rem require plaintext divisor).
- **Bitwise**: `FHE.and/or/xor/not/shl/shr/rotl/rotr`.
- **Comparison**: `FHE.eq/ne/lt/le/gt/ge` -> returns `ebool`.
- **Selection**: `FHE.select(ebool cond, T thenV, T elseV)` for encrypted branching.
- **Random**: `FHE.randEbool`, `FHE.randEuint{8,16,32,64,128,256}` (optionally with upper bound). Must be in a state-changing tx (not `eth_call`).
- **HCU note**: Encrypted ops consume HCU. Respect per-tx limits; consider splitting transactions.

#### 3.1 Casting and trivial encryption
- **Trivial encryption (public)**: plaintext -> encrypted type, publicly visible but ciphertext-form; use to mix public and private values.
  - `FHE.asEbool(bool) -> ebool`
  - `FHE.asEuintXX(uintX|ebool) -> euintXX`
  - `FHE.asEaddress(address) -> eaddress`
- **Encrypted type casts**:
  - Widening preserves info: `euint32 -> euint64`.
  - Narrowing truncates: `euint64 -> euint32`.

#### 3.2 Generate random numbers
- **APIs**:
```solidity
ebool rb = FHE.randEbool();
euint32 r = FHE.randEuint32();
euint16 rBnd = FHE.randEuint16(upperBound);
```
- **Constraints**: only in transactions; PRNG state updates on-chain.

### 4. Encrypted inputs
- **Concept**: Client encrypts inputs with FHE public key; packs multiple inputs; provides ZKPoK.
- **Solidity params**: `externalE*` handles + `bytes inputProof`.
- **Validation/conversion**: `FHE.fromExternal(externalE*, bytes proof) -> e*` or `FHE.asEuintXX(externalE*, proof)` depending on API page; both patterns exist in the doc.
- **Frontend (TS)**: create encrypted input via Hardhat plugin, collect `handles[]`, `inputProof`, then call contract.
- **Best practices**: pack inputs; encrypt client-side; ensure correct proof matches handles.

### 5. Access Control List
- **Purpose**: control who can use or decrypt ciphertexts.
- **Permanent**: `FHE.allow(ciphertext, address)`; `FHE.allowThis(ciphertext)`.
- **Transient**: `FHE.allowTransient(ciphertext, address)` for one-off or limited scope.
- **Public decryption**: `FHE.makePubliclyDecryptable(ciphertext)`.
- **Chaining**: `using FHE for *; ciphertext.allow(addr1).allow(addr2);`.

#### 5.1 ACL examples
- Granting allowances to multiple addresses; mixing persistent and transient allowances; reauthorizing after `FHE.select` or updates.
- Reminder: each `select` creates a new ciphertext; re-allow as needed.

#### 5.2 Reorgs handling
- **Risk**: ACL events emitted before chain finality may be reverted in a reorg.
- **Mitigation**: two-step flow with timelock > 95 blocks on Ethereum before calling `FHE.allow(...)` for critical secrets.
- **Pattern**: record `blockWhenBought`, later `requestACL()` requires `block.number > blockWhenBought + 95` before granting.

### 6. Logics
- **Encrypted branching**: use `FHE.select` with `ebool` conditions; avoid revealing paths.
- **Gas and ciphertext churn**: `select` produces new ciphertexts; re-authorize with ACL.

#### 6.1 Branching
- Implement conditional updates entirely in encrypted space with `FHE.lt` + `FHE.select` (e.g., auction highest bid).

#### 6.2 Dealing with branches and conditions
- Cannot `break`/`continue` based on encrypted conditions.
- Replace with finite loops and `FHE.select` inside the loop; obfuscate branching where possible to reduce leakage.

#### 6.3 Error handling
- Encrypted flows don’t revert on failed conditions by default.
- Implement per-user last-error logging using encrypted error codes (`euint8`) and expose query/events for UX.

### 7. Decryption
- **Async model**: request via `FHE.requestDecryption(bytes32[] handles, bytes4 callbackSelector)`; relayer/KMS fulfills; verify in callback with `FHE.checkSignatures`.
- **Callback**: `(uint256 requestId, bytes cleartexts, bytes decryptionProof)`; decode ABI to native types.
- **Client decryption**: use Hardhat plugin APIs (`fhevm.userDecryptEuint/Ebool/Eaddress`).
- **Security**: always verify signatures and implement replay protection; grant ACL before requesting if needed.

### Appendix: Practical tips
- Re-authorize after value changes: call `FHE.allowThis(updatedCiphertext)` following `select`/writes.
- Keep HCU below limits; prefer smaller bit-widths where possible.
- Use `isInitialized` guards for state vars before first use.
- Prefer obfuscated control-flow over decrypting mid-logic; only decrypt for async public outcomes.
