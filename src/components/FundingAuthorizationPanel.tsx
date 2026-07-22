import { useCallback, useEffect, useRef, useState } from 'react';
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

function statusLabel(phase: Phase): string | null {
  switch (phase) {
    case 'connecting':
      return 'Waiting for wallet connection…';
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
  const { publicKey, connected, connecting, disconnect, signMessage } =
    useWallet();
  const { setVisible } = useWalletModal();
  const { authorizeFundingMutation, state } = useDemoState();

  const [phase, setPhase] = useState<Phase>('idle');
  const [challengeMessage, setChallengeMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pendingFundRef = useRef(false);
  const inFlightRef = useRef(false);

  const address = publicKey?.toBase58() ?? null;
  const canSign = walletSupportsSignMessage({ signMessage });
  const campaign = state.campaigns.find((c) => c.id === campaignId);
  const alreadyFunded =
    campaign?.status === 'simulated_funded' ||
    campaign?.status === 'live' ||
    campaign?.status === 'completed';

  const runFunding = useCallback(async () => {
    if (inFlightRef.current || disabled || alreadyFunded) return;
    setError(null);

    if (!connected || !address) {
      pendingFundRef.current = true;
      setPhase('connecting');
      setVisible(true);
      return;
    }

    if (!canSign || !signMessage) {
      pendingFundRef.current = false;
      setPhase('error');
      setError(en.walletUnsupported);
      return;
    }

    inFlightRef.current = true;
    pendingFundRef.current = false;

    try {
      setPhase('challenging');
      const challenge = await requestWalletChallenge({ walletAddress: address });
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
          setError('Signature was rejected in the wallet. Try again.');
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
    connected,
    disabled,
    setVisible,
    signMessage,
  ]);

  // After Phantom connects, automatically continue the funding flow.
  useEffect(() => {
    if (
      pendingFundRef.current &&
      connected &&
      address &&
      !inFlightRef.current &&
      !alreadyFunded
    ) {
      void runFunding();
    }
  }, [alreadyFunded, address, connected, runFunding]);

  useEffect(() => {
    if (!connecting && phase === 'connecting' && !connected) {
      // Modal closed without connecting
      pendingFundRef.current = false;
      setPhase('idle');
    }
  }, [connecting, connected, phase]);

  return (
    <div className="panel stack funding-panel">
      <h3>{en.fundAction}</h3>
      <p className="muted">{en.fundingDisclosure}</p>
      <p className="muted">
        Use the real advertiser route <span className="mono">/advertiser</span>{' '}
        (not <span className="mono">/demo-preview</span>).
      </p>

      {address ? (
        <div className="switcher">
          <span className="mono">
            {en.walletConnected}: {shortenAddress(address)}
          </span>
          <button
            type="button"
            className="btn"
            onClick={() => {
              pendingFundRef.current = false;
              void disconnect();
              setPhase('idle');
            }}
          >
            {en.disconnectWallet}
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="btn"
          onClick={() => {
            setError(null);
            setPhase('connecting');
            setVisible(true);
          }}
        >
          {en.connectWallet}
        </button>
      )}

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
          alreadyFunded ||
          phase === 'connecting' ||
          phase === 'challenging' ||
          phase === 'awaiting_signature' ||
          phase === 'submitting'
        }
        onClick={() => void runFunding()}
      >
        {address ? en.signAndFund : `${en.connectWallet} & ${en.fundAction}`}
      </button>

      {statusLabel(phase) ? (
        <p className={phase === 'success' ? 'success' : 'muted'}>
          {statusLabel(phase)}
        </p>
      ) : null}
      {error ? <p className="error">{error}</p> : null}
      {connected && !canSign ? (
        <p className="error">{en.walletUnsupported}</p>
      ) : null}
    </div>
  );
}
