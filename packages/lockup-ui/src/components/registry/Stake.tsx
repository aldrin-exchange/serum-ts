import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSnackbar } from 'notistack';
import BN from 'bn.js';
import Container from '@material-ui/core/Container';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import { TransitionProps } from '@material-ui/core/transitions';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import InputLabel from '@material-ui/core/InputLabel';
import Slide from '@material-ui/core/Slide';
import FormHelperText from '@material-ui/core/FormHelperText';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { PublicKey } from '@solana/web3.js';
import { accounts, Client } from '@project-serum/registry';
import { useWallet } from '../../components/common/WalletProvider';
import OwnedTokenAccountsSelect from '../../components/common/OwnedTokenAccountsSelect';
import { ViewTransactionOnExplorerButton } from '../../components/common/Notification';
import { State as StoreState, ProgramAccount } from '../../store/reducer';
import { ActionType } from '../../store/actions';
import EntityGallery, { EntityActivityLabel } from './EntityGallery';
import Me from './Me';
import Rewards from './Rewards';

enum TabModel {
  Me,
  EntityGallery,
  Rewards,
}

export default function Stake() {
  const [tab, setTab] = useState(TabModel.Me);
  return (
    <div>
      <MyNodeBanner setTab={setTab} />
      <Container fixed maxWidth="md" style={{ flex: 1, display: 'flex' }}>
        {tab === TabModel.Me && <Me />}
        {tab === TabModel.EntityGallery && <EntityGallery />}
        {tab === TabModel.Rewards && <Rewards />}
      </Container>
    </div>
  );
}

type MyNodeBannerProps = {
  setTab: (t: TabModel) => void;
};

function MyNodeBanner(props: MyNodeBannerProps) {
  const [tab, setTab] = useState(TabModel.Me);
  const { registryClient } = useWallet();
  const { member, entity, registrar } = useSelector((state: StoreState) => {
    const member = state.registry.member;
    return {
      registrar: state.registry.registrar,
      member: state.registry.member,
      entity: state.registry.entities
        .filter(
          e =>
            state.registry.member &&
            e.publicKey.toString() ===
              state.registry.member!.account.entity.toString(),
        )
        .pop(),
      pendingWithdrawals: member
        ? state.registry.pendingWithdrawals.get(member.publicKey.toString())
        : [],
    };
  });
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);

  return (
    <>
      <div
        style={{
          backgroundColor: '#fff',
          paddingTop: '24px',
          borderBottom: 'solid 1pt #ccc',
        }}
      >
        <Container
          fixed
          maxWidth="md"
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <Typography variant="h4" style={{ marginBottom: '10px' }}>
                My Node
              </Typography>
            </div>
            {entity && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  flexDirection: 'column',
                }}
              >
                <EntityActivityLabel
                  noBubble={true}
                  textStyle={{ fontSize: '16px' }}
                  entity={entity}
                />
              </div>
            )}
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <Typography>
                {member
                  ? member?.account.entity.toString()
                  : 'Account not found. Please create a stake account.'}
              </Typography>
              <Typography color="textSecondary">
                Generation {member ? entity?.account.generation.toString() : 0}
              </Typography>
            </div>
            <div>
              <div>
                <Button
                  disabled={member === undefined}
                  onClick={() => setShowDepositDialog(true)}
                  variant="outlined"
                  color="primary"
                  style={{ marginRight: '10px' }}
                >
                  <ArrowDownwardIcon style={{ fontSize: '20px' }} />
                  <Typography style={{ marginLeft: '5px', marginRight: '5px' }}>
                    Deposit
                  </Typography>
                </Button>
                <Button
                  disabled={member === undefined}
                  variant="outlined"
                  color="primary"
                  onClick={() => setShowWithdrawDialog(true)}
                >
                  <ArrowUpwardIcon style={{ fontSize: '20px' }} />
                  <Typography style={{ marginLeft: '5px', marginRight: '5px' }}>
                    Withdraw
                  </Typography>
                </Button>
              </div>
            </div>
          </div>
        </Container>
        <div
          style={{
            maxWidth: '960px',
            marginLeft: 'auto',
            marginRight: 'auto',
            paddingLeft: '24px',
            paddingRight: '24px',
            marginTop: '10px',
          }}
        >
          <Tabs
            value={tab}
            onChange={(_e, t) => {
              setTab(t);
              props.setTab(t);
            }}
          >
            <Tab value={TabModel.Me} label="Me" />
            <Tab value={TabModel.EntityGallery} label="Nodes" />
            <Tab value={TabModel.Rewards} label="Rewards" />
          </Tabs>
        </div>
      </div>
      {member !== undefined && (
        <>
          <DepositDialog
            registrar={registrar!}
            client={registryClient}
            member={member}
            open={showDepositDialog}
            onClose={() => setShowDepositDialog(false)}
          />
          <WithdrawDialog
            registrar={registrar!}
            client={registryClient}
            member={member}
            open={showWithdrawDialog}
            onClose={() => setShowWithdrawDialog(false)}
          />
        </>
      )}
    </>
  );
}

type DepositDialogProps = {
  member: ProgramAccount<accounts.Member>;
  registrar: ProgramAccount<accounts.Registrar>;
  client: Client;
  open: boolean;
  onClose: () => void;
};

function DepositDialog(props: DepositDialogProps) {
  const { client, registrar, member, open, onClose } = props;
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const dispatch = useDispatch();
  return (
    <TransferDialog
      title={'Deposit'}
      contextText={'Select the amount and coin you want to deposit'}
      open={open}
      onClose={onClose}
      onTransfer={async (from: PublicKey, amount: number, coin: string) => {
        enqueueSnackbar(
          `Depositing ${amount} ${coin} from ${from.toString()}`,
          {
            variant: 'info',
          },
        );
        const { tx } = await client.deposit({
          member: member.publicKey,
          depositor: from,
          amount: new BN(amount),
          entity: member.account.entity,
          vault:
            coin === 'srm'
              ? registrar.account.vault
              : registrar.account.megaVault,
        });
        const newMember = await client.accounts.member(member.publicKey);
        const newEntity = await client.accounts.entity(member.account.entity);
        dispatch({
          type: ActionType.RegistrySetMember,
          item: {
            member: {
              publicKey: member.publicKey,
              account: newMember,
            },
          },
        });
        dispatch({
          type: ActionType.RegistryUpdateEntity,
          item: {
            entity: {
              publicKey: member.account.entity,
              account: newEntity,
            },
          },
        });
        closeSnackbar();
        enqueueSnackbar(`Deposit complete`, {
          variant: 'success',
          action: <ViewTransactionOnExplorerButton signature={tx} />,
        });
        onClose();
      }}
    />
  );
}

type WithdrawDialogProps = DepositDialogProps;

function WithdrawDialog(props: WithdrawDialogProps) {
  const { client, registrar, member, open, onClose } = props;
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const dispatch = useDispatch();
  return (
    <TransferDialog
      title={'Withdraw'}
      contextText={'Select the amount and coin you want to withdraw'}
      open={open}
      onClose={onClose}
      onTransfer={async (from: PublicKey, amount: number, coin: string) => {
        enqueueSnackbar(`Withdrawing ${amount} ${coin} to ${from.toString()}`, {
          variant: 'info',
        });
        const { tx } = await client.withdraw({
          member: member.publicKey,
          depositor: from,
          amount: new BN(amount),
          entity: member.account.entity,
          vault:
            coin === 'srm'
              ? registrar.account.vault
              : registrar.account.megaVault,
          vaultOwner: await client.accounts.vaultAuthority(
            client.programId,
            client.registrar,
            registrar.account,
          ),
        });
        const newMember = await client.accounts.member(member.publicKey);
        const newEntity = await client.accounts.entity(member.account.entity);
        dispatch({
          type: ActionType.RegistrySetMember,
          item: {
            member: {
              publicKey: member.publicKey,
              account: newMember,
            },
          },
        });
        dispatch({
          type: ActionType.RegistryUpdateEntity,
          item: {
            entity: {
              publicKey: member.account.entity,
              account: newEntity,
            },
          },
        });
        closeSnackbar();
        enqueueSnackbar(`Withdraw complete`, {
          variant: 'success',
          action: <ViewTransactionOnExplorerButton signature={tx} />,
        });
        onClose();
      }}
    />
  );
}

type TransferDialogProps = {
  title: string;
  contextText: string;
  open: boolean;
  onClose: () => void;
  onTransfer: (from: PublicKey, amount: number, coin: string) => void;
};

function TransferDialog(props: TransferDialogProps) {
  const { srmMint, msrmMint } = useSelector((state: StoreState) => {
    const network = state.common.network;
    return {
      srmMint: network.srm,
      msrmMint: network.msrm,
    };
  });
  const { open, onClose, onTransfer, title, contextText } = props;
  const [amount, setAmount] = useState<null | number>(null);
  const [coin, setCoin] = useState<null | string>(null);
  const [from, setFrom] = useState<null | PublicKey>(null);
  const mint = !coin ? undefined : coin === 'srm' ? srmMint : msrmMint;

  return (
    <div>
      <Dialog
        open={open}
        TransitionComponent={Transition}
        keepMounted
        onClose={onClose}
        fullWidth
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <div style={{ display: 'flex' }}>
            <div style={{ flex: 1 }}>
              <TextField
                style={{ width: '100%' }}
                id="outlined-number"
                label="Amount"
                type="number"
                InputLabelProps={{
                  shrink: true,
                }}
                variant="outlined"
                onChange={e => setAmount(parseInt(e.target.value) as number)}
                InputProps={{ inputProps: { min: 0 } }}
              />
              <FormHelperText>{contextText}</FormHelperText>
            </div>
            <div>
              <FormControl
                variant="outlined"
                style={{ width: '100px', marginLeft: '10px' }}
              >
                <InputLabel>Coin</InputLabel>
                <Select
                  value={coin}
                  onChange={e => setCoin(e.target.value as string)}
                  label="Coin"
                >
                  <MenuItem value="srm">SRM</MenuItem>
                  <MenuItem value="msrm">MSRM</MenuItem>
                </Select>
              </FormControl>
            </div>
          </div>
          <FormControl fullWidth>
            <OwnedTokenAccountsSelect
              variant="outlined"
              mint={mint}
              onChange={(f: PublicKey) => setFrom(f)}
            />
            <FormHelperText>Token account to transfer to/from</FormHelperText>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary">
            Cancel
          </Button>
          <Button
            //@ts-ignore
            onClick={() => onTransfer(from, amount, coin)}
            color="primary"
            disabled={!from || !amount || !coin}
          >
            {title}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children?: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});
