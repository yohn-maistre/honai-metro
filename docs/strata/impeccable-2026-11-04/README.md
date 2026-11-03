# Impeccable evidence — 4 November 2026 (Bangkok)

Two independent reviews of the existing ETNOS interface, before redesign. Assessment A finished before the parent read Assessment B’s detector results. Source target: `apps/strata/src/App.svelte`; product runtime remains the deployed `2e5bc65` UI with engine `21904dc`.

- [Design assessment](assessment-a.md): 93 captures across 24 identified route families, mobile/desktop and selected tablet states, including accepted wiki, pending review and sponsored work.
- [Technical assessment](assessment-b.md): 45 route/width samples, supplementary themes/keyboard/error checks, source detector and four injected headless overlay samples. Both CLI warnings were reviewed and suppressed; one runtime line-wrap suggestion is minor.
- Eight selected PNG captures are retained here. All displayed people, communities, proposals and reporting are explicitly synthetic fixtures. Other paths in the assessment reports refer to retained temporary runtime evidence; they are not portable screenshot links or claims of production content.

## Parent verification after independent assessments

A focused browser check filled a wiki proposal with a unique synthetic unsaved marker, pressed Escape and reopened the proposal. Both the development server and built production preview closed without a discard prompt and restored only the accepted text, losing the unsaved marker. Both emitted `state_unsafe_mutation` from `DocumentEditor.svelte`’s transaction handler on blur during teardown. This is additional evidence beyond A’s source-only draft finding. There were no production writes. The parent synthesis therefore reduces technical implementation integrity from B’s 4 to 3: **15/20** technical health; A’s independent design score remains **23/40**.

## Scope and cleanup

Headless Chromium evidence is not a user-visible browser overlay, complete screen-reader audit, physical-device gesture check or measured production performance assessment. The reports enumerate missing populated media, messaging, agent and failure/conflict states. Do not describe this as every screen tested. All review browsers and in-memory stores closed; the overlay helper stopped without source injection. The parent stopped both local Vite processes after verification. No UI fixes were applied during critique.
