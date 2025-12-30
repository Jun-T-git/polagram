# @polagraph/cli

The official CLI for Polagraph, enabling CI/CD integration for sequence diagram transformations.

## Installation

```bash
pnpm add -D @polagraph/cli
```

## Usage

### Configuration

Create a `polagraph.yml` in your project root:

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
pnpm polagraph run
```

Or with a specific config:

```bash
pnpm polagraph run --config my-config.yml
```

## Features

- **Glob Support**: Use standard glob patterns to find input files.
- **Directory Mirroring**: Output files preserve their directory structure relative to the project root (or execution directory) to prevent collisions.
- **Strict Validation**: Validates `polagraph.yml` against the Core schema to prevent errors.
