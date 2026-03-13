# Game Design Document — MVP v1.0
**Project:** TheGGCompany Game Platform MVP
**Date:** 2026-03-13
**Author:** CEO
**Status:** Approved for development

---

## 1. Game Title (Working)

**Pixel Dash** — a fast-paced endless runner for browser

---

## 2. Genre & Platform

- **Genre:** Hyper-casual endless runner
- **Platform:** Browser (HTML5/Canvas), desktop + mobile
- **Engine:** Phaser.js 3.x (MIT license, battle-tested, CrazyGames compatible)

---

## 3. Core Loop

```
START RUN → Run automatically → Tap/click/spacebar to JUMP → Dodge obstacles
→ Collect coins → Die → See score + leaderboard → PLAY AGAIN
```

- One-button control (spacebar / tap)
- Speed increases over time — difficulty escalates naturally
- Coins give score multiplier, not "lives" — keeps loop tight
- Death is instant; retry is one click — no friction

---

## 4. Key Mechanics

| Mechanic | Description |
|---|---|
| Auto-run | Character moves right at constant speed, player only controls jumps |
| Jump | Single jump (no double-jump) — tight, readable timing window |
| Obstacles | Ground spikes, floating blocks — procedurally spaced, seeded RNG |
| Coins | Randomly placed mid-air and on ground, score multiplier |
| Difficulty curve | Speed increases every 500m; obstacle density increases every 1000m |
| High score | Local storage; CrazyGames leaderboard API if available |

---

## 5. Monetization (CrazyGames)

- **Interstitial ads:** Show after every death (CrazyGames SDK `showAd()`)
- **Rewarded ads:** "Revive once" — watch ad to continue current run (optional, adds engagement)
- **CrazyGames SDK:** `GameDistribution` / `CrazyGames SDK v3` for ad calls + leaderboard

Expected revenue model:
- Target: 100 sessions/day at ~2 ads/session = 200 ad impressions/day
- CPM estimate: ~$1.50 (CrazyGames average for casual)
- ~$0.30/day → ~$100 revenue in ~333 days at minimal traffic
- With CrazyGames featuring: 10x traffic boost possible → $100 in 30 days

---

## 6. Art Direction

- **Style:** 8-bit pixel art — fast to produce, nostalgic, consistent with hyper-casual genre
- **Palette:** 4-color per scene (Game Boy aesthetic — readable at any size)
- **Assets needed:** Player sprite (run cycle, jump, death), 3 obstacle types, ground tile, background (parallax 2 layers), coin
- **Audio:** 8-bit jump SFX, coin pickup SFX, death SFX, looping background track

All assets must be royalty-free or created original. Use Kenney.nl assets for prototype.

---

## 7. Scope & Build Plan

**Total estimate: 10 working days (2 calendar weeks, 1 developer)**

| Week | Tasks |
|---|---|
| Week 1 | Phaser project setup, character movement, jump mechanic, procedural obstacle generation, collision detection, coin collection, score counter |
| Week 2 | Death/retry flow, difficulty curve, pixel art assets, sound, CrazyGames SDK integration, mobile touch controls, performance pass, submission |

---

## 8. CrazyGames Submission Acceptance Criteria

- [ ] HTML5 build, no server-side dependency
- [ ] Responsive — works at 800×600 up to 1920×1080; mobile touch controls
- [ ] CrazyGames SDK v3 integrated: `requestAd()` on death, optional rewarded ad
- [ ] Average session time ≥ 60 seconds (required by CrazyGames)
- [ ] 60fps on mid-range hardware (no dropped frames on Chrome/Firefox/Safari)
- [ ] No third-party copyrighted assets
- [ ] Game description, thumbnail (616×353px), and category tags ready
- [ ] Tested on Chrome, Firefox, Safari desktop + iOS/Android Chrome

---

## 9. Success Metrics (Post-Launch)

- **Primary:** First $100 ad revenue
- **Leading indicators:** Session length ≥ 90s avg, Day-1 retention ≥ 30%, CrazyGames approval
- **Target:** CrazyGames featured in "New Games" section (drives 5-20k plays/day)

---

## 10. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| CrazyGames rejects submission | Pre-check their content policy; use their test kit before submitting |
| Session time below minimum | Add "daily challenge" mode or streak mechanic to extend play |
| Art quality too low | Use Kenney.nl free packs as baseline; polish later |
| Ad SDK breaks gameplay | Wrap SDK calls in try/catch; graceful degradation |
