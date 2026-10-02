# UF SASE Mobile Set Up Guide

The official UF SASE mobile application, built with React Native, Expo Router,
Expo development builds, and Supabase.

Use this guide the first time you set up the project on a Mac or Windows
computer. Physical-device testing instructions will be added after the shared
development builds are ready.

---

## 1. Get Project Access

* Ask a project lead for access to the `UF-SASE-Web-Team` GitHub organization
  and the `UF-SASE-Mobile` repository.
* Ask to be added to the `uf-sase` Expo organization.
* Ask a project lead for the development Supabase URL and publishable key.
* Accept all invitations before continuing.
* Do not ask for or share Apple credentials, signing files, Supabase secret or
  service-role keys, database passwords, or personal access tokens.

---

## 2. Install Required Software

* Git: required to clone the repository and work with branches.
* Node.js: install the current Long-Term Support (LTS) release. npm is included
  with Node.js.
* VS Code: recommended editor, although another code editor is acceptable.
* Xcode: required only on macOS for the iOS Simulator.
* Android Studio and JDK 17: required on macOS or Windows for the Android
  Emulator.
* Docker Desktop: only required if you are assigned local Supabase or database
  work.

Open a new terminal and verify the installations:

```bash
git --version
node --version
npm --version
```

If a command is not recognized, finish the installation and restart the
terminal before continuing. Use the Node.js LTS release rather than an
experimental or Current release.

---

## 3. Clone the Repository

```bash
git clone https://github.com/UF-SASE-Web-Team/UF-SASE-Mobile.git
cd UF-SASE-Mobile
npm ci
```

`npm ci` installs the exact dependency versions from `package-lock.json`. Run
it after the first clone and again when a pull changes `package.json` or
`package-lock.json`; it is not required every time you edit the app.

If GitHub returns a permission error, confirm that you accepted the
organization or repository invitation and ask a project lead to verify your
access.

---

## 4. Create the Local Environment File

`.env.local` is intentionally excluded from Git, so every developer creates a
local copy from `.env.example`.

### macOS or Git Bash

```bash
cp .env.example .env.local
```

### Windows PowerShell

```powershell
Copy-Item .env.example .env.local
```

### Windows Command Prompt

```cmd
copy .env.example .env.local
```

Copying the file only creates the template; it does not fill in the missing
values automatically. Open `.env.local` and replace the placeholders with the
values supplied by a project lead:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=<development Supabase URL>
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<development publishable key>
```

Only the public Supabase project URL and publishable key belong in the mobile
app. Never add a Supabase secret key, service-role key, database password,
signing credential, or personal access token.

Verify that Git is ignoring the local file:

```bash
git check-ignore .env.local
```

The expected output is `.env.local`. Do not commit this file.

---

## 5. Validate the Installation

```bash
npm run lint
npm run typecheck
npm run doctor
```

Resolve unexpected errors before beginning feature work. If a check fails
after pulling new dependency changes, run `npm ci` and try again.

---

## 6. Run and Test the App

An Android virtual device is called an emulator, while an iOS virtual device is
called a simulator. Android emulation is available on macOS and Windows. The
iOS Simulator requires macOS and Xcode and cannot run on Windows.

### Browser on macOS or Windows

Use the web version for a quick check that the project and environment variables
are configured:

```bash
npm run web
```

The browser should open the UF SASE starter screen. Under Supabase
configuration, it should say `Development environment variables are loaded.`
If it still asks you to copy `.env.example`, check the filename and variable
names in `.env.local`, stop the server with `Ctrl+C`, and restart it.

Browser verification confirms that the local project and environment are
configured, but it does not replace native Android or iOS testing.

### iOS Simulator on macOS

1. Install Xcode from the Mac App Store.
2. Open Xcode and go to **Xcode > Settings > Locations**. Select the newest
   available version under **Command Line Tools**.
3. Go to **Xcode > Settings > Components** and install an iOS Simulator runtime.
4. Start an iPhone virtual device. Depending on the Xcode version, open the
   **Simulator** app or **Device Hub**. Expo can also open one automatically.
5. From the project directory, build and install the development app:

```bash
npm run ios
```

The first build can take several minutes. It generates the ignored `ios/`
directory, compiles the native app, installs it in the simulator, and starts
the Expo development server. An Apple Developer Program membership and device
registration are not required for the iOS Simulator.

See Expo's [iOS Simulator guide](https://docs.expo.dev/workflow/ios-simulator/)
for installation troubleshooting.

### Android Emulator on macOS

1. Install JDK 17 and Android Studio.
2. Complete Android Studio's **Standard** setup.
3. Open **Settings > Languages & Frameworks > Android SDK** and install:
   * Android SDK Platform 36.
   * Android SDK Build-Tools.
   * Android Emulator.
   * Android SDK Platform-Tools.
4. Find the Android SDK location. The normal macOS location is
   `$HOME/Library/Android/sdk`.
5. Add the following lines to `~/.zshrc`:

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

6. Restart the terminal, or reload the file with `source ~/.zshrc`.
7. Verify that Java is available and reports JDK 17:

```bash
java --version
```

8. In Android Studio, open **Device Manager**, create a Pixel virtual device
   using an API 36 system image, and press its play button.
9. From the project directory, build and install the development app:

```bash
npm run android
```

### Android Emulator on Windows

1. Install JDK 17 and Android Studio. Include **Android Virtual Device** during
   installation and complete the **Standard** setup.
2. Open **Settings > Languages & Frameworks > Android SDK** and install:
   * Android SDK Platform 36.
   * Android SDK Build-Tools.
   * Android Emulator.
   * Android SDK Platform-Tools.
3. Copy the **Android SDK Location** shown in Android Studio. The normal Windows
   location is `%LOCALAPPDATA%\Android\Sdk`.
4. Open **Edit environment variables for your account** in Windows settings.
   Create an `ANDROID_HOME` user variable with the SDK location as its value.
5. Add `%ANDROID_HOME%\emulator` and `%ANDROID_HOME%\platform-tools` to the
   user `Path` variable, then open a new terminal.
6. Run `java --version` in the new terminal and confirm that it reports JDK 17.
   If Java is not recognized, create a `JAVA_HOME` user variable pointing to
   the JDK 17 installation directory and add `%JAVA_HOME%\bin` to `Path`.
7. In Android Studio, open **Device Manager**, create a Pixel virtual device
   using an API 36 system image, and press its play button.
8. From the project directory, build and install the development app:

```bash
npm run android
```

See Expo's
[Android Studio Emulator guide](https://docs.expo.dev/workflow/android-studio-emulator/)
for JDK, SDK, environment-variable, and virtualization troubleshooting.

Windows developers cannot run the iOS Simulator because Xcode is only
available on macOS. They can still develop and test with the Android Emulator
and browser until the team's physical-iPhone development build is available.

### Everyday Emulator Workflow

After `npm run ios` or `npm run android` has successfully installed the
development app once, start the simulator or emulator.

For the iOS Simulator on macOS, run:

```bash
npm run start:ios
```

Then press `i` in the Expo terminal. This command uses the Mac's IPv6 loopback
address so the simulator connects directly to the local development server.

For the Android Emulator on macOS or Windows, run:

```bash
npm start
```

Then press `a` in the Expo terminal. Saved JavaScript and TypeScript changes
should refresh automatically.

If local network routing prevents a development build from reaching the
server, stop Metro with `Ctrl+C` and use the tunnel fallback:

```bash
npm run start:tunnel
```

Tunnel mode requires an internet connection and may start more slowly than a
local connection.

Run `npm run ios` or `npm run android` again after adding or updating a library
that contains native code, or after changing native app configuration. If a
pull changes `package.json` or `package-lock.json`, run `npm ci` first.

Physical-device testing uses a separate shared development-build process. Do
not register devices, create signing credentials, or change the bundle or
package identifiers until a project lead provides those instructions.

---

## 7. Start an Assigned Task

Begin each task from an up-to-date `main` branch:

```bash
git switch main
git pull --ff-only
git switch -c feature/<area>-<short-description>
```

Work on the feature branch rather than directly on `main`. Follow
[CONTRIBUTE.md](CONTRIBUTE.md) for commits, rebasing, pushing, pull requests,
and common Git problems.

Before opening or updating a pull request, run:

```bash
npm run lint
npm run typecheck
npm run doctor
```

---

## 8. Project Structure

* `src/app/`: application screens and Expo Router routes.
* `src/lib/`: shared application services, environment handling, and the
  Supabase client.
* `assets/`: images, icons, and other bundled assets.
* `supabase/`: local Supabase configuration and future database migrations.
* `.env.example`: safe environment-variable template.
* `.env.local`: your ignored local development configuration.

---

## Optional: Local Supabase Development

Only follow this section when you are assigned database work. Start Docker
Desktop before running the local Supabase stack.

```bash
npm run db:start
```

Create database changes as migrations:

```bash
npm run db:migration -- <descriptive_name>
```

Rebuild and verify the local database from migrations:

```bash
npm run db:reset
```

Stop the local services when finished:

```bash
npm run db:stop
```

Remote migration deployment should be handled by a project lead or CI. Never
share privileged database credentials with the team.

---

## Common Issues and How to Resolve Them

### 1. `cp` Is Not Recognized on Windows

Use the PowerShell or Command Prompt command from the environment-file section.

### 2. Supabase Is Not Configured

Verify both variable names and values in `.env.local`, then restart the
development server.

### 3. Dependencies Are Missing or Inconsistent

```bash
npm ci
```

### 4. The Android Emulator Is Not Detected

Start the virtual device from Android Studio's Device Manager before running
the app. Then verify that the terminal can see it:

```bash
adb devices
```

If `adb` is not recognized, check `ANDROID_HOME` and `Path`, then open a new
terminal.

### 5. The iOS Simulator Does Not Open

Confirm that Xcode Command Line Tools and an iOS Simulator runtime are installed,
then open the Simulator manually before running `npm run ios` again.

### 6. The Web Preview Appears Stale

```bash
npx expo start --web --clear
```

### 7. GitHub Returns Error 403

The GitHub account currently authenticated in the terminal does not have
repository write access. Ask a project lead to verify the correct account and
permissions.

### 8. Physical-Device Testing Is Unavailable

Continue with browser-based setup verification. Do not create personal signing
credentials or change the iOS bundle identifier or Android package name unless
a project lead directs you to do so.

---

## Useful Commands

```bash
npm run web
npm run ios
npm run android
npm start
npm run start:ios
npm run start:tunnel
npm run lint
npm run typecheck
npm run doctor
```
