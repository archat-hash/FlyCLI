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
    }
  ],
  options: {
    tsPreCompilationDeps: false
  }
};
