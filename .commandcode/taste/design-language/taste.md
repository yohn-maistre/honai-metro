# design-language
- Honai Metro design language: terracotta primary (#C0633E) + cream paper (#d6cbac page, #e3dabf card surface). Confidence: 0.85
- No hover color changes on surfaces—hover should only affect controls, never repaint page/card backgrounds. Confidence: 0.80
- Three-layer broadsheet doctrine: Layer 0 flat paper (content directly on page), Layer 1 instruments (card skin for self-contained live objects only), Layer 2 floats (dossier/legend/menus get the only shadows). Confidence: 0.75
- Card skin when warranted: `bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 border-b-slate-300 dark:border-zinc-800 dark:border-t-zinc-700`, no shadow/gradients/translucency. Confidence: 0.75
- Density preference: use 87.5% font size on html element for ~80% zoom feel. Confidence: 0.70
- No gradients, no uppercase-tracking micro labels, no pill backgrounds (dots carry status). Confidence: 0.75
- Design language must be island-agnostic—ETNOS is a template other islands can inherit, not Papua-specific. Confidence: 0.80
