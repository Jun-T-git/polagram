import mermaid from 'mermaid';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import MermaidRenderer from '../../components/MermaidRenderer';
import { MermaidDiagram } from '../../components/ui/MermaidDiagram';

const realRender = mermaid.render.bind(mermaid);
const pending = new Map<string, { resolve: (value: Awaited<ReturnType<typeof realRender>>) => void; reject: (error: Error) => void }>();
const failure = '<img src="missing-fixture.png" onerror="window.fixtureExecuted=true">';

mermaid.render = (id, text, container) => {
  if (text === 'fixture-error') return Promise.reject(new Error(failure));
  if (text.startsWith('fixture-delay-')) {
    return new Promise((resolve, reject) => pending.set(text, { resolve, reject }));
  }
  return realRender(id, text, container);
};

const root = createRoot(document.getElementById('root')!);
const harness = {
  show(component: 'renderer' | 'diagram', chart: string) {
    flushSync(() => root.render(component === 'renderer'
      ? <MermaidRenderer code={chart} /> : <MermaidDiagram chart={chart} />));
  },
  pending(chart: string) { return pending.has(chart); },
  settle(chart: string, reject = false) {
    const task = pending.get(chart);
    if (!task) throw new Error(`No pending render: ${chart}`);
    pending.delete(chart);
    if (reject) task.reject(new Error('stale fixture error'));
    else task.resolve({ diagramType: 'fixture', svg: `<svg xmlns="http://www.w3.org/2000/svg"><text>${chart}</text></svg>` });
  },
  securityLevel() { return mermaid.mermaidAPI.getConfig().securityLevel; },
};
declare global {
  interface Window { renderHarness: typeof harness; fixtureExecuted?: boolean }
}
window.renderHarness = harness;
