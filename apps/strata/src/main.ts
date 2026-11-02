import { mount } from 'svelte'
import '@fontsource-variable/instrument-sans'
import './styles/ui.css'
import './styles/conversation.css'
import './styles/november.css'
import App from './App.svelte'
import { restoreAppearance } from './appearance.svelte'
restoreAppearance()
if (location.pathname === '/recover-messages') {
  void import('./RecoveryPage.svelte').then(({ default: Recovery }) =>
    mount(Recovery, { target: document.getElementById('app')! }),
  )
} else mount(App, { target: document.getElementById('app')! })
