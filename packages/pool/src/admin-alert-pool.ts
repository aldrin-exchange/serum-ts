import { struct, u32, blob } from 'buffer-layout';
import { Layout, rustEnum, tagged, u64 } from '@project-serum/borsh';
import {
  AccountMeta,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import BN from 'bn.js';
import { PoolInfo } from './instructions';
import { TOKEN_PROGRAM_ID } from '@project-serum/token';

export type AdminAlertRequest =
  | { pause: any }
  | { unpause: any }
  | { addAsset: any }
  | { removeAsset: any }
  | { updateFee: { feeRate: number } }
  | { updateAdmin: any }
  | { serumCreateOrderV3: {data: Buffer} }
  | { serumCancelOrderV2: {data: Buffer} };

export const ADMIN_ALERT_INSTRUCTION_TAG = new BN('31e645f3c1617878', 'hex');

export const AdminAlertRequest: Layout<AdminAlertRequest> = tagged(
  ADMIN_ALERT_INSTRUCTION_TAG,
  rustEnum([
    struct([], 'pause'),
    struct([], 'unpause'),
    struct([], 'addAsset'),
    struct([], 'removeAsset'),
    struct([u32('feeRate')], 'updateFee'),
    struct([], 'updateAdmin'),
    struct([blob(284, 'data')], 'serumCreateOrderV3'),
    struct([blob(132, 'data')], 'serumCancelOrderV2')
  ]),
);

function encodeAdminRequest(request: AdminAlertRequest): Buffer {
  const buffer = Buffer.alloc(1000);
  const len = AdminAlertRequest.encode(request, buffer);
  return buffer.slice(0, len);
}

function makeAdminInstruction(
  pool: PoolInfo,
  request: AdminAlertRequest,
  keys?: Array<AccountMeta>,
): TransactionInstruction {
  if (!pool.state.adminKey) {
    throw new Error('Pool does not have admin');
  }
  return new TransactionInstruction({
    keys: [
      { pubkey: pool.address, isSigner: false, isWritable: true },
      { pubkey: pool.state.adminKey, isSigner: true, isWritable: false },
      ...(keys ?? []),
    ],
    programId: pool.program,
    data: encodeAdminRequest(request),
  });
}

/** Instructions for interacting with the example admin-controlled pool. */
export class AdminAlertPoolInstructions {
  /** Pauses creations and redemptions for the pool. */
  static pause(pool: PoolInfo): TransactionInstruction {
    return makeAdminInstruction(pool, { pause: {} });
  }
  /**
   * Resumes creations and redemptions for the pool.
   *
   * Pool assets must not have any outstanding delegates.
   */
  static unpause(pool: PoolInfo): TransactionInstruction {
    return makeAdminInstruction(
      pool,
      { unpause: {} },
      pool.state.assets.map(asset => ({
        pubkey: asset.vaultAddress,
        isSigner: false,
        isWritable: false,
      })),
    );
  }


  /** Adds a new asset to the pool. */
  static addAsset(pool: PoolInfo, vault: PublicKey): TransactionInstruction {
    return makeAdminInstruction(pool, { addAsset: {} }, [
      { pubkey: vault, isSigner: false, isWritable: false },
    ]);
  }

  /**
   * Removes an asset from the pool.
   *
   * The pool must not currently own any tokens of the asset to be removed.
   */
  static removeAsset(pool: PoolInfo, vault: PublicKey): TransactionInstruction {
    return makeAdminInstruction(pool, { removeAsset: {} }, [
      { pubkey: vault, isSigner: false, isWritable: false },
    ]);
  }

  /** Modifies the fee rate for the pool. */
  static updateFee(pool: PoolInfo, feeRate: number): TransactionInstruction {
    return makeAdminInstruction(pool, { updateFee: { feeRate } });
  }

  /** Transfers admin permission for the pool to a new account. */
  static updateAdmin(
    pool: PoolInfo,
    newAdmin: PublicKey,
  ): TransactionInstruction {
    return makeAdminInstruction(pool, { updateAdmin: {} }, [
      { pubkey: newAdmin, isSigner: true, isWritable: false },
    ]);
  }

  static serumCreateOrderV3(
    pool: PoolInfo,
    data: Buffer,
    keys: AccountMeta[],
  ): TransactionInstruction {
    return makeAdminInstruction(pool, { serumCreateOrderV3: {data}},
      keys
      );
  }

  static serumCancelOrderV2(
    pool: PoolInfo,
    data: Buffer,
    keys: AccountMeta[],
  ): TransactionInstruction {
    return makeAdminInstruction(pool, { serumCancelOrderV2: {data}},
      keys
      );
  }
}

export const ADMIN_ALERT_POOL_TAG = new BN('4a3fbcf74f93f94e', 'hex');

export function isAdminAlertPool(pool: PoolInfo): boolean {
  return pool.state.customState
    .slice(0, 8)
    .equals(ADMIN_ALERT_POOL_TAG.toArrayLike(Buffer, 'le', 8));
}
