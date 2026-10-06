# Workflows

One workflow per deployable, each with path filters (HLD D7):

| Workflow | Paths | Status |
| --- | --- | --- |
| `web.yml` | `apps/web/**`, `packages/ui/**`, `packages/shared/**` | active |
| `api.yml` | `apps/api/**`, `packages/shared/**`, `packages/ai-client/**` | active |
| `ai.yml` | `services/ai/**` | active |
| `contract.yml` | `services/ai/**`, `packages/ai-client/**` | M2, when the generated client exists |
| `evals.yml` | prompt / model changes under `services/ai/**` | todo (M4) |

M0 workflows validate pull requests and pushes to `master`. Production deployment jobs are added in M4, after the GCP project, registry, database, and static host are provisioned.
