import { env } from '$env/dynamic/public'
import type { Theme, ThemeColors } from './theme.svelte'

// Original Photon 'Mono' colors, preserved as a preset
const PHOTON_MONO = {
  slate: {
    25: '252 253 254',
    50: '248 250 252',
    100: '241 245 249',
    200: '226 232 240',
    300: '203 213 225',
    400: '148 163 184',
    500: '100 116 139',
    600: '71 85 105',
    700: '51 65 85',
    800: '30 41 59',
    900: '15 23 42',
    950: '2 6 23',
  },
  zinc: {
    '50': '252 252 254',
    '100': '248 248 251',
    '200': '235 235 240',
    '300': '222 222 228',
    '400': '175 175 185',
    '500': '128 128 138',
    '600': '98 98 108',
    '700': '68 68 76',
    '800': '47 47 54',
    '900': '34 34 39',
    '925': '28 28 32',
    '950': '25 25 29',
  },
  primary: {
    100: '241 245 249',
    900: '15 23 42',
  },
  other: {
    black: '0 0 0',
    white: '255 255 255',
  },
}

// ETNOS 'Honai Metro': DINAS cream paper + terracotta, shared design
// language with detak-detik (its tokens.css) and the Aksara device
// (abstraksi/specs/etnos/10_design-language.md is the token truth).
// Light ramps only this wave: zinc (dark mode) is intentionally carried
// over unchanged from the previous palette (Honai Malam is a later wave).
const HONAI_METRO = {
  slate: {
    // 25 is the page field (Shell.svelte paints bg with slate-25);
    // cards sit LIGHTER than the page via other.white, like paper on a desk.
    25: '214 203 172', // #d6cbac khaki paper
    50: '207 195 163',
    100: '196 184 150',
    200: '178 166 133', // borders
    300: '170 160 133', // #aaa085 soft dividers (detak line-soft)
    400: '138 128 107',
    500: '111 103 87',
    600: '90 83 69', // #5a5345 muted text (4.5:1 on the page field)
    700: '64 58 47',
    800: '43 39 30',
    900: '21 19 14', // #15130e ink
    950: '14 12 9',
  },
  zinc: {
    '50': '255 245 224',
    '100': '247 236 212',
    '200': '219 201 164',
    '300': '234 220 189',
    '400': '219 201 164',
    '500': '211 190 146',
    '600': '234 220 189',
    '700': '13 14 42',
    '800': '14 14 37',
    '900': '14 17 32',
    '925': '7 7 24',
    '950': '6 6 22',
  },
  primary: {
    // Terracotta family (device language #C0633E at 500 = charts/badges).
    // 100 stays the on-dark accent (dark mode untouched this wave).
    // 900 is the on-light accent (buttons/links): deep terracotta #8c4529
    // so cream text on it passes AA; it sits lighter than 800 on purpose,
    // Photon treats 100/900 as a semantic pair, not ramp ends.
    50: '250 240 230',
    100: '255 245 224',
    200: '232 195 174',
    300: '214 157 121',
    400: '203 127 85',
    500: '192 99 62', // #C0633E brand terracotta
    600: '166 82 52',
    700: '140 69 41',
    800: '102 50 36',
    900: '140 69 41', // #8c4529 on-light accent (semantic slot)
    950: '74 36 25',
  },
  other: {
    black: '0 0 0',
    white: '227 218 191', // #e3dabf card surface
  },
}

// Previous default palette, preserved verbatim for rollback (plan R1).
const HONAI_METRO_LAMA = {
  slate: {
    25: '255 245 224',
    50: '247 236 212',
    100: '234 220 189',
    200: '219 201 164',
    300: '211 190 146',
    400: '196 175 130',
    500: '187 164 114',
    600: '108 94 66',
    700: '71 60 36',
    800: '49 40 23',
    900: '28 7 7',
    950: '20 5 5',
  },
  zinc: {
    '50': '255 245 224',
    '100': '247 236 212',
    '200': '219 201 164',
    '300': '234 220 189',
    '400': '219 201 164',
    '500': '211 190 146',
    '600': '234 220 189',
    '700': '13 14 42',
    '800': '14 14 37',
    '900': '14 17 32',
    '925': '7 7 24',
    '950': '6 6 22',
  },
  primary: {
    100: '255 245 224',
    900: '11 9 9',
  },
  other: {
    black: '0 0 0',
    white: '255 252 245',
  },
}

export function getDefaultColors(): ThemeColors {
  return env.PUBLIC_THEME ? JSON.parse(env.PUBLIC_THEME) : HONAI_METRO
}

export function getDefaultTheme(): Theme {
  return {
    id: 0,
    colors: getDefaultColors(),
    name: env.PUBLIC_THEME ? 'Instance Default' : 'Honai Metro',
  }
}

export const presets: Theme[] = [
  getDefaultTheme(),
  // Previous default, selectable for rollback
  { colors: HONAI_METRO_LAMA, id: -12, name: 'Honai Metro (Lama)' },
  // Always include Mono (original Photon) as a selectable preset
  { colors: PHOTON_MONO, id: -10, name: 'Mono' },
  ...(env.PUBLIC_THEME
    ? [{ colors: HONAI_METRO, id: -11, name: 'Honai Metro' }]
    : []),
  {
    colors: {
      slate: {
        25: '252 253 254',
        50: '248 250 252',
        100: '241 245 249',
        200: '226 232 240',
        300: '203 213 225',
        400: '148 163 184',
        500: '100 116 139',
        600: '71 85 105',
        700: '51 65 85',
        800: '30 41 59',
        900: '15 23 42',
        950: '2 6 23',
      },
      zinc: {
        50: '250 250 250',
        100: '244 244 245',
        200: '228 228 231',
        300: '212 212 216',
        400: '161 161 170',
        500: '113 113 122',
        600: '82 82 91',
        700: '52 52 59',
        800: '31 31 36',
        900: '18 18 21',
        925: '12 12 14',
        950: '9 9 11',
      },
      primary: {
        100: '241 245 249',
        900: '15 23 42',
      },
      other: {
        black: '0 0 0',
        white: '255 255 255',
      },
    },
    id: -1,
    name: 'Classic',
  },
  {
    colors: {
      slate: {
        25: '252 253 254',
        50: '248 250 252',
        100: '241 245 249',
        200: '226 232 240',
        300: '203 213 225',
        400: '148 163 184',
        500: '100 116 139',
        600: '71 85 105',
        700: '51 65 85',
        800: '30 41 59',
        900: '15 23 42',
        950: '2 6 23',
      },
      zinc: {
        50: `249 250 251`,
        100: `243 244 246`,
        200: `229 231 235`,
        300: `209 213 219`,
        400: `156 163 175`,
        500: `107 114 128`,
        600: `75 85 99`,
        700: '30 30 30',
        800: '22 22 22',
        900: '10 10 10',
        925: '0 0 0',
        950: `0 0 0`,
      },
      primary: {
        100: '241 245 249',
        900: '15 23 42',
      },
      other: {
        black: `0 0 0`,
        white: `255 255 255`,
      },
    },
    id: -2,
    name: 'AMOLED',
  },
  {
    colors: {
      zinc: {
        '50': '205 214 244',
        '100': '186 194 222',
        '200': '166 173 200',
        '300': '147 153 178',
        '400': '127 132 156',
        '500': '108 112 134',
        '600': '88 91 112',
        '700': '69 71 90',
        '800': '49 50 68',
        '900': '30 30 46',
        '925': '24 24 37',
        '950': '17 17 27',
      },
      primary: { '100': '166 227 161', '900': '114 135 253' },
      other: { white: '239 241 245' },
      slate: {
        '25': '239 241 245',
        '50': '230 233 239',
        '100': '220 224 232',
        '200': '204 208 218',
        '300': '188 192 204',
        '400': '172 176 190',
        '500': '140 143 161',
        '600': '124 127 147',
        '700': '108 111 133',
        '800': '92 95 119',
        '900': '76 79 105',
        '950': '76 79 105',
      },
    },
    id: -3,
    name: 'Catppuccin',
  },
  {
    colors: {
      slate: {
        25: '251 251 251',
        50: '242 242 242',
        100: '229 229 229',
        200: '226 226 226',
        300: '222 222 222',
        400: '154 153 150',
        500: '102 102 102',
        600: '51 51 51',
        700: '85 85 85',
        800: '51 51 51',
        900: '51 51 51',
        950: '7 7 7',
      },
      zinc: {
        50: '253 253 253',
        100: '244 244 244',
        200: '226 226 226',
        300: '213 213 213',
        400: '163 163 163',
        500: '114 114 114',
        600: '85 85 85',
        700: '78 78 78',
        800: '59 59 59',
        900: '42 42 42',
        925: '34 34 34',
        950: '29 29 29',
      },
      primary: {
        100: '241 245 249',
        900: '15 23 42',
      },
      other: {
        black: '0 0 0',
        white: '255 255 255',
      },
    },
    id: -4,
    name: 'Neutral',
  },
]
