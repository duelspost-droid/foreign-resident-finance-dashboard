"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  generateMockResidents,
  MOCK_TOTAL,
  NATIONALITY_OPTIONS,
  SIDO_OPTIONS,
  type MockResident
} from "@/lib/data/mockResidents";

const PAGE_SIZE = 50;
const inputCls = "rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none";

export default function MockResidentsPage() {
  const [rows, setRows] = useState<MockResident[] | null>(null);
  const [name, setName] = useState("");
  const [nat, setNat] = useState("");
  const [gender, setGender] = useState("");
  const [sido, setSido] = useState("");
  const [page, setPage] = useState(0);

  // 10만 건 합성 데이터는 마운트 후 1회 생성(첫 페인트 블로킹 방지). 실제 개인정보 아님.
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <>
      <section className="page-header">
        <p className="page-kicker">데이터 탐색 · 데모</p>
        <h2 className="page-title">외국인 정보 관리 (가상)</h2>
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
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름 검색"
            className={inputCls}
            aria-label="이름 검색"
          />
          <select value={nat} onChange={(e) => setNat(e.target.value)} className={inputCls} aria-label="국적 필터">
            <option value="">국적 전체</option>
            {NATIONALITY_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputCls} aria-label="성별 필터">
            <option value="">성별 전체</option>
            <option value="남">남</option>
            <option value="여">여</option>
          </select>
          <select value={sido} onChange={(e) => setSido(e.target.value)} className={inputCls} aria-label="지역 필터">
            <option value="">지역 전체</option>
            {SIDO_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-2 px-1 text-xs text-muted">
          {rows ? (
            <>
              조회 결과 <strong className="text-ink">{filtered.length.toLocaleString()}</strong>건 / 전체{" "}
              {MOCK_TOTAL.toLocaleString()}건
            </>
          ) : (
            "합성 데이터 생성 중…"
          )}
        </p>
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
            {!rows ? (
              <tr>
                <td colSpan={10} className="px-3 py-12 text-center text-muted">
                  합성 데이터 생성 중… (10만 건)
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
      {rows && filtered.length > 0 && (
        <div className="mt-3 flex items-center justify-center gap-3 text-sm">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
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
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            다음
          </button>
        </div>
      )}
    </>
  );
}
