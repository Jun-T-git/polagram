# @polagram/cli

## 0.1.2

### Patch Changes

- Updated dependencies [d5ed757]
  - @polagram/core@0.4.0

## 0.1.1

### Patch Changes

- f605f22: Refactor merge configuration:
  - Introduce `into` object for merge targets.
  - Support `id` and `name` in `into`.
  - Implement auto-naming if `id`/`name` are omitted.
  - Fix participant ordering (insert at first merged participant's position).
- Updated dependencies [f605f22]
  - @polagram/core@0.3.0

## 0.1.0

### Minor Changes

- 6f0474a: Introduced `MergeFilter` and `MergeLayer` to allow merging multiple participants into a single entity, abstracting internal interactions. Updated CLI to support `action: merge` in `polagram.yml`.

### Patch Changes

- Updated dependencies [6f0474a]
  - @polagram/core@0.2.0

## 0.0.11

### Patch Changes

- Updated dependencies [d6a874b]
  - @polagram/core@0.1.2

## 0.0.10

### Patch Changes

- Updated dependencies [d85a7cc]
  - @polagram/core@0.1.1

## 0.0.9

### Patch Changes

- Updated dependencies [dfa469b]
  - @polagram/core@0.1.0

## 0.0.8

### Patch Changes

- Fix: Remove invalid dependency on @polagram/preview in published package

## 0.0.7

### Patch Changes

- Support for PlantUML format inputs
- Export config schema from core and update supported formats in cli readme
- Updated dependencies
  - @polagram/core@0.0.4

## 0.0.6

### Patch Changes

- fix README

## 0.0.5

### Patch Changes

- fix CLI API

## 0.0.4

### Patch Changes

- bugfix EMV

## 0.0.3

### Patch Changes

- 612e54c: Update README
- Updated dependencies [612e54c]
  - @polagram/core@0.0.3

## 0.0.2

### Patch Changes

- Initial release
- Updated dependencies
  - @polagram/core@0.0.2
