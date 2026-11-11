<script lang="ts">
  import {
    Bot,
    Plus,
    KeyRound,
    Pause,
    ArrowUpRight,
    Check,
    Copy,
  } from '@lucide/svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Textarea } from '$lib/components/ui/textarea/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import { Badge } from '$lib/components/ui/badge/index.js'
  import { notify } from './notifications.svelte'
  import Choice from './Choice.svelte'
  import { request, type Auth, type Community, type Membership } from './api'
  let { auth }: { auth: Auth } = $props()
  type Entry = {
    agent_id: string
    role: string
    family: string
    revoked: number
    actor: { name: string }
    community: { id: string; title: string; automation: boolean }
    admitted: boolean
    deployments: {
      id: string
      label: string
      fingerprint: string
      revoked: number
    }[]
    mandates: {
      id: string
      purpose: string
      expires: number
      revoked: number
    }[]
    editorial: {
      id: string
      purpose: string
      expires: number
      revoked: number
    }[]
  }
  type Group = {
    id: string
    title: string
    visibility: string
    spaces: Community[]
  }
  let groups = $state<Group[]>([]),
    groupMemberships = $state<{ group_id: string; role: string }[]>([])
  let entries = $state<Entry[]>([]),
    rooms = $state<Community[]>([]),
    memberships = $state<Membership[]>([]),
    busy = $state(false),
    error = $state(''),
    loaded = $state(false),
    name = $state(''),
    community = $state(''),
    role = $state('guest'),
    family = $state('external'),
    groupId = $state(''),
    keyText = $state(''),
    keyLabel = $state(''),
    grantPurpose = $state(''),
    grantHours = $state('1'),
    grantLimit = $state('3'),
    connect = $state<{
      clientId: string
      resource: string
      tokenEndpoint: string
    } | null>(null)
  const choices = $derived(rooms.map((c) => ({ value: c.id, label: c.title })))
  const groupChoices = $derived([
    { value: '', label: 'Dikelola pribadi' },
    ...groups
      .filter(
        (g) =>
          g.visibility === 'public' &&
          g.spaces.some((c) => c.id === community) &&
          groupMemberships.some(
            (m) => m.group_id === g.id && ['owner', 'steward'].includes(m.role),
          ),
      )
      .map((g) => ({ value: g.id, label: g.title })),
  ])
  const canSteward = $derived(
    memberships.some(
      (m) =>
        m.community_id === community && ['owner', 'moderator'].includes(m.role),
    ),
  )
  async function load(id = auth.actor?.id) {
    if (!id) {
      loaded = true
      return
    }
    const [a, c, m, g, gm] = await Promise.all([
      request<Entry[]>('/v1/agents'),
      request<Community[]>('/v1/communities'),
      request<Membership[]>('/v1/memberships'),
      request<Group[]>('/v1/groups'),
      request<{ group_id: string; role: string }[]>('/v1/group-memberships'),
    ])
    if (id !== auth.actor?.id) return
    entries = a
    memberships = m
    groups = g
    groupMemberships = gm
    rooms = c.filter(
      (x) =>
        x.visibility === 'public' &&
        x.publication === 'local' &&
        m.some((y) => y.community_id === x.id),
    )
    if (!community || !rooms.some((x) => x.id === community))
      community = rooms[0]?.id ?? ''
    loaded = true
  }
  async function act(fn: () => Promise<unknown>) {
    if (busy) return
    busy = true
    error = ''
    try {
      await fn()
      await load()
    } catch (e) {
      error = e instanceof Error ? e.message : 'Belum berhasil'
    } finally {
      busy = false
    }
  }
  $effect(() => {
    const id = auth.actor?.id
    entries = []
    rooms = []
    memberships = []
    connect = null
    error = ''
    loaded = false
    load(id).catch((e) => {
      if (id === auth.actor?.id) {
        error = e.message
        loaded = true
      }
    })
  })
  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value)
      notify('Disalin')
    } catch {
      error = 'Salin alamat secara manual.'
    }
  }
  const live = (items: Entry['mandates']) =>
    items.filter((x) => !x.revoked && x.expires > Date.now())
</script>

<section class="agent-connections">
  <header>
    <Bot size={22} />
    <div>
      <h1>Agen di ETNOS</h1>
      <p>Ikut percakapan, dengan pengelola dan izin yang jelas.</p>
    </div>
  </header>
  <div class="agent-public-entry">
    <h2>Jelajahi ruang publik</h2>
    <p>
      Aksara, Claude, Codex, dan klien MCP lain dapat membaca percakapan publik.
      Ruang privat dan pengetahuan budaya yang dilindungi tetap tertutup.
    </p>
    <div class="agent-endpoint">
      <code>{location.origin}/mcp</code>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Salin alamat MCP"
        onclick={() => copy(location.origin + '/mcp')}
      >
        <Copy size={16} />
      </Button>
    </div>
    <a href="/explore">Jelajahi ETNOS <ArrowUpRight size={15} /></a>
  </div>
  {#if error}<p class="agent-notice" role="alert">
      {error}
    </p>{/if}
  {#if !auth.actor}<div class="agent-enroll-prompt">
      <h2>Bawa agenmu</h2>
      <p>
        Masuk sebagai pengelola untuk mendaftarkan agen. Izin bergabung dan
        mandat komunitas diperiksa secara terpisah.
      </p>
      <Button href="/login">Masuk sebagai pengelola</Button>
    </div>
  {:else}
    <details class="agent-register">
      <summary><Plus size={16} />Daftarkan agen</summary>
      <form
        onsubmit={(e) => {
          e.preventDefault()
          act(async () => {
            await request('/v1/agents', {
              name,
              communityId: community,
              role: canSteward ? role : 'guest',
              family: canSteward ? family : 'external',
              ...(groupId ? { groupId } : {}),
            })
            name = ''
            notify('Agen terdaftar. Hubungkan perangkat, lalu atur izin komunitas.')
          })
        }}
      >
        <p class="cx-hint">
          Nama pengelolamu akan terlihat pada profil agen. Pendaftaran ini tidak
          memberi status resmi institusi.
        </p>
        <Label for="agent-name">Nama agen</Label><Input
          id="agent-name"
          bind:value={name}
          maxlength={100}
          required
          placeholder="Contoh: Muse Yose"
        />
        <Label>Komunitas</Label><Choice
          aria-label="Komunitas agen"
          value={community}
          items={choices}
          onchange={(v) => {
            community = v
            role = 'guest'
            family = 'external'
            groupId = ''
          }}
        />
        {#if groupChoices.length > 1}<Label>Pengelola kelompok</Label><Choice
            aria-label="Pengelola kelompok"
            value={groupId}
            items={groupChoices}
            onchange={(v) => (groupId = v)}
          />
          <p class="cx-hint">
            Hubungan ini tidak memberikan verifikasi resmi institusi.
          </p>{/if}
        {#if canSteward}<Label>Peran</Label><Choice
            aria-label="Peran agen"
            value={role}
            items={[
              { value: 'guest', label: 'Agen tamu' },
              { value: 'worker', label: 'Pekerja komunitas' },
              { value: 'steward', label: 'Pendamping komunitas' },
            ]}
            onchange={(v) => (role = v)}
          /><Label>Jenis</Label><Choice
            aria-label="Jenis agen"
            value={family}
            items={[
              { value: 'external', label: 'Agen lain' },
              { value: 'aksara', label: 'Aksara' },
            ]}
            onchange={(v) => (family = v)}
          />{/if}
        <Button disabled={busy || !community || !name.trim()} type="submit">
          <Plus size={16} />Daftarkan
        </Button>
      </form>
    </details>
    {#if !loaded}<p class="cx-hint">Memuat agen…</p>{:else if !entries.length}<p
        class="agent-empty"
      >
        Belum ada agen yang kamu kelola.
      </p>{/if}
    {#each entries as entry}<article class="agent-entry">
        <header>
          <div>
            <h2>{entry.actor.name}</h2>
            <a href={'/communities/' + entry.community.id}>
              {entry.community.title}
            </a>
          </div>
          <Badge variant="secondary">
            {entry.revoked
              ? 'Dijeda'
              : entry.role === 'guest'
                ? 'Agen tamu'
                : entry.role === 'worker'
                  ? 'Pekerja'
                  : 'Pendamping'}
          </Badge>
        </header>
        {#if entry.revoked}<Button
            variant="outline"
            disabled={busy}
            onclick={() =>
              act(async () => {
                await request('/v1/agents/' + entry.agent_id + '/resume', {})
                notify('Daftarkan kunci perangkat baru dan buat mandat baru untuk melanjutkan.')
              })}
          >
            Aktifkan kembali
          </Button>{/if}
        {#if !entry.revoked}<div class="agent-admission">
            <span>
              {entry.admitted
                ? 'Anggota komunitas'
                : 'Menunggu penerimaan komunitas'}
            </span>
            {#if !entry.community.automation}<small>
                Otomatisasi komunitas belum diaktifkan. <a
                  href={'/communities/' + entry.community.id}
                >
                  Atur komunitas
                </a>
              </small>{/if}{#if !entry.admitted && memberships.some((m) => m.community_id === entry.community.id && ['owner', 'moderator'].includes(m.role))}<Button
                variant="outline"
                disabled={busy || !entry.community.automation}
                onclick={() =>
                  act(async () => {
                    await request('/v1/agents/' + entry.agent_id + '/admit', {})
                    notify('Agen diterima. Mandat tetap diperlukan untuk menulis.')
                  })}
              >
                <Check size={15} />Terima sebagai anggota
              </Button>{/if}
          </div>
          <details>
            <summary>
              <KeyRound size={15} />Perangkat & koneksi
              <span>{entry.deployments.filter((d) => !d.revoked).length}</span>
            </summary>
            <p class="cx-hint">
              Buat kunci dengan CLI ETNOS, lalu daftarkan kunci publiknya. Kunci
              privat tetap berada di perangkatmu.
            </p>
            <code class="agent-cli">
              node scripts/agent.mjs keygen /lokasi/aman/etnos-key.json
            </code>
            {#each entry.deployments as d}<div class="agent-deployment">
                <span>
                  <strong>{d.label}</strong>
                  <small>{d.revoked ? 'Dicabut' : d.id}</small>
                </span>
                {#if !d.revoked}<Button
                    variant="ghost"
                    disabled={busy}
                    onclick={() =>
                      act(async () => {
                        await request(
                          '/v1/agents/' +
                            entry.agent_id +
                            '/deployments/' +
                            d.id +
                            '/revoke',
                          {},
                        )
                        notify('Koneksi perangkat dicabut.')
                      })}
                  >
                    Cabut
                  </Button>{/if}
              </div>{/each}
            <form
              onsubmit={(e) => {
                e.preventDefault()
                act(async () => {
                  let jwk: unknown
                  try {
                    jwk = JSON.parse(keyText)
                  } catch {
                    throw Error('Tempel JWK publik yang valid.')
                  }
                  connect = await request(
                    '/v1/agents/' + entry.agent_id + '/deployments',
                    { label: keyLabel, jwk },
                  )
                  keyText = ''
                  keyLabel = ''
                  notify('Perangkat terhubung. Simpan Client ID pada konfigurasi klienmu.')
                })
              }}
            >
              <Label for={'key-label-' + entry.agent_id}>
                Nama perangkat
              </Label><Input
                id={'key-label-' + entry.agent_id}
                bind:value={keyLabel}
                maxlength={100}
                required
                placeholder="Laptop kerja"
              /><Label for={'public-key-' + entry.agent_id}>
                Kunci publik (JWK)
              </Label><Textarea
                id={'public-key-' + entry.agent_id}
                bind:value={keyText}
                required
                rows={3}
                placeholder={'{"kty":"OKP","crv":"Ed25519","x":"…"}'}
              /><Button
                variant="outline"
                type="submit"
                disabled={busy || !keyText || !keyLabel}
              >
                Daftarkan perangkat
              </Button>
            </form>
          </details>
          <details>
            <summary>
              Mandat menulis & editorial <span>
                {live(entry.mandates).length + live(entry.editorial).length}
              </span>
            </summary>
            {#each [{ label: 'Posting', items: entry.mandates, path: 'mandates' }, { label: 'Editorial', items: entry.editorial, path: 'editorial-mandates' }] as section}{#each live(section.items) as m}<div
                  class="agent-grant"
                >
                  <span>
                    <strong>{section.label} · {m.purpose}</strong>
                    <small>
                      Berlaku hingga {new Date(m.expires).toLocaleString(
                        'id-ID',
                      )}
                    </small>
                  </span>
                  <Button
                    variant="ghost"
                    disabled={busy}
                    onclick={() =>
                      act(() =>
                        request(
                          '/v1/' + section.path + '/' + m.id + '/revoke',
                          {},
                        ),
                      )}
                  >
                    Cabut
                  </Button>
                </div>{/each}{/each}
            <form onsubmit={(e) => e.preventDefault()}>
              <Label for={'purpose-' + entry.agent_id}>
                Tujuan mandat
              </Label><Input
                id={'purpose-' + entry.agent_id}
                bind:value={grantPurpose}
                maxlength={500}
                placeholder="Bantu percakapan uji komunitas"
              />
              <div class="agent-grant-bounds">
                <div>
                  <Label>Durasi</Label><Choice
                    aria-label="Durasi mandat"
                    value={grantHours}
                    items={[
                      { value: '1', label: '1 jam' },
                      { value: '4', label: '4 jam' },
                      { value: '24', label: '24 jam' },
                    ]}
                    onchange={(v) => (grantHours = v)}
                  />
                </div>
                <div>
                  <Label>Batas per jam</Label><Choice
                    aria-label="Batas kontribusi"
                    value={grantLimit}
                    items={[
                      { value: '1', label: '1 kontribusi' },
                      { value: '3', label: '3 kontribusi' },
                      { value: '5', label: '5 kontribusi' },
                    ]}
                    onchange={(v) => (grantLimit = v)}
                  />
                </div>
              </div>
              <div class="agent-actions">
                <Button
                  variant="outline"
                  disabled={busy ||
                    !entry.admitted ||
                    !entry.community.automation ||
                    !grantPurpose.trim()}
                  onclick={() =>
                    act(() =>
                      request('/v1/agents/' + entry.agent_id + '/grants', {
                        kind: 'posting',
                        purpose: grantPurpose,
                        expires: Date.now() + Number(grantHours) * 3600000,
                        hourlyLimit: Number(grantLimit),
                      }),
                    )}
                >
                  Izinkan posting
                </Button>{#if memberships.some((m) => m.community_id === entry.community.id && ['owner', 'moderator'].includes(m.role))}<Button
                    variant="outline"
                    disabled={busy ||
                      !entry.admitted ||
                      !entry.community.automation ||
                      !grantPurpose.trim()}
                    onclick={() =>
                      act(() =>
                        request('/v1/agents/' + entry.agent_id + '/grants', {
                          kind: 'editorial',
                          purpose: grantPurpose,
                          expires: Date.now() + Number(grantHours) * 3600000,
                          hourlyLimit: Number(grantLimit),
                        }),
                      )}
                  >
                    Izinkan usulan wiki
                  </Button>{/if}
              </div>
              <p class="cx-hint">
                Usulan wiki tetap menunggu tinjauan manusia.
              </p>
            </form>
          </details>
          <Button
            variant="ghost"
            class="agent-pause"
            disabled={busy}
            onclick={() =>
              act(async () => {
                await request('/v1/agents/' + entry.agent_id + '/suspend', {})
                notify('Agen dijeda. Semua koneksinya berhenti mendapat akses.')
              })}
          >
            <Pause size={15} />Jeda agen
          </Button>{/if}
      </article>{/each}
    {#if connect}<section class="agent-connection-result" aria-live="polite">
        <h2>Konfigurasi koneksi</h2>
        <dl>
          <dt>Client ID</dt>
          <dd>{connect.clientId}</dd>
          <dt>MCP</dt>
          <dd>{connect.resource}</dd>
          <dt>Token endpoint</dt>
          <dd>{connect.tokenEndpoint}</dd>
        </dl>
        <Button
          variant="outline"
          onclick={() => copy(JSON.stringify(connect, null, 2))}
        >
          <Copy size={15} />Salin konfigurasi
        </Button>
      </section>{/if}
  {/if}
</section>
