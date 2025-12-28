'use client';

import { usePolagram } from '../../hooks/usePolagram';
import { ExampleContainer } from '../ExampleContainer';
import SequenceDiagram from '../SequenceDiagram';
import { Button } from '../ui/button';

const CODE = `sequenceDiagram
    participant Web
    participant API
    participant DB
    
    Web->>API: Request
    API->>DB: Query
    DB-->>API: Result
    API-->>Web: Response
    
    Web->>DB: Direct Access (Avoid)
    DB-->>Web: Data
`;

export function FocusDemo() {
  const { transformedCode, error, addTransform, pipeline, removeTransform } = usePolagram(CODE);
  
  const handleFocus = (target: string) => {
    if (pipeline.some(op => op.operation === 'focusParticipant' && op.target === target)) return;
    addTransform('focusParticipant', target);
  };

  const handleReset = () => {
     for (let i = pipeline.length - 1; i >= 0; i--) {
        removeTransform(i);
     }
  };

  return (
    <ExampleContainer 
      title="Interactive Demo: Focus"
      description="Select a participant to focus on."
      className="my-8 not-prose"
      controls={
        <div className="flex gap-2 items-center">
          <Button size="sm" onClick={() => handleFocus('Web')} variant={pipeline.some(p => p.target === 'Web') ? "primary" : "secondary"}>
            Focus Web
          </Button>
          <Button size="sm" onClick={() => handleFocus('API')} variant={pipeline.some(p => p.target === 'API') ? "primary" : "secondary"}>
            Focus API
          </Button>
          <Button size="sm" variant="outline" onClick={handleReset}>
            Reset
          </Button>
        </div>
      }
    >
      <div className="h-[300px] bg-neutral-900/50 overflow-hidden relative">
         <SequenceDiagram code={transformedCode} error={error} />
      </div>
    </ExampleContainer>
  );
}
