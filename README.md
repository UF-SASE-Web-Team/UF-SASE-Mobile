# UF SASE Mobile

The official UF SASE mobile application, built with React Native, Expo Router,
Expo development builds, and Supabase.

## Requirements

- Node.js LTS
- npm
- An Expo account in the UF SASE organization
- The shared Supabase development configuration
- Docker Desktop only when running Supabase locally

## Local setup

Install dependencies:

```bash
npm ci
```

Create the ignored local environment file:

```bash
cp .env.example .env.local
```

Add the development Supabase URL and publishable key, then start Metro for the
installed development build:

```bash
npm start
```

If the phone and computer cannot communicate over the local network:

```bash
npm run start:tunnel
```

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for development-build
installation, platform-specific setup, validation, and Supabase workflows.

## Validation

Run these checks before opening a pull request:

```bash
npm run lint
npm run typecheck
npm run doctor
```

Never commit `.env.local`, Supabase secret keys, service-role keys, database
passwords, signing credentials, or personal access tokens.
