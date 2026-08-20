# architecture
- Canvas dot-grid engine for all maps: per-feature alpha coverage rasterization (threshold 32) instead of indexed color channel. No point-in-polygon math at runtime. Confidence: 0.75
- Cross-product separation: detak-detik is the press/news organ, ETNOS is the community square; ETNOS points at press via deep links (kliping URL), never rehosts press content. Confidence: 0.80
- i18n must maintain full parity across en/id/pmy (Indonesian + Papuan Malay) for all etnos.* keys. Confidence: 0.80
- No new npm dependencies for features—hand-roll charts, components, etc. using Svelte 5 and Tailwind. Confidence: 0.70
- Use SWR-localStorage caching pattern for live data fetches with honest null/nihil/point degradation. Confidence: 0.70
- SvelteKit SPA with SSR off, Svelte 5 runes ($state/$derived/$effect/$props). Confidence: 0.70
