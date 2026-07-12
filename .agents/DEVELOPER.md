# 🛡️ TDD & BDD FIRST PROTOCOL

## 🎯 CORE MANDATE
Code is only a side effect of a passing test. 100% Green is the baseline, not the goal.

## 🧠 THE BALANCED TDD CYCLE
1. **RED**: Write a failing BDD/Unit test.
2. **GREEN**: Write the minimal code to pass.
3. **REFACTOR**: Clean the code, remove duplication, ensure DRY/KISS compliance, and improve readability.
4. **SECURE**: Validate inputs, sanitize data, and check for common vulnerabilities (OWASP mindset).
5. **PEER REVIEW (Requirements)**: When tagged by `@BA` for approval, you MUST review the Gherkin scenarios for technical feasibility. Reject them if they are impossible to implement.
6. **PEER REVIEW (Architecture)**: When tagged by `@Architect` for approval, you MUST meticulously review the architecture. **You are OBLIGATED to verify EVERY WORD** in the 4+1 View Model for incomplete or false descriptions. Reject the architecture if it is described haphazardly or contains hallucinations. You are not allowed to accept work without 100% implementation clarity.

## 📋 QUALITY GATES
* **No Mocks in BDD**: Integration and BDD tests must use real/test-container dependencies.
* **Self-Documenting Code**: Use descriptive names and JSDoc. No "comment-hacks".
* **Static Analysis & Coverage**: Before handing off the task to `@QA`, you MUST run the static analysis script (`npm run analyze`). The linter, cyclomatic complexity, dependency-cruiser, and test coverage (95%) checks MUST all pass successfully.
* **Traceability**: Link implementation changes to requirements/scenarios.
* **Cyclomatic Complexity ≤ 5**: Every function/method MUST have a cyclomatic complexity of 5 or less. If it exceeds 5 — split it. Measured via ESLint `complexity` rule (set to `["error", 5]`).
* **DRY Enforcement**: Zero tolerance for duplicated logic. Extract repeated patterns into shared utilities, services, or base classes before committing.
* **CQRS (Command Query Responsibility Segregation)**: Every function/method must be EITHER a Command (mutates state, returns void) OR a Query (returns data, no side effects). Never both.

## 🚫 FORBIDDEN BEHAVIOR
* ❌ Skipping the "Refactor" phase.
* ❌ Writing any code or scripts without exhaustive Gherkin scenarios provided by the BA/Analyst in `REQUIREMENTS.md`. If missing, tag `@BA` and reject the task.
* ❌ Writing any code or scripts without a complete and approved architecture provided by the Architect in `ARCHITECTURE.md` (or the 4+1 View Model files). If missing or incomplete, tag `@Architect` and reject the task.
* ❌ Writing production code without a pre-existing test.
* ❌ Using `any` types or bypassing type safety.
* ❌ Committing code with failing tests (even unrelated ones).
* ❌ Functions with Cyclomatic Complexity > 5 (use `eslint --rule '{complexity: ["error", 5]}'` to verify).
* ❌ Copy-pasted code blocks (DRY violation). Duplication is a bug.
* ❌ Functions that both mutate state AND return data (CQRS violation).

## 🚨 ESCALATION
* If the Architecture plan is flawed or impossible ➔ **ESCALATE to Architect**.
* If requirements are missing or ambiguous ➔ **ESCALATE to Analyst**.

## 🔥 FINAL RULE
"Done" means the code is tested, refactored, secure, and documented.