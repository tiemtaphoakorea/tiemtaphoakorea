import { execSync } from "node:child_process";

const run = (command: string) => {
  execSync(command, { stdio: "inherit" });
};

export default async function globalSetup() {
  run("npm run db:reset");
  run("npm run db:seed:e2e");
}
