import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSnackbar } from 'notistack';
import BN from 'bn.js';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import IconButton from '@material-ui/core/IconButton';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import FormControl from '@material-ui/core/FormControl';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Typography from '@material-ui/core/Typography';
import { MintInfo, AccountInfo as TokenAccount, u64 } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { PoolState, Basket } from '@project-serum/pool';
import { accounts } from '@project-serum/registry';
import { useWallet } from '../../components/common/WalletProvider';
import { ViewTransactionOnExplorerButton } from '../../components/common/Notification';
import { State as StoreState, ProgramAccount } from '../../store/reducer';
import { ActionType } from '../../store/actions';
import * as skin from '../../skin';

export default function Me() {
  const { registryClient } = useWallet();
  const dispatch = useDispatch();
  const {
    pool,
    poolTokenMint,
    poolVault,
    megaPool,
    megaPoolTokenMint,
    megaPoolVaults,
    member,
    registrar,
    entity,
  } = useSelector((state: StoreState) => {
    return {
      pool: state.registry.pool,
      poolTokenMint: state.registry.poolTokenMint,
      poolVault: state.registry.poolVault,
      megaPool: state.registry.megaPool,
      megaPoolTokenMint: state.registry.megaPoolTokenMint,
      megaPoolVaults: state.registry.megaPoolVaults,
      member: state.registry.member,
      registrar: state.registry.registrar,
      entity: state.registry.entities
        .filter(
          e =>
            state.registry.member &&
            e.publicKey.toString() ===
              state.registry.member!.account.entity.toString(),
        )
        .pop(),
    };
  });

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const prices = new PoolPrices({
    poolVault: poolVault!.account,
    poolTokenMint: poolTokenMint!.account,
    megaPoolVaults: megaPoolVaults!.map(
      (v: ProgramAccount<TokenAccount>) => v.account,
    ),
    megaPoolTokenMint: megaPoolTokenMint!.account,
  });
  const poolSharePrice = prices.basket(new BN(1), true).quantities[0] + ' SRM';
  const megaPoolSharePrice = (() => {
    const b = prices.megaBasket(new BN(1), true).quantities;
    return `${b[0]} SRM, ${b[1]} MSRM`;
  })();

  const createPoolTokens = async (
    amount: number,
    spt: PublicKey,
    label: string,
  ) => {
    enqueueSnackbar(`Creating ${spt} ${label} Pool tokens`, {
      variant: 'info',
    });
    const { tx } = await registryClient.stake({
      member: member!.publicKey,
      amount: new u64(amount),
      entity: entity?.publicKey,
      spt: spt,
    });
    const updatedMember = await registryClient.accounts.member(
      member!.publicKey,
    );
    dispatch({
      type: ActionType.RegistrySetMember,
      item: {
        member: {
          publicKey: member!.publicKey,
          account: updatedMember,
        },
      },
    });
    const updatedEntity = await registryClient.accounts.entity(
      entity!.publicKey,
    );
    dispatch({
      type: ActionType.RegistryUpdateEntity,
      item: {
        entity: {
          publicKey: entity!.publicKey,
          account: updatedEntity,
        },
      },
    });
    closeSnackbar();
    enqueueSnackbar(`Creation complete`, {
      variant: 'success',
      action: <ViewTransactionOnExplorerButton signature={tx} />,
    });
  };

  const redeemPoolTokens = async (
    amount: number,
    spt: PublicKey,
    label: string,
  ) => {
    enqueueSnackbar(
      `Initiating redemption for ${amount} ${label} Pool tokens`,
      {
        variant: 'info',
      },
    );
    const { tx, pendingWithdrawal } = await registryClient.startStakeWithdrawal(
      {
        member: member!.publicKey,
        amount: new u64(amount),
        entity: entity?.publicKey,
        registrar: registrar!.account,
        spt: spt,
      },
    );
    const updatedMember = await registryClient.accounts.member(
      member!.publicKey,
    );
    dispatch({
      type: ActionType.RegistrySetMember,
      item: {
        member: {
          publicKey: member!.publicKey,
          account: updatedMember,
        },
      },
    });
    const updatedEntity = await registryClient.accounts.entity(
      entity!.publicKey,
    );
    dispatch({
      type: ActionType.RegistryUpdateEntity,
      item: {
        entity: {
          publicKey: entity!.publicKey,
          account: updatedEntity,
        },
      },
    });
    const pwAccount = await registryClient.accounts.pendingWithdrawal(
      pendingWithdrawal,
    );
    dispatch({
      type: ActionType.RegistryCreatePendingWithdrawal,
      item: {
        memberPublicKey: member!.publicKey,
        pendingWithdrawal: {
          publicKey: pendingWithdrawal,
          account: pwAccount,
        },
      },
    });
    closeSnackbar();
    enqueueSnackbar(`Pending redemption ${pendingWithdrawal.toString()}`, {
      variant: 'success',
      action: <ViewTransactionOnExplorerButton signature={tx} />,
    });
  };

  const createSrmPool = async (shares: number) => {
    if (shares > 0) {
      await createPoolTokens(shares, member!.account.spt, 'SRM');
    }
  };
  const redeemSrmPool = async (shares: number) => {
    if (shares > 0) {
      await redeemPoolTokens(shares, member!.account.spt, 'SRM');
    }
  };

  const createMsrmPool = async (shares: number) => {
    if (shares > 0) {
      await createPoolTokens(shares, member!.account.sptMega, 'MSRM');
    }
  };
  const redeemMsrmPool = async (shares: number) => {
    if (shares > 0) {
      await redeemPoolTokens(shares, member!.account.sptMega, 'MSRM');
    }
  };

  return (
    <div style={{ display: 'flex', width: '100%' }}>
      <div style={{ flex: 1, marginTop: '24px', marginBottom: '24px' }}>
        {member && <MemberBalancesCard prices={prices} member={member} />}
        <PoolCard
          title={'Stake Pool'}
          pool={pool!}
          poolSharePrice={poolSharePrice}
          poolTokenMint={poolTokenMint!}
          assetsLabel={`${poolVault!.account.amount} SRM`}
          disabled={member === undefined}
          create={createSrmPool}
          redeem={redeemSrmPool}
        />
        <PoolCard
          title={'Mega Stake Pool'}
          pool={megaPool!}
          poolSharePrice={megaPoolSharePrice}
          poolTokenMint={megaPoolTokenMint!}
          assetsLabel={`${megaPoolVaults![0].account.amount} SRM, ${
            megaPoolVaults![1].account.amount
          } MSRM`}
          disabled={member === undefined}
          create={createMsrmPool}
          redeem={redeemMsrmPool}
        />
      </div>
      <RedemptionList
        style={{
          marginBottom: '24px',
        }}
      />
    </div>
  );
}

type MemberBalancesCardProps = {
  member: ProgramAccount<accounts.Member>;
  prices: PoolPrices;
};

function MemberBalancesCard(props: MemberBalancesCardProps) {
  const { member, prices } = props;
  const rows = [
    {
      token: 'SRM',
      balance: member.account.balances.currentDeposit.toString(),
    },
    {
      token: 'MSRM',
      balance: member.account.balances.currentMegaDeposit.toString(),
    },
  ];
  let value = prices.basket(member.account.balances.sptAmount, false)
    .quantities;
  let megaValue = prices.megaBasket(
    member.account.balances.sptMegaAmount,
    false,
  ).quantities;
  const poolRows = [
    {
      pool: 'Stake Pool',
      account: member.account.spt.toString(),
      shares: member.account.balances.sptAmount.toString(),
      value: `${value} SRM`,
    },
    {
      pool: 'Mega Stake Pool',
      account: member.account.sptMega.toString(),
      shares: member.account.balances.sptMegaAmount.toString(),
      value: `${megaValue[0]} SRM, ${megaValue[1]} MSRM`,
    },
  ];
  return (
    <Card
      style={{
        marginBottom: '24px',
      }}
    >
      <CardHeader
        title={'My Membership'}
        subheader={member.publicKey.toString()}
      />
      <CardContent
        style={{
          position: 'relative',
          paddingTop: 0,
          paddingBottom: '16px',
        }}
      >
        <div>
          <Typography style={{ fontWeight: 'bold' }}>
            Stake Pool Shares
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Pool</TableCell>
                  <TableCell align="left">Account</TableCell>
                  <TableCell align="right">Shares</TableCell>
                  <TableCell align="right">Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {poolRows.map(row => (
                  <TableRow key={row.pool}>
                    <TableCell component="th" scope="row">
                      {row.pool}
                    </TableCell>
                    <TableCell align="left">
                      <div style={{ width: '180px', overflowX: 'hidden' }}>
                        {row.account}
                      </div>
                    </TableCell>
                    <TableCell align="right">{row.shares}</TableCell>
                    <TableCell align="right">{row.value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
        <div style={{ marginTop: '16px', marginBottom: '40px' }}>
          <Typography style={{ fontWeight: 'bold' }}>
            Available Balances
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Token</TableCell>
                  <TableCell align="right">Balance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map(row => (
                  <TableRow key={row.token}>
                    <TableCell component="th" scope="row">
                      {row.token}
                    </TableCell>
                    <TableCell align="right">{row.balance}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
        <div
          style={{
            position: 'absolute',
            right: '16px',
            bottom: '16px',
            display: 'flex',
            flexDirection: 'row-reverse',
          }}
        >
          <Typography color="textSecondary">
            Generation {member.account.generation.toString()}
          </Typography>
        </div>
      </CardContent>
    </Card>
  );
}

type PoolCardProps = {
  title: string;
  pool: ProgramAccount<PoolState>;
  poolSharePrice: string;
  poolTokenMint: ProgramAccount<MintInfo>;
  assetsLabel: string;
  disabled: boolean;
  create: (shares: number) => void;
  redeem: (shares: number) => void;
};

function PoolCard(props: PoolCardProps) {
  const {
    title,
    create,
    redeem,
    pool,
    poolSharePrice,
    poolTokenMint,
    assetsLabel,
    disabled,
  } = props;
  const [srmPoolAmount, setSrmPoolAmount] = useState<null | number>(null);

  return (
    <Card
      style={{
        marginBottom: '24px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <CardHeader title={title} subheader={pool.publicKey.toString()} />
        <div
          style={{
            paddingRight: '16px',
            display: 'flex',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <Typography color="textSecondary"></Typography>
        </div>
      </div>
      <CardContent>
        <div
          style={{
            marginBottom: '16px',
          }}
        >
          <Typography style={{ fontWeight: 'bold' }}>Pool Token</Typography>
          <Typography>Mint: {poolTokenMint.publicKey.toString()}</Typography>
          <Typography>
            Outstanding: {poolTokenMint.account.supply.toString()}
          </Typography>
          <Typography style={{ marginTop: '10px', fontWeight: 'bold' }}>
            Pool Assets
          </Typography>
          <Typography>Total basket: {assetsLabel}</Typography>
          <Typography>Price per share: {poolSharePrice}</Typography>
        </div>
        <div style={{ width: '190px' }}>
          <div style={{ marginBottom: '10px' }}>
            <FormControl>
              <TextField
                style={{ width: '100%' }}
                label="Shares"
                type="number"
                variant="outlined"
                onChange={e => setSrmPoolAmount(parseInt(e.target.value))}
              />
            </FormControl>
          </div>
          <div>
            <Button
              disabled={disabled || srmPoolAmount === null || srmPoolAmount < 1}
              color="primary"
              variant="contained"
              onClick={() => create(srmPoolAmount as number)}
            >
              Create
            </Button>
            <Button
              disabled={disabled || srmPoolAmount === null || srmPoolAmount < 1}
              color="secondary"
              variant="contained"
              style={{ marginLeft: '10px' }}
              onClick={() => redeem(srmPoolAmount as number)}
            >
              Redeem
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type RedemptionListProps = {
  style: any;
};

function RedemptionList(props: RedemptionListProps) {
  const { pendingWithdrawals, member } = useSelector((state: StoreState) => {
    const member = state.registry.member;
    return {
      member,
      pendingWithdrawals: member
        ? state.registry.pendingWithdrawals.get(member.publicKey.toString())
        : [],
    };
  });
  return (
    <div style={props.style}>
      <Card
        style={{
          marginLeft: '20px',
          marginTop: '24px',
          width: '294px',
        }}
      >
        <CardContent
          style={{
            paddingLeft: 0,
            paddingRight: 0,
            paddingBottom: 0,
            paddingTop: 0,
          }}
        >
          <div
            style={{
              marginLeft: '24px',
              marginTop: '24px',
              marginRight: '24px',
              borderBottom: 'solid 1pt #ccc',
              paddingBottom: '12px',
            }}
          >
            <Typography style={{}}>Redemptions</Typography>
          </div>
          <div style={{ paddingLeft: '24px', paddingRight: '24px' }}>
            {pendingWithdrawals && pendingWithdrawals.length > 0 ? (
              pendingWithdrawals.map((pw, idx) => {
                return (
                  <div
                    style={{
                      paddingBottom:
                        idx !== pendingWithdrawals!.length - 1
                          ? '12px'
                          : '24px',
                      paddingTop: '12px',
                      borderBottom: 'solid 1pt #ccc',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <Typography
                          style={{ fontWeight: 'bold', fontSize: '14px' }}
                        >
                          {`${pw.account.sptAmount}`} shares
                        </Typography>
                      </div>
                      <div>
                        <PendingWithdrawalButton
                          member={member!}
                          pendingWithdrawal={pw}
                        />
                      </div>
                    </div>
                    <Typography style={{ fontSize: '14px' }}>
                      {`${pw.account.payment.assetAmount} SRM, ${pw.account.payment.megaAssetAmount} MSRM`}
                    </Typography>
                    <Typography style={{ fontSize: '14px' }}>
                      {`Start: ${new Date(
                        pw.account.startTs.toNumber() * 1000,
                      ).toLocaleString()}`}
                    </Typography>
                    <Typography style={{ fontSize: '14px' }}>
                      {`End:   ${new Date(
                        pw.account.endTs.toNumber() * 1000,
                      ).toLocaleString()}`}
                    </Typography>
                    <Typography
                      color="textSecondary"
                      style={{
                        fontSize: '14px',
                        overflow: 'hidden',
                      }}
                    >
                      {pw.account.pool.toString()}
                    </Typography>
                  </div>
                );
              })
            ) : (
              <div
                style={{
                  paddingBottom: '24px',
                  paddingTop: '12px',
                }}
              >
                <Typography color="textSecondary" style={{ fontSize: '14px' }}>
                  None found
                </Typography>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

type PendingWithdrawalButtonProps = {
  pendingWithdrawal: ProgramAccount<accounts.PendingWithdrawal>;
  member: ProgramAccount<accounts.Member>;
};

function PendingWithdrawalButton(props: PendingWithdrawalButtonProps) {
  const { pendingWithdrawal, member } = props;
  const { registryClient } = useWallet();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const dispatch = useDispatch();

  const endPendingWithdrawal = async () => {
    enqueueSnackbar(`Completing redemption`, {
      variant: 'info',
    });
    const { tx } = await registryClient.endStakeWithdrawal({
      member: member.publicKey,
      pendingWithdrawal: pendingWithdrawal.publicKey,
      entity: member.account.entity,
    });

    const updatedPendingWithdrawal = {
      publicKey: pendingWithdrawal.publicKey,
      account: {
        ...pendingWithdrawal.account,
        burned: true,
      },
    };
    const updatedMember = await registryClient.accounts.member(
      member.publicKey,
    );
    const updatedEntity = await registryClient.accounts.entity(
      member.account.entity,
    );

    dispatch({
      type: ActionType.RegistrySetMember,
      item: {
        member: {
          publicKey: member!.publicKey,
          account: updatedMember,
        },
      },
    });
    dispatch({
      type: ActionType.RegistryUpdateEntity,
      item: {
        entity: {
          publicKey: member.account.entity,
          account: updatedEntity,
        },
      },
    });
    dispatch({
      type: ActionType.RegistryUpdatePendingWithdrawal,
      item: {
        memberPublicKey: member!.publicKey,
        pendingWithdrawal: updatedPendingWithdrawal,
      },
    });

    closeSnackbar();
    enqueueSnackbar(`Redemption completed`, {
      variant: 'success',
      action: <ViewTransactionOnExplorerButton signature={tx} />,
    });
  };

  let disabled = false;
  let color = skin.instance().ready;
  let onClick = async () => endPendingWithdrawal();
  if (pendingWithdrawal.account.burned) {
    disabled = true;
    color = skin.instance().active;
    onClick = async () => {};
  }

  if (pendingWithdrawal.account.endTs.toNumber() > Date.now() / 1000) {
    disabled = true;
    color = skin.instance().notReady;
    onClick = async () => {};
  }

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column',
      }}
    >
      <IconButton disabled={disabled} style={{ width: '25px', height: '25px' }}>
        <CheckCircleIcon style={{ color, fontSize: '20px' }} />
      </IconButton>
    </div>
  );
}

type PoolPricesConfig = {
  poolVault: TokenAccount;
  poolTokenMint: MintInfo;
  megaPoolVaults: TokenAccount[];
  megaPoolTokenMint: MintInfo;
};

export class PoolPrices {
  private poolVault: TokenAccount;
  private poolTokenMint: MintInfo;
  private megaPoolVaults: TokenAccount[];
  private megaPoolTokenMint: MintInfo;

  constructor(cfg: PoolPricesConfig) {
    this.poolVault = cfg.poolVault!;
    this.poolTokenMint = cfg.poolTokenMint!;
    this.megaPoolVaults = cfg.megaPoolVaults!;
    this.megaPoolTokenMint = cfg.megaPoolTokenMint!;
  }

  // TODO: replace these methods with `getPoolBasket` from the pool package.
  basket(sptAmount: BN, roundUp: boolean): Basket {
    if (this.poolTokenMint.supply.toNumber() === 0) {
      return { quantities: [new u64(sptAmount)] };
    }
		// TODO: need to more thoughtfully handle the case where the token supply
		//       resets *and* there exists rewards in the pool.
    return {
      quantities: [
        this.poolVault.amount
          .mul(sptAmount)
          .add(roundUp ? this.poolTokenMint.supply.sub(new BN(1)) : new BN(0))
          .div(this.poolTokenMint.supply),
      ],
    };
  }
  // TODO: replace these methods with `getPoolBasket` from the pool package.
  megaBasket(sptAmount: BN, roundUp: boolean): Basket {
    if (this.megaPoolVaults.length !== 2) {
      throw new Error('invariant violation');
    }
    if (this.poolTokenMint.supply.toNumber() === 0) {
      return { quantities: [new u64(0), new u64(sptAmount)] };
    }
    const quantities = this.megaPoolVaults.map(v => {
      return v.amount
        .mul(sptAmount)
        .add(roundUp ? this.megaPoolTokenMint.supply.sub(new BN(1)) : new BN(0))
        .div(this.megaPoolTokenMint.supply);
    });
    return {
      quantities,
    };
  }
}
