import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import BN from 'bn.js';
import { useSnackbar } from 'notistack';
import Dialog from '@material-ui/core/Dialog';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Collapse from '@material-ui/core/Collapse';
import Button from '@material-ui/core/Button';
import Tabs from '@material-ui/core/Tabs';
import MenuItem from '@material-ui/core/MenuItem';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import FormHelperText from '@material-ui/core/FormHelperText';
import Paper from '@material-ui/core/Paper';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import * as registry from '@project-serum/registry';
import { PublicKey } from '@solana/web3.js';
import { Network } from '@project-serum/common';
import { TransactionSignature } from '@solana/web3.js';
import { useWallet } from '../../components/common/WalletProvider';
import OwnedTokenAccountsSelect from '../common/OwnedTokenAccountsSelect';
import { ViewTransactionOnExplorerButton } from '../common/Notification';
import { State as StoreState } from '../../store/reducer';
import AppBar from '@material-ui/core/AppBar';
import * as notification from '../common/Notification';

export default function Rewards() {
  const { rewardEventQueue } = useSelector((state: StoreState) => {
    return {
      rewardEventQueue: state.registry.rewardEventQueue,
    };
  });
  const rewards = rewardEventQueue!.account.messages();
  return (
    <div style={{ width: '100%', marginTop: '24px' }}>
      <div
        style={{
          marginBottom: '10px',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Typography style={{ fontWeight: 'bold', fontSize: '20px' }}>
          Reward History
        </Typography>
        <div>
          <DropButton />
        </div>
      </div>
      <Paper>
        <List>
          {rewards.map(r => {
            return <RewardListItem reward={r} />;
          })}
        </List>
      </Paper>
    </div>
  );
}

function DropButton() {
  const [showDialog, setShowDialog] = useState(false);
  return (
    <>
      <div onClick={() => setShowDialog(true)}>
        <Button variant="contained" color="secondary">
          Drop Rewards
        </Button>
      </div>
      <DropRewardsDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
      />
    </>
  );
}

type DropRewardsDialogProps = {
  open: boolean;
  onClose: () => void;
};

type RewardListItemProps = {
  reward: registry.accounts.RewardEvent;
};

function RewardListItem(props: RewardListItemProps) {
  const { reward } = props;
  if (reward.poolDrop !== undefined) {
    return <PoolDropReward poolDrop={reward.poolDrop} />;
  } else {
    return <div>{JSON.stringify(reward)}</div>;
  }
}

type PoolDropRewardProps = {
  poolDrop: registry.accounts.PoolDrop;
};

function PoolDropReward(props: PoolDropRewardProps) {
  const { poolDrop } = props;
  let amountLabel = `${poolDrop.totals[0].toString()} SRM`;
  if (poolDrop.totals.length === 2) {
    amountLabel += ` ${poolDrop.totals[1].toString()} MSRM`;
  }
  let lockedLabel = 'unlocked';
  let fromLabel = poolDrop.from.toString();
  return (
    <>
      <ListItem>
        <ListItemText
          primary={<>{`${amountLabel} ${lockedLabel}`}</>}
          secondary={fromLabel}
        />
      </ListItem>
    </>
  );
}

enum PoolTabViewModel {
  Srm,
  Msrm,
}

enum LockedTabViewModel {
  Locked,
  Unlocked,
}

function DropRewardsDialog(props: DropRewardsDialogProps) {
  const { open, onClose } = props;

  // Commons state (header).
  const [poolTab, setPoolTab] = useState(PoolTabViewModel.Srm);
  const [isLockedTab, setIsLockedTab] = useState(LockedTabViewModel.Unlocked);
  const isLocked = isLockedTab === LockedTabViewModel.Locked;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h4" component="h2">
            {'Drop Rewards'}
          </Typography>
        </div>
      </DialogTitle>
      <DialogContent>
        <Tabs value={isLockedTab} onChange={(_e, t) => setIsLockedTab(t)}>
          <Tab value={LockedTabViewModel.Unlocked} label="Unlocked" />
          <Tab value={LockedTabViewModel.Locked} label="Locked" />
        </Tabs>
        <Tabs
          style={{ marginTop: '10px' }}
          value={poolTab}
          onChange={(_e, t) => setPoolTab(t)}
        >
          <Tab value={PoolTabViewModel.Srm} label="Pool" />
          <Tab value={PoolTabViewModel.Msrm} label="Mega Pool" />
        </Tabs>
        {isLocked ? (
          <DropLockedForm onClose={onClose} poolTab={poolTab} />
        ) : (
          <DropUnlockedForm onClose={onClose} poolTab={poolTab} />
        )}
      </DialogContent>
    </Dialog>
  );
}

type DropUnlockedFormProps = {
  onClose: () => void;
  poolTab: PoolTabViewModel;
};

function DropLockedForm(props: DropUnlockedFormProps) {
  const { onClose, poolTab } = props;
  const snack = useSnackbar();
  const { registryClient } = useWallet();
  const { network, pool, megaPool, poolTokenMint, megaPoolTokenMint } = useSelector((state: StoreState) => {
    return {
			network: state.common.network,
			pool: state.registry.pool!,
			poolTokenMint: state.registry.poolTokenMint!,
			megaPool: state.registry.megaPool!,
			megaPoolTokenMint: state.registry.megaPoolTokenMint!,
		};
  });

  // Locked reward state.
  const [lockedRewardAmount, setLockedRewardAmount] = useState<null | number>(
    null,
  );
  const [expiryTs, setExpiryTs] = useState<null | number>(
    null,
  );
	const [expiryReceiver, setExpiryReceiver] = useState(registryClient.provider.wallet.publicKey.toString());
  const [depositor, setDepositor] = useState<null | PublicKey>(null);
	const [mintLabel, setMintLabel] = useState('srm');
  const [mint, setMint] = useState<null | PublicKey>(network.srm);

  const isSendEnabled = mint !== null
										 && depositor !== null
										 && lockedRewardAmount !== null
										 && expiryTs !== null;

  const sendLockedRewards = async () => {
		await notification.withTx(snack, 'Dropping locked reward...', 'Locked reward dropped', async () => {
			let { tx } = await registryClient.dropLockedReward({
				total: new BN(lockedRewardAmount as number),
				expiryTs: new BN(expiryTs as number),
				expiryReceiver: new PublicKey(expiryReceiver as string),
				depositor: depositor as PublicKey,
				depositorMint: mint as PublicKey,
				pool: (poolTab === PoolTabViewModel.Srm) ? pool.publicKey : megaPool.publicKey,
				poolTokenMint: (poolTab === PoolTabViewModel.Srm) ? poolTokenMint.publicKey : megaPoolTokenMint.publicKey,
			});
			return tx;
		});
    onClose();
  };

  return (
    <>
      <div>
        <div style={{ display: 'flex', marginTop: '10px' }}>
          <div style={{ flex: 1 }}>
            <OwnedTokenAccountsSelect
              style={{ height: '100%' }}
              mint={mint}
              onChange={(f: PublicKey) => setDepositor(f)}
            />
            <FormHelperText>Account to send from</FormHelperText>
          </div>
          <div>
            <FormControl
              variant="outlined"
              style={{ width: '200px', marginLeft: '10px', marginTop: '10px' }}
            >
              <InputLabel>Mint</InputLabel>
              <Select
                value={mintLabel}
                onChange={e => {
                  const m = e.target.value;
                  setMintLabel(m as string);
                  if (m === 'srm') {
                    setMint(network.srm);
                  } else if (m === 'msrm') {
                    setMint(network.msrm);
                  }
                }}
                label="Mint"
              >
                <MenuItem value="srm">SRM</MenuItem>
                <MenuItem value="msrm">MSRM</MenuItem>
              </Select>
            </FormControl>
          </div>
          <div>
            <TextField
              style={{ marginLeft: '10px', marginTop: '10px' }}
              id="outlined-number"
              label="Amount"
              type="number"
              InputLabelProps={{
                shrink: true,
              }}
              variant="outlined"
              onChange={e =>
                setLockedRewardAmount(parseInt(e.target.value) as number)
              }
              InputProps={{ inputProps: { min: 0 } }}
            />
          </div>
    </div>
    <TextField
    style={{ marginTop: '37px', width: '100%' }}
    label="Expiry Receiver"
    variant="outlined"
		value={expiryReceiver}
    onChange={e => setExpiryReceiver(e.target.value as string)}
    />
        <TextField
          style={{ marginTop: '10px' }}
          fullWidth
          label="Expiry date"
          type="date"
          InputLabelProps={{
            shrink: true,
          }}
          onChange={e => {
            const d = new Date(e.target.value);
            setExpiryTs(d.getTime() / 1000);
          }}
        />
      </div>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={() => sendLockedRewards()}
          type="submit"
          color="primary"
          disabled={!isSendEnabled}
        >
          Send
        </Button>
      </DialogActions>
    </>
  );
}

type DropLockedFormProps = {
  poolTab: PoolTabViewModel;
  onClose: () => void;
};

function DropUnlockedForm(props: DropLockedFormProps) {
  const { poolTab, onClose } = props;
  const snack = useSnackbar();
  const { network, pool, poolVault, megaPool, megaPoolVaults } = useSelector(
    (state: StoreState) => {
      return {
        network: state.common.network,
        pool: state.registry.pool!,
        poolVault: state.registry.poolVault!,
        megaPool: state.registry.megaPool!,
        megaPoolVaults: state.registry.megaPoolVaults!,
      };
    },
  );
  const { registryClient } = useWallet();
  const [srmFromAccount, setSrmFromAccount] = useState<null | PublicKey>(null);
  const [msrmFromAccount, setMsrmFromAccount] = useState<null | PublicKey>(
    null,
  );
  const [rewardAmount, setRewardAmount] = useState<null | number>(null);
  const [rewardMegaAmount, setRewardMegaAmount] = useState<null | number>(null);

  const sendUnlockedRewards = async () => {
    await notification.withTx(
      snack,
      'Dropping unlocked reward...',
      'Unlocked reward dropped',
      async () => {
        let { tx } = await registryClient.dropPoolReward({
          pool:
            poolTab === PoolTabViewModel.Srm
              ? pool.publicKey
              : megaPool.publicKey,
          srmDepositor: srmFromAccount as PublicKey,
          msrmDepositor:
            poolTab === PoolTabViewModel.Msrm
              ? (msrmFromAccount as PublicKey)
              : undefined,
          srmAmount: new BN(rewardAmount!),
          msrmAmount:
            poolTab === PoolTabViewModel.Msrm
              ? new BN(rewardMegaAmount!)
              : undefined,
          poolSrmVault:
            poolTab === PoolTabViewModel.Msrm
              ? megaPoolVaults[0].publicKey
              : poolVault.publicKey,
          poolMsrmVault:
            poolTab === PoolTabViewModel.Msrm
              ? megaPoolVaults[1].publicKey
              : undefined,
        });
        return tx;
      },
    );
    onClose();
  };

  const isSendEnabled = (() => {
    // todo
    return true;
  })();

  return (
    <>
      <div>
        <div style={{ display: 'flex', marginBottom: '10px' }}>
          <div style={{ flex: 1 }}>
            <OwnedTokenAccountsSelect
              style={{ height: '100%' }}
              mint={network.srm}
              onChange={(f: PublicKey) => setSrmFromAccount(f)}
            />
            <FormHelperText>SRM account to send from</FormHelperText>
          </div>
          <TextField
            style={{ width: '200px', marginLeft: '24px' }}
            id="outlined-number"
            label="Amount"
            type="number"
            InputLabelProps={{
              shrink: true,
            }}
            variant="outlined"
            onChange={e => setRewardAmount(parseInt(e.target.value) as number)}
            InputProps={{ inputProps: { min: 0 } }}
          />
        </div>
        {poolTab === PoolTabViewModel.Msrm && (
          <div style={{ display: 'flex' }}>
            <div style={{ flex: 1 }}>
              <OwnedTokenAccountsSelect
                style={{ height: '100%' }}
                mint={network.msrm}
                onChange={(f: PublicKey) => setMsrmFromAccount(f)}
              />
              <FormHelperText>MSRM account to send from</FormHelperText>
            </div>
            <TextField
              style={{ width: '200px', marginLeft: '24px' }}
              id="outlined-number"
              label="Amount"
              type="number"
              InputLabelProps={{
                shrink: true,
              }}
              variant="outlined"
              onChange={e =>
                setRewardMegaAmount(parseInt(e.target.value) as number)
              }
              InputProps={{ inputProps: { min: 0 } }}
            />
          </div>
        )}
      </div>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={() => sendUnlockedRewards()}
          type="submit"
          color="primary"
          disabled={!isSendEnabled}
        >
          Send
        </Button>
      </DialogActions>
    </>
  );
}
