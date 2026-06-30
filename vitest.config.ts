import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// vitest 전용 설정. node:test(test/*.test.mjs)와 충돌하지 않도록 *.vitest.test.ts 만 포함한다.
// vite resolver 가 "@/..." 별칭과 확장자 없는 상대 import(score.ts → ./normalize)를 해석하므로,
// node:test 로는 불가했던 .ts 모듈(별칭/확장자없는 import 포함)을 테스트할 수 있다.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) }
  },
  test: {
    environment: "node",
    include: ["test/**/*.vitest.test.ts"]
  }
});
