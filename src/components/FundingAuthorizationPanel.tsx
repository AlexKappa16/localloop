import { useCallback, useState } from 'react';
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
  | 'challenging'
  | 'awaiting_signature'
  | 'submitting'
  | 'success'
  | 'error';

export function FundingAuthorizationPanel({ campaignId, disabled }: Props) {
  const { publicKey, connected, disconnect, signMessage } = useWallet();
  const { setVisible } = useWalletModal();
  const { authorizeFundingMutation } = useDemoState();

  const [phase, setPhase] = useState<Phase>('idle');
  const [challengeMessage, setChallengeMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const address = publicKey?.toBase58() ?? null;
  const canSign = walletSupportsSignMessage({ signMessage });

  const runFunding = useCallback(async () => {
    setError(null);

    if (!connected || !address) {
      setVisible(true);
      return;
    }

    if (!canSign || !signMessage) {
      setPhase('error');
      setError(en.walletUnsupported);
      return;
    }

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
        setError(err.message);
      } else {
        setError(en.errorGeneric);
      }
    }
  }, [
    address,
    authorizeFundingMutation,
    campaignId,
    canSign,
    connected,
    setVisible,
    signMessage,
  ]);

  return (
    <div className="panel stack funding-panel">
      <h3>{en.fundAction}</h3>
      <p className="muted">{en.fundingDisclosure}</p>

      {address ? (
        <div className="switcher">
          <span className="mono">
            {en.walletConnected}: {shortenAddress(address)}
          </span>
          <button type="button" className="btn" onClick={() => void disconnect()}>
            {en.disconnectWallet}
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => setVisible(true)}
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
          phase === 'challenging' ||
          phase === 'awaiting_signature' ||
          phase === 'submitting'
        }
        onClick={() => void runFunding()}
      >
        {phase === 'submitting' || phase === 'challenging'
          ? en.fundingPending
          : en.signAndFund}
      </button>

      {phase === 'success' ? (
        <p className="success">{en.fundingSuccess}</p>
      ) : null}
      {error ? <p className="error">{error}</p> : null}
      {connected && !canSign ? (
        <p className="error">{en.walletUnsupported}</p>
      ) : null}
    </div>
  );
}
