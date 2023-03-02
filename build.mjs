import * as esbuild from 'esbuild';
const production = process.argv[2] === "--production";
const watch = process.argv[2] === "--watch";

await esbuild.build({
    entryPoints: ["src/chatgpt.ts"],
    bundle: false,
    outdir: "./dist",
    format: "esm",
    sourcemap: !production,
    minify: production,
    // target: ["ES2020"],
    platform: "node",
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });


await esbuild.build({
    entryPoints: ["src/extension.ts"],
    bundle: true,
    outdir: "./dist",
    external: ["vscode"],
    format: "cjs",
    sourcemap: !production,
    minify: production,
    // target: ["ES2020"],
    platform: "node",
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
