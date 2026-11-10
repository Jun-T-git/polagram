# @polagram/preview

## 0.1.4

### Patch Changes

- 4a8acc4: Restrict preview access to configured diagram inputs inside the project root, bind the local server to loopback, and reject unsafe static output destinations. Harden diagram rendering and update the Mermaid security fixes. Existing non-empty static output directories require the preview build marker before they can be replaced.

## 0.1.3

### Patch Changes

- ac47762: fix: resolve file paths relative to config file directory and fix client-side handling of relative paths

## 0.1.2

### Patch Changes

- ac47762: fix: resolve file paths relative to config file directory in preview command

## 0.1.1

### Patch Changes

- f93d0cc: Fix broken dependencies

## 0.1.0

### Minor Changes

- 4bd1eee: Enhance preview UI, add E2E tests, and refine configuration schema.

### Patch Changes

- Updated dependencies [4bd1eee]
  - @polagram/core@0.4.2
