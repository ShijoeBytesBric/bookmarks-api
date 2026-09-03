# Bookmarks API

[![CI](https://github.com/ShijoeBytesBric/bookmarks-api/actions/workflows/ci.yml/badge.svg)](https://github.com/ShijoeBytesBric/bookmarks-api/actions/workflows/ci.yml)
[![CD](https://github.com/ShijoeBytesBric/bookmarks-api/actions/workflows/cd.yml/badge.svg)](https://github.com/ShijoeBytesBric/bookmarks-api/actions/workflows/cd.yml)

A small **Fastify + TypeScript** REST API with a full CI/CD pipeline. Every
merge to `main` automatically tests, builds, version-tags, publishes a Docker
image to GitHub Container Registry, and deploys to Kubernetes — all through
GitHub Actions.

No cloud account needed. The pipeline creates its own Kubernetes cluster (Kind)
on GitHub's runners, so everything is self-contained.

---

## How the pipeline works

```
  Push to main
       │
       ├──► CI          Lint → Typecheck → Test → Docker build (no push)
       │
       ├──► Auto-bump   Computes next version (v0.1.0 → v0.1.1 → ...)
       │                   │
       │                   ├──► Publish   Builds vX.Y.Z image → pushes to GHCR
       │                   │
       │                   └──► Release   Creates GitHub Release with notes
       │
       └──► CD          Builds + pushes image → Deploys to Kind cluster
                         (pauses for human approval before deploy)
```

---

## What's in this repo

**Workflows** (`ci.yml`, `cd.yml`, `publish.yml`, `release.yml`, `bump-version.yml`)

- Each workflow runs with only the permissions it needs (least privilege)
- Fast: npm and Docker layer caching across runs
- Deploys require a human to click "Approve" in the GitHub Actions UI
- Every merge auto-increments the version number

**Container image**

- Multi-stage Docker build (small final image, ~150 MB)
- Runs as non-root user for security
- Includes a health check that Kubernetes and Docker both use
- Signed with SLSA provenance and an SBOM (supply chain transparency)

**Kubernetes manifests** (`infra/k8s/`)

- Kustomize overlays (base config + production overrides)
- Rolling deploys with zero downtime
- Health probes, resource limits, and security settings built in

**Testing**

- Unit tests for the repository, schemas, and config
- Integration tests that exercise the full HTTP API
- Coverage thresholds enforced in CI

**API**

- CRUD endpoints for bookmarks
- Interactive docs at `/docs` (Swagger UI, auto-generated from code)

---

## Quick start

```bash
npm ci
npm run dev
curl http://localhost:3000/health
# Open http://localhost:3000/docs for API docs
```

Run everything CI checks:

```bash
npm run lint
npm run format:check
npm run typecheck
npm run test:coverage
npm run build
npm start
```

---

## Push to GitHub and watch it run

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create bookmarks-api --public --source=. --push
```

1. Open the **Actions** tab — CI runs on the first push.
2. Merge more code to `main` — the pipeline auto-tags, builds, and deploys.
3. The `deploy-to-kind` job pauses until you click **Approve** in the Actions UI.

---

## One-time setup (GitHub repo settings)

These can't be committed, so set them up once:

1. **Branch protection** — Settings → Branches → `main` → require a pull request,
   require the `ci` status check to pass.
2. **Production environment** — Settings → Environments → `production` → add
   yourself as a required reviewer. This is the approval gate before every deploy.

---

## Project layout

```
.github/workflows/
  ci.yml                Tests + lint on PRs and main
  cd.yml                Build image → deploy to Kind (approval-gated)
  publish.yml           Build + push versioned image (vX.Y.Z)
  release.yml           Create GitHub Release on version tags
  bump-version.yml      Auto-increment version on every main merge

infra/k8s/
  base/                 Core manifests (deployment, service, configmap)
  overlays/prod/        Production overrides (image, pull secrets)

src/
  server.ts             Entrypoint — config, listen, graceful shutdown
  app.ts                Wires routes and plugins (testable, no listen)
  config.ts             Typed environment variables
  routes/               /health and bookmarks CRUD
  modules/bookmarks/    Zod schemas + repository
  plugins/swagger.ts    OpenAPI docs from route schemas

test/
  unit/                 Repository, schemas, config
  integration/          Full HTTP behavior + spec assertions

Dockerfile              3-stage build, non-root, health check
```

---

## License

MIT — see [LICENSE](LICENSE).
