/** Let the containing surface own vertical scrolling, including on older browsers. */
export function autosizeText(node:HTMLTextAreaElement,_value?:string){
 let alive=true,width=0
 const resize=()=>{if(!alive)return;node.style.height='0px';node.style.height=node.scrollHeight+'px'}
 const frame=requestAnimationFrame(resize)
 node.addEventListener('input',resize)
 const observer=new ResizeObserver(entries=>{const next=entries[0]?.contentRect.width??0;if(next!==width){width=next;resize()}})
 observer.observe(node)
 return {update(){requestAnimationFrame(resize)},destroy(){alive=false;cancelAnimationFrame(frame);observer.disconnect();node.removeEventListener('input',resize)}}
}
