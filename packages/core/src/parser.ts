import { ActivationNode, AyatoriRoot, EventNode, FragmentOperator, MessageNode, NoteNode } from './ast';
import { ARROW_MAPPING } from './constants';
import { Lexer } from './lexer';
import { Token, TokenType } from './tokens';

export class Parser {
  private currToken!: Token;
  private peekToken!: Token;
  private idCounters = {
    evt: 0,
    frag: 0,
    br: 0,
    note: 0,
  };

  constructor(private lexer: Lexer) {
    this.nextToken();
    this.nextToken();
  }

  private nextToken() {
    this.currToken = this.peekToken;
    this.peekToken = this.lexer.nextToken();
  }

  parse(): AyatoriRoot {
    const root: AyatoriRoot = {
      kind: 'root',
      meta: { version: '1.0.0', source: 'unknown' },
      participants: [],
      groups: [],
      events: []
    };

    root.events = this.parseBlock(root);

    return root;
  }

  private parseBlock(root: AyatoriRoot, stopTokens: TokenType[] = []): EventNode[] {
    const events: EventNode[] = [];

    while (this.currToken.type !== 'EOF') {
      const type = this.currToken.type as TokenType;

      if (stopTokens.includes(type)) {
        return events;
      }

      if (type === 'NEWLINE') {
        this.nextToken();
        continue;
      }

      if (type === 'SEQUENCE_DIAGRAM') {
        root.meta.source = 'mermaid';
        this.nextToken();
        continue;
      }

      if (type === 'TITLE') {
        this.nextToken(); // eat TITLE
        root.meta.title = this.readRestOfLine();
        continue;
      }

      if (type === 'PARTICIPANT' || type === 'ACTOR') {
        this.parseParticipant(root);
        continue;
      }

      if (type === 'LOOP' || type === 'ALT' || type === 'OPT') {
        events.push(this.parseFragment(root));
        continue;
      }

      if (type === 'NOTE') {
        events.push(this.parseNote(root));
        continue;
      }

      if (type === 'ACTIVATE' || type === 'DEACTIVATE') {
        events.push(this.parseActivation(root));
        continue;
      }

      // Check for Message start: Identifier (or String) followed by Arrow or special tokens
      // But lexer returns STRING token for quote string.
      if (this.isParticipantToken(this.currToken)) {
          // Look ahead to see if it's a message
          // A -> B
          // "Alice" -> "Bob"
          // We need to be careful.
          // If parseMessage fails, we might just consume tokens?
          // For now assume if it starts with ID/String it's a message if arrow follows.
          const msg = this.parseMessage(root);
          if (msg) {
             events.push(msg);
             continue;
          }
      }

      // Skip unknown or unhandled
      this.nextToken();
    }
    return events;
  }
  
  private isParticipantToken(tok: Token): boolean {
      return tok.type === 'IDENTIFIER' || tok.type === 'STRING';
  }

  private parseFragment(root: AyatoriRoot): EventNode {
    const type = this.currToken.type as TokenType;
    let operator: FragmentOperator = 'loop';
    if (type === 'ALT') operator = 'alt';
    if (type === 'OPT') operator = 'opt';

    this.nextToken(); // eat operator

    const condition = this.readRestOfLine();

    const branches = [];
    const events = this.parseBlock(root, ['END', 'ELSE']);

    branches.push({
      id: this.generateId('br'),
      condition,
      events
    });

    while ((this.currToken.type as TokenType) === 'ELSE') {
      this.nextToken();
      const elseCond = this.readRestOfLine();
      const elseEvents = this.parseBlock(root, ['END', 'ELSE']);
      branches.push({
        id: this.generateId('br'),
        condition: elseCond,
        events: elseEvents
      });
    }

    if ((this.currToken.type as TokenType) === 'END') {
      this.nextToken();
    }

    return {
      kind: 'fragment',
      id: this.generateId('frag'),
      operator,
      branches
    };
  }

  private parseParticipant(root: AyatoriRoot) {
    const isActor = this.currToken.type === 'ACTOR';
    this.nextToken(); // eat 'participant' or 'actor'

    let id = '';
    let name = '';

    if (this.isParticipantToken(this.currToken)) {
      id = this.currToken.literal;
      name = id;
      this.nextToken();
    }

    // Check for 'as'
    if (this.currToken.type === 'AS') {
      this.nextToken(); // eat 'as'
      if (this.isParticipantToken(this.currToken)) {
        name = this.currToken.literal;
        this.nextToken();
      }
    }
    
    // Register if not exists (or update if flexible?)
    // In Mermaid, re-declaration updates props usually.
    // For now simple push if check fails is ok, but we should probably check ID.
    const existing = root.participants.find(p => p.id === id);
    if (!existing) {
        root.participants.push({
            id,
            name,
            type: isActor ? 'actor' : 'participant'
        });
    } else {
        // Update name if alias defined later
        if (name !== id) existing.name = name;
        if (isActor) existing.type = 'actor';
    }
  }

  private parseNote(root: AyatoriRoot): NoteNode {
    this.nextToken(); // eat 'note'
    
    let position: 'left' | 'right' | 'over' = 'over'; // default
    if (this.currToken.type === 'LEFT') { position = 'left'; this.nextToken(); }
    else if (this.currToken.type === 'RIGHT') { position = 'right'; this.nextToken(); }
    else if (this.currToken.type === 'OVER') { position = 'over'; this.nextToken(); }
    
    // consume 'of' if present (optional in some cases but usually note right of A)
    if (this.currToken.type === 'OF') {
      this.nextToken();
    }
    
    const participantIds: string[] = [];
    
    while (this.isParticipantToken(this.currToken)) {
      participantIds.push(this.currToken.literal);
      this.ensureParticipant(root, this.currToken.literal);
      this.nextToken();
      
      if (this.currToken.type === 'COMMA') {
        this.nextToken();
      } else {
        break;
      }
    }
    
    let text = '';
    if (this.currToken.type === 'COLON') {
      this.nextToken();
      text = this.readRestOfLine();
    }
    
    return {
      kind: 'note',
      id: this.generateId('note'),
      position,
      participantIds,
      text
    };
  }

  private parseActivation(root: AyatoriRoot): ActivationNode {
     const action = this.currToken.type === 'ACTIVATE' ? 'activate' : 'deactivate';
     this.nextToken(); // eat command
     
     let participantId = '';
     if (this.isParticipantToken(this.currToken)) {
         participantId = this.currToken.literal;
         this.ensureParticipant(root, participantId);
         this.nextToken();
     }
     
     return {
         kind: 'activation',
         participantId,
         action
     };
  }

  private parseMessage(root: AyatoriRoot): MessageNode | null {
    // Check if next token is an arrow to confirm it's a message before side-effects
    if (this.peekToken.type !== 'ARROW') {
        return null; 
    }

    const fromId = this.currToken.literal;
    this.ensureParticipant(root, fromId);
    this.nextToken(); // eat from

    // Current token is now ARROW (guaranteed by peek check)
    if (this.currToken.type !== 'ARROW') {
       // Should not happen
       return null;
    }
    
    const arrowLiteral = this.currToken.literal;
    this.nextToken(); // eat arrow
    
    // Check for lifecycle suffixes (+/-) on TARGET side or SOURCE side?
    // Mermaid: A->>+B (activate B)
    // A-->>-B (deactivate A)
    // The suffix is attached to the arrow in syntax but lexer splits it?
    // Lexer splits `->>+` into `ARROW(->>)` and `PLUS(+)` if we implemented it right.
    // Wait, my lexer `readArrow` consumes `->>` then returns. 
    // The next char is `+`. `nextToken` will pick `PLUS`.
    
    let activateTarget = false;
    let deactivateSource = false;
    
    if ((this.currToken.type as TokenType) === 'PLUS') {
        activateTarget = true;
        this.nextToken();
    }
    if ((this.currToken.type as TokenType) === 'MINUS') {
        deactivateSource = true;
        this.nextToken();
    }

    if (!this.isParticipantToken(this.currToken)) return null;
    const toId = this.currToken.literal;
    this.ensureParticipant(root, toId);
    this.nextToken(); // eat to

    let text = '';
    if ((this.currToken.type as TokenType) === 'COLON') {
      this.nextToken(); // eat colon
      text = this.readRestOfLine();
    }
    
    const { type, style } = this.resolveArrow(arrowLiteral);

    return {
      kind: 'message',
      id: this.generateId('evt'),
      from: fromId,
      to: toId,
      text: text,
      type: type,
      style: style,
      lifecycle: (activateTarget || deactivateSource) ? { activateTarget, deactivateSource } : undefined
    };
  }

  private resolveArrow(arrow: string): { type: MessageNode['type'], style: MessageNode['style'] } {
    const mapping = ARROW_MAPPING[arrow];
    if (mapping) {
        return mapping;
    }
    // Fallback
    return { type: 'sync', style: { line: 'solid', head: 'arrow' } };
  }

  private generateId(prefix: keyof typeof this.idCounters): string {
    this.idCounters[prefix]++;
    return `${prefix}_${this.idCounters[prefix]}`;
  }

  private readRestOfLine(): string {
    if ((this.currToken.type as TokenType) === 'NEWLINE' || (this.currToken.type as TokenType) === 'EOF') {
        return '';
    }

    const start = this.currToken.start;
    let end = this.currToken.end;
    
    while ((this.currToken.type as TokenType) !== 'NEWLINE' && (this.currToken.type as TokenType) !== 'EOF') {
      end = this.currToken.end;
      this.nextToken();
    }
    
    // Trim? Mermaid messages usually trim leading/trailing whitespace semantics but preserve internal
    // Lexer skips whitespace between tokens?
    // Lexer skips whitespace in nextToken(). So getInput().slice(start, end) will include whitespace BETWEEN tokens.
    // It will NOT include leading whitespace before the first token because start is from currToken.start.
    // It will NOT include trailing whitespace after the last token because end is from lastToken.end.
    // Perfect.
    
    return this.lexer.getInput().slice(start, end);
  }

  private ensureParticipant(root: AyatoriRoot, id: string) {
    if (!root.participants.find(p => p.id === id)) {
      root.participants.push({
        id,
        name: id,
        type: 'participant'
      });
    }
  }
}
