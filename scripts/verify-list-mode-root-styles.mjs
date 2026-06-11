import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const appFile = path.join(process.cwd(), "src", "App.tsx");

const fail = (message) => {
  console.error(`[verify-list-mode-root-styles] ${message}`);
  process.exit(1);
};

const main = async () => {
  const source = await readFile(appFile, "utf8");

  if (!source.includes("const renderAppComponentPreview = (")) {
    fail("renderAppComponentPreview function was not found in src/App.tsx");
  }

  if (!source.includes("const rootClassName = `flex w-full")) {
    fail("rootClassName wrapper definition was not found");
  }

  if (!source.includes("const rootStyle = {")) {
    fail("rootStyle wrapper definition was not found");
  }

  const listBranchUsesRootWrapper =
    /componentApi\.isApitComponent[\s\S]*componentApi\.isList[\s\S]*listItemTemplate[\s\S]*return\s*\(\s*<div className=\{rootClassName\} style=\{rootStyle\}>/.test(
      source,
    );

  if (!listBranchUsesRootWrapper) {
    fail(
      "list-mode branch does not render with rootClassName/rootStyle wrapper",
    );
  }

  console.log(
    "[verify-list-mode-root-styles] list-mode root style regression check passed.",
  );
};

main().catch((error) => {
  fail(error instanceof Error ? error.message : "Unexpected error");
});
