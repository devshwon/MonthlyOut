import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: { "@": path.resolve(import.meta.dirname, "./src") },
	},
	test: {
		environment: "node",
		// node에는 localStorage가 없다 — 저장소를 쓰는 테스트가 죽지 않게 하나 심는다.
		setupFiles: ["./src/test/setup.ts"],
	},
});
