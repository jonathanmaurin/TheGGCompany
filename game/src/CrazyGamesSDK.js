/**
 * CrazyGames SDK v3 wrapper
 * Gracefully degrades when SDK is not available (local dev, non-CrazyGames hosts).
 */

const sdk = () => window?.CrazyGames?.SDK ?? null;

export const CrazyGamesSDK = {
  async init() {
    try {
      if (sdk()) {
        await sdk().init();
        console.log('[CrazyGames] SDK initialized');
      }
    } catch (e) {
      console.warn('[CrazyGames] SDK init failed (dev mode):', e.message);
    }
  },

  gameLoadingStop() {
    try { sdk()?.game?.sdkGameLoadingStop(); } catch (e) {}
  },

  gameplayStart() {
    try { sdk()?.game?.gameplayStart(); } catch (e) {}
  },

  gameplayStop() {
    try { sdk()?.game?.gameplayStop(); } catch (e) {}
  },

  /**
   * Show a midgame (interstitial) ad. Resolves when ad is done or on error.
   */
  requestMidgameAd() {
    return new Promise((resolve) => {
      try {
        if (!sdk()) { resolve(); return; }
        sdk().ad.requestAd('midgame', {
          adStarted: () => {},
          adFinished: () => resolve(),
          adError: () => resolve(),
        });
      } catch (e) {
        resolve();
      }
    });
  },

  /**
   * Show a rewarded ad. Resolves with true if the user earned the reward, false otherwise.
   */
  requestRewardedAd() {
    return new Promise((resolve) => {
      try {
        if (!sdk()) { resolve(false); return; }
        sdk().ad.requestAd('rewarded', {
          adStarted: () => {},
          adFinished: () => resolve(true),
          adError: () => resolve(false),
        });
      } catch (e) {
        resolve(false);
      }
    });
  },
};
