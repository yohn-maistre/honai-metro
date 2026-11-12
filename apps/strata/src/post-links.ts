import {marked} from 'marked'
/** Preview an actual document link, never Markdown delimiters, code or an image. */
export function firstPostUrl(text:string,rich:boolean):string {
  let found=''
  const accept=(href:string)=>{if(found)return;try{const url=new URL(href);if(['http:','https:'].includes(url.protocol)&&!url.username&&!url.password)found=url.href}catch{/* Non-web links do not become previews. */}}
  if(rich)marked.walkTokens(marked.lexer(text),token=>{if(token.type==='link')accept(token.href)})
  else {const match=text.match(/https?:\/\/[^\s<>]+/)?.[0]?.replace(/[.,;!?)]*$/,'');if(match)accept(match)}
  return found
}
