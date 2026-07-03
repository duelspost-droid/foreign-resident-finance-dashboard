"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Database, Cpu, Download } from "lucide-react";
import {
  generateMockResidents,
  MOCK_TOTAL,
  NATIONALITY_OPTIONS,
  SIDO_OPTIONS,
  type MockResident
} from "@/lib/data/mockResidents";
import { fetchAllMockResidents, fetchMockResidentsPage } from "@/lib/data/mockResidentsDb";
import { downloadFile, EXPORT_FILENAME, openPrintable, toCsv, toJson } from "@/lib/data/mockResidentsExport";

type ExportFormat = "csv" | "json" | "pdf";

// 내보내기 도구모음(자체 진행상태 관리). collectRows로 현재 필터의 전체 행을 모아 파일로.
function ExportBar({
  total,
  collectRows
}: {
  total: number;
  collectRows: (onProgress?: (done: number, total: number) => void) => Promise<MockResident[] | null>;
}) {
  const [busy, setBusy] = useState<{ fmt: ExportFormat; done: number; total: number } | null>(null);
  const [err, setErr] = useState("");

  async function run(fmt: ExportFormat) {
    if (busy || total === 0) return;
    setErr("");
    setBusy({ fmt, done: 0, total });
    try {
      const rows = await collectRows((done, t) => setBusy({ fmt, done, total: t || total }));
      if (!rows || rows.length === 0) {
        setErr("내보낼 데이터가 없습니다.");
        return;
      }
      if (fmt === "csv") {
        downloadFile(EXPORT_FILENAME("csv", rows.length), toCsv(rows), "text/csv;charset=utf-8");
      } else if (fmt === "json") {
        downloadFile(EXPORT_FILENAME("json", rows.length), toJson(rows), "application/json");
      } else if (!openPrintable(rows)) {
        setErr("팝업이 차단되어 인쇄 창을 열 수 없습니다. 팝업을 허용해 주세요.");
      }
    } catch {
      setErr("내보내기 중 오류가 발생했습니다.");
    } finally {
      setBusy(null);
    }
  }

  const label = (fmt: ExportFormat, text: string) => {
    if (busy?.fmt === fmt) {
      const pct = busy.total ? Math.round((busy.done / busy.total) * 100) : 0;
      return `내보내는 중… ${pct}%`;
    }
    return text;
  };
  const btn =
    "inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-0.5 inline-flex items-center gap-1 text-xs text-muted">
        <Download size={13} aria-hidden /> 내보내기
      </span>
      <button type="button" className={btn} disabled={!!busy || total === 0} onClick={() => run("csv")}>
        {label("csv", "CSV")}
      </button>
      <button type="button" className={btn} disabled={!!busy || total === 0} onClick={() => run("json")}>
        {label("json", "JSON")}
      </button>
      <button type="button" className={btn} disabled={!!busy || total === 0} onClick={() => run("pdf")}>
        {label("pdf", "PDF(인쇄)")}
      </button>
      {err && <span className="text-xs text-rose-700">{err}</span>}
    </div>
  );
}

const PAGE_SIZE = 50;
const inputCls =
  "rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none";

// 값 변경 후 ms 지연 뒤 반영(DB 모드 이름검색이 매 키 입력마다 쿼리하지 않도록).
function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

type ViewProps = {
  dbMode: boolean;
  loading: boolean;
  errored?: boolean;
  total: number;
  pageRows: MockResident[];
  page: number;
  onPage: (updater: (p: number) => number) => void;
  name: string;
  onName: (v: string) => void;
  nat: string;
  onNat: (v: string) => void;
  gender: string;
  onGender: (v: string) => void;
  sido: string;
  onSido: (v: string) => void;
  collectRows: (onProgress?: (done: number, total: number) => void) => Promise<MockResident[] | null>;
};

// 공통 프레젠테이션(배너·필터·표·페이지네이션). 데이터는 DB/클라 컴포넌트가 주입.
function MockResidentsView(props: ViewProps) {
  const { dbMode, loading, errored, total, pageRows, page, onPage } = props;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <section className="page-header">
        <p className="page-kicker">데이터 탐색 · 데모</p>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="page-title">외국인 정보 관리 (가상)</h2>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              dbMode ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-600"
            }`}
            title={dbMode ? "전용 Postgres에서 조회" : "브라우저에서 합성 생성"}
          >
            {dbMode ? <Database size={12} aria-hidden /> : <Cpu size={12} aria-hidden />}
            {dbMode ? "DB 연동" : "로컬 생성"}
          </span>
        </div>
        <p className="page-description">
          합성(가상) 개인정보 {MOCK_TOTAL.toLocaleString()}건을 조회하는 데모 화면입니다.
        </p>
      </section>

      {/* 경고 배너 */}
      <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
        <AlertTriangle aria-hidden size={18} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-bold">전부 가상(합성) 데이터입니다 — 실제 개인정보가 아닙니다.</p>
          <p className="mt-0.5 text-xs text-rose-800">
            이름·국적·지역은 임의 조합이며, 주민등록번호·외국인등록번호는 <strong>뒷자리 마스킹된 합성 포맷</strong>(실제
            유효번호 아님)으로만 표시됩니다. 이 대시보드의 실제 데이터는 <strong>집계 통계</strong>만 사용합니다(개인 단위 정보 미보유).
          </p>
        </div>
      </div>

      {/* 필터 */}
      <section className="surface mt-4 p-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <input
            value={props.name}
            onChange={(e) => props.onName(e.target.value)}
            placeholder="이름 검색"
            className={inputCls}
            aria-label="이름 검색"
          />
          <select value={props.nat} onChange={(e) => props.onNat(e.target.value)} className={inputCls} aria-label="국적 필터">
            <option value="">국적 전체</option>
            {NATIONALITY_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <select value={props.gender} onChange={(e) => props.onGender(e.target.value)} className={inputCls} aria-label="성별 필터">
            <option value="">성별 전체</option>
            <option value="남">남</option>
            <option value="여">여</option>
          </select>
          <select value={props.sido} onChange={(e) => props.onSido(e.target.value)} className={inputCls} aria-label="지역 필터">
            <option value="">지역 전체</option>
            {SIDO_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-1">
          <p className="text-xs text-muted">
            {errored ? (
              <span className="text-rose-700">
                전용 DB 조회에 실패했습니다. 연결 설정(NEXT_PUBLIC_MOCK_SUPABASE_*)을 확인하세요.
              </span>
            ) : loading && total === 0 ? (
              dbMode ? "불러오는 중…" : "합성 데이터 생성 중…"
            ) : (
              <>
                조회 결과 <strong className="text-ink">{total.toLocaleString()}</strong>건 / 전체{" "}
                {MOCK_TOTAL.toLocaleString()}건
              </>
            )}
          </p>
          <ExportBar total={total} collectRows={props.collectRows} />
        </div>
      </section>

      {/* 테이블 */}
      <section className="surface mt-3 overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-600">
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">이름</th>
              <th className="px-3 py-2">성별</th>
              <th className="px-3 py-2">생년월일</th>
              <th className="px-3 py-2">주민등록번호</th>
              <th className="px-3 py-2">외국인등록번호</th>
              <th className="px-3 py-2">국적</th>
              <th className="px-3 py-2">체류자격</th>
              <th className="px-3 py-2">지역</th>
              <th className="px-3 py-2">등록일</th>
            </tr>
          </thead>
          <tbody>
            {loading && pageRows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-3 py-12 text-center text-muted">
                  {dbMode ? "불러오는 중…" : "합성 데이터 생성 중… (10만 건)"}
                </td>
              </tr>
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-3 py-12 text-center text-muted">
                  조건에 맞는 결과가 없습니다.
                </td>
              </tr>
            ) : (
              pageRows.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-1.5 tabular-nums text-slate-400">{r.id.toLocaleString()}</td>
                  <td className="px-3 py-1.5 font-medium text-ink">{r.name}</td>
                  <td className="px-3 py-1.5">{r.gender}</td>
                  <td className="px-3 py-1.5 tabular-nums text-slate-600">{r.birth}</td>
                  <td className="px-3 py-1.5 tabular-nums text-slate-500">{r.rrn}</td>
                  <td className="px-3 py-1.5 tabular-nums text-slate-500">{r.frn}</td>
                  <td className="px-3 py-1.5">{r.nationality}</td>
                  <td className="px-3 py-1.5">{r.visa}</td>
                  <td className="px-3 py-1.5 text-slate-600">
                    {r.sido} {r.sigungu}
                  </td>
                  <td className="px-3 py-1.5 tabular-nums text-slate-600">{r.registeredAt}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {/* 페이지네이션 */}
      {total > 0 && (
        <div className="mt-3 flex items-center justify-center gap-3 text-sm">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => onPage((p) => Math.max(0, p - 1))}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            이전
          </button>
          <span className="tabular-nums text-muted">
            {(page + 1).toLocaleString()} / {totalPages.toLocaleString()} 페이지
          </span>
          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => onPage((p) => Math.min(totalPages - 1, p + 1))}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            다음
          </button>
        </div>
      )}
    </>
  );
}

// ── 클라이언트 생성 모드(전용 DB 미설정 시): 10만 건 브라우저 생성 후 메모리 필터 ──
function ClientMock() {
  const [rows, setRows] = useState<MockResident[] | null>(null);
  const [name, setName] = useState("");
  const [nat, setNat] = useState("");
  const [gender, setGender] = useState("");
  const [sido, setSido] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => setRows(generateMockResidents(MOCK_TOTAL)), 0);
    return () => clearTimeout(id);
  }, []);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = name.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (!q || r.name.toLowerCase().includes(q)) &&
        (!nat || r.nationality === nat) &&
        (!gender || r.gender === gender) &&
        (!sido || r.sido === sido)
    );
  }, [rows, name, nat, gender, sido]);

  useEffect(() => setPage(0), [name, nat, gender, sido]);

  const pageRows = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <MockResidentsView
      dbMode={false}
      loading={rows === null}
      total={filtered.length}
      pageRows={pageRows}
      page={page}
      onPage={setPage}
      name={name}
      onName={setName}
      nat={nat}
      onNat={setNat}
      gender={gender}
      onGender={setGender}
      sido={sido}
      onSido={setSido}
      collectRows={async () => filtered}
    />
  );
}

// ── DB 모드(전용 Postgres 설정 시): 필터·페이지 변경마다 서버 페이지네이션 조회 ──
function DbMock() {
  const [name, setName] = useState("");
  const debouncedName = useDebounced(name, 250);
  const [nat, setNat] = useState("");
  const [gender, setGender] = useState("");
  const [sido, setSido] = useState("");
  const [page, setPage] = useState(0);
  const [pageRows, setPageRows] = useState<MockResident[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);

  // 필터가 바뀌면 첫 페이지로.
  useEffect(() => setPage(0), [debouncedName, nat, gender, sido]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchMockResidentsPage({ page, pageSize: PAGE_SIZE, name: debouncedName, nationality: nat, gender, sido })
      .then((res) => {
        if (cancelled) return;
        if (!res) {
          setErrored(true);
          setPageRows([]);
          setTotal(0);
        } else {
          setErrored(false);
          setPageRows(res.rows);
          setTotal(res.total);
        }
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setErrored(true);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, debouncedName, nat, gender, sido]);

  return (
    <MockResidentsView
      dbMode
      loading={loading}
      errored={errored}
      total={total}
      pageRows={pageRows}
      page={page}
      onPage={setPage}
      name={name}
      onName={setName}
      nat={nat}
      onNat={setNat}
      gender={gender}
      onGender={setGender}
      sido={sido}
      onSido={setSido}
      collectRows={(onProgress) =>
        fetchAllMockResidents({ name: debouncedName, nationality: nat, gender, sido, onProgress })
      }
    />
  );
}

export default function MockResidentsPage() {
  // 마운트 시 mock_residents 테이블을 프로브 → 데이터가 있으면 DB 모드, 없거나(테이블
  // 부재) 오류면 클라이언트 생성 모드. 테이블 준비 여부와 무관하게 항상 동작(배포 무영향).
  const [mode, setMode] = useState<"probe" | "db" | "client">("probe");

  useEffect(() => {
    let cancelled = false;
    fetchMockResidentsPage({ page: 0, pageSize: 1 })
      .then((res) => {
        if (!cancelled) setMode(res && res.total > 0 ? "db" : "client");
      })
      .catch(() => {
        if (!cancelled) setMode("client");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (mode === "probe") {
    return (
      <MockResidentsView
        dbMode
        loading
        total={0}
        pageRows={[]}
        page={0}
        onPage={() => {}}
        name=""
        onName={() => {}}
        nat=""
        onNat={() => {}}
        gender=""
        onGender={() => {}}
        sido=""
        onSido={() => {}}
        collectRows={async () => []}
      />
    );
  }
  return mode === "db" ? <DbMock /> : <ClientMock />;
}
