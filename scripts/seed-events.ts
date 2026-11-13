/// <reference types="node" />

import { main } from './sync-events.ts';

const rawArgs = process.argv.slice(2);
const args = [...rawArgs];
if (!args.includes('--seed') && !args.includes('--sql') && !args.includes('--dry-run')) {
  args.push('--seed');
}

main(args).catch((err) => {
  console.error('Fatal error seeding events:', err);
  process.exit(1);
});
