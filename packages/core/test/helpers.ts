import type { EventNode, FragmentNode, MessageNode, NoteNode } from '../src/ast';

/**
 * Type guard for FragmentNode.
 * Throws an error if the event is not a fragment.
 */
export function assertFragment(event: EventNode): asserts event is FragmentNode {
  if (event.kind !== 'fragment') {
    throw new Error(`Expected fragment, got ${event.kind}`);
  }
}

/**
 * Type guard for MessageNode.
 * Throws an error if the event is not a message.
 */
export function assertMessage(event: EventNode): asserts event is MessageNode {
  if (event.kind !== 'message') {
    throw new Error(`Expected message, got ${event.kind}`);
  }
}

/**
 * Type guard for NoteNode.
 * Throws an error if the event is not a note.
 */
export function assertNote(event: EventNode): asserts event is NoteNode {
  if (event.kind !== 'note') {
    throw new Error(`Expected note, got ${event.kind}`);
  }
}

/**
 * Get event as fragment (throws if not a fragment).
 */
export function asFragment(event: EventNode): FragmentNode {
  assertFragment(event);
  return event;
}

/**
 * Get event as message (throws if not a message).
 */
export function asMessage(event: EventNode): MessageNode {
  assertMessage(event);
  return event;
}

/**
 * Get event as note (throws if not a note).
 */
export function asNote(event: EventNode): NoteNode {
  assertNote(event);
  return event;
}
