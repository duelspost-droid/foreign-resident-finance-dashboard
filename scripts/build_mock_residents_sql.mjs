// 가상 외국인 정보(mock_residents) Postgres 시드 SQL 생성기.
//
// 단일 출처(single source of truth)로 lib/data/mockResidents.ts 의 생성기를 그대로
// import 한다(node v24 타입 스트리핑). 따라서 DB에 적재되는 행은 조회 화면(UI)이
// 보여주는 값과 100% 동일하다.
//
// 사용:
//   node scripts/build_mock_residents_sql.mjs                 # 10만 건 → db/mock_residents/seed.sql
//   node scripts/build_mock_residents_sql.mjs --count 5000    # 건수 지정
//   node scripts/build_mock_residents_sql.mjs --stdout        # 파일 대신 표준출력
//
// 출력은 psql COPY(text) 포맷. 적재:
//   psql "$DATABASE_URL" -f db/mock_residents/schema.sql
//   psql "$DATABASE_URL" -f db/mock_residents/seed.sql

import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mockResidentAt, MOCK_TOTAL } from "../lib/data/mockResidents.ts";

const root = process.cwd();
const argv = process.argv.slice(2);

function argValue(flag, fallback) {
  const i = argv.indexOf(flag);
  if (i === -1 || i + 1 >= argv.length) return fallback;
  return argv[i + 1];
}

const count = Math.max(0, Number(argValue("--count", MOCK_TOTAL)) || MOCK_TOTAL);
const toStdout = argv.includes("--stdout");
const outPath = join(root, "db", "mock_residents", "seed.sql");

const COLUMNS = [
  "id",
  "name",
  "gender",
  "birth_date",
  "rrn_masked",
  "frn_masked",
  "nationality",
  "visa",
  "sido",
  "sigungu",
  "registered_at"
];

// COPY(text) 이스케이프: 백슬래시·탭·개행·캐리지리턴만 처리(그 외 UTF-8은 그대로, '●' 포함).
function copyEscape(value) {
  const s = String(value);
  if (!/[\\\t\n\r]/.test(s)) return s;
  return s.replace(/\\/g, "\\\\").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r");
}

function rowToTsv(r) {
  return [
    r.id,
    r.name,
    r.gender,
    r.birth, // YYYY-MM-DD → DATE
    r.rrn,
    r.frn,
    r.nationality,
    r.visa,
    r.sido,
    r.sigungu,
    r.registeredAt // YYYY-MM-DD → DATE
  ]
    .map(copyEscape)
    .join("\t");
}

async function writeAll(sink) {
  const header =
    "-- 가상(합성) 데이터 — 실제 개인정보 아님. 생성: scripts/build_mock_residents_sql.mjs\n" +
    "-- 재실행 멱등: 기존 데이터 TRUNCATE 후 재적재.\n" +
    "BEGIN;\n" +
    "TRUNCATE mock_residents;\n" +
    `COPY mock_residents (${COLUMNS.join(", ")}) FROM stdin;\n`;

  await write(sink, header);

  const CHUNK = 2000;
  let buf = "";
  for (let i = 0; i < count; i += 1) {
    buf += rowToTsv(mockResidentAt(i)) + "\n";
    if (i % CHUNK === CHUNK - 1) {
      await write(sink, buf);
      buf = "";
    }
  }
  if (buf) await write(sink, buf);

  await write(sink, "\\.\n" + "COMMIT;\n");
}

function write(sink, text) {
  if (sink === process.stdout) {
    return new Promise((resolve) => process.stdout.write(text, resolve));
  }
  return new Promise((resolve, reject) => {
    sink.write(text, (err) => (err ? reject(err) : resolve()));
  });
}

async function main() {
  if (toStdout) {
    await writeAll(process.stdout);
    return;
  }
  await mkdir(dirname(outPath), { recursive: true });
  const sink = createWriteStream(outPath, { encoding: "utf8" });
  await writeAll(sink);
  await new Promise((resolve, reject) => sink.end((err) => (err ? reject(err) : resolve())));
  console.log(JSON.stringify({ ok: true, rows: count, out: `db/mock_residents/seed.sql` }, null, 2));
}

// 직접 실행 시에만 동작(테스트 import 안전).
if (import.meta.url === `file://${process.argv[1]}` || fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
