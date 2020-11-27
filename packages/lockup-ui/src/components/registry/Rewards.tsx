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
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import FormHelperText from '@material-ui/core/FormHelperText';
import Paper from '@material-ui/core/Paper';
import * as registry from '@project-serum/registry';
import { PublicKey } from '@solana/web3.js';
import { useWallet } from '../../components/common/WalletProvider';
import OwnedTokenAccountsSelect from '../common/OwnedTokenAccountsSelect';
import { ViewTransactionOnExplorerButton } from '../common/Notification';
import { State as StoreState } from '../../store/reducer';
import AppBar from '@material-ui/core/AppBar';

export default function Rewards() {
  const { rewardEventQueue } = useSelector((state: StoreState) => {
    return {
      rewardEventQueue: state.registry.rewardEventQueue,
    };
  });
  const rewards = rewardEventQueue!.account.messages();
  return (
    <div style={{ width: '100%', marginTop: '24px' }}>
        <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
          <Typography style={{ fontWeight: 'bold', fontSize: '20px', }}>Reward History</Typography>
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
    return <div> </div>;
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
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const { registryClient } = useWallet();
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
  const { open, onClose } = props;
  const [poolTab, setPoolTab] = useState(PoolTabViewModel.Srm);
  const [srmFromAccount, setSrmFromAccount] = useState<null | PublicKey>(null);
  const [msrmFromAccount, setMsrmFromAccount] = useState<null | PublicKey>(
    null,
  );
  const [rewardAmount, setRewardAmount] = useState<null | number>(null);
  const [rewardMegaAmount, setRewardMegaAmount] = useState<null | number>(null);
  const [isLockedTab, setIsLockedTab] = useState(LockedTabViewModel.Unlocked);
  const isLocked = isLockedTab === LockedTabViewModel.Locked;
  const [lockedRewardAmount, setLockedRewardAmount] = useState<null | number>(
    null,
  );
  const [endLockedTimestamp, setLockedEndTimestamp] = useState<null | number>(
    null,
  );
  const [lockedVendor, setLockedVendor] = useState<null | string>(null);

  const isSendEnabled = (() => {
    // todo
    return true;
  })();
  const sendRewards = async () => {
    enqueueSnackbar('Dropping rewards...', {
      variant: 'info',
    });

    let { tx } = await registryClient.dropPoolReward({
      pool:
        poolTab === PoolTabViewModel.Srm ? pool.publicKey : megaPool.publicKey,
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
    closeSnackbar();
    enqueueSnackbar('Dropping rewards...', {
      variant: 'info',
      action: <ViewTransactionOnExplorerButton signature={tx} />,
    });

    onClose();
  };

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
        <div>
          <Tabs value={isLockedTab} onChange={(_e, t) => setIsLockedTab(t)}>
            <Tab value={LockedTabViewModel.Unlocked} label="Unlocked" />
            <Tab value={LockedTabViewModel.Locked} label="Locked" />
          </Tabs>
        </div>
        <div style={{ marginTop: '10px' }}>
          <Tabs value={poolTab} onChange={(_e, t) => setPoolTab(t)}>
            <Tab value={PoolTabViewModel.Srm} label="Pool" />
            <Tab value={PoolTabViewModel.Msrm} label="Mega Pool" />
          </Tabs>
        </div>
        {isLocked && (
          <div>
            <TextField
              style={{ marginTop: '10px' }}
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
            <TextField
              style={{ marginTop: '10px' }}
              fullWidth
              label="End date"
              type="date"
              InputLabelProps={{
                shrink: true,
              }}
              onChange={e => {
                const d = new Date(e.target.value);
                setLockedEndTimestamp(d.getTime() / 1000);
              }}
            />
            <TextField
              style={{ marginTop: '10px' }}
              fullWidth
              label="Locked Vendor"
              value={lockedVendor}
              onChange={e => setLockedVendor(e.target.value)}
            />
            <FormHelperText>
              Vendor account for distributing locked rewards
            </FormHelperText>
          </div>
        )}
        {!isLocked && (
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
                  onChange={e =>
                    setRewardAmount(parseInt(e.target.value) as number)
                  }
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
          </>
        )}
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => sendRewards()}
            type="submit"
            color="primary"
            disabled={!isSendEnabled}
          >
            Send
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
