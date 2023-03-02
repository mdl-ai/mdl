const production = process.argv[2] === "--production";
const watch = process.argv[2] === "--watch";

require("esbuild")
  .build({
    entryPoints: ["src/extension.ts", "src/chatgpt.ts"],
    bundle: true,
    outdir: "./dist",
    external: ["vscode"],
    format: "cjs",
    sourcemap: !production,
    minify: production,
    target: ["ES2021"],
    platform: "node",
    // watch: watch && {
    //   onRebuild(error) {
    //     if (error) { console.error("watch build failed:", error); }
    //     else { console.log("build successful"); }
    //   },
    // },
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
