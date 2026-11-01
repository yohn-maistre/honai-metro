import { mount } from 'svelte'
import '@fontsource-variable/instrument-sans'
import './styles/ui.css'
import App from './App.svelte'
import { restoreAppearance } from './appearance.svelte'
restoreAppearance()
mount(App, { target: document.getElementById('app')! })
