import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import TabBar from '../../shared/components/TabBar';
import ChunkyButton from '../../shared/components/ChunkyButton';
import { useAppStore, selectChildPoints } from '../../core/store/appStore';
import { playRedemption } from '../../core/audio';
import styles from './RewardsScreen.module.css';

export default function RewardsScreen() {
  const { childId } = useParams<{ childId: string }>();
  const { rewards, redemptionTitle, redeemReward, dismissRedemption } = useAppStore();
  const pts = useAppStore((s) => selectChildPoints(s, childId ?? ''));

  const [confirming, setConfirming] = useState<string | null>(null);

  // Play chime when redemption succeeds
  useEffect(() => {
    if (redemptionTitle) playRedemption();
  }, [redemptionTitle]);

  const enabledRewards = rewards.filter((r) => r.enabled);

  async function handleRedeem(rewardId: string) {
    await redeemReward(rewardId);
    setConfirming(null);
  }

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <h1 className={styles.title}>🎁 Reward Vault</h1>
        <div className={styles.balance}>
          <span className={styles.balanceNum}>{pts}</span>
          <span>⭐ available</span>
        </div>
      </div>

      <div className={styles.list}>
        {enabledRewards.length === 0 ? (
          <div className={styles.empty}>
            <span>🎁</span>
            <p>No rewards set up yet.</p>
          </div>
        ) : (
          enabledRewards.map((reward) => {
            const canAfford = pts >= reward.cost;
            return (
              <div
                key={reward.id}
                className={[styles.card, canAfford ? styles.affordable : styles.locked].join(' ')}
              >
                <div className={styles.cardInfo}>
                  <span className={styles.rewardTitle}>{reward.title}</span>
                  <span className={styles.cost}>⭐ {reward.cost}</span>
                </div>
                <ChunkyButton
                  variant={canAfford ? 'secondary' : 'ghost'}
                  size="sm"
                  disabled={!canAfford}
                  onClick={() => setConfirming(reward.id)}
                >
                  {canAfford ? 'Claim' : `Need ${reward.cost - pts} more ⭐`}
                </ChunkyButton>
              </div>
            );
          })
        )}
      </div>

      <TabBar childId={childId ?? ''} />

      {/* Confirm dialog */}
      {confirming &&
        (() => {
          const r = rewards.find((x) => x.id === confirming);
          if (!r) return null;
          return (
            <div className={styles.overlay} onClick={() => setConfirming(null)}>
              <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
                <p className={styles.confirmTitle}>Claim reward?</p>
                <p className={styles.confirmReward}>{r.title}</p>
                <p className={styles.confirmCost}>
                  Costs {r.cost} ⭐ — you have {pts}
                </p>
                <div className={styles.confirmBtns}>
                  <ChunkyButton variant="ghost" size="sm" onClick={() => setConfirming(null)}>
                    Cancel
                  </ChunkyButton>
                  <ChunkyButton variant="secondary" size="sm" onClick={() => handleRedeem(r.id)}>
                    Yes, claim!
                  </ChunkyButton>
                </div>
              </div>
            </div>
          );
        })()}

      {/* Redemption success */}
      {redemptionTitle && (
        <div className={styles.overlay} onClick={dismissRedemption}>
          <div className={styles.successCard}>
            <span className={styles.successIcon}>🎉</span>
            <p className={styles.successText}>Enjoy your</p>
            <p className={styles.successReward}>{redemptionTitle}</p>
            <ChunkyButton variant="primary" onClick={dismissRedemption}>
              Awesome!
            </ChunkyButton>
          </div>
        </div>
      )}
    </div>
  );
}
