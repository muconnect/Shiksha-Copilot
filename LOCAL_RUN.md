# Shiksha Copilot Local Run Guide

This guide is for running the repo locally on macOS.

It reflects the current repo structure and the issues discovered during setup:

- the website backend is a Node/Express app
- the website frontend is an Angular app
- the Python API is a separate FastAPI service
- the website backend and the Python API are not wired together out of the box for all AI routes

## Repo layout

- `shiksha-website/shiksha-backend`: Node backend
- `shiksha-website/shiksha-frontend`: Angular frontend
- `shiksha-api/app-service`: FastAPI app
- `shiksha-api/durable-functions`: Azure Durable Functions

## What to run first

For local development, start with:

1. MongoDB
2. Node backend
3. Angular frontend

Treat the FastAPI app as optional until Azure credentials are ready.

## Prerequisites

### Node

The website backend is built for Node `16.20.0`.

Check your version:

```bash
node -v
```

If needed on macOS with Homebrew:

```bash
brew install node@16
export PATH="$(brew --prefix node@16)/bin:$PATH"
node -v
```

### MongoDB

You need either:

- a working MongoDB Atlas connection string, or
- a local MongoDB instance

Local MongoDB on macOS:

```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

## 1. Backend setup

Go to the backend:

```bash
cd /Users/ritu/Documents/GitHub/Shiksha-Copilot/shiksha-website/shiksha-backend
```

Install dependencies:

```bash
npm install
```

Create `.env`:

```bash
cp .env.example .env
```

### Minimum backend `.env`

This is the minimum structure for local startup.

```env
PORT=8000

MONGO_URL=mongodb://127.0.0.1:27017/shiksha_copilot

JWT_SECRET=replace_with_random_value
JWT_SECRET_REMEMBER_ME=replace_with_random_value

E2E_STORAGE_ACCESS_KEY=replace_with_storage_key
E2E_STORAGE_SECRET_KEY=replace_with_storage_secret
E2E_STORAGE_URL=replace_with_storage_host_only
E2E_STORAGE_BUCKET=replace_with_bucket_name

PIN_SECRET_KEY=replace_with_random_value

VARIFORM_BEARER_TOKEN=dummy_token
VARIFORM_SMS_TEMPLATE=dummy_template
VARIFORM_SMS_WELCOME_TEMPLATE=dummy_welcome_template
VARIFORM_SENDER_ID=SHIKSH
VARIFORM_SMS_TYPE=transactional
VARIFORM_SMS_URL=https://dummy.example.com

LLM_API_BASE_URL=http://localhost:9999
LLM_CHECKLIST_URL=http://localhost:9999/checklist
LLM_EMBEDDING_URL=http://localhost:9999/embedding

SIMILARITY_THRESHOLD=0.98
CACHE_USAGE_RATE=0.9
CACHE_QUESTION_PER_TYPE=10
```

### Notes on backend env

- `MONGO_URL` must be valid. If Atlas auth fails, use local Mongo first.
- `E2E_STORAGE_*` are for S3-compatible storage. DigitalOcean Spaces works.
- `E2E_STORAGE_URL` must be host only. Example:
  - correct: `sfo3.digitaloceanspaces.com`
  - wrong: `https://sfo3.digitaloceanspaces.com`
- `VARIFORM_*` can be dummy values for local boot.
- `LLM_*` can be dummy values for local boot, but AI features in the website will fail if used.

### Generate local secrets

Use this for JWT and PIN secrets:

```bash
openssl rand -base64 32
```

Run it three times and use the outputs for:

- `JWT_SECRET`
- `JWT_SECRET_REMEMBER_ME`
- `PIN_SECRET_KEY`

## 2. Start backend

For local debugging, do not use `pm2-runtime` first.

Run directly:

```bash
cd /Users/ritu/Documents/GitHub/Shiksha-Copilot/shiksha-website/shiksha-backend
node app.js
```

Expected output:

```text
App listening on port 8000!
Connected To Database
```

Test it:

```bash
curl http://localhost:8000/
```

Expected response:

```text
Shikshana Backend!
```

### If port 8000 is already in use

Find the process:

```bash
lsof -nP -iTCP:8000 -sTCP:LISTEN
```

Kill it:

```bash
kill -9 <PID>
```

## 3. Frontend setup

Go to the frontend:

```bash
cd /Users/ritu/Documents/GitHub/Shiksha-Copilot/shiksha-website/shiksha-frontend
```

Install dependencies:

```bash
npm install
```

Update these files:

- `src/environments/environment.ts`
- `src/environments/environment.dev.ts`

Use:

```ts
export const environment = {
    production: false,
    apiUrl: 'http://localhost:8000/api',
    CRYPTO_SECRET: 'dev_crypto_secret'
};
```

Important:

- the backend routes are mounted under `/api`
- use `http://localhost:8000/api`
- not `http://localhost:8000`

Start the frontend:

```bash
npm start
```

Open:

- `http://localhost:4200`

## 4. Create a local test user

If OTP/login says `Account does not exist!`, seed a local test user.

Run:

```bash
cd /Users/ritu/Documents/GitHub/Shiksha-Copilot/shiksha-website/shiksha-backend
node scripts/seed-dev-user.js
```

This creates or updates a test user with phone:

```text
9958667744
```

## 5. OTP login flow

The backend has been adjusted for local development so `get-otp`:

- always generates a fresh OTP
- stores it on the user
- returns it in the API response

When the frontend calls:

```text
POST /api/auth/get-otp?type=0
```

the response should contain:

```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "user": "9958667744",
    "otpTriggered": true,
    "otp": "1234"
  }
}
```

Use that `otp` value in the verify step.

## 6. FastAPI setup

The FastAPI service is separate from the website backend.

Go to the app service:

```bash
cd /Users/ritu/Documents/GitHub/Shiksha-Copilot/shiksha-api/app-service
```

Create a virtual environment:

```bash
python3.11 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install poetry
poetry env use .venv/bin/python
poetry install
```

Create `.env`:

```bash
cp .env.example .env
```

### Required FastAPI env

```env
DEBUG=False
APP_NAME="Shiksha Copilot Fast API"
HOST=0.0.0.0
PORT=8001

AZURE_OPENAI_API_KEY=replace_me
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/openai/v1
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT_NAME=your-chat-deployment
AZURE_OPENAI_EMBED_MODEL=your-embedding-deployment
AZURE_PROJECT_ENDPOINT=https://your-project.services.ai.azure.com/api/projects/your-project
BLOB_STORE_CONNECTION_STRING=your_blob_connection_string
LOG_LEVEL=INFO
```

Optional:

```env
AZURE_BING_GROUNDING_CONNECTION_ID=
QDRANT_URL=
QDRANT_API_KEY=
```

### Important FastAPI notes

- use `AZURE_PROJECT_ENDPOINT`, not `BING_API_KEY`
- do not put spaces around `=`
- `BLOB_STORE_CONNECTION_STRING` must be a real Azure Storage connection string
- the FastAPI app can run on `8001` to avoid conflicting with the Node backend on `8000`

Start FastAPI:

```bash
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

Open docs:

- `http://localhost:8001/docs`

## 7. Known limitations

### Website backend AI routes

The website backend expects a separate LLM service via:

- `LLM_API_BASE_URL`
- `LLM_CHECKLIST_URL`
- `LLM_EMBEDDING_URL`

Those routes are not automatically provided by the FastAPI app in this repo.

So:

- website login/basic pages can run locally
- website AI generation routes may fail unless you provide the older LLM service or patch the backend

### SMS

Variform SMS is not required for local boot.

For local development:

- dummy `VARIFORM_*` values are acceptable
- OTP is returned in the API response

## 8. Common problems

### `your_backend_url` appears in frontend requests

Fix the Angular environment files to use:

```ts
apiUrl: 'http://localhost:8000/api'
```

### `POST /auth/get-otp` returns 404

Use:

```text
/api/auth/get-otp
```

not:

```text
/auth/get-otp
```

### Mongo auth failed

- verify username/password in `MONGO_URL`
- URL-encode special characters in the password
- confirm Atlas network access rules
- easiest fallback: use local MongoDB

### Backend starts but login says `Account does not exist!`

Run:

```bash
node scripts/seed-dev-user.js
```

Then retry with phone:

```text
9958667744
```

### `pm2-runtime: command not found`

Either install pm2:

```bash
npm install -g pm2
```

or run directly:

```bash
node app.js
```

## 9. Recommended local workflow

Use 3 terminal tabs:

### Terminal 1

```bash
cd /Users/ritu/Documents/GitHub/Shiksha-Copilot/shiksha-website/shiksha-backend
node app.js
```

### Terminal 2

```bash
cd /Users/ritu/Documents/GitHub/Shiksha-Copilot/shiksha-website/shiksha-frontend
npm start
```

### Terminal 3

```bash
cd /Users/ritu/Documents/GitHub/Shiksha-Copilot/shiksha-api/app-service
source .venv/bin/activate
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

## 10. Security note

Do not commit real secrets to the repo.

If any keys or passwords were exposed during testing, rotate them:

- Azure OpenAI keys
- Azure Blob Storage keys
- MongoDB credentials
- DigitalOcean Spaces keys
- JWT secrets
- PIN secret
