module.exports = {
  forbidden: [
    {
      name: "no-domain-to-outside",
      severity: "error",
      from: { path: "^src/domain" },
      to: { path: "^src/(application|infrastructure|interfaces)" }
    },
    {
      name: "no-app-to-infra",
      severity: "error",
      from: { path: "^src/application" },
      to: { path: "^src/infrastructure" }
    },
    {
      name: "composition-root-purity",
      comment: "Тільки шар interfaces (Delivery) може поєднувати application та infrastructure для DI.",
      severity: "error",
      from: { path: "^src/(domain|application|infrastructure)" },
      to: { path: "^src/interfaces" }
    }
  ],
  options: {
    tsPreCompilationDeps: false
  }
};
