import {
  Account,
  SystemProgram,
  PublicKey,
  Transaction,
  TransactionInstruction,
  GetProgramAccountsFilter,
} from '@solana/web3.js';
import { Provider } from './provider';
import {
  MintInfo,
  MintLayout,
  AccountInfo,
  AccountLayout,
  u64,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import BN from 'bn.js';

export * from './provider';
export * as token from './token';
export { simulateTransaction } from './simulate-transaction';
export * as connection from './connection';

export const SPL_SHARED_MEMORY_ID = new PublicKey(
  'shmem4EWT2sPdVGvTZCzXXRAURL9G5vpPxNwSeKhHUL',
);

export async function createMint(
  provider: Provider,
  authority?: PublicKey,
  decimals?: number,
): Promise<PublicKey> {
  if (authority === undefined) {
    authority = provider.wallet.publicKey;
  }
  const mint = new Account();
  const instructions = await createMintInstructions(
    provider,
    authority,
    mint.publicKey,
    decimals,
  );

  const tx = new Transaction();
  tx.add(...instructions);

  await provider.send(tx, [mint]);

  return mint.publicKey;
}

export async function createMintInstructions(
  provider: Provider,
  authority: PublicKey,
  mint: PublicKey,
  decimals?: number,
): Promise<TransactionInstruction[]> {
  return [
    SystemProgram.createAccount({
      fromPubkey: provider.wallet.publicKey,
      newAccountPubkey: mint,
      space: 82,
      lamports: await provider.connection.getMinimumBalanceForRentExemption(82),
      programId: TOKEN_PROGRAM_ID,
    }),
    {
      programId: TOKEN_PROGRAM_ID,
      keys: [
        { pubkey: mint, isSigner: false, isWritable: true },
        { pubkey: authority, isSigner: false, isWritable: false },
      ],
      data: Buffer.from([0, decimals ?? 0]),
    },
  ];
}

export async function createMintAndVault(
  provider: Provider,
  amount: BN,
  owner?: PublicKey,
  decimals?: number,
): Promise<[PublicKey, PublicKey]> {
  if (owner === undefined) {
    owner = provider.wallet.publicKey;
  }
  const mint = new Account();
  const vault = new Account();
  const tx = new Transaction();
  tx.add(
    SystemProgram.createAccount({
      fromPubkey: provider.wallet.publicKey,
      newAccountPubkey: mint.publicKey,
      space: 82,
      lamports: await provider.connection.getMinimumBalanceForRentExemption(82),
      programId: TOKEN_PROGRAM_ID,
    }),
    {
      programId: TOKEN_PROGRAM_ID,
      keys: [
        { pubkey: mint.publicKey, isSigner: false, isWritable: true },
        { pubkey: provider.wallet.publicKey, isSigner: false, isWritable: false },
      ],
      data: Buffer.from([0, decimals ?? 0]),
    },
    SystemProgram.createAccount({
      fromPubkey: provider.wallet.publicKey,
      newAccountPubkey: vault.publicKey,
      space: 165,
      lamports: await provider.connection.getMinimumBalanceForRentExemption(
        165,
      ),
      programId: TOKEN_PROGRAM_ID,
    }),
    {
      programId: TOKEN_PROGRAM_ID,
      keys: [
        { pubkey: vault.publicKey, isSigner: false, isWritable: true },
        { pubkey: mint.publicKey, isSigner: false, isWritable: false },
        { pubkey: owner, isSigner: false, isWritable: false },
      ],
      data: Buffer.from([1]),
    },
    {
      programId: TOKEN_PROGRAM_ID,
      keys: [
        { pubkey: mint.publicKey, isSigner: false, isWritable: true },
        { pubkey: vault.publicKey, isSigner: false, isWritable: true },
        { pubkey: provider.wallet.publicKey, isSigner: true, isWritable: false },
      ],
      data: Buffer.from([7, ...amount.toArray('le', 8)]),
    },
  );
  await provider.send(tx, [mint, vault]);
  return [mint.publicKey, vault.publicKey];
}

export async function createTokenAccount(
  provider: Provider,
  mint: PublicKey,
  owner: PublicKey,
): Promise<PublicKey> {
  const vault = new Account();
  const tx = new Transaction();
  tx.add(
    ...(await createTokenAccountInstrs(provider, vault.publicKey, mint, owner)),
  );
  await provider.send(tx, [vault]);
  return vault.publicKey;
}

export async function createTokenAccountInstrs(
  provider: Provider,
  newAccountPubkey: PublicKey,
  mint: PublicKey,
  owner: PublicKey,
  lamports?: number,
): Promise<TransactionInstruction[]> {
  if (lamports === undefined) {
    lamports = await provider.connection.getMinimumBalanceForRentExemption(165);
  }
  return [
    SystemProgram.createAccount({
      fromPubkey: provider.wallet.publicKey,
      newAccountPubkey,
      space: 165,
      lamports,
      programId: TOKEN_PROGRAM_ID,
    }),
    {
      programId: TOKEN_PROGRAM_ID,
      keys: [
        { pubkey: newAccountPubkey, isSigner: false, isWritable: true },
        { pubkey: mint, isSigner: false, isWritable: false },
        { pubkey: owner, isSigner: false, isWritable: false },
      ],
      data: Buffer.from([1]),
    },
  ];
}

export async function createAccountRentExempt(
  provider: Provider,
  programId: PublicKey,
  size: number,
): Promise<Account> {
  const acc = new Account();
  const tx = new Transaction();
  tx.add(
    SystemProgram.createAccount({
      fromPubkey: provider.wallet.publicKey,
      newAccountPubkey: acc.publicKey,
      space: size,
      lamports: await provider.connection.getMinimumBalanceForRentExemption(
        size,
      ),
      programId,
    }),
  );
  await provider.send(tx, [acc]);
  return acc;
}

export async function getMintInfo(
  provider: Provider,
  addr: PublicKey,
): Promise<MintInfo> {
  let depositorAccInfo = await provider.connection.getAccountInfo(addr);
  if (depositorAccInfo === null) {
    throw new Error('Failed to find token account');
  }
  return parseMintAccount(depositorAccInfo.data);
}

export function parseMintAccount(data: Buffer): MintInfo {
  const m = MintLayout.decode(data);
  m.mintAuthority = new PublicKey(m.mintAuthority);
  m.supply = u64.fromBuffer(m.supply);
  m.isInitialized = m.state !== 0;
  return m;
}

export async function getTokenAccount(
  provider: Provider,
  addr: PublicKey,
): Promise<AccountInfo> {
  let depositorAccInfo = await provider.connection.getAccountInfo(addr);
  if (depositorAccInfo === null) {
    throw new Error('Failed to find token account');
  }
  return parseTokenAccount(depositorAccInfo.data);
}

export function parseTokenAccount(data: Buffer): AccountInfo {
  const accountInfo = AccountLayout.decode(data);
  accountInfo.mint = new PublicKey(accountInfo.mint);
  accountInfo.owner = new PublicKey(accountInfo.owner);
  accountInfo.amount = u64.fromBuffer(accountInfo.amount);

  if (accountInfo.delegateOption === 0) {
    accountInfo.delegate = null;
    accountInfo.delegatedAmount = new u64(0);
  } else {
    accountInfo.delegate = new PublicKey(accountInfo.delegate);
    accountInfo.delegatedAmount = u64.fromBuffer(accountInfo.delegatedAmount);
  }

  accountInfo.isInitialized = accountInfo.state !== 0;
  accountInfo.isFrozen = accountInfo.state === 2;

  if (accountInfo.isNativeOption === 1) {
    accountInfo.rentExemptReserve = u64.fromBuffer(accountInfo.isNative);
    accountInfo.isNative = true;
  } else {
    accountInfo.rentExemptReserve = null;
    accountInfo.isNative = false;
  }

  if (accountInfo.closeAuthorityOption === 0) {
    accountInfo.closeAuthority = null;
  } else {
    accountInfo.closeAuthority = new PublicKey(accountInfo.closeAuthority);
  }

  return accountInfo;
}

export function sleep(ms: number): Promise<any> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export type ProgramAccount<T> = {
  publicKey: PublicKey;
  account: T;
};
