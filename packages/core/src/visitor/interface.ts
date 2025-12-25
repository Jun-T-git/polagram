
import {
    ActivationNode,
    DividerNode,
    FragmentNode,
    MessageNode,
    NoteNode,
    Participant,
    ParticipantGroup,
    PolagramRoot,
    ReferenceNode,
    SpacerNode,
} from '../ast';

/**
 * Visitor interface for traversing the Polagram AST.
 * Implement this interface to create code generators, validators, etc.
 */
export interface PolagramVisitor {
  visitRoot(node: PolagramRoot): void;
  
  visitParticipant(node: Participant): void;
  visitParticipantGroup(node: ParticipantGroup): void;
  
  visitMessage(node: MessageNode): void;
  visitFragment(node: FragmentNode): void;
  visitNote(node: NoteNode): void;
  visitActivation(node: ActivationNode): void;
  visitDivider(node: DividerNode): void;
  visitSpacer(node: SpacerNode): void;
  visitReference(node: ReferenceNode): void;
}
