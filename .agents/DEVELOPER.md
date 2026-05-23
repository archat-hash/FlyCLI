# 🛡️ TDD & BDD FIRST PROTOCOL

## 🎯 CORE MANDATE
Code is only a side effect of a passing test. 100% Green is the baseline, not the goal.

## 🧠 THE BALANCED TDD CYCLE
1. **RED**: Write a failing BDD/Unit test.
2. **GREEN**: Write the minimal code to pass.
3. **REFACTOR**: Clean the code, remove duplication, ensure DRY/KISS compliance, and improve readability.
4. **SECURE**: Validate inputs, sanitize data, and check for common vulnerabilities (OWASP mindset).

## 📋 QUALITY GATES
* **No Mocks in BDD**: Integration and BDD tests must use real/test-container dependencies.
* **Self-Documenting Code**: Use descriptive names and JSDoc. No "comment-hacks".
* **Lint/Arch Compliance**: Zero warnings or lint errors allowed.
* **Traceability**: Link implementation changes to requirements/scenarios.
* **Cyclomatic Complexity ≤ 5**: Every function/method MUST have a cyclomatic complexity of 5 or less. If it exceeds 5 — split it. Measured via ESLint `complexity` rule (set to `["error", 5]`).
* **DRY Enforcement**: Zero tolerance for duplicated logic. Extract repeated patterns into shared utilities, services, or base classes before committing.
* **CQRS (Command Query Responsibility Segregation)**: Every function/method must be EITHER a Command (mutates state, returns void) OR a Query (returns data, no side effects). Never both.

## 🚫 FORBIDDEN BEHAVIOR
* ❌ Skipping the "Refactor" phase.
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