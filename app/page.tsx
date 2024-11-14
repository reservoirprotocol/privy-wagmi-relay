'use client';

import {type LinkedWallet, SwapWidget} from '@reservoir0x/relay-kit-ui';
import {adaptViemWallet, type AdaptedWallet, type RelayChain} from '@reservoir0x/relay-sdk';
import {adaptSolanaWallet} from '@reservoir0x/relay-svm-wallet-adapter';
import {
  Connection,
  type SendOptions,
  type VersionedTransaction,
  type Transaction as SolanaTransaction,
} from '@solana/web3.js';
import Balance from 'components/Balance';
import BlockNumber from 'components/BlockNumber';
import Button from 'components/Button';
import ContractEvent from 'components/ContractEvent';
import ContractRead from 'components/ContractRead';
import ContractReads from 'components/ContractReads';
import ContractWrite from 'components/ContractWrite';
import EnsAddress from 'components/EnsAddress';
import EnsAvatar from 'components/EnsAvatar';
import EnsName from 'components/EnsName';
import EnsResolver from 'components/EnsResolver';
import FeeData from 'components/FeeData';
import PublicClient from 'components/PublicClient';
import SendTransaction from 'components/SendTransaction';
import SignMessage from 'components/SignMessage';
import SignTypedData from 'components/SignTypedData';
import Signer from 'components/Signer';
import SwitchNetwork from 'components/SwitchNetwork';
import Token from 'components/Token';
import Transaction from 'components/Transaction';
import WaitForTransaction from 'components/WaitForTransaction';
import WalletClient from 'components/WalletClient';
import WatchPendingTransactions from 'components/WatchPendingTransactions';
import {convertToLinkedWallet} from 'lib/relay';
import {shorten} from 'lib/utils';
import Image from 'next/image';
import {useEffect, useMemo, useRef, useState} from 'react';
import {zeroAddress} from 'viem';
import {useAccount, useDisconnect, useWalletClient} from 'wagmi';

import {
  type ConnectedWallet,
  type ConnectedSolanaWallet,
  useConnectWallet,
  usePrivy,
  useWallets,
  useSolanaWallets,
} from '@privy-io/react-auth';
import {useSetActiveWallet} from '@privy-io/wagmi';

import wagmiPrivyLogo from '../public/wagmi_privy_logo.png';

const MonoLabel = ({label}: {label: string}) => {
  return <span className="rounded-xl bg-slate-200 px-2 py-1 font-mono">{label}</span>;
};

export default function Home() {
  const [wallet, setWallet] = useState<AdaptedWallet | undefined>();
  const [primaryWallet, setPrimaryWallet] = useState<ConnectedWallet | undefined>();
  const _walletsRef = useRef<ConnectedWallet[]>();
  const [linkWalletPromise, setLinkWalletPromise] = useState<
    | {
        resolve: (value: LinkedWallet) => void;
        reject: () => void;
        params: {chain?: RelayChain; direction: 'to' | 'from'};
      }
    | undefined
  >();

  // Privy hooks
  const {ready, user, authenticated, login, logout, linkWallet} = usePrivy();
  const {connectWallet} = useConnectWallet({
    onSuccess: (wallet) => {
      if (linkWalletPromise) {
        linkWalletPromise?.resolve(convertToLinkedWallet(wallet as ConnectedWallet));
        setLinkWalletPromise(undefined);
      }
    },
  });
  const {wallets, ready: walletsReady} = useWallets();
  const {data: walletClient} = useWalletClient();
  const {wallets: solanaWallets} = useSolanaWallets();
  const linkedWallets = useMemo(() => {
    const _wallets = wallets.reduce((linkedWallets, wallet) => {
      linkedWallets.push(convertToLinkedWallet(wallet));
      return linkedWallets;
    }, [] as LinkedWallet[]);
    const _solanaWallets = solanaWallets.reduce((linkedWallets, wallet) => {
      linkedWallets.push(convertToLinkedWallet(wallet as unknown as ConnectedWallet));
      return linkedWallets;
    }, [] as LinkedWallet[]);
    _walletsRef.current = [...solanaWallets, ..._wallets] as unknown as ConnectedWallet[];
    return [..._wallets, ..._solanaWallets];
  }, [wallets, solanaWallets]);

  // WAGMI hooks
  const {address, isConnected, isConnecting, isDisconnected} = useAccount();
  const {disconnect} = useDisconnect();
  const {setActiveWallet} = useSetActiveWallet();

  useEffect(() => {
    const adaptWallet = async () => {
      try {
        if (primaryWallet) {
          let adaptedWallet: AdaptedWallet | undefined;
          if (primaryWallet.chainId) {
            if (walletClient) {
              adaptedWallet = adaptViemWallet(walletClient);
            }
          } else if (primaryWallet.connectorType.includes('solana')) {
            const solanaWallet = primaryWallet as unknown as ConnectedSolanaWallet;
            const connection = new Connection(`${process.env.NEXT_PUBLIC_SOLANA_RPC}`);
            const signAndSendTransaction = async (
              transaction: SolanaTransaction | VersionedTransaction,
              options?: SendOptions,
            ) => {
              const signature = await solanaWallet.sendTransaction(
                transaction,
                connection,
                options,
              );
              return {signature};
            };

            adaptedWallet = adaptSolanaWallet(
              primaryWallet.address,
              792703809,
              connection,
              signAndSendTransaction,
            );
          }
          setWallet(adaptedWallet);
        } else {
          setWallet(undefined);
        }
      } catch (e) {
        setWallet(undefined);
      }
    };
    adaptWallet();
  }, [primaryWallet, walletClient]);

  if (!ready) {
    return null;
  }

  return (
    <>
      <main className="min-h-screen bg-slate-200 p-4 text-slate-800">
        <Image
          className="mx-auto rounded-lg"
          src={wagmiPrivyLogo}
          alt="wagmi x privy logo"
          width={400}
          height={100}
        />
        <p className="my-4 text-center">
          This demo showcases how you can integrate{' '}
          <a href="https://wagmi.sh/" className="font-medium underline">
            wagmi
          </a>{' '}
          alongside{' '}
          <a href="https://www.privy.io/" className="font-medium underline">
            Privy
          </a>{' '}
          in your React app. Login below to try it out!
          <br />
          For more information, check out{' '}
          <a href="https://docs.privy.io/guide/guides/wagmi" className="font-medium underline">
            our integration guide
          </a>{' '}
          or the{' '}
          <a href="https://github.com/privy-io/wagmi-demo" className="font-medium underline">
            source code
          </a>{' '}
          for this app.
        </p>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="border-1 flex flex-col items-start gap-2 rounded border border-black bg-slate-100 p-3">
            <h1 className="text-4xl font-bold">RelayKit</h1>
            <SwapWidget
              defaultToToken={{
                chainId: 1,
                address: zeroAddress,
                decimals: 18,
                name: 'ETH',
                symbol: 'ETH',
                logoURI: 'https://assets.relay.link/icons/currencies/eth.png',
              }}
              defaultFromToken={{
                chainId: 8453,
                address: '0x0000000000000000000000000000000000000000',
                decimals: 18,
                name: 'ETH',
                symbol: 'ETH',
                logoURI: 'https://assets.relay.link/icons/currencies/eth.png',
              }}
              wallet={wallet}
              multiWalletSupportEnabled={true}
              linkedWallets={linkedWallets}
              onConnectWallet={() => connectWallet}
              onLinkNewWallet={({chain, direction}) => {
                if (linkWalletPromise) {
                  linkWalletPromise.reject();
                  setLinkWalletPromise(undefined);
                }
                const promise = new Promise<LinkedWallet>((resolve, reject) => {
                  setLinkWalletPromise({
                    resolve,
                    reject,
                    params: {
                      chain,
                      direction,
                    },
                  });
                });
                connectWallet({});
                return promise;
              }}
              onSetPrimaryWallet={async (address: string) => {
                //In some cases there's a race condition between connecting the wallet and having it available to switch to so we need to poll for it
                const maxAttempts = 20;
                let attemptCount = 0;
                const timer = setInterval(async () => {
                  attemptCount++;
                  const newPrimaryWallet = _walletsRef.current?.find(
                    (wallet) => wallet.address === address,
                  );
                  if (attemptCount >= maxAttempts) {
                    clearInterval(timer);
                    return;
                  }
                  if (!newPrimaryWallet) {
                    return;
                  }
                  setPrimaryWallet(newPrimaryWallet);
                  try {
                    if (newPrimaryWallet.chainId) {
                      setActiveWallet(newPrimaryWallet);
                    }
                    clearInterval(timer);
                  } catch (e) {}
                }, 200);
              }}
            />
          </div>

          <div className="border-1 flex flex-col items-start gap-2 rounded border border-black bg-slate-100 p-3">
            <h1 className="text-4xl font-bold">Privy</h1>
            {ready && !authenticated && (
              <>
                <p>You are not authenticated with Privy</p>
                <div className="flex items-center gap-4">
                  <Button onClick_={login} cta="Login with Privy" />
                  <span>or</span>
                  <Button onClick_={connectWallet} cta="Connect only" />
                </div>
              </>
            )}
            {walletsReady &&
              wallets.map((wallet) => {
                return (
                  <div
                    key={wallet.address}
                    className="flex min-w-full flex-row flex-wrap items-center justify-between gap-2 bg-slate-50 p-4"
                  >
                    <div>
                      <MonoLabel label={shorten(wallet.address)} />
                    </div>
                    <Button
                      cta="Make active"
                      onClick_={() => {
                        setActiveWallet(wallet);
                      }}
                    />
                  </div>
                );
              })}
            {ready && authenticated && (
              <>
                <p className="mt-2">You are logged in with privy.</p>
                <Button onClick_={connectWallet} cta="Connect another wallet" />
                <Button onClick_={linkWallet} cta="Link another wallet" />
                <textarea
                  value={JSON.stringify(wallets, null, 2)}
                  className="mt-2 w-full rounded-md bg-slate-700 p-4 font-mono text-xs text-slate-50 sm:text-sm"
                  rows={JSON.stringify(wallets, null, 2).split('\n').length}
                  disabled
                />
                <br />
                <textarea
                  value={JSON.stringify(user, null, 2)}
                  className="mt-2 w-full rounded-md bg-slate-700 p-4 font-mono text-xs text-slate-50 sm:text-sm"
                  rows={JSON.stringify(user, null, 2).split('\n').length}
                  disabled
                />
                <br />
                <Button onClick_={logout} cta="Logout from Privy" />
              </>
            )}
          </div>
          <div className="border-1 flex flex-col items-start gap-2 rounded border border-black bg-slate-100 p-3">
            <h1 className="text-4xl font-bold">WAGMI</h1>
            <p>
              Connection status: {isConnecting && <span>🟡 connecting...</span>}
              {isConnected && <span>🟢 connected.</span>}
              {isDisconnected && <span> 🔴 disconnected.</span>}
            </p>
            {isConnected && address && (
              <>
                <h2 className="mt-6 text-2xl">useAccount</h2>
                <p>
                  address: <MonoLabel label={address} />
                </p>

                <Balance />
                <Signer />
                <SignMessage />
                <SignTypedData />
                <PublicClient />
                <EnsName />
                <EnsAddress />
                <EnsAvatar />
                <EnsResolver />
                <SwitchNetwork />
                <BlockNumber />
                <SendTransaction />
                <ContractRead />
                <ContractReads />
                <ContractWrite />
                <ContractEvent />
                <FeeData />
                <Token />
                <Transaction />
                <WatchPendingTransactions />
                <WalletClient />
                <WaitForTransaction />

                <h2 className="mt-6 text-2xl">useDisconnect</h2>
                <Button onClick_={disconnect} cta="Disconnect from WAGMI" />
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
