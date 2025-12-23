
import {
    ActivationNode,
    AyatoriRoot,
    DividerNode,
    FragmentNode,
    MessageNode,
    NoteNode,
    Participant,
    ParticipantGroup,
    ReferenceNode,
    SpacerNode,
} from '../../ast';

/**
 * Visitor interface for traversing the Ayatori AST.
 * Implement this interface to create code generators, validators, etc.
 */
export interface AyatoriVisitor {
  visitRoot(node: AyatoriRoot): void;
  
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
