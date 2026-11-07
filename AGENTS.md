# Agent Instructions

This guide outlines core conventions and architectural patterns for AI agents working on the UF SASE Mobile codebase.

---

## 1. Quality & Verification Strategy (Inner vs. Outer Loop)

To maintain high development velocity without context pollution, distinguish between active development and final handoff:

### Inner Loop (While Actively Coding)

Do **not** run the entire 20+ test suite on every minor change. Instead:

- **Fast Typecheck**: Run `npm run typecheck` (`tsc --noEmit`) for instant verification of props, types, and imports.
- **Targeted Unit Test**: Run only the specific test file relevant to the component/feature you are touching:
  ```bash
  npm test path/to/changed.test.tsx
  ```
- **Auto-formatting**: Run `npm run fix` to clean up formatting issues incrementally.

### Outer Loop (Final Quality Gate Before Handoff / Commit)

Run the complete suite once before concluding a task or submitting a PR:

```bash
# 1. Run full unit & integration test suite
npm test

# 2. Strict typecheck & linting
npm run typecheck
npm run lint

# 3. Regenerate TypeScript types (if database migrations were touched)
npm run db:types
```

---

## 2. Design Tokens & Styling

Never use hardcoded hex colors (`#FFFFFF`), raw pixels (`padding: 13`), or inline ad-hoc styles. Always consume theme tokens from `@/theme`:

### Tokens Overview

- **Colors**: Access via `useTheme()` or `useThemedStyles(createStyles)`
  - Surfaces: `colors.surface.base.*`, `colors.surface.saseBlue.*`, `colors.surface.accentSubtle.*`, `colors.surface.media.scrim`
  - Content: `colors.content.onBase.*`, `colors.content.onSaseBlue.*`, `colors.surface.onAccentSubtle.*`, `colors.content.onMedia.primary`
  - Borders: `colors.border.base.*`
- **Spacing**: `space['050']` (2px) through `space['1200']` (48px)
- **Radii**: `radius.sm` (8), `radius.md` (12), `radius.lg` (24), `radius.xl` (32), `radius.full` (9999)
- **Borders**: `borderWidth.sm` (1), `borderWidth.lg` (2)
- **Icons**: `iconSize.sm` (16), `iconSize.md` (24), `iconSize.lg` (36)
- **Typography**: Prefer `<Text variant="...">` (`display`, `title`, `bodyStrong`, `body`, `bodySmStrong`, `bodySm`)

### Pattern: Themed Styles

```tsx
import { Text } from '@/components/Text';
import { useThemedStyles } from '@/context/ThemeContext';
import { type Colors, radius, space } from '@/theme';

export function ExampleCard() {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.card}>
      <Text variant="bodyStrong">Card Title</Text>
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface.base.secondary,
      padding: space['400'],
      borderRadius: radius.md,
    },
  });
```

---

## 3. Component Extraction Guidelines

Keep files readable and avoid monolithic screens:

### When to Extract a Component

- **Single Responsibility**: The subview handles a distinct domain concern (e.g. external link validation and launching -> `EventLinksSection`).
- **Reusability**: Shared across screens/tabs (e.g. `ContactCard`, `EventTag`, `HappeningNowCard`).
- **Decoupling Data Shape**: Hiding nested API/GraphQL/database shapes from the screen body (e.g. `EventContactsSection` resolving POCs from `program.program_members`).
- **Heavy Modals / Hardware**: Modals with complex state, camera scanners, or custom inputs (e.g. `EventCheckInModal`, `SixDigitInput`).

### When NOT to Extract

- Do not create single-use 3-line wrapper components that introduce unnecessary indirection.
- Avoid premature abstractions with dozens of conditional props; prefer composable, focused components.

---

## 4. Screen Layout & Performance

- **Routing**: Follow Expo Router conventions in `src/app/` (`(tabs)`, `(auth)`, `events/[id].tsx`).
- **List Virtualization**: **Never use a plain `ScrollView` with nested `.map()` loops for dynamic or growing collections.** Always use `<SectionList>` or `<FlatList>` with `keyExtractor` to ensure virtualization and prevent memory leaks.
- **Header & Filter Composition**: Host banners, filters, and section headers inside `ListHeaderComponent` or `renderSectionHeader` so they scroll naturally with virtualized lists.
- **Safe Area Insets**: Use `<SafeAreaView edges={['top']}>` for screens, and `useSafeAreaInsets()` for floating bottom bars or absolute elements to accommodate notches and home indicators.

---

## 5. Database, Types & Supabase Workflow

- **Local Supabase First**: Develop migrations and test against the local Docker instance (`supabase start`, `npm run db:reset`). Never edit remote staging or production schema directly.
- **Update `seed.sql` with Migrations**: Whenever a migration adds or alters a table, column, constraint, or enum, immediately update `supabase/seed.sql` with corresponding mock data. Running `npm run db:reset` acts as an automated safety check: if an agent wrote invalid SQL, missed a `NOT NULL` default, or created constraint mismatches, `db:reset` immediately catches it.
- **Automated Type Generation**:
  Always regenerate TypeScript types after modifying database schema or RPC functions:
  ```bash
  npm run db:types
  ```
  This runs `supabase gen types typescript --local > src/types/supabase.ts` and formats the output.
- **Domain Types Derivation**:
  Domain types in `src/types/` (e.g. `src/types/events.ts`, `src/types/programs.ts`) must derive directly from generated Supabase types (`Database['public']['Tables'][...]['Row']` or `Database['public']['Enums'][...]`). Do not manually redeclare database column shapes.
- **Services Layer**: Keep raw Supabase client calls and RPC functions in `src/services/` (e.g. `src/services/events.ts`). Screens and components should consume typed service functions.
- **Global State**: Shared, frequently accessed data (auth sessions, theme, live events) belongs in `src/context/` (`AuthContext`, `ThemeContext`, `EventsContext`).
- **Database-Side Aggregation**: Compute metrics, point totals, leaderboards, and semester summaries in PostgreSQL (views or RPCs), not client-side. The database should return compact summaries over the wire rather than dumping raw attendance rows for the client to calculate.

---

## 6. Testing Philosophy

Write resilient, behavior-driven tests using `@testing-library/react-native`:

- **Query by Accessibility**: Prefer `getByRole`, `getByLabelText`, and `getByPlaceholderText`. Avoid asserting on internal React component trees.
- **Do NOT Assert on Brittle Styles or Static Text**: Never assert on exact hex colors, styles, headings, or marketing copy. Tests must focus on core functionality, routing, guards, and accessibility states (e.g. `aria-invalid`, `disabled`). Visual layout and copy are reviewed by the developer and must not cause test churn when refined.
- **Test Core Primitives & Behavior, Not Declarative UI**: Verify primitive functionality, state changes, service calls, and navigation transitions rather than checking if visual text or elements are simply present.
- **Async Renders**: Use `await render(...)` and user interaction events (`const user = userEvent.setup(); await user.press(...)`).
- **No Snapshots**: Do not add snapshot tests; they cause high maintenance churn on trivial UI refinements.
