import {
  Account,
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,  
} from '@solana/web3.js';
import { PoolInfo, loadPoolInfo } from "@project-serum/pool";
import { BaseMarket, MarketOptions, Order, OrderParams } from "./base-market";
import { getMintDecimals } from './utils';
import { DexInstructions } from './instructions';
import BN from 'bn.js';
import { AdminAlertPoolInstructions } from '@project-serum/pool';

export class PoolMarket extends BaseMarket {
  
  private _poolProgramId: PublicKey;
  private _poolInfo: PoolInfo;
  
  constructor(
    decoded,
    baseMintDecimals: number,
    quoteMintDecimals: number,
    options: MarketOptions = {},
    marketProgramId: PublicKey,
    poolProgramId: PublicKey,
    poolInfo: PoolInfo,
  ) {
    super(decoded, baseMintDecimals, quoteMintDecimals, options, marketProgramId);  
    this._poolProgramId = poolProgramId;
    this._poolInfo = poolInfo;
  }
  
  static async load(
    connection: Connection,
    address: PublicKey,
    options: MarketOptions = {},
    marketProgramId: PublicKey,
    poolProgramId: PublicKey
  ) {
    const { owner, data } = throwIfNull(
      await connection.getAccountInfo(address),
      'Market not found',
    );
    if (!owner.equals(marketProgramId)) {
      throw new Error('Address not owned by program: ' + owner.toBase58());
    }
    const decoded = this.getLayout(marketProgramId).decode(data);
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
    const poolInfo = await loadPoolInfo(connection, poolProgramId);
    return new PoolMarket(
      decoded,
      baseMintDecimals,
      quoteMintDecimals,
      options,
      marketProgramId,
      poolProgramId,
      poolInfo,
    );
  }

  makePlaceOrderInstruction<T extends PublicKey | Account>(
    connection: Connection,
    {
      owner,
      payer,
      side,
      price,
      size,
      orderType = 'limit',
      clientId,
      openOrdersAddressKey,
      openOrdersAccount,
      feeDiscountPubkey = null,
      selfTradeBehavior = 'decrementTake',
    }: OrderParams<T>,
  ): TransactionInstruction {
    // @ts-ignore
    const ownerAddress: PublicKey = owner.publicKey ?? owner;
    if (this.baseSizeNumberToLots(size).lte(new BN(0))) {
      throw new Error('size too small');
    }
    if (this.priceNumberToLots(price).lte(new BN(0))) {
      throw new Error('invalid price');
    }
    if (!this.supportsSrmFeeDiscounts) {
      feeDiscountPubkey = null;
    }
    let newOrder: TransactionInstruction;
    if (this.usesRequestQueue) {      
      newOrder = DexInstructions.newOrder({
        market: this.address,
        requestQueue: this._decoded.requestQueue,
        baseVault: this._decoded.baseVault,
        quoteVault: this._decoded.quoteVault,
        openOrders: openOrdersAccount
          ? openOrdersAccount.publicKey
          : openOrdersAddressKey,
        owner: ownerAddress,
        payer,
        side,
        limitPrice: this.priceNumberToLots(price),
        maxQuantity: this.baseSizeNumberToLots(size),
        orderType,
        clientId,
        programId: this._programId,
        feeDiscountPubkey,
      });
    } else {
      newOrder = DexInstructions.newOrderV3({
        market: this.address,
        bids: this._decoded.bids,
        asks: this._decoded.asks,
        requestQueue: this._decoded.requestQueue,
        eventQueue: this._decoded.eventQueue,
        baseVault: this._decoded.baseVault,
        quoteVault: this._decoded.quoteVault,
        openOrders: openOrdersAccount
          ? openOrdersAccount.publicKey
          : openOrdersAddressKey,
        owner: ownerAddress,
        payer,
        side,
        limitPrice: this.priceNumberToLots(price),
        maxBaseQuantity: this.baseSizeNumberToLots(size),
        maxQuoteQuantity: new BN(this._decoded.quoteLotSize.toNumber()).mul(
          this.baseSizeNumberToLots(size).mul(this.priceNumberToLots(price)),
        ),
        orderType,
        clientId,
        programId: this._programId,
        selfTradeBehavior,
        feeDiscountPubkey,
      });
    }
    return AdminAlertPoolInstructions.serumCreateOrderV3(this._poolInfo, newOrder.data, newOrder.keys);
  }

  makeCancelOrderInstruction(
    connection: Connection,
    owner: PublicKey,
    order: Order,
  ) {
    let cancelOrder;
    if (this.usesRequestQueue) {
      cancelOrder = DexInstructions.cancelOrder({
        market: this.address,
        owner,
        openOrders: order.openOrdersAddress,
        requestQueue: this._decoded.requestQueue,
        side: order.side,
        orderId: order.orderId,
        openOrdersSlot: order.openOrdersSlot,
        programId: this._programId,
      });
    } else {
      cancelOrder = DexInstructions.cancelOrderV2({
        market: this.address,
        owner,
        openOrders: order.openOrdersAddress,
        bids: this._decoded.bids,
        asks: this._decoded.asks,
        eventQueue: this._decoded.eventQueue,
        side: order.side,
        orderId: order.orderId,
        openOrdersSlot: order.openOrdersSlot,
        programId: this._programId,
      });
    }
    return AdminAlertPoolInstructions.serumCancelOrderV2(this._poolInfo, cancelOrder.data, cancelOrder.keys);
  }
}

function throwIfNull<T>(value: T | null, message = 'account not found'): T {
  if (value === null) {
    throw new Error(message);
  }
  return value;
}
