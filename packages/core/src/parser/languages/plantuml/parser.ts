import type {
    ActivationNode,
    DividerNode,
    EventNode,
    FragmentNode,
    MessageNode,
    NoteNode,
    Participant,
    ParticipantGroup,
    PolagramRoot,
} from '../../../ast';
import { BaseParser } from '../../base/parser';
import type { Lexer } from './lexer';
import type { Token } from './tokens';

export class Parser extends BaseParser<Token> {
  /**
   * Type-safe token type checker.
   * Helps TypeScript understand token type after advance() calls.
   */
  private isTokenType(type: string): boolean {
    return this.currToken.type === type;
  }

  parse(): PolagramRoot {
    const root: PolagramRoot = {
      kind: 'root',
      meta: { version: '1.0.0', source: 'plantuml' },
      participants: [],
      groups: [],
      events: [],
    };

    while (this.currToken.type !== 'EOF') {
      if (this.currToken.type === 'START_UML') {
        this.advance();
        continue;
      }
      if (this.currToken.type === 'END_UML') {
        this.advance();
        continue;
      }
      if (this.currToken.type === 'TITLE') {
        this.advance(); // eat title
        root.meta.title = this.readRestOfLine().trim();
        continue;
      }

      if (['PARTICIPANT', 'ACTOR', 'DATABASE', 'BOUNDARY', 'CONTROL', 'ENTITY', 'COLLECTIONS', 'QUEUE'].includes(this.currToken.type)) {
        this.parseParticipant(root);
        continue;
      }

      // Handle dividers
      if (this.currToken.type === 'DIVIDER') {
        const divider: DividerNode = {
          kind: 'divider',
          id: `div_${root.events.length + 1}`,
          text: this.currToken.literal || undefined,
        };
        root.events.push(divider);
        this.advance();
        continue;
      }

      // Implicit message/participant detection
      // A -> B : text
      // Identifier/String -> Arrow...
      if (this.isParticipantToken(this.currToken)) {
        const probMsg = this.parseMessage(root);
        if (probMsg) {
          root.events.push(probMsg);
          continue;
        }
      }

      if (
        this.currToken.type === 'ACTIVATE' ||
        this.currToken.type === 'DEACTIVATE'
      ) {
        const act = this.parseActivation(root);
        if (act) root.events.push(act);
        continue;
      }

      if (this.currToken.type === 'NOTE') {
        const note = this.parseNote(root);
        if (note) root.events.push(note);
        continue;
      }

      if (['ALT', 'OPT', 'LOOP'].includes(this.currToken.type)) {
        const fragment = this.parseFragment(root);
        if (fragment) root.events.push(fragment);
        continue;
      }

      // Handle standalone 'end' if it appears outside (shouldn't if parsed recursively, but safeguard)
      if (this.currToken.type === 'END') {
        // If we are at root, 'end' might be closing a fragment.
        // But parseFragment consumes until end.
        // If we see it here, it's unmatched or nested logic needed.
        // For simple recursive descent, we return to caller.
        return root;
      }

      if (this.currToken.type === 'BOX') {
        const group = this.parseGroup(root);
        if (group) root.groups.push(group);
        continue;
      }

      this.advance();
    }

    return root;
  }

  private parseGroup(root: PolagramRoot): ParticipantGroup | null {
    this.advance(); // eat box

    let name = '';
    let backgroundColor: string | undefined;

    // box "Title" #Color
    if (this.currToken.type === 'STRING') {
      name = this.currToken.literal;
      this.advance();
    }

    // Check for color (starts with # usually, but lexer might tokenize it as UNKNOWN or need handling)
    // PlantUML #Color is just text heavily.
    // My lexer tokenizes # as UNKNOWN?
    // Let's check lexer. It has no case for '#'.
    // So it returns UNKNOWN.
    if (this.currToken.type === 'UNKNOWN' && this.currToken.literal === '#') {
      // Read color
      // #LightBlue
      // We need to read identifiers after #?
      // Currently I don't have good color support in lexer.
      // Quick hack: assume we are at #. Read next identifier.
      this.advance(); // eat #
      if (this.isTokenType('IDENTIFIER')) {
        backgroundColor = `#${this.currToken.literal}`;
        this.advance();
      }
    }

    const participantIds: string[] = [];

    // Parse content until 'end box' (or just 'end')
    while (this.currToken.type !== 'EOF') {
      if (this.currToken.type === 'END') {
        this.advance(); // eat end
        if (this.isTokenType('BOX')) {
          this.advance(); // eat box
        }
        break;
      }

      // We expect participant declarations inside box usually.
      if (['PARTICIPANT', 'ACTOR', 'DATABASE', 'BOUNDARY', 'CONTROL', 'ENTITY', 'COLLECTIONS', 'QUEUE'].includes(this.currToken.type)) {
        // We need to capture the ID of the participant created.
        // parseParticipant pushes to root.participants.
        // We can check root.participants.length before and after? Or return ID from parseParticipant.
        const lenBefore = root.participants.length;
        this.parseParticipant(root);
        const lenAfter = root.participants.length;
        if (lenAfter > lenBefore) {
          participantIds.push(root.participants[lenAfter - 1].id);
        }
        continue;
      }

      // If implicit participant? 'A'
      if (this.currToken.type === 'IDENTIFIER') {
        // Check if it is a participant decl without keyword? (PlantUML allows it)
        // OR check if it is start of message?
        // If start of message, participants might be already capable of being in group?
        // Usually checking 'participant A' is safe.

        // But implicit participants in box:
        // box "Foo"
        //   A
        // end box
        // This declares A in box.

        // But A -> B inside box?
        // The message is an event. The participants are in the box?
        // Only if they are first declared here.

        // For MVP: Support explicit 'participant' inside box, OR just parse statements.
        // If parseStatement returns null (participant decl), we need to capture ID.

        // Let's rely on explicit participant keywords for now as per test case.
        this.advance(); // skip other things
        continue;
      }

      this.advance();
    }

    return {
      kind: 'group',
      id: `group_${root.groups.length + 1}`,
      name,
      type: 'box',
      participantIds,
      style: backgroundColor ? { backgroundColor } : undefined,
    };
  }

  private parseFragment(root: PolagramRoot): FragmentNode | null {
    const kind = 'fragment';
    const operator = this.currToken.literal.toLowerCase() as FragmentNode['operator']; // alt, opt, loop
    this.advance(); // eat keyword

    const condition = this.readRestOfLine().trim();

    const branches: FragmentNode['branches'] = [];
    let currentEvents: EventNode[] = [];
    const currentBranch = { id: `br_${branches.length + 1}`, condition, events: currentEvents };
    branches.push(currentBranch);

    // We need to parse block content until ELSE or END
    while (this.currToken.type !== 'EOF') {
      if (this.currToken.type === 'END') {
        this.advance(); // eat end
        // Check if it is 'end box' or just 'end'?
        // PlantUML has 'end' for fragments.
        // Also 'end note', 'end box'.
        // For now assume 'end' closes fragment.
        break;
      }

      if (this.currToken.type === 'ELSE') {
        this.advance(); // eat else
        // New branch
        const elseCond = this.readRestOfLine().trim();
        currentEvents = [];
        branches.push({ id: `br_${branches.length + 1}`, condition: elseCond, events: currentEvents });
        continue;
      }

      // Parse single line event or nested structure
      // We can reuse the main loop logic effectively if we refactor 'parseBlock'
      // For now, let's duplicate the switch logic or call a recursive 'parseStatement'

      // Simulating parseStatement step:
      if (this.currToken.type === 'NEWLINE') {
        this.advance();
        continue;
      }

      // Recursively call a helper that processes ONE statement
      const event = this.parseStatement(root); // We need this helper!
      if (event) {
        currentEvents.push(event);
      } else {
        // If not returned an event (e.g. participant decl), we might still advance?
        // parseStatement should handle everything inside block.
        // But 'parseStatement' needs to be extracted from parse().
      }
    }

    return {
      kind,
      id: `frag_${root.events.length + 1}`,
      operator,
      branches,
    };
  }

  // Refactor parse() to use parseStatement
  private parseStatement(root: PolagramRoot): EventNode | null {
    if (['PARTICIPANT', 'ACTOR', 'DATABASE', 'BOUNDARY', 'CONTROL', 'ENTITY', 'COLLECTIONS', 'QUEUE'].includes(this.currToken.type)) {
      this.parseParticipant(root);
      return null; // Not an event
    }

    if (this.isParticipantToken(this.currToken)) {
      const probMsg = this.parseMessage(root);
      if (probMsg) return probMsg;
    }

    if (
      this.currToken.type === 'ACTIVATE' ||
      this.currToken.type === 'DEACTIVATE'
    ) {
      return this.parseActivation(root);
    }

    if (this.currToken.type === 'NOTE') {
      return this.parseNote(root);
    }

    if (['ALT', 'OPT', 'LOOP'].includes(this.currToken.type)) {
      return this.parseFragment(root);
    }

    this.advance();
    return null;
  }

  private parseNote(root: PolagramRoot): NoteNode | null {
    this.advance(); // eat note

    let position: 'left' | 'right' | 'over' = 'over'; // default
    // note left of A
    // note right of A
    // note over A

    if (this.currToken.type === 'LEFT') {
      position = 'left';
      this.advance();
    } else if (this.currToken.type === 'RIGHT') {
      position = 'right';
      this.advance();
    } else if (this.currToken.type === 'OVER') {
      position = 'over';
      this.advance();
    }

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
      text = this.readRestOfLine().trim();
    } else {
      // Multi-line note
      if (this.currToken.type === 'NEWLINE') {
        this.advance();
      }

      const start = this.currToken.start;
      let end = start;

      while (this.currToken.type !== 'EOF') {
        if (this.currToken.type === 'END' && this.peekToken.type === 'NOTE') {
          end = this.currToken.start;
          this.advance(); // eat end
          this.advance(); // eat note
          break;
        }
        this.advance();
      }

      const input = (this.lexer as Lexer).getInput();
      text = input.slice(start, end).trim();
    }

    return {
      kind: 'note',
      id: `note_${root.events.length + 1}`,
      position,
      participantIds,
      text,
    };
  }

  private parseActivation(root: PolagramRoot): ActivationNode | null {
    const action =
      this.currToken.type === 'ACTIVATE' ? 'activate' : 'deactivate';
    this.advance(); // eat keyword

    let participantId = '';
    if (this.isParticipantToken(this.currToken)) {
      participantId = this.currToken.literal;
      this.ensureParticipant(root, participantId);
      this.advance();
    } else {
      return null; // Error
    }

    return {
      kind: 'activation',
      participantId,
      action,
    };
  }

  private isParticipantToken(tok: { type: string }): boolean {
    return tok.type === 'IDENTIFIER' || tok.type === 'STRING';
  }

  private parseMessage(root: PolagramRoot): MessageNode | null {
    if (this.peekToken.type !== 'ARROW') {
      // Maybe it's just a participant declaration implied? 'A' on its own line?
      // PlantUML 'A' is valid. It creates participant A.
      // But here we look for message.
      return null;
    }

    const fromId = this.currToken.literal; // simple ID for now. If quoted string, use it as ID/Name.
    this.ensureParticipant(root, fromId);
    this.advance(); // eat from

    const arrow = this.currToken.literal; // -> or -->
    this.advance(); // eat arrow

    if (!this.isParticipantToken(this.currToken)) {
      return null; // Error?
    }
    const toId = this.currToken.literal;
    this.ensureParticipant(root, toId);
    this.advance(); // eat to

    let text = '';
    if (this.currToken.type === 'COLON') {
      this.advance(); // eat colon
      text = this.readRestOfLine().trim();
    }

    // Resolve arrow style
    let type: MessageNode['type'] = 'sync';
    let style: MessageNode['style'] = { line: 'solid', head: 'arrow' };

    if (arrow === '-->') {
      type = 'reply';
      style = { line: 'dotted', head: 'arrow' };
    } else if (arrow === '->') {
      type = 'sync';
      style = { line: 'solid', head: 'arrow' };
    }

    return {
      kind: 'message',
      id: `msg_${root.events.length + 1}`, // Simple ID generation
      from: fromId,
      to: toId,
      text,
      type,
      style,
    };
  }

  private ensureParticipant(root: PolagramRoot, id: string) {
    if (!root.participants.find((p) => p.id === id)) {
      root.participants.push({
        id,
        name: id,
        type: 'participant',
      });
    }
  }

  private parseParticipant(root: PolagramRoot) {
    const typeStr = this.currToken.type; // ACTOR, DATABASE, PARTICIPANT, BOUNDARY, etc.
    let type: Participant['type'] = 'participant'; // Default
    if (typeStr === 'ACTOR') type = 'actor';
    if (typeStr === 'DATABASE') type = 'database';
    if (typeStr === 'BOUNDARY') type = 'boundary';
    if (typeStr === 'CONTROL') type = 'control';
    if (typeStr === 'ENTITY') type = 'entity';
    if (typeStr === 'COLLECTIONS') type = 'collections';
    if (typeStr === 'QUEUE') type = 'queue';

    this.advance(); // eat keyword

    // console.log('DEBUG: parseParticipant token:', this.currToken.type, this.currToken.literal);

    let name = '';
    let id = '';

    // Name/ID
    if (
      this.currToken.type === 'STRING' ||
      this.currToken.type === 'IDENTIFIER'
    ) {
      name = this.currToken.literal;
      id = name; // Default ID is name (unless as is used)
      // If name has spaces (quoted), ID usually needs alias to be usable without quotes?
      // PlantUML: participant "Long Name" as A
      // ID = A, Name = "Long Name"
      // PlantUML: participant A
      // ID = A, Name = A

      // But strict PlantUML uses the Alias as the ID for arrows.

      this.advance();
    }

    if (this.currToken.type === 'AS') {
      this.advance(); // eat as
      if (this.isTokenType('IDENTIFIER')) {
        id = this.currToken.literal; // "Long Name" as Svc -> Svc is ID
        this.advance();
      }
    } else {
      // If "Long Name" is given without 'as', usually we treat name as ID if safe?
      // But usually we sanitize.
      // For now follow logic: A as B -> ID=B, Name=A.
      // If just A -> ID=A, Name=A.
      // If "A B" -> ID="A B", Name="A B".
      // In Core AST, ID is the references key.
      // If name was quoted "Service Wrapper", without ID, it is hard to reference.
      // Unless we reference using Quotes?
      // Let's assume input is valid alias for now.
      // Wait, Step 93 test case:
      // participant "Service Wrapper" as Svc
      // name="Service Wrapper", id="Svc"
    }

    // If we found 'as', id was updated.
    // If we didn't find 'as' (e.g. actor User), id = User, name = User.

    // But wait:
    // case: participant "Service Wrapper" as Svc
    // 1. Keyword participant.
    // 2. String "Service Wrapper". name = "Service Wrapper", id="Service Wrapper".
    // 3. AS.
    // 4. Identifier Svc. id="Svc".
    // correct.

    root.participants.push({
      id,
      name,
      type,
    });
  }

  private readRestOfLine(): string {
    // We need to sync/consume tokens until NEWLINE
    // But since we want raw text, we should ask lexer.
    // However, we effectively already consumed 'current token' if we are here?
    // Usually we call readRestOfLine AFTER consuming the label (e.g. COLON).
    // So currToken should be the first token of the text?

    // But lexer might have already tokenized it into multiple tokens.
    // If we simply call lexer.readRestOfLine(), it continues from CURRENT lexer position.
    // currToken is the token *already read*.
    // peekToken is the next one.
    // Parser is usually one step behind or ahead?
    // BaseParser: this.currToken, this.peekToken.
    // Parsing process:
    // 1. nextToken called for currToken.
    // 2. nextToken called for peekToken.
    // So Lexer is at position AFTER peekToken.

    // If we want "rest of line from currToken", we are in trouble because Lexer is far ahead.

    // Alternative:
    // Reconstruct text from tokens until NEWLINE.
    // But tokens don't enforce whitespace rules strictly?
    // We capture literal.

    // Wait, `Token` has `start` and `end`?
    // Yes: { type, literal, start, end }
    // We can use the start of currToken and end of the last token before NEWLINE to slice from source?
    // We don't have easy access to source in strict BaseParser (it's in Lexer).
    // But we can access `(this.lexer as Lexer).input`.

    if (this.currToken.type === 'NEWLINE' || this.currToken.type === 'EOF')
      return '';

    const start = this.currToken.start;
    let end = this.currToken.end;

    while (!this.isTokenType('NEWLINE') && !this.isTokenType('EOF')) {
      end = this.currToken.end;
      this.advance();
    }

    // We advanced past the last text token. currToken is now NEWLINE.
    // The previous token ended at `end`.

    // We need access to input.
    const input = (this.lexer as Lexer).getInput(); // BaseLexer usually carries input?
    // BaseLexer: protected input: string;
    // We might need to make it public accessor or cast.

    return input.slice(start, end).trim();
  }
}
