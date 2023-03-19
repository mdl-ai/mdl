import * as esbuild from 'esbuild';

let ctx1 = await esbuild.context({
    entryPoints: ["src/chatgpt.ts"],
    bundle: true,
    outdir: "./dist",
    format: "esm",
    sourcemap: !production,
    minify: production,
    platform: "node",
    target: ["ES2021"],
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });


let ctx2 = await esbuild.context({
    entryPoints: ["src/extension.ts"],
    bundle: false,
    outdir: "./dist",
    format: "cjs",
    sourcemap: true,
    minify: false,
    target: ["ES2021"],
    platform: "node",
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

  await ctx1.watch();
  await ctx2.watch();
  console.log("watching for changes...");
