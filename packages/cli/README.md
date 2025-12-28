# @polagram/cli

The official CLI for Polagram, enabling CI/CD integration for sequence diagram transformations.

## Installation

```bash
pnpm add -D @polagram/cli
```

## Usage

### Configuration

Create a `polagram.yml` in your project root:

```yaml
version: 1
targets:
  - input: ["docs/design/**/*.mmd"]
    outputDir: "docs/generated"
    ignore: ["**/_*.mmd"]
    lenses:
      - name: "success"
        suffix: ".success"
        layers:
          # Resolve "Success" alt blocks
          - action: resolve
            selector: { kind: "fragment", condition: "Success" }
          # Remove infrastructure details
          - action: remove
            selector: { kind: "participant", stereotype: "infra" }
```

### Running

```bash
pnpm polagram run
```

Or with a specific config:

```bash
pnpm polagram run --config my-config.yml
```

## Features

- **Glob Support**: Use standard glob patterns to find input files.
- **Directory Mirroring**: Output files preserve their directory structure relative to the project root (or execution directory) to prevent collisions.
- **Strict Validation**: Validates `polagram.yml` against the Core schema to prevent errors.
