import { blob, seq, struct, u8 } from 'buffer-layout';
import {
  accountFlagsLayout,
  publicKeyLayout,
  selfTradeBehaviorLayout,
  u128,
  u64,
} from './layout';
import { Slab, SLAB_LAYOUT } from './slab';
import { DexInstructions } from './instructions';
import BN from 'bn.js';
import {
  Account,
  AccountInfo,
  Commitment,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  TransactionSignature,
} from '@solana/web3.js';
import { decodeEventQueue, decodeRequestQueue } from './queue';
import { Buffer } from 'buffer';
import { getFeeTier, supportsSrmFeeDiscounts } from './fees';
import {
  closeAccount,
  initializeAccount,
  MSRM_DECIMALS,
  MSRM_MINT,
  SRM_DECIMALS,
  SRM_MINT,
  TOKEN_PROGRAM_ID,
  WRAPPED_SOL_MINT,
} from './token-instructions';
import { getLayoutVersion } from './tokens_and_markets';
import { BaseMarket, MarketOptions } from './base-market';
import { getMintDecimals, throwIfNull } from './utils';

export class Market extends BaseMarket {

  static async load(
    connection: Connection,
    address: PublicKey,
    options: MarketOptions = {},
    programId: PublicKey,
  ) {
    const { owner, data } = throwIfNull(
      await connection.getAccountInfo(address),
      'Market not found',
    );
    if (!owner.equals(programId)) {
      throw new Error('Address not owned by program: ' + owner.toBase58());
    }
    const decoded = this.getLayout(programId).decode(data);
    if (
      !decoded.accountFlags.initialized ||
      !decoded.accountFlags.market ||
      !decoded.ownAddress.equals(address)
    ) {
      throw new Error('Invalid market');
    }
    const [baseMintDecimals, quoteMintDecimals] = await Promise.all([
      getMintDecimals(connection, decoded.baseMint),
      getMintDecimals(connection, decoded.quoteMint),
    ]);
    return new Market(
      decoded,
      baseMintDecimals,
      quoteMintDecimals,
      options,
      programId,
    );
  }
}
