import { redirect } from '@sveltejs/kit'

// Ruang Bahasa merged into the wiki language hub (design overhaul P6);
// deep links keep working forever.
export const load = () => {
  redirect(308, '/wiki/bahasa')
}
