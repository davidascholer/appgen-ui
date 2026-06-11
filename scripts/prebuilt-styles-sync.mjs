import { spawn } from "node:child_process";
import process from "node:process";

const command =
  process.env.PREBUILT_STYLES_SYNC_COMMAND?.trim() || "npm run build";

console.log(`[prebuilt-styles-sync] running: ${command}`);

const child = spawn(command, {
  shell: true,
  stdio: "inherit",
  cwd: process.cwd(),
  env: process.env,
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
