/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import {RelayKitProvider} from '@reservoir0x/relay-kit-ui';
import {
  configureViemChain,
  convertViemChainToRelayChain,
  LogLevel,
  MAINNET_RELAY_API,
} from '@reservoir0x/relay-sdk';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {http} from 'viem';
import {base, mainnet, optimism} from 'viem/chains';

import type {PrivyClientConfig} from '@privy-io/react-auth';
import {PrivyProvider} from '@privy-io/react-auth';
import {toSolanaWalletConnectors} from '@privy-io/react-auth/solana';
import {WagmiProvider, createConfig} from '@privy-io/wagmi';

const queryClient = new QueryClient();

const solanaConnectors = toSolanaWalletConnectors({
  // By default, shouldAutoConnect is enabled
  shouldAutoConnect: true,
});

export const wagmiConfig = createConfig({
  chains: [mainnet, base],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [optimism.id]: http(),
  },
});

const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
    createOnLogin: 'users-without-wallets',
    requireUserPasswordOnCreate: true,
    noPromptOnSignature: false,
  },
  loginMethods: ['wallet'],
  appearance: {
    walletChainType: 'ethereum-and-solana',
    showWalletLoginFirst: true,
  },
  externalWallets: {
    solana: {
      connectors: solanaConnectors,
    },
  },
};

const SolanaChain = {
  id: 792703809,
  name: 'solana',
  displayName: 'Solana',
  httpRpcUrl: 'https://api.mainnet-beta.solana.com',
  wsRpcUrl: '',
  explorerUrl: 'https://solscan.io',
  explorerName: 'SolScan',
  depositEnabled: true,
  disabled: false,
  partialDisableLimit: 0,
  blockProductionLagging: false,
  currency: {
    id: 'sol',
    symbol: 'SOL',
    name: 'Solana',
    address: '11111111111111111111111111111111',
    decimals: 9,
    supportsBridging: false,
  },
  withdrawalFee: 0,
  depositFee: 0,
  surgeEnabled: false,
  erc20Currencies: [],
  contracts: {
    multicall3: '',
    multicaller: '',
    onlyOwnerMulticaller: '',
    relayReceiver: '',
    erc20Router: '',
    approvalProxy: '',
  },
  vmType: 'svm',
};

export default function Providers({children}: {children: React.ReactNode}) {
  return (
    <PrivyProvider
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      apiUrl={process.env.NEXT_PUBLIC_PRIVY_AUTH_URL as string}
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID as string}
      config={privyConfig}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
          <RelayKitProvider
            options={{
              baseApiUrl: MAINNET_RELAY_API,
              source: 'relay-privy-demo',
              logLevel: LogLevel.Verbose,
              duneApiKey: process.env.NEXT_PUBLIC_DUNE_TOKEN,
              chains: [
                convertViemChainToRelayChain(mainnet),
                convertViemChainToRelayChain(base),
                convertViemChainToRelayChain(optimism),
                configureViemChain(SolanaChain as any),
              ],
              appName: 'Relay Privy Demo',
            }}
          >
            {children}
          </RelayKitProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
