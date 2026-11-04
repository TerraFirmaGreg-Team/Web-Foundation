import { CodeBlock, Pre } from '@terrafirmagreg-team/ui/components/mdx/codeblock';
import { renderMermaidChart } from '@terrafirmagreg-team/ui/lib/mdx/mermaid';

export function Mermaid({ chart }: { chart: string }) {
  const svg = renderMermaidChart(chart);

  if (svg === null) {
    return (
      <CodeBlock title="Mermaid">
        <Pre>
          {chart.split('\n').map((line, i) => (
            <span key={i} className="line">
              {line}
            </span>
          ))}
        </Pre>
      </CodeBlock>
    );
  }

  return <div dangerouslySetInnerHTML={{ __html: svg }} />;
}

