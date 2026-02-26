# NL Search Feature Setup Guide

This guide helps you set up the Natural Language Search feature for ADS/SciX, which converts natural language queries to ADS search syntax using a fine-tuned LLM.

## Prerequisites

- **Node.js** >= 22.21.1 (use [Volta](https://volta.sh/) or nvm)
- **pnpm** package manager
- **Redis** (local install or containerized)
- **Git** access to ADS repos

For model inference:
- A running inference endpoint (see [Deployment Options](#deployment-options))

## Quick Start

### 1. Clone and Install

```bash
cd ~/ads-dev/nectar
git fetch origin
git checkout sj/fine-tune
pnpm install
```

### 2. Configure Environment

```bash
cp .env.local.sample .env.local
```

Edit `.env.local`:
```bash
# API endpoints
API_HOST_CLIENT=https://api.adsabs.harvard.edu/v1
API_HOST_SERVER=https://api.adsabs.harvard.edu/v1

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Enable NL Search feature (global — or use ?nl_search=1 cookie toggle instead)
# NEXT_PUBLIC_NL_SEARCH=enabled

# Model inference endpoint (REQUIRED - set to your deployment)
NL_SEARCH_PIPELINE_ENDPOINT=https://your-endpoint.example.com/v1/chat/completions
# Optional vLLM fallback endpoint
# NL_SEARCH_VLLM_ENDPOINT=https://your-vllm-endpoint.example.com/v1/chat/completions
```

### 3. Start Development Server

```bash
pnpm dev
```

Open http://localhost:8000

## Architecture

```
User Input → NL Search Component → /api/nl-search API Route
                                          ↓
                                   LLM Inference Endpoint
                                   (vLLM, TGI, SageMaker, etc.)
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

## Fine-tuned Model

| Property | Value |
|----------|-------|
| **Model** | `adsabs/scix-nls-translator` |
| **Base** | Qwen3-1.7B |
| **Training data** | 4,600+ NL→query pairs |
| **HuggingFace** | https://huggingface.co/adsabs/scix-nls-translator |

### Training Dataset

The training dataset is available at:
- **HuggingFace**: https://huggingface.co/datasets/adsabs/scix-query-pairs
- **Source**: `nls-finetune-scix/data/datasets/raw/gold_examples.json`

Format:
```json
{"natural_language": "papers about exoplanets", "ads_query": "abs:exoplanet", "category": "topic"}
```

## Deployment Options

The NL search API expects an OpenAI-compatible chat completions endpoint. Choose one:

### Option 1: Google Colab (Quickest — no local GPU needed)

Open [`nls-finetune-scix/scripts/serve_colab.ipynb`](https://github.com/sjarmak/nls-finetune-scix/blob/main/scripts/serve_colab.ipynb) in Google Colab (free T4 GPU). It loads the model and exposes a public URL via ngrok.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/sjarmak/nls-finetune-scix/blob/main/scripts/serve_colab.ipynb)

Set the printed URL in `.env.local`:
```bash
NL_SEARCH_VLLM_ENDPOINT=https://<your-ngrok-id>.ngrok-free.app/v1/chat/completions
```

### Option 2: vLLM (Recommended for production)

```bash
pip install vllm

# Serve the model
vllm serve adsabs/scix-nls-translator \
  --max-model-len 512 \
  --port 8000

# Endpoint: http://localhost:8000/v1/chat/completions
```

### Option 2: Text Generation Inference (TGI)

```bash
docker run --gpus all -p 8080:80 \
  -e MODEL_ID=adsabs/scix-nls-translator \
  ghcr.io/huggingface/text-generation-inference:latest

# Endpoint: http://localhost:8080/v1/chat/completions
```

### Option 3: AWS SageMaker

```python
from sagemaker.huggingface import HuggingFaceModel

hub = {
    'HF_MODEL_ID': 'adsabs/scix-nls-translator',
    'HF_TASK': 'text-generation',
}

model = HuggingFaceModel(
    env=hub,
    role=role,
    transformers_version='4.37',
    pytorch_version='2.1',
    py_version='py310',
)

predictor = model.deploy(
    instance_type='ml.g5.xlarge',
    initial_instance_count=1,
)

# Use the endpoint URL in NL_SEARCH_PIPELINE_ENDPOINT
```

### Option 4: AWS EC2 with vLLM

```bash
# On an EC2 g5.xlarge (or similar GPU instance):
pip install vllm

vllm serve adsabs/scix-nls-translator \
  --max-model-len 512 \
  --host 0.0.0.0 \
  --port 8000

# Configure security group to allow traffic on port 8000
# Endpoint: http://<ec2-public-ip>:8000/v1/chat/completions
```

### Option 5: Local GPU (Development)

```bash
# Requires CUDA GPU with 8GB+ VRAM
pip install vllm

vllm serve adsabs/scix-nls-translator \
  --max-model-len 512 \
  --gpu-memory-utilization 0.8

# Endpoint: http://localhost:8000/v1/chat/completions
```

## Training Your Own Model

If you want to retrain the model with updated data:

### Using Google Colab (Free GPU)

1. Open `nls-finetune-scix/scripts/train_colab.ipynb` in Google Colab
2. Upload your `train.jsonl` file
3. Run all cells
4. Download the merged model or push directly to HuggingFace

### Using AWS/EC2

```bash
# On a GPU instance (g5.xlarge recommended)
git clone https://github.com/sjarmak/nls-finetune-scix.git
cd nls-finetune-scix

pip install torch transformers datasets peft accelerate trl
pip install "unsloth[cu121] @ git+https://github.com/unslothai/unsloth.git"

python scripts/train_standalone.py \
  --output-dir ./output \
  --epochs 3 \
  --push-to-hub adsabs/scix-nls-translator
```

### Training Data Format

The training data (`train.jsonl`) uses chat format:
```json
{"messages": [
  {"role": "system", "content": "Convert natural language to ADS search query. Output JSON: {\"query\": \"...\"}"},
  {"role": "user", "content": "Query: papers about exoplanets\nDate: 2025-01-23"},
  {"role": "assistant", "content": "{\"query\": \"abs:exoplanet\"}"}
]}
```

## Key Files

| File | Description |
|------|-------------|
| `src/components/NLSearch/index.tsx` | React component for NL search input |
| `src/components/NLSearch/useNLSearch.ts` | Hook with search logic and state |
| `src/pages/api/nl-search.ts` | API route that calls inference endpoint |
| `src/lib/field-constraints.ts` | TypeScript field validation |
| `src/pages/api/nl-report-issue.ts` | Issue reporting → GitHub Issues |
| `e2e/tests/nl-search.spec.ts` | Playwright E2E tests |

## Testing

```bash
# Unit tests
pnpm test

# E2E tests (requires dev server and inference endpoint)
pnpm test:e2e

# E2E with visible browser
pnpm test:e2e:headed
```

## Troubleshooting

### NL Search returns errors

1. Check that `NL_SEARCH_PIPELINE_ENDPOINT` is set and reachable:
   ```bash
   curl -X POST $NL_SEARCH_PIPELINE_ENDPOINT \
     -H "Content-Type: application/json" \
     -d '{"model": "adsabs/scix-nls-translator", "messages": [{"role": "user", "content": "test"}]}'
   ```

2. Check the inference endpoint logs for errors

### Model returns malformed queries

The post-processing pipeline should catch most issues. If you see problems:
1. Check `src/lib/field-constraints.ts` for field validation
2. Check the operator post-processing in `src/pages/api/nl-search.ts`
3. Consider retraining with updated gold examples

### Feature flag not working

There are two ways to enable NL Search:

**Option 1: Cookie toggle (recommended for testing/demos)**

Visit any page with `?nl_search=1` appended to the URL. This sets a browser cookie that persists for 1 year. Disable with `?nl_search=0`.

```
https://your-site.com/?nl_search=1   # enable
https://your-site.com/?nl_search=0   # disable
```

**Option 2: Environment variable (global enable)**

Set in `.env.local`:
```bash
NEXT_PUBLIC_NL_SEARCH=enabled
```

Restart the dev server after changing env vars. This enables the feature for all users.

## Reporting Issues

The NL search UI includes a "Report Issue" button that lets users flag bad translations. Reports are filed as GitHub Issues on the training data repo.

### Setup

Add a GitHub token to `.env.local`:
```bash
NL_SEARCH_GITHUB_TOKEN=ghp_your_token_here
```

The token needs **Issues write** permission on the target repo. You can configure the repo via:
```bash
NL_SEARCH_ISSUE_REPO=sjarmak/nls-finetune-scix  # default
```

### How it works

1. User clicks "Report Issue" on any NL search result
2. Fills in what they expected the query to be, selects a category, and optionally adds notes
3. A GitHub Issue is created with the original input, model output, and expected query
4. Issues are labeled `nl-search` and `training-data` for easy filtering

Reported issues can then be used to improve the training dataset for future model versions.

### Viewing reports

All reports are at: https://github.com/sjarmak/nls-finetune-scix/issues?q=label%3Anl-search

## API Reference

### POST /api/nl-search

Request:
```json
{
  "query": "papers about exoplanets by Smith",
  "expand": true,
  "resolveObjects": true
}
```

Response:
```json
{
  "query": "abs:exoplanet author:\"Smith\"",
  "queries": [
    {"query": "abs:exoplanet author:\"Smith\"", "description": "Basic search"},
    {"query": "abs:exoplanet ^author:\"Smith\"", "description": "First author only"}
  ],
  "corrections": [],
  "constraintViolations": []
}
```

## Related Resources

- [HuggingFace Model](https://huggingface.co/adsabs/scix-nls-translator)
- [Training Dataset](https://huggingface.co/datasets/adsabs/scix-query-pairs)
- [ADS Search Syntax](https://ui.adsabs.harvard.edu/help/search/search-syntax)
- [Training Scripts](https://github.com/adsabs/nls-finetune-scix/tree/main/scripts)
