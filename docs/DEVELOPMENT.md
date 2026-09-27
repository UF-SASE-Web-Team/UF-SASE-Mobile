# Development setup

This project uses an Expo development build so the same native runtime can be
installed on team devices and reused until a native dependency or native app
configuration changes.

## First-time setup

1. Install Git and the current Node.js LTS release.
2. Clone the repository and run `npm ci`.
3. Sign in to the UF SASE Expo organization when EAS access is required.
4. Copy `.env.example` to `.env.local`.
5. Add the shared development Supabase URL and publishable key.
6. Install the appropriate development build from the link supplied by a lead.
7. Run `npm start` and scan the QR code from the development client.

On Windows PowerShell, create the environment file with:

```powershell
Copy-Item .env.example .env.local
```

On macOS, use:

```bash
cp .env.example .env.local
```

The computer and physical device should be on the same Wi-Fi network. On a
restricted network, run `npm run start:tunnel` instead.

## Platform support

- Android development builds work on physical Android devices regardless of
  whether the developer uses macOS or Windows.
- Physical iPhone development builds work with either macOS or Windows after
  the iPhone has been registered in the Apple provisioning profile.
- The iOS Simulator requires macOS and Xcode.
- An Android Emulator requires Android Studio but is optional when using a
  physical device.

## Shared development builds

The lead creates installable builds with:

```bash
npx eas-cli@latest build --platform android --profile development
npx eas-cli@latest build --platform ios --profile development
```

The optional Mac-only simulator build uses:

```bash
npx eas-cli@latest build --platform ios --profile development-simulator
```

Before an iPhone can install the physical-device build, register it with:

```bash
npx eas-cli@latest device:create
```

A new native build is required after adding a native dependency, changing an
Expo config plugin, or changing native app configuration. Normal TypeScript,
layout, styling, and Supabase-query changes only require restarting or
reloading Metro.

## Supabase

The mobile app may only use the project URL and publishable key. Never put a
Supabase secret key or legacy service-role key in client code or any
`EXPO_PUBLIC_` variable.

Developers working on database changes can start the local Supabase stack with
Docker running:

```bash
npm run supabase:start
```

Create database changes as migrations:

```bash
npx supabase migration new <descriptive_name>
```

Rebuild and verify the local database from migrations:

```bash
npm run supabase:reset
```

Stop local services when finished:

```bash
npm run supabase:stop
```

Remote migration deployment should be handled by a lead or CI rather than by
sharing privileged credentials across the team.

## Checks before a pull request

```bash
npm ci
npm run lint
npm run typecheck
npm run doctor
```

Also launch the feature on a physical device or emulator and record which
platform was tested in the pull request.
