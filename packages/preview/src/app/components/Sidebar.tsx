import type { ReactNode } from 'react';
import { useMemo } from 'react';
import type { PreviewCase } from '../../types';

interface SidebarProps {
  cases: PreviewCase[];
  selectedId: string | null;
  onSelect: (previewCase: PreviewCase) => void;
}

interface TreeNode {
  type: 'target' | 'input' | 'lens';
  label: string;
  children?: TreeNode[];
  case?: PreviewCase;
}

export default function Sidebar({ cases, selectedId, onSelect }: SidebarProps) {
  // Build tree structure from cases
  const tree = useMemo(() => {
    const targetMap = new Map<number, Map<string, PreviewCase[]>>();

    for (const c of cases) {
      if (!targetMap.has(c.targetIndex)) {
        targetMap.set(c.targetIndex, new Map());
      }
      const inputMap = targetMap.get(c.targetIndex)!;
      if (!inputMap.has(c.inputPath)) {
        inputMap.set(c.inputPath, []);
      }
      inputMap.get(c.inputPath)!.push(c);
    }

    const nodes: TreeNode[] = [];
    for (const [targetIndex, inputMap] of targetMap) {
      const inputNodes: TreeNode[] = [];
      for (const [inputPath, lensCases] of inputMap) {
        const lensNodes: TreeNode[] = lensCases.map((c) => ({
          type: 'lens' as const,
          label: c.lensName,
          case: c,
        }));
        inputNodes.push({
          type: 'input',
          label: inputPath,
          children: lensNodes,
        });
      }
      nodes.push({
        type: 'target',
        label: `Target ${targetIndex}`,
        children: inputNodes,
      });
    }
    return nodes;
  }, [cases]);

  const renderNode = (node: TreeNode, depth: number = 0): ReactNode => {
    if (node.type === 'lens' && node.case) {
      const isSelected = node.case.id === selectedId;
      return (
        <div
          key={node.case.id}
          className={`sidebar-item sidebar-item-lens ${isSelected ? 'selected' : ''}`}
          onClick={() => onSelect(node.case!)}
        >
          <span>🔍</span>
          <span>{node.label}</span>
        </div>
      );
    }

    const icon = node.type === 'target' ? '📁' : '📄';
    return (
      <div key={`${node.type}-${node.label}`} className="sidebar-group">
        <div className="sidebar-group-label">
          <span>{icon}</span>
          <span>{node.label}</span>
        </div>
        {node.children?.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <aside className="sidebar">
      {tree.map((node) => renderNode(node))}
    </aside>
  );
}
