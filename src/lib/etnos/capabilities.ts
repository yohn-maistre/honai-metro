/**
 * Instance-capability gates: PieFed's API marks several methods
 * 'unsupported' (signup, modlog, registration applications), so ETNOS
 * hides those surfaces instead of shipping buttons that error. When a
 * capability arrives upstream (or the backend moves off PieFed), flip
 * it here — one owner for the answer.
 */
import { profile } from '$lib/app/auth'

const isPiefed = () => profile.current.client?.name === 'piefed'

/** PieFed has no modlog API — /modlog renders empty against it. */
export const hasModlog = () => !isPiefed()

/** PieFed has no signup API — registration happens on the instance site. */
export const hasSignup = () => !isPiefed()
