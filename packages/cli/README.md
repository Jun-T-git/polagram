# @polagram/cli

The official CLI for Polagram, enabling CI/CD integration for sequence diagram transformations.

**Official Website:** [https://polagram.org/](https://polagram.org/)

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
    # format: mermaid        # Optional: auto-detected from file extension/content
    # outputFormat: plantuml # Optional: defaults to input format
    lenses:
      - name: "success"
        suffix: ".success"
        layers:
          # Resolve "Success" alt blocks (Show only the success case)
          - action: resolve
            selector: { kind: "fragment", condition: "Success" }
          
          # Remove infrastructure details (Logger, Metrics)
          - action: remove
            selector: { kind: "participant", name: { pattern: ".*(Logger|Metrics).*" } }
            
          # Focus on specific interactions
          - action: focus
            selector: { kind: "participant", name: { pattern: "Client.*" } }
```

### Running

```bash
pnpm polagram generate
```

Or with a specific config:

```bash
pnpm polagram generate --config my-config.yml
```

## Features

- **Multi-Format Support**: Works with both Mermaid and PlantUML sequence diagrams
- **Auto-Detection**: Automatically detects diagram format from file extension or content
- **Format Conversion**: Convert between Mermaid and PlantUML formats
- **Glob Support**: Use standard glob patterns to find input files
- **Directory Mirroring**: Output files preserve their directory structure relative to the project root
- **Strict Validation**: Validates `polagram.yml` against the Core schema to prevent errors

## Supported Formats

| Format | Extensions | Auto-Detection |
|--------|-----------|----------------|
| Mermaid | `.mmd`, `.mermaid` | `sequenceDiagram` keyword |
| PlantUML | `.puml`, `.plantuml`, `.pu` | `@startuml` keyword |

## Examples

### PlantUML to PlantUML

```yaml
version: 1
targets:
  - input: ["diagrams/**/*.puml"]
    outputDir: "generated"
    lenses:
      - name: "clean"
        layers:
          - action: remove
            selector: { kind: "participant", name: "Logger" }
```

### Cross-Format Conversion (PlantUML to Mermaid)

```yaml
version: 1
targets:
  - input: ["diagrams/**/*.puml"]
    outputDir: "generated"
    outputFormat: mermaid  # Convert to Mermaid format
    lenses:
      - name: "converted"
        layers:
          - action: focus
            selector: { kind: "participant", name: { pattern: "API.*" } }
```
