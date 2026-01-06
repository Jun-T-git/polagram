interface LayerItem {
  action: string;
  selector: {
    kind?: string;
    name?: string | { pattern: string };
    condition?: string | { pattern: string };
    text?: string | { pattern: string };
  };
}

interface LayerToggleProps {
  layers: LayerItem[];
  enabledLayers: Set<number>;
  onToggle: (index: number) => void;
}

export default function LayerToggle({
  layers,
  enabledLayers,
  onToggle,
}: LayerToggleProps) {
  const getLayerLabel = (layer: LayerItem): string => {
    const action = layer.action;
    const selector = layer.selector;
    let target = '';

    if (selector.name) {
      target =
        typeof selector.name === 'string'
          ? selector.name
          : selector.name.pattern;
    } else if (selector.condition) {
      target =
        typeof selector.condition === 'string'
          ? selector.condition
          : selector.condition.pattern;
    } else if (selector.text) {
      target =
        typeof selector.text === 'string'
          ? selector.text
          : selector.text.pattern;
    }

    return `${action}: ${target || selector.kind || 'unknown'}`;
  };

  return (
    <div className="layer-toggle">
      {layers.map((layer, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: Layers are static and don't have unique IDs
        <label key={index} className="layer-toggle-item">
          <input
            type="checkbox"
            checked={enabledLayers.has(index)}
            onChange={() => onToggle(index)}
          />
          <span>{getLayerLabel(layer)}</span>
        </label>
      ))}
    </div>
  );
}
