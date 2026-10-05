# infra

```
docker/    Shared Docker assets
gcp/       Cloud Run, Cloud Tasks, Scheduler config; billing kill switch (HLD section 10)
scripts/   Helper scripts (e.g. generate AI client, seed registry)
```

Guardrails to set before first deploy: `min-instances=0`, `max-instances=1`, low budget with
billing kill switch, Artifact Registry cleanup policy, authenticated worker/scheduler endpoints.
