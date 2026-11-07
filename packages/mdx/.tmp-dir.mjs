import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkDirective from 'remark-directive';
const p = unified().use(remarkParse).use(remarkDirective);
const t = p.parse('::gradient{from="red"}\nhello **world**\n::'); p.runSync(t);
console.log(JSON.stringify(t, null, 1).slice(0, 2500));
