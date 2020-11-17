export type Action = {
  type: ActionType;
  item: any;
};

export enum ActionType {
  // Common.
  CommonTriggerBootstrap,
  CommonAppWillBootstrap,
  CommonAppDidBootstrap,
  CommonTriggerShutdown,
  CommonWalletDidConnect,
  CommonWalletDidDisconnect,
  CommonWalletSetProvider,
  CommonSetNetwork,
  CommonOwnedTokenAccountsSet,
  CommonWalletReset,
  ConsumeLoginOnceToken,

  // Solana.
  SolanaSlotUpdate,

  // Lockup.
  LockupSetSafe,
  LockupSetVestings,
  LockupCreateVesting,

  // Registry.
  RegistryCreateEntity,
  RegistrySetEntities,
  RegistryUpdateEntity,
  RegistrySetMember,
  RegistrySetMetadata,
  RegistryCreateMetadata,
  RegistrySetPools,
  RegistrySetRegistrar,
  RegistrySetPendingWithdrawals,
  RegistryCreatePendingWithdrawal,
  RegistryUpdatePendingWithdrawal,
}
