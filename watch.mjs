import * as esbuild from 'esbuild';

let ctx1 = await esbuild.context({
    entryPoints: ["src/chatgpt.ts"],
    bundle: false,
    outdir: "./dist",
    format: "esm",
    sourcemap: true,
    minify: false,
    // target: ["ES2020"],
    platform: "node",
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });


let ctx2 = await esbuild.context({
    entryPoints: ["src/extension.ts"],
    bundle: true,
    outdir: "./dist",
    external: ["vscode"],
    format: "cjs",
    sourcemap: true,
    minify: false,
    // target: ["ES2020"],
    platform: "node",
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

  await ctx1.watch();
  await ctx2.watch();
  console.log("watching for changes...");
