# design-language
See [design-language/taste.md](design-language/taste.md)
# naming-conventions
- The flipboard/Solari board is called "Papan Sinyal" (not Papan Kilas). Confidence: 0.75
- Honesty vocabulary for data status: langsung (live), contoh (sample), segera (coming soon), nihil (live but empty). Never use "demo" or "Simulasi". Confidence: 0.80
- Page-job doctrine for page purposes: Beranda = "apa yang terjadi hari ini", Jelajah = "siapa dan di mana", Wiki = "siapa kami", Papan Data = "bagaimana keadaan kita". Confidence: 0.70
- Use Indonesian/Malay mixed terminology for app navigation and page names (jelajah, tentang, papan sinyal, lokasi urutan tampilan). Confidence: 0.75

# architecture
See [architecture/taste.md](architecture/taste.md)
# workflow
- Screenshot-driven iterative review: user sends screenshots pointing out issues, requests specific fixes, review cycle repeats until polished. Confidence: 0.75
- Deploy ritual: push to main → `gh run watch --exit-status <id>` → verify production via screenshots. Confidence: 0.70
- Never run agent actors on borrowed production backends (piefed.social)—use a throwaway docker instance for sandbox. Confidence: 0.80
- When verifying production deploys, grep deployed assets with cache-buster in URLs to confirm strings exist. Confidence: 0.70
