import test from 'node:test'
import assert from 'node:assert/strict'
import {firstPostUrl} from '../src/post-links.ts'
test('post previews preserve document links through formatting and exclude code/images/local or credentialed links',()=>{
 assert.equal(firstPostUrl('**[River knowledge](https://example.org/river)**',true),'https://example.org/river')
 assert.equal(firstPostUrl('[Study](https://example.org/Taxon_(name))',true),'https://example.org/Taxon_(name)')
 assert.equal(firstPostUrl('`https://example.org/code`\n\n![Photo](https://example.org/image.png)\n\n[Source](https://example.org/report?a=1&b=2)',true),'https://example.org/report?a=1&b=2')
 assert.equal(firstPostUrl('[Local](/wiki/topic) [Unsafe](https://name:password@example.org/private)',true),'')
 assert.equal(firstPostUrl('Read https://example.org/report. Then discuss.',false),'https://example.org/report')
})
