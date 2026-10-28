# Measure CPU savings and audit deployment storage safely

Measure comparable requests before and after deployment. Code optimizations reduce future consumption; they do not refund CPU hours or transfer already accumulated in the billing period. Removing local assets does not remove retained deployments.

## Quick path

1. In Vercel Usage, select the exact team, Koru project, environment and billing period shown in the warning. Confirm whether any other project contributes to the team total.
2. In Observability → Functions, record CPU time and invocations by route for a representative window. Save the deployed commit and the date range alongside the export.
3. After an explicitly authorized deployment, compare the same routes, environment and equivalent traffic windows. Check errors and access behavior as well as resource usage.
4. Separately inspect Deployment Storage and deployment retention. Inventory before deciding what to remove; no deletion or retention change is part of this implementation.

## Comparison worksheet

| Field | Before | After |
| --- | --- | --- |
| Deployed commit and environment | | |
| Window and timezone | | |
| Matched route | | |
| Total function Active CPU (ms) | | |
| Function invocations | | |
| CPU / invocation (ms) | | |
| Error rate | | |
| CDN cache hits / misses | | |
| Origin transfer (bytes) | | |
| Function duration and provisioned memory | | |

CPU per invocation = route CPU milliseconds / invocations for that same route and window. CDN requests are not function invocations. Database and network waiting affect duration and memory, but are not themselves Active CPU. Background work still consumes CPU when it executes.

Interpretation:
- Lower invocations per calendar interaction indicates request amplification was removed.
- Lower CPU per invocation indicates less repeated rendering or transformation.
- More CDN hits and fewer public function invocations indicate public output caching is effective.
- Lower total CPU alone is inconclusive if traffic dropped or errors increased.
- Bot traffic, generated deployment URLs and preview environments must be examined before attributing all usage to production users.

## Deployment storage checklist

- Identify which deployments and environments own the stored bytes.
- Verify that the deployed version includes the local asset cleanup; do not infer this from the worktree alone.
- Retain the current production deployment and an intentional rollback target.
- Check preview links, custom aliases and rollback requirements before proposing deletion.
- Review the existing retention policy and plan-specific options in Vercel; do not assume a particular policy is enabled.
- Ask the owner to approve the exact deletion or retention change separately.
- Recheck storage after an approved operation; do not promise one deployment's bytes are multiplied identically across retained versions.

## Local validation and limits

Use the focused `fluid-*.test.mjs` integration tests for cache, navigation, identity and pagination behavior, followed by domain checks, TypeScript and the relevant integration suite. Do not run database-writing integration tests against a shared database or load production credentials for local checks. Build-time public CMS reads can require a configured database; report an unavailable build honestly rather than filling production data with test records.

Initial baseline on commit `1d1a79000285e0c85aa61ca76f3a6116e4ae88c7`: 522 integration tests, 518 passed, 3 failed, 1 skipped. Two failures in `family-financial.test.mjs` require database credentials (`SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string`). The existing S6 assertion in `inventory-purchase-total.test.mjs` expects an older `PsychopedagogyEntry` model. These are pre-existing failures, not evidence that CPU optimizations pass or fail.

Production CPU attribution, actual savings, retained deployment sizes and browser validation require their respective production metrics or an authorized isolated environment. They must not be inferred from source tests.

## References

- [Fluid compute accounting](https://vercel.com/docs/functions/usage-and-pricing)
- [Active CPU diagnosis](https://vercel.com/kb/guide/optimize-active-cpu-on-fluid-compute)
- [Observability](https://vercel.com/docs/observability/insights)
- [Deployment retention](https://vercel.com/docs/deployment-retention)
