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
