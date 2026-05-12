import { execSync } from "node:child_process";

const run = (command: string) => {
  execSync(command, { stdio: "inherit" });
};

export default async function globalSetup() {
  run("pnpm exec tsx packages/database/scripts/run-migrate.ts");
  run("pnpm run db:reset");
  run("pnpm run db:seed:e2e");
}
