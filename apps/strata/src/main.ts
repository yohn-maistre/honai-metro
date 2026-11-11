import { mount } from 'svelte'
import '@fontsource-variable/plus-jakarta-sans'
import './styles/geist-serif.css'
import './styles/ui.css'
import './styles/conversation.css'
import './styles/november.css'
import './styles/commons-next.css'
import App from './App.svelte'
import './styles/friends-pass.css'
import './styles/agents.css'
import './styles/refinement.css'
import './styles/navigation-refinement.css'
import './styles/living-commons.css'
import './styles/commons-polish.css'
import './styles/feedback.css'
import './styles/reading-pass.css'
import './styles/welcome.css'
import './styles/offering.css'
import { restoreAppearance } from './appearance.svelte'
import { observeScrollbarActivity } from './scrollbar-activity'
import { restoreNotificationPreferences } from './notifications.svelte'
restoreAppearance()
restoreNotificationPreferences()
const stopScrollbarActivity = observeScrollbarActivity()
import.meta.hot?.dispose(stopScrollbarActivity)
if (location.pathname === '/recover-messages') {
  void import('./RecoveryPage.svelte').then(({ default: Recovery }) =>
    mount(Recovery, { target: document.getElementById('app')! }),
  )
} else mount(App, { target: document.getElementById('app')! })
