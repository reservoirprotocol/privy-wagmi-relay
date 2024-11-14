import type {LinkedWallet} from '@reservoir0x/relay-kit-ui';

import type {ConnectedWallet} from '@privy-io/react-auth';

export const convertToLinkedWallet = (wallet: ConnectedWallet): LinkedWallet => {
  const vmType = wallet.chainId ? 'evm' : 'svm';
  return {
    address: wallet.address,
    walletLogoUrl: wallet.meta.icon,
    vmType,
    connector: wallet.walletClientType,
  };
};
