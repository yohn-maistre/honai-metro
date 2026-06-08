# Indonesian Text-to-Speech for Aksara — model survey and recommendation

> Scope: pick the TTS engine(s) that give Aksara nodes an expressive Indonesian voice for surat-flow responses, persona personalities (Staf Administrasi, Bendahara, Sekretaris, Arsiparis Digital, Operator Sistem), and offline-graceful fallback. Constrained by Orange Pi 5 (RK3588S NPU, 8–16 GB RAM), Indonesia data-residency, permissive license, and the "feels human, not robocall" bar. Survey current as of mid-2026.
>
> Status: **v0.1, opinionated**. Owner: ETNOS core. Last revision: 2026-06-08.

---

## TL;DR

Run a **2 B-parameter tokenizer-free diffusion-autoregressive TTS** as the primary engine, hosted on a single A10/L4 GPU at IDCloudHost (or inside the NVIDIA NIM Indonesia sandbox when it lights up), exposed to Aksara nodes over a streaming WebSocket. It supports Indonesian as a first-class training language (1.36% ASR-WER on Indonesian eval), Apache 2.0, voice cloning + text-described "voice design," 110 ms first-byte streaming, and 48 kHz output. **Cloud-primary matches the rest of the Aksara reasoning stack** (Amendment 5 of v3.6) and keeps the Pi free for Gemma 4 E4B + LightRAG. **Fallback on-device** is the Indonesian Piper VITS voice (`id_ID-news_tts-medium`) served via sherpa-onnx with RKNN delegation to the RK3588 NPU — single-speaker, slightly newsreader-flat, but real-time and offline-capable. **Cloud API of last resort** for high-stakes production polish (kepala-desa-facing surat read-aloud) is Google Cloud TTS Chirp 3: HD Indonesian. Honest caveat: no current model nails Papuan Malay; we accept formal Jakarta-register Indonesian for v1 and plan a small fine-tune by M9.

---

## 1. Scorecard

Weights reflect Aksara's constraints: Indonesian quality > license > deployability > voice variety > streaming > expressivity > release-date freshness. "Pi-NPU OK" means real-time-factor (RTF) < 0.5 in a credible community port; "cloud-OK" means it fits a single mid-tier GPU at <1 s first-byte.

| Model | ID quality | License | Pi-NPU | Cloud-OK | Voice variety | Expressivity | Streaming | Released | Verdict |
|---|---|---|---|---|---|---|---|---|---|
| VoxCPM2 (OpenBMB) | High (trained, 1.36% ASR-WER) | Apache 2.0 | No (8 GB VRAM; CPU port too slow for streaming) | Yes (A10/L4, 110 ms FB) | Voice design + cloning, unlimited personas | Strong (diffusion AR) | Yes (chunked) | Apr–May 2026 | **Primary (cloud)** |
| Piper VITS `id_ID-news_tts-medium` | OK (news register, flat-ish) | MIT | **Yes** (sherpa-onnx RKNN, RTF ~0.15) | n/a | 1 voice | Low | Yes | 2024, stable | **Fallback (offline)** |
| Google Cloud TTS Chirp 3: HD ID | Very high | Closed, $30/M chars | No | API | ~6 ID voices | Good | Yes | 2026 | **Production-polish fallback** |
| facebook/mms-tts-ind | OK (VITS, single speaker, robotic) | CC-BY-NC 4.0 | Yes (small) | Yes | 1 voice | Low | Partial | 2023 | Skip (NC license kills civic use) |
| CosyVoice 3.5 (Alibaba) | Claimed (added Mar 2026) | Apache 2.0 (weights), terms vary | No (≥6 GB VRAM) | Yes (150 ms FB) | Multi via FreeStyle prompts | Strong | Yes | Mar 2026 | Watch — needs native-speaker eval |
| Fish Audio S2 Pro | "Global Coverage" tier (lower than zh/en/ja) | Closed/API | No | API | Multi-speaker | Strong (tags) | Yes | 2026 | Skip (closed) |
| Fish Speech 1.5 (open) | English/zh-strong; ID untested | Apache 2.0 | No | Yes | Cloning | Medium | Yes | 2024 | Skip (older, ID weak) |
| Chatterbox Multilingual (Resemble) | **Indonesian NOT in 23-lang list** | MIT | No | Yes | Cloning | Strong | Partial | 2025 | Skip (no ID) |
| Chatterbox-TTS-Indonesian (community FT) | Decent (SuaraGabungan-ID) | Apache 2.0 | No (cloning needs GPU) | Yes | Cloning | Medium | Partial | 2025 | Backup OSS candidate |
| F5-TTS (SWivid) base | Bad on ID (community-confirmed) | MIT | No | Yes | Cloning | Strong | Yes | 2024 | Skip base |
| F5-TTS-INDO-FINETUNE-V2 (Eempostor) / Ijazah_Palsu_V2 (PapaRazi) | Variable; speaker-similarity issues acknowledged | MIT (model FT inherits) | No | Yes | Cloning | Medium | Yes | Jan 2026 | Backup OSS candidate |
| Kokoro 82M | **No Indonesian** | Apache 2.0 | Yes (CPU, 300 MB) | Yes | 54 preset, all non-ID | Low | Yes | 2025 (#1 TTS Arena) | Skip (no ID) |
| MeloTTS | **No Indonesian** (Malay fork only) | MIT | Yes | Yes | Multi-lang | Medium | Partial | 2024 | Skip (no ID) |
| OpenVoice v2 | Zero-shot cross-lingual only; not trained on ID | MIT | No | Yes | Cloning | Medium | No | 2024 | Skip (poor ID) |
| XTTS-v2 (Coqui) | Not in 17 official langs | CPML (no commercial w/o license) | No | Yes | Cloning | Strong | Partial | 2023; **company defunct Dec 2025** | Skip (license + dead) |
| Style-TTS 2 | English-only base; no ID FT | MIT | No | Yes | English voices | Strong | No | 2024 | Skip |
| Bark (Suno) | Multilingual incl ID but variable | MIT | No (~6 GB VRAM) | Yes | Multi | High (paralinguistic) | No | 2023 | Skip (slow, inconsistent) |
| MaskGCT | 6 langs (en/zh/ko/ja/fr/de) | Custom | No | Yes | Cloning | Strong | No | 2024 | Skip (no ID) |
| NaturalSpeech 3 | Research-only, no public weights | Microsoft Research | n/a | n/a | n/a | Strong | n/a | 2024 | Skip (not released) |
| Sesame CSM-1B | "One language" currently (en); ID would need FT | Apache 2.0 | No | Yes | Cloning | Strong (context-aware) | Yes | Mar 2025 | Watch (FT path) |
| CSM-1B Indonesian FT (Ellbendls) | Decent, 81 speakers, 24 kHz | Apache 2.0 (FT inherits) | No | Yes | 81 speakers | Medium | Yes | 2026 | **Strong OSS backup** |
| NVIDIA Riva / Magpie TTS Multi | **Indonesian not in supported list** (en/es/fr/de/zh/vi/it/hi/ja) | NVIDIA AI Enterprise | No (16 GB VRAM) | Yes | Limited | Good | Yes | 2026 | Skip until ID lands |
| ElevenLabs v3 | High (70+ langs incl ID) | Closed API, paid | No | API | 1000s cloned | High | Yes | 2026 | Cloud-fallback option |
| OpenAI gpt-4o-mini-tts | OK (50+ langs incl ID); slightly robotic | Closed API, $0.015/min | No | API | 13 preset voices | Steerable | Yes | 2025 | Cloud-fallback option |
| Azure Speech Neural HD | High (ID neural voices: Gadis, Ardi) | Closed API, $22/M chars | No | API | 2 ID voices | Good | Yes | 2026 | Cloud-fallback option |
| Microsoft Edge-TTS | High (uses Azure voices for free) | **TOS forbids commercial use** | No | n/a | Many | Good | Yes | Free | **Skip (license violation)** |

---

## 2. The candidate verdict — yes, with a footnote

The user's candidate is the right pick **as the cloud-primary engine**, not as an on-device engine. The reasons are concrete:

**For it.** Indonesian is a first-class supported language in the 30-language list, not a "we trained mostly English and threw some IPA in" afterthought. The model's own ASR-side eval shows 1.36% WER on Indonesian — that is a strong signal the speech embedding genuinely captures Bahasa Indonesia phonotactics. Apache 2.0 covers commercial civic use without strings. The diffusion-AR architecture is genuinely expressive (intonation, register, questions, emphasis are not flat). 110 ms first-byte streaming and chunked output meet the "user hears speech start before generation finishes" constraint. Voice design (text-described personas like "warm female administrative voice, Jakarta accent, professional") plus voice cloning gives us trivial mapping to the five Aksara personas. The release is recent (April–May 2026), the project has momentum, and a community CPU port (`VoxCPM.cpp` on GGML, Q4_K / Q8_0 GGUF) exists for the future.

**Against it for the Pi.** The model is 2 B parameters, bf16 ≈ 8 GB VRAM. On CPU, the community port reports model-only RTF of 3.83–15.02 (i.e. **4–15 seconds of compute per second of audio**) — multiple minutes for a typical surat-response utterance. Even with Q4_K quantization, the Orange Pi 5's CPU is unlikely to hit real-time, and the RKNN NPU does not yet have a port for diffusion-AR TTS models (the RKNN ecosystem is mature for VITS-style and YOLO-style models, not yet for this class). Edge-deployment is **not the right altitude for this model in 2026**.

**Where it fits.** It belongs at the same altitude as the cloud LLM. Aksara's architecture (v3.6 Amendment 5) is already cloud-primary for reasoning, with the local SLM as backstop. Putting the expressive TTS on the same cloud tier is consistent: surat responses, persona dialogue, ETNOS-side voice messages all hit the cloud TTS when the IoT SIM is up. When the SIM drops or PII is detected at boundary, the node falls back to a smaller offline voice. That is the same routing rule Hermes Agent already uses for reasoning — no new architectural primitive needed.

---

## 3. Indonesian quality — who actually sounds Indonesian?

Marketing claims about "supports Bahasa Indonesia" are mostly meaningless because the relevant question is whether native Indonesian audio was in the training set at scale. The honest groupings:

- **Trained on real Indonesian at scale**: the primary cloud candidate (1.36% Indonesian ASR-WER is hard to fake), Google Chirp 3 HD ID, Azure Neural HD ID (Gadis, Ardi), and ElevenLabs Indonesian voices. Native-speaker spot-checks on Hugging Face Spaces and the Google/Azure demo pages confirm these sound like Indonesian people, not English speakers reading IPA.
- **Trained on Indonesian, but flat / single-register**: `facebook/mms-tts-ind` (VITS, MMS project — sounds fine but newsreader-monotone), Piper `id_ID-news_tts-medium` (community FT on news corpus, similar register), CSM-1B Indonesian fine-tune (81 speakers, 24 kHz, surprisingly varied for an OSS FT).
- **Community Indonesian fine-tunes of English models**: F5-TTS-INDO-FINETUNE-V2 and Ijazah_Palsu_V2 explicitly acknowledge speaker-similarity and emotion mismatch issues. They're usable for demos, not production civic flows.
- **Claims Indonesian, untested or "global coverage tier"**: Fish Audio S2 Pro puts Indonesian in the second tier behind zh/en/ja — interpret as "we have data, we did not optimize for it." OpenAI's TTS inherits Whisper's language list (50+ langs) but Indonesian is unevaluated. CosyVoice 3.5 added Indonesian in March 2026 — no independent native-speaker review surfaced as of June 2026; needs evaluation before commitment.
- **Does not support Indonesian**: Kokoro, MeloTTS (base), Chatterbox Multilingual base, NVIDIA Magpie TTS Multilingual, MaskGCT, Style-TTS 2, NaturalSpeech 3.

The bar for "good Indonesian" should be **"a native speaker from Jayapura can listen for 30 seconds and not flinch at vowel length, the final-glottal-stop on words ending in -k, or the stress pattern on three-syllable Sanskrit-derived words like *sertifikat*."** Apply this bar in pilot; do not trust vendor leaderboards.

---

## 4. Deployment story — primary engine

**Where it runs.** A single A10 (24 GB) or L4 (24 GB) GPU instance at IDCloudHost (or inside the NVIDIA NIM Indonesia sandbox once available — the v3.6 §22 data-residency commitment is satisfied either way because both are Indonesia-hosted). The model in bf16 fits comfortably; even an A10 has headroom for 4–8 concurrent streams. The same VM hosts a small FastAPI/WebSocket service that exposes:

- `POST /tts/synthesize` for non-streaming (short utterances)
- `WS /tts/stream` for chunked streaming (default for surat responses)
- Per-persona endpoints with cached voice-design prompts and (optionally) cloned reference clips

**Latency budget.** Cloud-side first-byte ≤ 200 ms (model 110 ms + jitter). Network IoT-SIM RTT to Jakarta GPU adds 60–150 ms. Total perceived first-byte ≤ 400 ms in normal conditions — well inside the 1 s Tier B target. Full 30-second surat-response utterance generates in ≈ 9 seconds on A10 (RTF ~0.3), but chunked output means the user hears the first second of audio almost immediately and the rest streams behind.

**Memory budget.** Cloud: 8 GB VRAM for the model, ~2 GB for runtime overhead. Pi: zero — the Pi only runs the WebSocket client and an audio sink. This preserves the Pi's RAM for Gemma 4 E4B (≈ 4 GB), LightRAG + sqlite-vec (≈ 1 GB), Hermes Agent runtime, and aksara-cli.

**Audio pipeline on the Pi.** WebSocket consumer → opus decoder → ALSA sink (for the OLED/e-ink panel's small speaker) or WhatsApp voice-note upload (for citizen delivery, where the chunked stream is buffered locally and packaged as a single Ogg-Opus file). The Pi never synthesizes; it receives PCM/Opus frames.

**Routing rule** (consistent with Hermes Agent provider abstraction):

```
TTS request
  ├─ IoT SIM up && cloud-tts-budget remaining → primary engine (A10 in ID)
  ├─ IoT SIM up && Presidio-ID flagged content → primary engine, ephemeral mode (no caching, no log retention beyond audit hash)
  ├─ IoT SIM down → on-device fallback (sherpa-onnx + Piper id_ID-news_tts-medium on NPU)
  └─ Cloud engine 5xx for 30s → fall through to Google Cloud TTS Chirp 3 HD ID (paid API, residency: Singapore region acceptable for non-PII responses; Presidio gates this path)
```

The PII gate matters: a cloud TTS provider receives the text to synthesize. For surat content (which includes NIK, KK numbers, names), routing through ElevenLabs or OpenAI is a data-residency violation. The primary engine is OK because it runs in Indonesia; the fallback Google API is OK only for non-PII responses (greetings, status updates, error messages); for PII surat read-aloud during a cloud outage, the system degrades to the Pi-side Piper voice and a "*kualitas suara sederhana, koneksi terbatas*" notice.

---

## 5. Cloud fallback cost

For the high-polish API fallback (Google Chirp 3 HD Indonesian):

- **$30 per 1 million characters** input.
- A typical surat-response utterance is ~600 characters spoken in ~30 seconds. That is **$0.018 per utterance**.
- At the pilot success metric of 500 docs/month/unit, with ~3 voice interactions per doc, that is ~1500 utterances/unit/month = **$27/unit/month** worst-case if every utterance hit the paid API.
- In practice the primary engine handles >95% of traffic. Fallback cost lands at <$2/unit/month. Negligible vs. compute budget.

Azure Neural HD ID at $22/M chars is cheaper and has the Gadis/Ardi voices (high quality), but requires Azure account ops. ElevenLabs Indonesian is highest quality and highest cost ($330/month Scale plan minimum for production-volume). OpenAI gpt-4o-mini-tts is cheapest at ~$0.015/min of audio but Indonesian quality is mid-tier.

Primary engine self-hosted on IDCloudHost A10 runs ~$0.50/hour × 730 hours = **$365/month flat** for the GPU, serving ~600 concurrent-stream-hours. Across 7 pilot units that is **$52/unit/month** — same order as the API but with better latency and full residency control. The math flips in our favor as pilot scales.

---

## 6. License gotchas

- **Microsoft Edge-TTS is off the table.** It is technically Azure neural voices behind a free wrapper, and Microsoft's TOS explicitly says it is for Edge browser reader use only. Using it in production civic flows is a TOS violation, however quiet. Do not let anyone slip this into a "free voice on the demo" Friday-afternoon shortcut.
- **facebook/mms-tts-ind is CC-BY-NC 4.0.** Non-commercial. A government-issued surat with revenue-attached service is commercial activity by any reasonable read. Skip.
- **XTTS-v2 is CPML** (Coqui Public Model License) which requires a paid commercial license. Coqui the company also closed in December 2025, so no one is even available to sell us one. Skip.
- **Bark, MeloTTS, OpenVoice v2 are MIT.** Fine licensing-wise; they just don't speak Indonesian well enough to matter.
- **Primary cloud engine is Apache 2.0.** Clean for commercial civic use, including BSrE-sealed audio attachments to surat if we ever go there.
- **The CSM-1B Indonesian fine-tune and the F5-TTS Indonesian fine-tunes** inherit MIT / Apache 2.0 from upstream. The Hugging Face model cards do not assert additional restrictions. Diligence: re-check the dataset licenses (SuaraGabungan-ID, the curated Bahasa corpus the Ijazah model used) before any production commitment — community fine-tunes occasionally train on copyrighted radio/podcast audio without saying so.
- **Cloud APIs (Google, Azure, ElevenLabs, OpenAI)** carry standard commercial T&Cs; verify the per-character / per-token contract supports broadcast/civic output (it does, in all four cases as of 2026).

---

## 7. Voice persona mapping

The Master Proposal names five personas (§11): **Staf Administrasi, Operator Sistem, Bendahara, Sekretaris, Arsiparis Digital**. With the primary engine's voice design + cloning, we propose:

| Persona | Voice profile | Source |
|---|---|---|
| Staf Administrasi | Warm female, Jakarta professional register, mid-30s, clear articulation | Voice design prompt |
| Bendahara | Steady male, mid-40s, slightly slower pace, fiscal-formal | Voice design prompt |
| Sekretaris | Female, slightly younger, friendlier register, faster pace | Voice design prompt |
| Arsiparis Digital | Neutral/androgynous, monotone-by-design (archive narration) | Voice design prompt |
| Operator Sistem | Male, terse, technical register, fewer fillers | Voice design prompt |

Voice design via text description avoids reference-clip licensing entirely (no need for a real person to record reference audio). If pilot feedback wants more local-color, we can clone from a single 10-second clip of a willing local volunteer per persona, with explicit consent recorded via CARE-as-Code.

**On-device fallback** has only the one Piper voice; under degraded mode all personas collapse to a single "Staf Administrasi-suara-darurat" speaker. The UI should make this transparent ("**Mode darurat: koneksi terbatas, suara seragam**").

---

## 8. Papuan Malay — the honest answer

No current TTS model produces convincing Papuan Malay. The literature has expressive Indonesian work (Tacotron 2 + Global Style Token for Indonesian / Javanese / Sundanese, INTERSPEECH 2023 STEN-TTS for code-switching), but none of it is Papuan-specific, and no open model has Papuan training data at meaningful scale. The primary engine produces Jakarta-register Bahasa Indonesia. That is the v1 reality.

Three options for the gap, in increasing ambition:

1. **Accept Jakarta-register for pilot.** Most government surat output is already in formal Jakarta-register Bahasa; this matches user expectation for institutional voice. Papuan Malay matters more in citizen-facing intake (which is voice-to-text, where Gemma multimodal handles it) than in node response. Acceptable for M0–M12.

2. **Light voice-cloning from a Papuan speaker.** A 10-second clip of a Papuan civil servant willing to "lend their voice" to the local Aksara node, via the primary engine's controllable voice cloning. Prosody shifts toward Papuan intonation, segmentals stay Jakarta-Bahasa. Better than option 1; ethical sourcing required (CARE-as-Code consent, revocable, clip-not-stored beyond the local Pi).

3. **Fine-tune the primary engine on a small Papuan Malay corpus** (M9–M12 stretch). 5–20 hours of clean Papuan-Malay speech from a volunteer Diskominfo Papua dataset is feasible. Apache 2.0 weights let us republish the fine-tune to the community as a Papua-specific contribution. This is the most defensible long-term answer and aligns with the Hub-level federated-learning track in the proposal (§36).

Flag this as a known limitation in the pilot communication. Do not over-promise "Aksara berbicara Papua" in M0–M6.

---

## 9. The unsatisfying caveat

Indonesian TTS in mid-2026 is **good enough for civic deployment but not yet good enough to feel intimate.** The primary engine will sometimes mis-stress *kepala kelurahan* on the wrong syllable. Cloud Indonesian voices from Google/Azure are smoother but read formal text more naturally than they read conversational text — they sound like announcements, not like the staf at the loket. ElevenLabs is closest to "feels human" but is foreign-hosted and pricey for civic budget.

If pilot field feedback in M6–M8 says "robotik, tidak ramah," the escalation ladder is:

1. **Tune voice-design prompts** (cheapest; just text). Add explicit "ramah, hangat, sedikit informal" cues.
2. **Switch to per-unit cloned voices** with local volunteer reference clips (free; consent-gated).
3. **Fall through to ElevenLabs Indonesian for citizen-facing flows only** (paid; non-PII only; gates via Presidio).
4. **Fine-tune on a Papua-region corpus** in M9–M12 (engineering effort but produces a community deliverable).

The realistic worst case is that we ship M6 with the primary engine on cloud + Piper on edge, citizens say "okay, terdengar formal seperti pegawai negeri" (which is *the actual target* — the persona is PNS Digital, not a friend), and we iterate prosody warmth in M9.

The truly bad case — every modern Indonesian TTS sounds wrong to Papuan users in a way no amount of prompt-tuning fixes — has a non-zero probability and would force us to fall back to a thoughtful **text + UI-tone** product strategy (no voice output by default, voice-on-request) until the M9–M12 Papua fine-tune ships. Document this as a pilot risk; it is not a project risk.

---

## 10. Sources

- VoxCPM2 model card and license: https://huggingface.co/openbmb/VoxCPM2
- VoxCPM project & demo: https://openbmb.github.io/VoxCPM-demopage/ and https://voxcpm.net/
- VoxCPM.cpp (CPU/GGUF port): https://github.com/bluryar/VoxCPM.cpp and https://voxcpm.readthedocs.io/en/latest/deployment/voxcpm_cpp.html
- F5-TTS Indonesian community discussion: https://github.com/SWivid/F5-TTS/discussions/1119, https://huggingface.co/Eempostor/F5-TTS-INDO-FINETUNE
- Piper voices repo (Indonesian voice added): https://huggingface.co/rhasspy/piper-voices and https://huggingface.co/rhasspy/piper-voices/commit/67265bba2397cfb86ff687cfc7ffe3a0e3c3aa55
- Piper on RK3588 NPU benchmark: https://clehaxze.tw/gemlog/2023/12-24-accelerating-piper-text-to-speech-on-the-rk3588-npu.gmi
- sherpa-onnx RKNN deployment: https://github.com/k2-fsa/sherpa-onnx
- facebook/mms-tts-ind model card: https://huggingface.co/facebook/mms-tts-ind
- CSM-1B Indonesian fine-tune: https://huggingface.co/Ellbendls/csm-1b-indonesian-fine-tuned
- Sesame CSM upstream: https://github.com/SesameAILabs/csm and https://huggingface.co/sesame/csm-1b
- Chatterbox Multilingual (Indonesian not listed): https://www.resemble.ai/introducing-chatterbox-multilingual-open-source-tts-for-23-languages/
- Chatterbox-TTS-Indonesian (community FT): https://huggingface.co/grandhigh/Chatterbox-TTS-Indonesian
- Kokoro TTS: https://kokorottsai.com/ and https://texttolab.com/blog/kokoro-tts-review
- MeloTTS supported languages: https://github.com/myshell-ai/MeloTTS
- OpenVoice v2 supported languages: https://huggingface.co/myshell-ai/OpenVoiceV2
- XTTS-v2 status + Coqui closure: https://huggingface.co/coqui/XTTS-v2 and https://qcall.ai/coqui-tts-review
- CosyVoice 3 / 3.5: https://funaudiollm.github.io/cosyvoice3/ and https://arxiv.org/abs/2505.17589 and https://gaga.art/blog/fun-cosyvoice3-5-and-fun-audiogen-vd/
- Fish Audio S2: https://fish.audio/s2/
- MaskGCT supported languages: https://github.com/open-mmlab/Amphion/blob/main/models/tts/maskgct/README.md
- NVIDIA Magpie TTS language list: https://docs.nvidia.com/nim/speech/latest/reference/support-matrix/tts.html
- Google Cloud TTS Chirp 3 HD: https://cloud.google.com/text-to-speech/pricing and https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd
- Azure Speech neural HD pricing: https://azure.microsoft.com/en-us/pricing/details/speech/
- ElevenLabs Indonesian + pricing: https://elevenlabs.io/pricing and https://elevenlabs.io/speech-to-text/indonesian
- OpenAI gpt-4o-mini-tts: https://platform.openai.com/docs/guides/text-to-speech and https://tokenmix.ai/blog/gpt-4o-mini-tts-cheapest-tts-api-2026
- Edge-TTS TOS discussion: https://learn.microsoft.com/en-us/answers/questions/2088770/are-opensource-edge-tts-free-for-commercial-use
- Indonesian expressive TTS research (Tacotron 2 + GST): https://ieeexplore.ieee.org/document/9640266/
- STEN-TTS Indonesian–English code-switching: https://arxiv.org/pdf/2412.19043
