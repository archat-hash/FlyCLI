# AI Software Factory Workflow

This document outlines the deterministic, multi-agent software development framework (AI Software Factory). It ensures AI agents produce high-quality, maintainable code by strictly following Software Engineering best practices (TDD, BDD, SOLID) and decoupling responsibilities into distinct agent roles.

## Principles
1. **1 Story = 1 Scenario**: A User Story is exactly one Gherkin Scenario. No more, no less.
2. **Test-First (TDD/BDD)**: No implementation code is written until the interfaces and failing tests (Red state) are defined.
3. **Strict Quality Gates**: Static analysis automatically rejects code that is too complex (Cyclomatic Complexity > 5).

---

## The Workflow Pipeline

### Phase 1: Requirements & Analysis (BA Agent)
- **Actor:** Business Analyst (BA) Agent + Human User
- **Action:** The User defines the business goal. The BA acts as an IT advisor, helping to refine the requirements.
- **Output:** 
  - The goal is broken down into **Epics**.
  - Epics are broken down into **Stories**.
  - *Crucial Rule:* The BA generates ALL necessary use cases. Every single use case is written in Gherkin (Cucumber) format. 1 Story = 1 Gherkin Scenario. If the system has 100 use cases, the BA produces 100 Stories.

### Phase 2: System Design (Architect Agent)
- **Actor:** Architect Agent
- **Action:** Reads the Epics and Stories to design the system structure.
- **Output:** 
  - Architectural diagrams and explanations.
  - Written **Interfaces** (contracts) and data structures.
  - *Note:* The Architect does not write business logic, only the scaffolding and contracts.

### Phase 3: Test Implementation (SDET Agent)
- **Actor:** SDET (Software Development Engineer in Test) Agent
- **Action:** Reads the Gherkin Stories and the Architect's Interfaces.
- **Output:**
  - Implements the BDD **Step Definitions** (the "glue" code) using the Architect's interfaces.
  - *State:* At this point, the test suite runs and **FAILs** (Red State), which is expected and desired because no implementation exists yet.

### Phase 4: Grooming & Negotiation
- **Actor:** Developer Agent, SDET, Architect
- **Action:** A formal grooming session occurs *before* any implementation begins.
- **Verification:** The Developer reviews the interfaces and the failing tests. If a task is underspecified, logically flawed, or impossible to implement cleanly (e.g., forces a SOLID violation), the Developer **rejectється (rejects)** the task and sends it back to the Architect or BA for rework.

### Phase 5: Implementation (Developer Agent)
- **Actor:** Developer Agent
- **Action:** Operates strictly in TDD style. Takes exactly **one** Story (one failing test) at a time.
- **Rules:**
  - Write Clean Code, DRY, SOLID.
  - Use appropriate design patterns (OOP, Functional).
  - Make the test pass (Green State).

### Phase 6: Static Analysis & Refactoring (Reviewer)
- **Actor:** Static Analysis Tools (e.g., ESLint, SonarQube) / Linter Agent
- **Action:** Automatically scans the Developer's code before it can be committed.
- **Rules:**
  - **Cyclomatic Complexity <= 5**: If complexity exceeds 5, the tool immediately rejects the code.
  - The Developer is forced to refactor (e.g., extract methods, apply patterns) until the complexity drops.

### Phase 7: CI/CD & Delivery
- **Actor:** CI/CD Pipeline
- **Action:** Runs the entire test suite. If all BDD tests are green and static analysis passes, a Pull Request is generated or the code is merged.

---
*Status: Draft / Under active refinement.*
