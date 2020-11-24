import React from 'react';
import { useSelector } from 'react-redux';
import ChartistGraph from 'react-chartist';
import { FixedScaleAxis, IChartOptions, Interpolation } from 'chartist';
import { Link as RouterLink } from 'react-router-dom';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import Container from '@material-ui/core/Container';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Link from '@material-ui/core/Link';
import Button from '@material-ui/core/Button';
import { accounts } from '@project-serum/lockup';
import { Network } from '@project-serum/common';
import { useWallet } from '../../components/common/WalletProvider';
import { ProgramAccount, State as StoreState } from '../../store/reducer';

export default function Vestings() {
  const { wallet } = useWallet();
  const { vestingAccounts, network } = useSelector((state: StoreState) => {
    return {
      vestingAccounts: state.lockup.vestings,
      network: state.common.network,
    };
  });
  const urlSuffix = `?cluster=${network.explorerClusterSuffix}`;
  return (
    <Container fixed maxWidth="md" style={{ flex: 1 }}>
      <div style={{ marginTop: '24px', marginBottom: '24px' }}>
        <link
          rel="stylesheet"
          href="//cdn.jsdelivr.net/chartist.js/latest/chartist.min.css"
        />
        <script src="//cdn.jsdelivr.net/chartist.js/latest/chartist.min.js"></script>
        {wallet.publicKey && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                flexDirection: 'column',
              }}
            >
              <Typography
                style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                }}
              >
                My Vesting Accounts
              </Typography>
            </div>
            <div>
              <RouterLink
                to={'/lockup/vesting/new'}
                style={{ color: 'inherit', textDecoration: 'none' }}
              >
                <Button variant="contained" color="secondary">
                  New
                </Button>
              </RouterLink>
            </div>
          </div>
        )}
        <Card>
          <CardContent style={{ paddingBottom: '16px' }}>
            {wallet.publicKey ? (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <Typography variant="h5">Beneficiary</Typography>
                  <Typography style={{ fontSize: '16px' }}>
                    <Link
                      href={
                        `https://explorer.solana.com/account/${wallet.publicKey.toBase58()}` +
                        urlSuffix
                      }
                      target="_blank"
                      rel="noopener"
                    >
                      {wallet.publicKey.toString()}
                    </Link>
                  </Typography>
                </div>
              </div>
            ) : (
              <Typography variant="h5">Disconnected</Typography>
            )}
          </CardContent>
        </Card>
        <List disablePadding>
          {vestingAccounts.map(v => (
            <VestingAccountCard network={network} vesting={v} />
          ))}
          {vestingAccounts.length === 0 && (
            <Card
              style={{
                marginTop: '24px',
              }}
            >
              <CardContent>
                <ListItem>
                  <div
                    style={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Typography color="textSecondary" variant="h6">
                      No vesting accounts found
                    </Typography>
                  </div>
                </ListItem>
              </CardContent>
            </Card>
          )}
        </List>
      </div>
    </Container>
  );
}

type VestingAccountCardProps = {
  network: Network;
  vesting: ProgramAccount<accounts.Vesting>;
};

function VestingAccountCard(props: VestingAccountCardProps) {
  const { vesting, network } = props;

  const currencyLabel = vesting.account.mint.equals(network.srm)
    ? 'SRM'
    : 'MSRM';

  const startTs = vesting.account.startTs;
  const endTs = vesting.account.endTs;

  const tsOverflow = endTs.sub(startTs).mod(vesting.account.periodCount);
  const shiftedStartTs = startTs.sub(tsOverflow);

  const period = endTs.sub(shiftedStartTs).div(vesting.account.periodCount);

  // Make the horizontal axis evenly spaced.
  //
  // Vesting dates assuming we stretch the start date back in time (so that the
  // periods are of even length).
  const vestingDates = [
    ...Array(vesting.account.periodCount.toNumber() + 1),
  ].map((_, idx) => {
    return formatDate(
      new Date((shiftedStartTs.toNumber() + idx * period.toNumber()) * 1000),
    );
  });
  // Now push the start window forward to the real start date, making the first period shorter.
  vestingDates[0] = formatDate(new Date(startTs.toNumber() * 1000));

  // Now do the same thing on the vertical axis.
  const rewardOverflow = vesting.account.startBalance.mod(
    vesting.account.periodCount,
  );
  const rewardPerPeriod = vesting.account.startBalance
    .sub(rewardOverflow)
    .div(vesting.account.periodCount)
    .toNumber();
  const cumulativeVesting = [...Array(vestingDates.length)].map(() => 0);
  cumulativeVesting[1] = rewardPerPeriod + rewardOverflow.toNumber();
  for (let k = 2; k < cumulativeVesting.length; k += 1) {
    cumulativeVesting[k] = cumulativeVesting[k - 1] + rewardPerPeriod;
  }

  const startLabel = formatDate(
    new Date(vesting.account.startTs.toNumber() * 1000),
  );
  const endLabel = formatDate(
    new Date(vesting.account.endTs.toNumber() * 1000),
  );

  const urlSuffix = `?cluster=${network.explorerClusterSuffix}`;
  return (
    <Card
      key={vesting.publicKey.toString()}
      style={{
        marginTop: '24px',
      }}
    >
      <CardContent>
        <ListItem>
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <ListItemText
              primary={
                <Link
                  href={
                    `https://explorer.solana.com/account/${vesting.publicKey.toBase58()}` +
                    urlSuffix
                  }
                  target="_blank"
                  rel="noopener"
                >
                  {vesting.publicKey.toString()}
                </Link>
              }
              secondary={`${startLabel}, ${endLabel} | ${vesting.account.periodCount.toNumber()} periods`}
            />
            <div
              style={{
                marginTop: '6px',
                color: 'rgba(0, 0, 0, 0.54)',
                display: 'flex',
                justifyContent: 'space-between',
                flexDirection: 'column',
              }}
            >
              <Typography variant="body1">
                {`${vesting.account.balance.toNumber()} ${currencyLabel}`}
              </Typography>
            </div>
          </div>
        </ListItem>
        <ChartistGraph
          data={{
            labels: vestingDates,
            series: [cumulativeVesting],
          }}
          options={
            {
              axisY: {
                type: FixedScaleAxis,
                low: 0,
                high: cumulativeVesting[cumulativeVesting.length - 1],
                ticks: cumulativeVesting,
              },
              axisX: {
                ticks: vestingDates,
              },
              lineSmooth: Interpolation.step(),
              height: 400,
            } as IChartOptions
          }
          type={'Line'}
        />
      </CardContent>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row-reverse',
          marginBottom: '16px',
          marginRight: '16px',
        }}
      >
        <Typography color="textSecondary">
          Granted by {vesting.account.grantor.toString()}
        </Typography>
      </div>
    </Card>
  );
}

// TODO: locale format without minutes, hours, seconds?
function formatDate(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}
