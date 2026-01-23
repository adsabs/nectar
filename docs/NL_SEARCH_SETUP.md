# NL Search Feature Branch Setup Guide

This guide helps you checkout and run the `sj/fine-tune` feature branch which adds Natural Language Search capabilities to the ADS/SciX interface.

## Prerequisites

- **Node.js** >= 22.21.1 (use [Volta](https://volta.sh/) or nvm)
- **pnpm** package manager
- **Docker** or **Podman** for backend services
- **Redis** (local install or containerized)
- **Git** access to ADS repos

## Quick Start

### 1. Clone/Update Repos and Checkout Feature Branch

```bash
cd ~/ads-dev

# For each repo, fetch and checkout the feature branch
for repo in nectar adsabs adsws api_gateway bumblebee BeeHive; do
  echo "=== $repo ==="
  cd ~/ads-dev/$repo
  git fetch origin
  git checkout sj/fine-tune 2>/dev/null || git checkout -b sj/fine-tune origin/sj/fine-tune
  cd ..
done
```

### 2. Install Dependencies

```bash
cd ~/ads-dev/nectar
pnpm install
```

### 3. Configure Environment

```bash
# Copy sample env file
cp ~/ads-dev/nectar/.env.local.sample ~/ads-dev/nectar/.env.local

# Edit as needed - the defaults point to production ADS API
# which works for testing the NL search feature
```

Key environment variables in `.env.local`:
```bash
# API endpoints (defaults to production ADS API)
API_HOST_CLIENT=https://api.adsabs.harvard.edu/v1
API_HOST_SERVER=https://api.adsabs.harvard.edu/v1

# Redis for sessions
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# NL Search feature (enable the feature)
NEXT_PUBLIC_NL_SEARCH=enabled

# Modal endpoints (optional - defaults to shared endpoints)
# Set these if you deploy your own Modal inference endpoints
# NL_SEARCH_PIPELINE_ENDPOINT=https://your-workspace--v1-chat-completions.modal.run
# NL_SEARCH_VLLM_ENDPOINT=https://your-workspace--nls-finetune-serve-vllm-serve.modal.run/v1/chat/completions
```

### 4. Start Services

```bash
# Use the startup script
~/ads-dev/START_DEV.sh

# Or manually:
# Start PostgreSQL
docker start ads_postgres

# Start Redis (if not running locally)
redis-server &

# Start the frontend
cd ~/ads-dev/nectar && pnpm dev
```

### 5. Access the Application

- **Frontend**: http://localhost:8000
- **API Proxy**: http://localhost:5001 (if running adsws)
- **Bootstrap endpoint**: http://localhost:5001/v1/accounts/bootstrap

## Feature: Natural Language Search

The NL Search feature allows users to type natural language queries like:
- "papers about exoplanets published in 2023"
- "articles by John Smith on machine learning"
- "highly cited papers about dark matter"

These get converted to ADS search syntax via a fine-tuned LLM hosted on Modal.

### Architecture

```
User Input → NL Search Component → /api/nl-search API Route
                                          ↓
                                   Modal LLM Endpoint
                                          ↓
                              Post-processing Pipeline:
                              1. Field constraint validation
                              2. Operator post-processing
                              3. Author name validation (ADS autocomplete)
                              4. SIMBAD object resolution
                              5. Synonym expansion
                                          ↓
                              Multiple query suggestions returned
```

### Key Files

| File | Description |
|------|-------------|
| `src/components/NLSearch/index.tsx` | React component for NL search input |
| `src/components/NLSearch/useNLSearch.ts` | Hook with search logic and state |
| `src/pages/api/nl-search.ts` | API route that proxies to Modal endpoint |
| `src/lib/field-constraints.ts` | TypeScript port of field validation |
| `e2e/tests/nl-search.spec.ts` | Playwright E2E tests |

### Feature Flag

The NL search component is controlled by a feature flag. To enable:

```bash
# In .env.local
NEXT_PUBLIC_NL_SEARCH=enabled
```

### Modal Inference Endpoints

The NL search feature requires Modal endpoints for query generation. By default, it uses shared endpoints, but you can deploy your own.

**Default (shared) endpoints** - work out of the box for testing:
- Pipeline: `https://sjarmak--v1-chat-completions.modal.run`
- vLLM fallback: `https://sjarmak--nls-finetune-serve-vllm-serve.modal.run`

**Deploy your own endpoints:**

1. **Clone the finetune repo** (if not already):
   ```bash
   git clone https://github.com/adsabs/nls-finetune-scix.git
   cd nls-finetune-scix
   ```

2. **Install Modal CLI**:
   ```bash
   pip install modal
   modal setup  # Authenticate with Modal
   ```

3. **Deploy the pipeline endpoint** (CPU-only, fast):
   ```bash
   modal deploy packages/finetune/src/finetune/modal/serve_pipeline.py
   ```

4. **Deploy the vLLM endpoint** (GPU, for fallback):
   ```bash
   # Requires a fine-tuned model in Modal volume
   modal deploy packages/finetune/src/finetune/modal/serve_vllm.py
   ```

5. **Update your environment**:
   ```bash
   # In nectar/.env.local
   NL_SEARCH_PIPELINE_ENDPOINT=https://your-workspace--v1-chat-completions.modal.run
   NL_SEARCH_VLLM_ENDPOINT=https://your-workspace--nls-finetune-serve-vllm-serve.modal.run/v1/chat/completions
   ```

### Fine-tuned Model

The vLLM endpoint serves a fine-tuned **Qwen3-1.7B** model trained on ADS query pairs.

**Model location**: Stored in Modal volume `scix-finetune-runs`

**Training data**: `nls-finetune-scix/data/datasets/raw/gold_examples.json` (4000+ curated examples)

**To train your own model**:
```bash
cd nls-finetune-scix
mise run train  # Uses Modal for GPU training
```

See `nls-finetune-scix/DEVELOPMENT.md` for detailed training instructions

### Testing the Feature

```bash
# Run unit tests
cd ~/ads-dev/nectar
pnpm test

# Run E2E tests (requires dev server running)
pnpm test:e2e

# Run E2E tests with browser visible
pnpm test:e2e:headed
```

## Commits on Feature Branch (nectar)

The `sj/fine-tune` branch includes 3 squashed commits:

| Commit | Files | Description |
|--------|-------|-------------|
| `feat: add natural language search component and API` | 7 | Core NL search: React component, API route, post-processing pipeline |
| `feat: add field constraint validation` | 2 | TypeScript port of field validation (doctype, property, bibgroup, etc.) |
| `test: add Playwright E2E tests` | 2 | End-to-end tests for NL search flow and operator queries |

## Troubleshooting

### "Module not found" errors
```bash
cd ~/ads-dev/nectar
rm -rf node_modules
pnpm install
```

### Redis connection errors
```bash
# Check if Redis is running
redis-cli ping  # Should return PONG

# Start Redis if needed
redis-server &
```

### API returns 401/403
The default config uses the production ADS API which requires authentication for some endpoints. For full local development, you may need:
- An ADS API key in your environment
- The adsws backend running locally

### Port already in use
```bash
# Find and kill process on port 8000
lsof -ti:8000 | xargs kill -9
```

## Related Documentation

- `~/ads-dev/AGENTS.md` - Development conventions and CLI tools
- `~/ads-dev/DEBUG_SEARCH.md` - Search functionality debugging guide
- `~/ads-dev/NEXT_SESSION.md` - Infrastructure status and setup details

## Contact

For questions about this feature branch, contact the author or check the commit history for context.
