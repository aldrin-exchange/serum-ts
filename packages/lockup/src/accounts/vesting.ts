import { struct, u8, Layout } from 'buffer-layout';
import { bool, i64, publicKey, u64, option } from '@project-serum/borsh';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

export interface Vesting {
  initialized: boolean;
  safe: PublicKey;
  beneficiary: PublicKey;
  claimed: boolean;
  grantor: PublicKey;
  balance: BN;
  startBalance: BN;
  startTs: BN;
  endTs: BN;
  periodCount: BN;
  lockedNftMint: PublicKey;
  lockedNftToken: PublicKey;
  whitelistOwned: BN;
}

export const VESTING_LAYOUT: Layout<Vesting> = struct([
  bool('initialized'),
  publicKey('safe'),
  publicKey('beneficiary'),
  bool('claimed'),
  publicKey('grantor'),
  u64('balance'),
  u64('startBalance'),
  i64('startTs'),
  i64('endTs'),
  u64('periodCount'),
  publicKey('lockedNftMint'),
  publicKey('lockedNftToken'),
  u64('whitelistOwned'),
]);

export function decode(data: Buffer): Vesting {
  return VESTING_LAYOUT.decode(data);
}

export function encode(v: Vesting): Buffer {
  const buffer = Buffer.alloc(1000); // TODO: use a tighter buffer.
  const len = VESTING_LAYOUT.encode(v, buffer);
  return buffer.slice(0, len);
}

export function defaultVesting(): Vesting {
  return {
    initialized: false,
    safe: new PublicKey(Buffer.alloc(32)),
    beneficiary: new PublicKey(Buffer.alloc(32)),
    claimed: false,
    grantor: new PublicKey(Buffer.alloc(32)),
    balance: new BN(0),
    startBalance: new BN(0),
    startTs: new BN(0),
    endTs: new BN(0),
    periodCount: new BN(0),
    lockedNftMint: new PublicKey(Buffer.alloc(32)),
    lockedNftToken: new PublicKey(Buffer.alloc(32)),
    whitelistOwned: new BN(0),
  };
}

export const SIZE = encode(defaultVesting()).length;
