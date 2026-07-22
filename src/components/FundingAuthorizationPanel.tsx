import { useCallback, useEffect, useRef, useState } from 'react';
import { WalletReadyState } from '@solana/wallet-adapter-base';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useDemoState } from '../app/DemoStateProvider';
import { en } from '../copy/en';
import { ApiClientError, requestWalletChallenge } from '../lib/api';
import {
  shortenAddress,
  signChallengeMessage,
  walletSupportsSignMessage,
} from '../lib/wallet';

type Props = {
  campaignId: string;
  disabled?: boolean;
};

type Phase =
  | 'idle'
  | 'connecting'
  | 'challenging'
  | 'awaiting_signature'
  | 'submitting'
  | 'success'
  | 'error';

const WALLET_CONNECT_TIMEOUT_MS = 15_000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(
      () => reject(new Error(en.walletConnectionTimedOut)),
      timeoutMs,
    );
    promise.then(
      (value) => {
        window.clearTimeout(timeout);
        resolve(value);
      },
      (error: unknown) => {
        window.clearTimeout(timeout);
        reject(error);
      },
    );
  });
}

function statusLabel(phase: Phase): string | null {
  switch (phase) {
    case 'connecting':
      return 'Waiting for Phantom connection…';
    case 'challenging':
      return 'Requesting funding challenge from server…';
    case 'awaiting_signature':
      return 'Approve the message signature in Phantom…';
    case 'submitting':
      return en.fundingPending;
    case 'success':
      return en.fundingSuccess;
    default:
      return null;
  }
}

export function FundingAuthorizationPanel({ campaignId, disabled }: Props) {
  const {
    publicKey,
    connected,
    connecting,
    connect,
    disconnect,
    select,
    signMessage,
    wallet,
  } = useWallet();
  const { setVisible, visible } = useWalletModal();
  const { authorizeFundingMutation, state } = useDemoState();
  const [phase, setPhase] = useState<Phase>('idle');
  const [challengeMessage, setChallengeMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);
  const awaitingWalletChoiceRef = useRef(false);
  const connectInFlightRef = useRef(false);

  const address = publicKey?.toBase58() ?? null;
  const canSign = walletSupportsSignMessage({ signMessage });
  const campaign = state.campaigns.find((c) => c.id === campaignId);
  const alreadyFunded =
    campaign?.status === 'simulated_funded' ||
    campaign?.status === 'live' ||
    campaign?.status === 'completed';
  const fundingTx = state.transactions.find((tx) => tx.type === 'funding_proof');

  const connectSelectedWallet = useCallback(async () => {
    if (!wallet || connectInFlightRef.current) return;

    connectInFlightRef.current = true;
    setError(null);
    setPhase('connecting');

    try {
      if (wallet.adapter.readyState !== WalletReadyState.Installed) {
        throw new Error(en.phantomNotDetected);
      }

      await withTimeout(connect(), WALLET_CONNECT_TIMEOUT_MS);
      setPhase('idle');
    } catch (err) {
      setPhase('error');
      const msg = err instanceof Error ? err.message.toLowerCase() : '';
      if (msg.includes('user rejected') || msg.includes('rejected') || msg.includes('cancel')) {
        setError('Connection was rejected in Phantom. Try again.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(en.errorGeneric);
      }
      try {
        select(null);
      } catch {
        // ignore
      }
    } finally {
      connectInFlightRef.current = false;
      awaitingWalletChoiceRef.current = false;
    }
  }, [connect, select, wallet]);

  const connectWallet = useCallback(async () => {
    setError(null);

    // Always start from a clean adapter session after reset / prior connect.
    if (connected) {
      await disconnect();
    }
    if (wallet) {
      select(null);
    }

    awaitingWalletChoiceRef.current = true;
    setPhase('connecting');
    setVisible(true);
  }, [connected, disconnect, select, setVisible, wallet]);

  // After the modal selects Phantom, actually open the approval prompt.
  useEffect(() => {
    if (
      !awaitingWalletChoiceRef.current ||
      !wallet ||
      connected ||
      connecting ||
      connectInFlightRef.current
    ) {
      return;
    }
    void connectSelectedWallet();
  }, [connectSelectedWallet, connected, connecting, wallet]);

  // If the user closes the wallet modal without choosing, unlock the UI.
  useEffect(() => {
    if (
      !visible &&
      awaitingWalletChoiceRef.current &&
      !wallet &&
      !connected &&
      !connectInFlightRef.current
    ) {
      awaitingWalletChoiceRef.current = false;
      setPhase('idle');
    }
  }, [connected, visible, wallet]);

  const runFunding = useCallback(async () => {
    if (inFlightRef.current || disabled || alreadyFunded) return;
    setError(null);

    if (!connected || !address) {
      await connectWallet();
      return;
    }

    if (!canSign || !signMessage) {
      setPhase('error');
      setError(en.walletUnsupported);
      return;
    }

    inFlightRef.current = true;

    try {
      setPhase('challenging');
      const challenge = await requestWalletChallenge({
        walletAddress: address,
      });
      setChallengeMessage(challenge.message);

      setPhase('awaiting_signature');
      const signatureBase58 = await signChallengeMessage(
        signMessage,
        challenge.message,
      );

      setPhase('submitting');
      await authorizeFundingMutation(campaignId, {
        challengeId: challenge.challengeId,
        walletAddress: address,
        signatureBase58,
      });
      setPhase('success');
    } catch (err) {
      setPhase('error');
      if (err instanceof ApiClientError) {
        setError(
          err.code === 'SOLANA_NOT_READY' ? en.solanaNotReady : err.message,
        );
      } else if (err instanceof Error) {
        const msg = err.message.toLowerCase();
        if (
          msg.includes('user rejected') ||
          msg.includes('rejected') ||
          msg.includes('cancel')
        ) {
          setError('Signature or connection was rejected in Phantom. Try again.');
        } else {
          setError(err.message);
        }
      } else {
        setError(en.errorGeneric);
      }
    } finally {
      inFlightRef.current = false;
    }
  }, [
    address,
    alreadyFunded,
    authorizeFundingMutation,
    campaignId,
    canSign,
    connectWallet,
    connected,
    disabled,
    signMessage,
  ]);

  if (alreadyFunded) {
    return (
      <div className="stack">
        <p className="success">{en.fundingSuccess}</p>
        {fundingTx ? (
          <>
            <p className="mono muted">{fundingTx.signature}</p>
            <p className="mono muted">{fundingTx.memo}</p>
            <a
              className="btn btn--primary"
              href={fundingTx.explorerUrl}
              target="_blank"
              rel="noreferrer"
            >
              {en.openExplorer}
            </a>
          </>
        ) : (
          <p className="muted">{en.noReceipt}</p>
        )}
      </div>
    );
  }

  return (
    <div className="stack">
      <p className="muted">{en.fundingDisclosure}</p>

      {address ? (
        <div className="switcher">
          <span className="mono">
            {en.walletConnected}: {shortenAddress(address)}
          </span>
          <button
            type="button"
            className="btn"
            onClick={() => {
              void disconnect().then(() => {
                select(null);
                setPhase('idle');
                setChallengeMessage(null);
                setError(null);
              });
            }}
          >
            {en.disconnectWallet}
          </button>
        </div>
      ) : null}

      {challengeMessage ? (
        <pre className="challenge-preview" aria-label={en.challengePreview}>
          {challengeMessage}
        </pre>
      ) : null}

      <button
        type="button"
        className="btn btn--primary"
        disabled={
          disabled ||
          connecting ||
          phase === 'connecting' ||
          phase === 'challenging' ||
          phase === 'awaiting_signature' ||
          phase === 'submitting'
        }
        onClick={() => void runFunding()}
      >
        {address ? en.signAndFund : en.connectWallet}
      </button>

      {statusLabel(phase) ? (
        <p className={phase === 'success' ? 'success' : 'muted'}>
          <strong>{statusLabel(phase)}</strong>
        </p>
      ) : null}
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
      {connected && !canSign ? (
        <p className="error">{en.walletUnsupported}</p>
      ) : null}
    </div>
  );
}
