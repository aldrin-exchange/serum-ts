import React from 'react';
import { useSelector } from 'react-redux';
import Button from '@material-ui/core/Button';
import { State as StoreState } from '../../store/reducer';

type Props = {
  signature: string;
};

export function ViewTransactionOnExplorerButton(props: Props) {
  const { signature } = props;
  const { explorerClusterSuffix } = useSelector((state: StoreState) => {
    return {
      explorerClusterSuffix: state.common.network.explorerClusterSuffix,
    };
  });
  const urlSuffix = `?cluster=${explorerClusterSuffix}`;
  return (
    <Button
      color="inherit"
      component="a"
      target="_blank"
      rel="noopener"
      href={`https://explorer.solana.com/tx/${signature}` + urlSuffix}
    >
      View on Solana Explorer
    </Button>
  );
}
