# 4. Development View

The Development View dictates how the codebase is organized and how developers must interact with it.

## 4.1 Repository Structure
```
src/
├── domain/        # Pure logic, no dependencies (Errors, Models)
├── application/   # Use Cases, Business Rules (e.g., FactoryOrchestrator)
├── infrastructure/# I/O, SerialPort, FreeCAD spawn, Storage
└── interfaces/    # CLI entry points, MCP server
docs/
├── architecture/  # 4+1 View Model (You are here)
├── business/      # Gherkin Feature files (Stories)
└── project_management/ # Epics, Milestones
```

## 4.2 Code Quality Gates
- **TDD Requirement**: Code must have 100% test coverage for all Gherkin scenarios.
- **Cyclomatic Complexity**: Max 5 per function (enforced by ESLint).
- **CQRS**: Functions must either Mutate or Return Data, not both.
