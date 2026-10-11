# Verification record

## Skills and design

Read local `/Users/intrepion/.agents/skills/{grill-with-docs,implement,grilling,domain-modeling,tdd,code-review}/SKILL.md` and compared current official Matt Pocock sources under engineering and productivity on 2026-10-11. The official domain-modeling version uses GLOSSARY.md; followed that vocabulary rather than local legacy CONTEXT.md. User-delegated recommended decisions replace interview and seam approval rounds. Documented the decision tree and public seams in SPEC.md. No issue tracker needed; SPEC.md is the originating contract. Code review comparison baseline is docs commit `41ae3d4`.

TDD evidence: world test failed before model module existed, passed after terrain implementation; resource/crafting slice failed before Game constructor existed and passed after transaction implementation; save roundtrip failed before codec existed, then passed; runtime-validation and progression regressions failed before fixes. Public tests cover deterministic terrain/bounds/bedrock, finite gathering, stone gate, atomic crafting and repeat-tool rejection, placement overlap and inventory underflow, collision/recovery, validated save roundtrip and malformed/version/duplicate/out-of-bounds edits. Expected inventory values are concrete worked examples, not implementation-derived snapshots.

## Independent review

Standards agent reviewed efee062 against CODING_STANDARDS.md and Fowler smell baseline. One hard finding: nonfinite player coordinates bypassed placement. Fixed and added regression test. Two possible smells: player dimensions and crafting eligibility duplicated. Fixed with shared dimensions and canCraft query.

Spec agent independently reviewed efee062 against SPEC.md. Two findings: historical placement counts could satisfy goals after mining the boards; spent stone made gathering progress revert. Fixed with existing-edit counts and a saved gatheredStone milestone. Six boards remain a deliberately simple build milestone, not geometric shelter validation.

## Mac Chrome playthrough

Normal UI controls only for gameplay: keyboard/drag fallback, F gathering, E workbench, craft buttons, G placement, number hotbar keys, WASD walking, Space jumping. Gathered timber from nearby trunks, made boards, equipped pick, mined the exposed stone ridge, crafted glow, gathered more timber, made another board batch, placed walls/upper boards/canopy and glow. Opening goals completed. Mined an added board to alter construction. Reload preserved placed construction, pick, finite inventory and journey. Player-foot placement rejected without consuming boards. F while paused did not change inventory. Recovery returned to clear terrain and kept the pack. Movement and jumping worked; stone ridge collision prevented passing through the block. Pause and workbench resume worked.

390 × 844 viewport: workbench readable without horizontal clipping, six-slot hotbar fits. Chrome touch emulation displayed the pad and action buttons; backward movement and jump buttons exercised. Actual phone hardware and extended touch-only progression were not tested. Emulation and viewport overrides restored. Pointer-lock entry separately checked; keyboard/drag is the verified automation path. Screenshots captured from the live Mac Chrome tab, not mockups.

## Delivery constraints

Existing game paths inspected; none changed. At task start no listeners on ports 5173/5174 were present; no server was stopped or replaced. Hearthwild uses 127.0.0.1:5175. Codex project list inspected: repository exists on disk, but there is no supported project-registration API exposed, so this is not registered as a sidebar project. No app configuration files edited. No deployment or paid service used.

Final rechecks: both independent reviewers rechecked d5c93d5 and confirmed their findings resolved with no remaining concrete issues in the fixes. Final typecheck, nine tests, production build passed; online npm audit returned zero vulnerabilities. Build emits an advisory for the ~508 kB Three.js/application bundle (~130 kB gzip), accepted for this compact local game. Automated Chrome denied pointer lock; entry stayed playable and displayed its arrow/drag fallback. Native mouse capture in a human-controlled session remains unverified. A clean glade with empty inventory was restored through the in-game fresh-start confirmation, then left at onboarding. Live server remains on port 5175.
