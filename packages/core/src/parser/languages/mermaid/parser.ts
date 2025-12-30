
import { ActivationNode, EventNode, FragmentOperator, MessageNode, NoteNode, ParticipantGroup, PolagraphRoot } from '../../../ast';
import { BaseParser } from '../../base/parser';
import { ARROW_MAPPING } from './constants';
import { Lexer } from './lexer';
import { Token, TokenType } from './tokens';

export class Parser extends BaseParser {
  private currentGroup: ParticipantGroup | null = null;
  private idCounters = {
    evt: 0,
    frag: 0,
    br: 0,
    note: 0,
    group: 0,
  };

  constructor(lexer: Lexer) {
    super(lexer);
  }

  parse(): PolagraphRoot {
    const root: PolagraphRoot = {
      kind: 'root',
      meta: { version: '1.0.0', source: 'unknown' },
      participants: [],
      groups: [],
      events: []
    };

    root.events = this.parseBlock(root);

    return root;
  }

  private parseBlock(root: PolagraphRoot, stopTokens: TokenType[] = []): EventNode[] {
    const events: EventNode[] = [];

    while (this.currToken.type !== 'EOF') {
      const type = this.currToken.type as TokenType;

      if (stopTokens.includes(type)) {
        return events;
      }

      if (type === 'NEWLINE') {
        this.advance();
        continue;
      }

      if (type === 'SEQUENCE_DIAGRAM') {
        root.meta.source = 'mermaid';
        this.advance();
        continue;
      }

      if (type === 'TITLE') {
        this.advance(); // eat TITLE
        root.meta.title = this.readRestOfLine();
        continue;
      }

      if (type === 'BOX') {
        const groupEvents = this.parseGroup(root);
        events.push(...groupEvents);
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

      if (this.isParticipantToken(this.currToken)) {
          const msg = this.parseMessage(root);
          if (msg) {
             events.push(msg);
             continue;
          }
      }

      // Skip unknown or unhandled
      this.advance();
    }
    return events;
  }
  
  private isParticipantToken(tok: Token): boolean {
      return tok.type === 'IDENTIFIER' || tok.type === 'STRING';
  }

  private parseGroup(root: PolagraphRoot): EventNode[] {
    this.advance(); // eat 'box'

    const rawAttrs = this.readRestOfLine().trim();
    let name = rawAttrs;
    let color: string | undefined;

    const parts = rawAttrs.split(/\s+/);
    if (parts.length > 0) {
        const first = parts[0];
        if (first.startsWith('#') || ['rgb', 'rgba', 'transparent', 'aqua', 'grey', 'gray', 'purple', 'red', 'blue', 'green'].includes(first.toLowerCase())) {
            color = first;
            name = parts.slice(1).join(' ');
        }
    }
    if (!name) name = `Group ${this.idCounters.group + 1}`;

    const group: ParticipantGroup = {
        kind: 'group',
        id: this.generateId('group'),
        name: name,
        type: 'box',
        participantIds: [],
        style: color ? { backgroundColor: color } : undefined
    };

    root.groups.push(group);
    
    // Set current group context
    const previousGroup = this.currentGroup;
    this.currentGroup = group;

    // Parse content until 'end'
    const events = this.parseBlock(root, ['END']);

    // Restore context
    this.currentGroup = previousGroup;

    if (this.currToken.type === 'END') {
        this.advance(); // eat 'end'
    }

    return events;
  }

  private parseFragment(root: PolagraphRoot): EventNode {
    const type = this.currToken.type as TokenType;
    let operator: FragmentOperator = 'loop';
    if (type === 'ALT') operator = 'alt';
    if (type === 'OPT') operator = 'opt';

    this.advance(); // eat operator

    const condition = this.readRestOfLine();

    const branches = [];
    const events = this.parseBlock(root, ['END', 'ELSE']);

    branches.push({
      id: this.generateId('br'),
      condition,
      events
    });

    while ((this.currToken.type as TokenType) === 'ELSE') {
      this.advance();
      const elseCond = this.readRestOfLine();
      const elseEvents = this.parseBlock(root, ['END', 'ELSE']);
      branches.push({
        id: this.generateId('br'),
        condition: elseCond,
        events: elseEvents
      });
    }

    if ((this.currToken.type as TokenType) === 'END') {
      this.advance();
    }

    return {
      kind: 'fragment',
      id: this.generateId('frag'),
      operator,
      branches
    };
  }

  private parseParticipant(root: PolagraphRoot) {
    const isActor = this.currToken.type === 'ACTOR';
    this.advance(); // eat 'participant' or 'actor'

    let id = '';
    let name = '';

    if (this.isParticipantToken(this.currToken)) {
      id = this.currToken.literal;
      name = id;
      this.advance();
    }

    // Check for 'as'
    if (this.currToken.type === 'AS') {
      this.advance(); // eat 'as'
      // Use readRestOfLine to capture multi-word aliases (e.g., "API Server")
      const alias = this.readRestOfLine().trim();
      if (alias) {
        name = alias;
      }
    }
    
    const existing = root.participants.find(p => p.id === id);
    if (!existing) {
        root.participants.push({
            id,
            name,
            type: isActor ? 'actor' : 'participant'
        });
    } else {
        if (name !== id) existing.name = name;
        if (isActor) existing.type = 'actor';
    }

    // Assign to current group if exists
    if (this.currentGroup) {
        if (!this.currentGroup.participantIds.includes(id)) {
            this.currentGroup.participantIds.push(id);
        }
    }
  }

  private parseNote(root: PolagraphRoot): NoteNode {
    this.advance(); // eat 'note'
    
    let position: 'left' | 'right' | 'over' = 'over'; // default
    if (this.currToken.type === 'LEFT') { position = 'left'; this.advance(); }
    else if (this.currToken.type === 'RIGHT') { position = 'right'; this.advance(); }
    else if (this.currToken.type === 'OVER') { position = 'over'; this.advance(); }
    
    // consume 'of' if present (optional in some cases but usually note right of A)
    if (this.currToken.type === 'OF') {
      this.advance();
    }
    
    const participantIds: string[] = [];
    
    while (this.isParticipantToken(this.currToken)) {
      participantIds.push(this.currToken.literal);
      this.ensureParticipant(root, this.currToken.literal);
      this.advance();
      
      if (this.currToken.type === 'COMMA') {
        this.advance();
      } else {
        break;
      }
    }
    
    let text = '';
    if (this.currToken.type === 'COLON') {
      this.advance();
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

  private parseActivation(root: PolagraphRoot): ActivationNode {
     const action = this.currToken.type === 'ACTIVATE' ? 'activate' : 'deactivate';
     this.advance(); // eat command
     
     let participantId = '';
     if (this.isParticipantToken(this.currToken)) {
         participantId = this.currToken.literal;
         this.ensureParticipant(root, participantId);
         this.advance();
     }
     
     return {
         kind: 'activation',
         participantId,
         action
     };
  }

  private parseMessage(root: PolagraphRoot): MessageNode | null {
    if (this.peekToken.type !== 'ARROW') {
        return null; 
    }

    const fromId = this.currToken.literal;
    this.ensureParticipant(root, fromId);
    this.advance(); // eat from

    if (this.currToken.type !== 'ARROW') {
       return null;
    }
    
    const arrowLiteral = this.currToken.literal;
    this.advance(); // eat arrow
    
    let activateTarget = false;
    let deactivateSource = false;
    
    if ((this.currToken.type as TokenType) === 'PLUS') {
        activateTarget = true;
        this.advance();
    }
    if ((this.currToken.type as TokenType) === 'MINUS') {
        deactivateSource = true;
        this.advance();
    }

    if (!this.isParticipantToken(this.currToken)) return null;
    const toId = this.currToken.literal;
    this.ensureParticipant(root, toId);
    this.advance(); // eat to

    let text = '';
    if ((this.currToken.type as TokenType) === 'COLON') {
      this.advance();
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
      this.advance();
    }
    
    return (this.lexer as Lexer).getInput().slice(start, end);
  }

  private ensureParticipant(root: PolagraphRoot, id: string) {
    if (!root.participants.find(p => p.id === id)) {
      root.participants.push({
        id,
        name: id,
        type: 'participant'
      });
    }
  }
}
