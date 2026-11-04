import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const lock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8'))
const output = [
  'ETNOS / Honai connected app — third-party notices',
  'Application: AGPL-3.0-only. This inventory includes client and build dependencies.',
  'Package source references and original license texts follow.',
]
for (const [path, entry] of Object.entries(lock.packages ?? {})) {
  if (!path.startsWith('node_modules/')) continue
  const folder = resolve(root, path),
    name = path.slice(path.lastIndexOf('node_modules/') + 13)
  if (!folder.startsWith(join(root, 'node_modules') + '/'))
    throw Error('Unexpected dependency path')
  output.push(
    '\n' + name + '@' + entry.version + ' — ' + (entry.license ?? 'see source'),
  )
  try {
    const pkg = JSON.parse(readFileSync(join(folder, 'package.json'), 'utf8'))
    if (pkg.repository)
      output.push(
        typeof pkg.repository === 'string'
          ? pkg.repository
          : (pkg.repository.url ?? ''),
      )
    for (const file of readdirSync(folder).filter((n) =>
      /^(licen[sc]e|copying|ofl)(\.|$)/i.test(n),
    ))
      output.push(readFileSync(join(folder, file), 'utf8'))
  } catch {
    /* Not all optional platform-specific build dependencies are installed. */
  }
}
for (const file of readdirSync(join(root, 'licenses')))
  output.push(
    '\n' + file + '\n' + readFileSync(join(root, 'licenses', file), 'utf8'),
  )
mkdirSync(join(root, 'public'), { recursive: true })
writeFileSync(
  join(root, 'public/third-party-notices.txt'),
  output.join('\n\n') + '\n',
)
