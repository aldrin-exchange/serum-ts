import BN from 'bn.js';
import { struct, Layout, u32 } from 'buffer-layout';
import { PublicKey } from '@solana/web3.js';
import { publicKey, u64, i64, str, rustEnum, vec } from '@project-serum/borsh';
import { Ring, RingItemDecoder } from './ring';

const CAPACITY = 500;
const MESSAGE_SIZE = 145;

export class RewardEventQueue extends Ring<RewardEvent> {
  constructor(data: Buffer) {
    super(data, new RewardEventDecoder(), CAPACITY, MESSAGE_SIZE);
    if (data.length != this.bufferSize()) {
      throw new Error(
        `expected data length ${this.bufferSize()} got ${data.length}`,
      );
    }
  }

  static accountSize(): number {
    return CAPACITY * MESSAGE_SIZE + Ring.MESSAGE_START;
  }
}

class RewardEventDecoder implements RingItemDecoder<RewardEvent> {
  decode(data: Buffer): RewardEvent {
    return REWARD_EVENT_LAYOUT.decode(data);
  }
}

export type RewardEvent = {
  poolDrop?: PoolDrop;
  lockedAlloc?: LockedAlloc;
};

export type PoolDrop = {
  from: PublicKey;
  totals: BN[];
  pool: PublicKey;
};

export type LockedAlloc = {
  from: PublicKey;
  total: BN;
  expirtyTs: BN;
  expiryReceiver: BN;
  pool: PublicKey;
  lockedVendor: PublicKey;
};

const REWARD_EVENT_LAYOUT: Layout<RewardEvent> = rustEnum([
  struct(
    [publicKey('from'), vec(u64(), 'totals'), publicKey('pool')],
    'poolDrop',
  ),
  struct(
    [
      publicKey('from'),
      u64('total'),
      i64('expiryTs'),
      publicKey('expiryReceiver'),
      publicKey('pool'),
      publicKey('lockedVendor'),
    ],
    'lockedAlloc',
  ),
]);
