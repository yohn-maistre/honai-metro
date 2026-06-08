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

The user's candidate is the right pick **as the cloud-primary engine**, not as an on-device engine.

**For it.** Indonesian is a first-class supported language in the 30-language list, not an afterthought. The model's own ASR-side eval shows 1.36% WER on Indonesian — strong signal the speech embedding captures Bahasa Indonesia phonotactics. Apache 2.0 covers commercial civic use without strings. The diffusion-AR architecture is genuinely expressive (intonation, register, questions, emphasis). 110 ms first-byte streaming meets the "user hears speech start before generation finishes" constraint. Voice design (text-described personas) plus voice cloning gives trivial mapping to the five Aksara personas. Recent release (April–May 2026), strong momentum, and a community CPU port (`VoxCPM.cpp` on GGML, Q4_K / Q8_0 GGUF) exists for future edge work.

**Against it for the Pi.** The model is 2 B parameters, bf16 ≈ 8 GB VRAM. On CPU, the community port reports model-only RTF of 3.83–15.02 — **4–15 seconds of compute per second of audio**, multiple minutes for a typical surat-response utterance. Even Q4_K won't hit real-time on the Pi CPU, and the RKNN NPU does not yet have a port for diffusion-AR TTS (mature for VITS-style only). Edge-deployment is **not the right altitude for this model in 2026**.

**Where it fits.** Same altitude as the cloud LLM. Aksara's architecture (v3.6 Amendment 5) is already cloud-primary for reasoning with local SLM as backstop; cloud TTS on the same tier is consistent. Same routing rule Hermes Agent already uses for reasoning — no new primitive.

---

## 3. Indonesian quality — who actually sounds Indonesian?

"Supports Bahasa Indonesia" is mostly meaningless; the question is whether native Indonesian audio was in training at scale.

- **Trained on real Indonesian at scale**: the primary cloud candidate (1.36% ID ASR-WER), Google Chirp 3 HD ID, Azure Neural HD ID (Gadis, Ardi), ElevenLabs ID voices. Native-speaker spot-checks on the Google/Azure demo pages confirm these sound like Indonesian people, not English speakers reading IPA.
- **Trained on Indonesian, but flat / single-register**: `facebook/mms-tts-ind`, Piper `id_ID-news_tts-medium`, CSM-1B Indonesian fine-tune (81 speakers, 24 kHz, surprisingly varied for an OSS FT).
- **Community FTs of English models**: F5-TTS-INDO-FINETUNE-V2, Ijazah_Palsu_V2 — acknowledge speaker-similarity and emotion mismatch. Demo-grade, not civic-grade.
- **Claims Indonesian, untested**: Fish Audio S2 Pro ("Global Coverage" tier behind zh/en/ja). OpenAI gpt-4o-mini-tts (Whisper language list). CosyVoice 3.5 (added March 2026, no independent native-speaker review yet).
- **Does not support Indonesian**: Kokoro, MeloTTS base, Chatterbox Multilingual base, NVIDIA Magpie TTS Multi, MaskGCT, Style-TTS 2, NaturalSpeech 3.

The bar for "good Indonesian" should be: a native speaker from Jayapura can listen 30 seconds and not flinch at vowel length, the final-glottal-stop on words ending in -k, or stress on Sanskrit-derived words like *sertifikat*. Apply this in pilot; do not trust vendor leaderboards.

---

## 4. Deployment story — primary engine

**Where it runs.** Single A10 (24 GB) or L4 (24 GB) instance at IDCloudHost (or NVIDIA NIM Indonesia sandbox when available — v3.6 §22 residency commitment satisfied either way). The bf16 model fits with headroom for 4–8 concurrent streams. The VM hosts a small FastAPI/WebSocket service: `POST /tts/synthesize` (short), `WS /tts/stream` (default for surat), per-persona endpoints with cached voice-design prompts.

**Latency budget.** Cloud-side first-byte ≤ 200 ms (model 110 ms + jitter). IoT-SIM RTT to Jakarta adds 60–150 ms. Total perceived first-byte ≤ 400 ms — inside the 1 s Tier B target. Full 30-second surat-response generates in ≈ 9 s on A10 (RTF ~0.3); chunked output means the user hears the first second of audio almost immediately.

**Memory budget.** Cloud: 8 GB VRAM + ~2 GB overhead. Pi: zero — WebSocket client + audio sink only. Preserves Pi RAM for Gemma 4 E4B (≈ 4 GB), LightRAG + sqlite-vec (≈ 1 GB), Hermes Agent, aksara-cli.

**Audio pipeline on the Pi.** WebSocket consumer → Opus decode → ALSA sink (panel speaker) or buffer to Ogg-Opus file (WhatsApp voice-note delivery). The Pi never synthesizes; it receives PCM/Opus frames.

**Routing rule** (consistent with Hermes Agent provider abstraction):

```
TTS request
  ├─ IoT SIM up && cloud-tts-budget remaining → primary engine (A10 in ID)
  ├─ IoT SIM up && Presidio-ID flagged content → primary engine, ephemeral mode (no caching, no log retention beyond audit hash)
  ├─ IoT SIM down → on-device fallback (sherpa-onnx + Piper id_ID-news_tts-medium on NPU)
  └─ Cloud engine 5xx for 30s → fall through to Google Cloud TTS Chirp 3 HD ID (paid API, residency: Singapore region acceptable for non-PII responses; Presidio gates this path)
```

The PII gate matters: a cloud TTS provider receives the text to synthesize. Surat content (NIK, KK numbers, names) routed through ElevenLabs/OpenAI is a residency violation. The primary engine is OK because it runs in Indonesia; the Google API fallback is OK only for non-PII (greetings, status, errors). For PII surat read-aloud during a cloud outage the system degrades to Pi-side Piper plus a "*kualitas suara sederhana, koneksi terbatas*" notice.

---

## 5. Cloud fallback cost

For the API fallback (Google Chirp 3 HD ID): **$30 per 1 M characters**. A typical surat-response is ~600 chars in ~30 s → **$0.018/utterance**. At 500 docs/month/unit × ~3 voice interactions = 1500 utterances/unit/month = **$27/unit/month** worst-case if every utterance hit the paid API. In practice the primary engine handles >95% of traffic; fallback lands at <$2/unit/month.

Alternatives: Azure Neural HD ID at $22/M chars (Gadis, Ardi voices, high quality, Azure account ops needed). ElevenLabs ID: highest quality, $330/month Scale minimum for production-volume. OpenAI gpt-4o-mini-tts: cheapest at ~$0.015/min of audio, mid-tier ID quality.

Primary engine self-hosted on IDCloudHost A10 ≈ $0.50/hr × 730 hr = **$365/month flat**, ~600 concurrent-stream-hours. Across 7 pilot units that is **$52/unit/month** — same order as the API but with better latency and full residency control. The math flips in our favor as pilot scales.

---

## 6. License gotchas

- **Edge-TTS is off the table.** Azure neural voices behind a free wrapper; Microsoft TOS limits to Edge browser reader use. Production civic use is a TOS violation. Block at the demo level.
- **facebook/mms-tts-ind is CC-BY-NC 4.0.** Government-issued surat counts as commercial. Skip.
- **XTTS-v2 is CPML** (paid commercial license required), and Coqui closed December 2025 — no one to sell us one. Skip.
- **Bark, MeloTTS base, OpenVoice v2 are MIT.** Fine licensing-wise; they don't speak Indonesian well enough to matter.
- **Primary cloud engine is Apache 2.0.** Clean for civic use, including BSrE-sealed audio attachments.
- **CSM-1B-ID and F5-TTS Indonesian FTs** inherit MIT / Apache 2.0 upstream. Diligence: re-check dataset licenses (SuaraGabungan-ID, the curated Bahasa corpus Ijazah used) before production — community FTs sometimes train on copyrighted radio/podcast audio undeclared.
- **Cloud APIs (Google, Azure, ElevenLabs, OpenAI)** standard commercial T&Cs; all four support broadcast/civic output as of 2026.

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

Voice design via text avoids reference-clip licensing. If pilot feedback wants more local color, clone from a 10-second clip of a willing local volunteer per persona, consent via CARE-as-Code.

**On-device fallback** has only the one Piper voice; under degraded mode all personas collapse to one "Staf Administrasi-suara-darurat" speaker. UI should be transparent: "**Mode darurat: koneksi terbatas, suara seragam**".

---

## 8. Papuan Malay — the honest answer

No current TTS model produces convincing Papuan Malay. The literature has expressive ID work (Tacotron 2 + Global Style Token for ID/Jv/Su, INTERSPEECH 2023 STEN-TTS code-switching), but none is Papuan-specific, and no open model has Papuan data at meaningful scale. The primary engine produces Jakarta-register Bahasa Indonesia. That is the v1 reality.

Three options, increasing ambition:

1. **Accept Jakarta-register for pilot.** Government surat output is already Jakarta-formal; matches user expectation for institutional voice. Papuan Malay matters more in citizen-facing intake (voice-to-text, Gemma multimodal handles it) than in node response. Acceptable M0–M12.
2. **Light voice-cloning from a Papuan speaker.** 10-second clip of a Papuan civil servant via primary engine cloning. Prosody shifts Papuan, segmentals stay Jakarta-Bahasa. CARE-as-Code consent, revocable, clip-not-stored beyond local Pi.
3. **Fine-tune the primary engine on a Papuan Malay corpus** (M9–M12 stretch). 5–20 h of clean speech from a Diskominfo Papua volunteer dataset. Apache 2.0 weights let us republish as a Papua-specific community contribution. Aligns with the Hub-level federated-learning track in §36.

Flag as a known limitation in pilot comms. Do not over-promise "Aksara berbicara Papua" in M0–M6.

---

## 9. The unsatisfying caveat

Indonesian TTS in mid-2026 is **good enough for civic deployment but not yet good enough to feel intimate.** The primary engine will sometimes mis-stress *kepala kelurahan*. Google/Azure ID voices are smoother but read formal text more naturally than conversational text — announcements, not the staf at the loket. ElevenLabs is closest to "feels human" but foreign-hosted and pricey.

If pilot feedback in M6–M8 says "robotik, tidak ramah," the escalation ladder:

1. Tune voice-design prompts. Add "ramah, hangat, sedikit informal" cues.
2. Per-unit cloned voices from local volunteer clips (consent-gated).
3. Fall through to ElevenLabs ID for citizen-facing non-PII flows only (Presidio-gated).
4. Fine-tune on a Papua-region corpus M9–M12.

Realistic worst case: M6 ships with primary cloud + Piper edge, citizens say "okay, terdengar formal seperti pegawai negeri" — *that is the actual target*; the persona is PNS Digital, not a friend. We iterate warmth in M9.

Truly bad case: every modern ID TTS sounds wrong to Papuan users in ways no prompt-tuning fixes. Forces fallback to **text + UI-tone** strategy (no voice by default, voice-on-request) until the M9–M12 Papua FT ships. Pilot risk, not project risk.

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
