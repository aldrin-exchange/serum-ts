import { Layout } from 'buffer-layout';
import * as borsh from '@project-serum/borsh';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

export interface LockedRewardVendor {
  initialized: boolean;
  vault: PublicKey;
  nonce: number;
  poolTokenSupply: BN;
  rewardEventQueueCursor: number;
  expiryTs: BN;
  expiryReceiver: PublicKey;
}

const LOCKED_REWARD_VENDOR_LAYOUT: Layout<LockedRewardVendor> = borsh.struct([
  borsh.bool('initialized'),
  borsh.publicKey('vault'),
  borsh.u8('nonce'),
  borsh.u64('poolTokenSupply'),
  borsh.u32('rewardEventQueueCursor'),
  borsh.i64('expiryTs'),
  borsh.publicKey('expiryReceiver'),
]);

export function decode(data: Buffer): LockedRewardVendor {
  return LOCKED_REWARD_VENDOR_LAYOUT.decode(data);
}

export function encode(v: LockedRewardVendor): Buffer {
  const buffer = Buffer.alloc(1000); // TODO: use a tighter buffer.
  const len = LOCKED_REWARD_VENDOR_LAYOUT.encode(v, buffer);
  return buffer.slice(0, len);
}

export function defaultLockedRewardVendor(): LockedRewardVendor {
  return {
    initialized: false,
    vault: new PublicKey(Buffer.alloc(32)),
    nonce: 0,
    poolTokenSupply: new BN(0),
    rewardEventQueueCursor: 0,
    expiryTs: new BN(0),
    expiryReceiver: new PublicKey(Buffer.alloc(32)),
  };
}

export const SIZE: number = encode(defaultLockedRewardVendor()).length;
