const esbuild = require("esbuild-wasm");

(async () => {
  try {
    await esbuild.build({
      entryPoints: ["server/_core/index.ts"],
      platform: "node",
      packages: "external",
      bundle: true,
      format: "esm",
      outdir: "dist",
    });

    console.log("SERVER BUILD OK");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
