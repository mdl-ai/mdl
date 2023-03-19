import * as esbuild from 'esbuild';

let ctx1 = await esbuild.context({
    entryPoints: ["src/chatgpt.ts"],
    bundle: true,
    outdir: "./dist",
    format: "esm",
    sourcemap: true,
    minify: false,
    platform: "node",
    target: ["ES2021"],
    external: ["vscode"],
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });


let ctx2 = await esbuild.context({
    entryPoints: ["src/extension.ts"],
    bundle: true,
    outdir: "./dist",
    format: "cjs",
    sourcemap: true,
    minify: false,
    platform: "node",
    target: ["ES2021"],
    external: ["vscode"],
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

  await ctx1.watch();
  await ctx2.watch();
  console.log("watching for changes...");
