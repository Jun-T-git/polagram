# @polagram/core

## 0.3.0

### Minor Changes

- f605f22: Refactor merge configuration:
  - Introduce `into` object for merge targets.
  - Support `id` and `name` in `into`.
  - Implement auto-naming if `id`/`name` are omitted.
  - Fix participant ordering (insert at first merged participant's position).

## 0.2.0

### Minor Changes

- 6f0474a: Introduced `MergeFilter` and `MergeLayer` to allow merging multiple participants into a single entity, abstracting internal interactions. Updated CLI to support `action: merge` in `polagram.yml`.

## 0.1.2

### Patch Changes

- d6a874b: fix: ensure participant order is preserved in PlantUML and Mermaid generators by using stack-based group management logic

## 0.1.1

### Patch Changes

- d85a7cc: fix: PlantUML generator now correctly handles multi-line and floating notes by using block syntax consistently.

## 0.1.0

### Minor Changes

- dfa469b: Refactor: Cleaned up exports, removed deprecated APIs, and enhanced PlantUML/Mermaid parser support.

## 0.0.4

### Patch Changes

- Support for PlantUML parsing and generation
- Export config schema from core and update supported formats in cli readme

## 0.0.3

### Patch Changes

- 612e54c: Update README

## 0.0.2

### Patch Changes

- Initial release
