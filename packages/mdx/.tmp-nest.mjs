import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkDirective from 'remark-directive';
const p = unified().use(remarkParse).use(remarkDirective);
function shape(n, d=0){ console.log('  '.repeat(d)+n.type+(n.name?':'+n.name:'')+(n.value?' ='+JSON.stringify(n.value).slice(0,40):'')); (n.children||[]).forEach(c=>shape(c,d+1)); }
const t = p.parse('::::details[Outer]\nbefore\n:::details[Inner]\ncontent\n:::\nafter\n::::'); p.runSync(t); shape(t);
