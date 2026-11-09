# Contributing to Polagram

Thank you for your interest in contributing to Polagram! We welcome contributions from the community to help improve this project.

## Development Setup

Polagram is a monorepo managed with [pnpm](https://pnpm.io/) and [Turborepo](https://turbo.build/).

### Prerequisites

- Node.js (v18 or later)
- pnpm (v8 or later)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/polagram/polagram.git
   cd polagram
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

## Workflow

### Building

To build all packages:

```bash
pnpm build
```

To build a specific package (e.g., core):

```bash
pnpm build --filter @polagram/core
```

### Testing

Run all tests:

```bash
pnpm test
```

### Linting & Formatting

We use [Biome](https://biomejs.dev/) for linting and formatting.

```bash
pnpm lint
pnpm format
```

## Pull Requests

1. **Fork** the repository and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes (`pnpm test`).
5. Make sure your code lints (`pnpm lint`).

### Versioning (Changesets)

We use [Changesets](https://github.com/changesets/changesets) to manage versioning and changelogs.

If your changes affect the released packages, **you must include a changeset**.

1. Run the changeset wizard:
   ```bash
   pnpm changeset
   ```
2. Select the packages you modified.
3. Select the bump type (major, minor, patch).
4. Write a summary of your changes.

This will generate a Markdown file in the `.changeset` directory. Commit this file along with your code.

## License

By contributing, you agree that your contributions will be licensed under its MIT License.

## Preview safety and verification

`polagram preview` listens on `127.0.0.1`. Its API accepts same-origin GET requests and serves configured diagram inputs relative to the configuration directory, inside the project root. Absolute paths, parent traversal, external symlinks, and non-diagram files are rejected. Existing diagram extensions remain `.mmd`, `.mermaid`, `.puml`, `.plantuml`, and `.pu`.

Static output must not overlap the project root, input files, or the client build. A new or empty output directory is supported; rebuilding a non-empty output requires its `.polagram-preview-build` marker. Preserve older generated output separately and choose a new directory for the first build after upgrading. Do not use an output directory shared with untrusted writers: realpath checks do not provide an OS sandbox against concurrent local filesystem mutation.

Run `pnpm build`, `pnpm lint`, and `pnpm test`. The web test task includes real-browser renderer regression tests; install the Chromium test browser with `pnpm --filter @polagram/web exec playwright install chromium` first. The existing full-site E2E remains `pnpm --filter @polagram/web test:e2e`. Test details and comparison against the previous renderer are in [the renderer test guide](packages/web/tests/render-security/README.md).

The pnpm package extensions declare the optional React type peer for three existing UI libraries so the React 18 preview and React 19 website resolve their respective types. They do not change runtime React versions or relax type checking. The Mermaid 10 DOMPurify override stays within Mermaid's declared 3.x range and fixes the sanitizer version in the lockfile. Dependency audit results still require reachability and published-version review; these changes do not assert that all dependencies or published builds are safe.
