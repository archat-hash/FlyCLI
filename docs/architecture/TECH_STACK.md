# FlyCLI Tech Stack

This document defines the strictly controlled technology stack for the FlyCLI project. **No other dependencies may be installed without the Architect's explicit approval.**

## Runtime Dependencies (Production)
These are shipped to the end-user:
- **`commander`**: Command-line interface framework.
- **`serialport`**: Communication with the flight controller over USB/Serial.
- **`@modelcontextprotocol/sdk`**: MCP server capabilities.
- **`fs-extra`**: Advanced file system operations.

## Development & Build Tools (devDependencies)
These are used exclusively for building, testing, and linting. They MUST NOT be placed in `dependencies`.
- **`eslint` / `eslint-config-airbnb-base` / `eslint-plugin-import`**: Static code analysis.
- **`jest` / `@jest/globals`**: Unit testing framework.
- **`@cucumber/cucumber`**: BDD integration testing framework.
- **`dependency-cruiser`**: Architecture and dependency validation.
- **`esbuild`**: Fast JavaScript bundler for creating single-file binaries.
- **`@yao-pkg/pkg`**: Executable packager for Node.js.

## Governance Rule
If a Developer requires a new package to implement a feature, they must **stop development** and return the task to the Architect for revision. Only the Architect can approve and add new dependencies to this list.
