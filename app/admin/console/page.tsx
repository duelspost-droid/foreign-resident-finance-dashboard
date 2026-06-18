"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Gauge,
  Inbox,
  Lock,
  MessageSquare,
  RefreshCw,
  ShieldAlert,
  Users
} from "lucide-react";
import {
  type FeatureRequestRow,
  type PageViewRow,
  fetchAllFeatureRequests,
  fetchPageViews,
  respondFeatureRequest
} from "@/lib/data/supabaseClient";
import { SUPABASE_PUBLIC_ANON_KEY, SUPABASE_PUBLIC_URL } from "@/lib/data/supabaseConfig";
import { ADMIN_PASSCODE_HASH, sha256Hex } from "@/lib/adminConfig";
import { STATUS_ORDER, categoryMeta, statusMeta } from "@/lib/feedback";

const ENABLED = Boolean(SUPABASE_PUBLIC_URL && SUPABASE_PUBLIC_ANON_KEY);
type Tab = "overview" | "requests" | "analytics" | "sessions";

function dayKey(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-CA"); // YYYY-MM-DD (local)
  } catch {
    return "—";
  }
}

// ── 패스코드 게이트 ────────────────────────────────────────────────────────────────
// 패스코드는 콘솔 메모리에만 보관되어 답변 저장 시 admin-respond 함수로 전송·서버 검증된다.
// 클라이언트 해시가 있으면 즉시 검증(UX), 없으면 통과(쓰기는 서버가 최종 검증).
function PasscodeGate({ onUnlock }: { onUnlock: (passcode: string) => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);

  async function tryUnlock() {
    if (!pw) return;
    setBusy(true);
    setErr(false);
    const pass = ADMIN_PASSCODE_HASH ? (await sha256Hex(pw)) === ADMIN_PASSCODE_HASH : true;
    setBusy(false);
    if (pass) onUnlock(pw);
    else setErr(true);
  }

  return (
    <div className="mx-auto mt-16 max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl text-white" style={{ background: "linear-gradient(135deg,#155BFF,#061A40)" }}>
        <Lock size={22} aria-hidden />
      </span>
      <h2 className="mt-3 text-base font-bold text-slate-900">운영 콘솔</h2>
      <p className="mt-1 text-xs text-slate-500">관리자 패스코드를 입력하세요.</p>
      <input
        type="password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && tryUnlock()}
        className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400"
        placeholder="패스코드"
        autoFocus
      />
      {err && <p className="mt-2 text-xs text-rose-600">패스코드가 올바르지 않습니다.</p>}
      <button
        type="button"
        onClick={tryUnlock}
        disabled={busy || !pw}
        className="mt-3 w-full rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
      >
        {busy ? "확인 중…" : "입장"}
      </button>
    </div>
  );
}

// ── 제안 카드(답변 작성) ───────────────────────────────────────────────────────────
function RequestCard({ row, passcode, onSaved }: { row: FeatureRequestRow; passcode: string; onSaved: (r: FeatureRequestRow) => void }) {
  const [status, setStatus] = useState(row.status);
  const [response, setResponse] = useState(row.admin_response ?? "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [failed, setFailed] = useState(false);
  const s = statusMeta(row.status);
  const c = categoryMeta(row.category);

  async function save() {
    setBusy(true);
    setSaved(false);
    setFailed(false);
    const ok = await respondFeatureRequest(row.id, { status, adminResponse: response.trim() || undefined, passcode });
    setBusy(false);
    if (ok) {
      setSaved(true);
      onSaved({ ...row, status, admin_response: response.trim() || null, responded_at: new Date().toISOString() });
    } else {
      setFailed(true);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${c.tone}`}>{c.label}</span>
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${s.tone}`}>{s.label}</span>
        <h3 className="text-sm font-bold text-slate-900">{row.title}</h3>
        <span className="ml-auto text-[11px] text-slate-400">
          {new Date(row.created_at).toLocaleString("ko-KR")} · {row.page ?? "—"}
        </span>
      </div>
      {row.body && <p className="mt-2 whitespace-pre-wrap text-xs text-slate-600">{row.body}</p>}

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="text-[11px] text-slate-500">
          상태
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="ml-1 rounded-md border border-slate-200 px-2 py-1 text-xs"
          >
            {STATUS_ORDER.map((st) => (
              <option key={st} value={st}>{statusMeta(st).label}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="ml-auto rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
        >
          {busy ? "저장 중…" : "답변 저장"}
        </button>
        {saved && <span className="text-[11px] text-teal-600">저장됨</span>}
        {failed && <span className="text-[11px] text-rose-600">저장 실패 — 패스코드/함수 배포 확인</span>}
      </div>
      <textarea
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        rows={2}
        placeholder="답변 내용 (제안자가 ‘내 제안’에서 확인)"
        className="mt-2 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-teal-400"
      />
    </div>
  );
}

export default function AdminConsolePage() {
  // 패스코드는 메모리에만 보관(새로고침 시 재입력) → 답변 저장 때 함수로 전송·서버 검증.
  const [unlocked, setUnlocked] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  const [requests, setRequests] = useState<FeatureRequestRow[]>([]);
  const [views, setViews] = useState<PageViewRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  async function load() {
    setLoading(true);
    const [r, v] = await Promise.all([fetchAllFeatureRequests(500), fetchPageViews(3000)]);
    setRequests(r ?? []);
    setViews(v ?? []);
    setLoading(false);
  }
  useEffect(() => {
    if (unlocked && ENABLED) void load();
  }, [unlocked]);

  // ── 집계 ──
  const reqStats = useMemo(() => {
    const byStatus: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    for (const r of requests) {
      byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
      byCategory[r.category] = (byCategory[r.category] ?? 0) + 1;
    }
    return { byStatus, byCategory, total: requests.length, pending: (byStatus.received ?? 0) + (byStatus.reviewing ?? 0) };
  }, [requests]);

  const analytics = useMemo(() => {
    const sessions = new Set<string>();
    const byPath: Record<string, number> = {};
    const byDay: Record<string, number> = {};
    for (const v of views) {
      sessions.add(v.session_id);
      byPath[v.path] = (byPath[v.path] ?? 0) + 1;
      byDay[dayKey(v.created_at)] = (byDay[dayKey(v.created_at)] ?? 0) + 1;
    }
    // 최근 14일
    const days: { day: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86_400_000).toLocaleDateString("en-CA");
      days.push({ day: d, count: byDay[d] ?? 0 });
    }
    const topPaths = Object.entries(byPath).map(([path, count]) => ({ path, count })).sort((a, b) => b.count - a.count).slice(0, 12);
    return { totalViews: views.length, sessions: sessions.size, days, topPaths };
  }, [views]);

  const sessionList = useMemo(() => {
    const map = new Map<string, { sessionId: string; count: number; lastAt: string; paths: Set<string> }>();
    for (const v of views) {
      const e = map.get(v.session_id) ?? { sessionId: v.session_id, count: 0, lastAt: v.created_at, paths: new Set<string>() };
      e.count += 1;
      e.paths.add(v.path);
      if (v.created_at > e.lastAt) e.lastAt = v.created_at;
      map.set(v.session_id, e);
    }
    return [...map.values()].sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1)).slice(0, 100);
  }, [views]);

  const filteredRequests = useMemo(
    () => (statusFilter === "all" ? requests : requests.filter((r) => r.status === statusFilter)),
    [requests, statusFilter]
  );

  if (!ENABLED) {
    return (
      <div className="mx-auto mt-16 max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
        <ShieldAlert className="mx-auto text-amber-600" size={28} />
        <h2 className="mt-2 text-base font-bold text-amber-900">Supabase 미연결</h2>
        <p className="mt-1 text-sm text-amber-800">운영 콘솔은 Supabase 연결이 필요합니다. 환경변수를 설정하세요.</p>
      </div>
    );
  }
  if (!unlocked) return <PasscodeGate onUnlock={(pw) => { setPasscode(pw); setUnlocked(true); }} />;

  const maxDay = Math.max(1, ...analytics.days.map((d) => d.count));
  const maxPath = Math.max(1, ...analytics.topPaths.map((p) => p.count));

  return (
    <div className="space-y-5 pb-14">
      <section className="page-header flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="page-kicker">시스템</p>
          <h2 className="page-title">운영 콘솔</h2>
          <p className="page-description">사용자 제안 답변 · 접속통계 · 방문자 세션을 한 곳에서 관리합니다.</p>
        </div>
        <button type="button" onClick={() => void load()} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} aria-hidden /> 새로고침
        </button>
      </section>

      {!ADMIN_PASSCODE_HASH && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
          <ShieldAlert size={14} /> 클라이언트 패스코드 검증 비활성 — 답변 쓰기는 서버(admin-respond 함수)가 검증합니다. UX용 즉시 검증을 원하면 <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_ADMIN_PASSCODE_HASH</code> 설정.
        </div>
      )}

      {/* 탭 */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {([
          ["overview", "개요", Gauge],
          ["requests", `제안 관리${reqStats.pending ? ` (${reqStats.pending})` : ""}`, Inbox],
          ["analytics", "접속통계", BarChart3],
          ["sessions", "방문자/세션", Users]
        ] as const).map(([k, label, Icon]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k as Tab)}
            className={`flex items-center gap-1.5 rounded-t-lg px-3.5 py-2 text-sm font-semibold ${tab === k ? "border-b-2 border-teal-600 text-teal-700" : "text-slate-400 hover:text-slate-600"}`}
          >
            <Icon size={14} aria-hidden /> {label}
          </button>
        ))}
      </div>

      {/* ── 개요 ── */}
      {tab === "overview" && (
        <div className="space-y-5">
          {analytics.totalViews === 0 && reqStats.total === 0 && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-500">
              아직 수집된 접속·제안 데이터가 없습니다 — Supabase 테이블(마이그레이션 004) 적용 후 방문·제안이 기록되면 표시됩니다.
            </div>
          )}
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "총 제안", value: reqStats.total, sub: `미처리 ${reqStats.pending}`, color: "#0f766e" },
              { label: "답변 완료", value: reqStats.byStatus.answered ?? 0, sub: `응답률 ${reqStats.total ? Math.round(((reqStats.byStatus.answered ?? 0) / reqStats.total) * 100) : 0}%`, color: "#3157a4" },
              { label: "누적 접속(뷰)", value: analytics.totalViews, sub: `세션 ${analytics.sessions}`, color: "#b45309" },
              { label: "방문 세션", value: analytics.sessions, sub: "익명 단위", color: "#be123c" }
            ].map((c) => (
              <div key={c.label} className="surface p-4">
                <p className="text-sm text-muted">{c.label}</p>
                <p className="mt-1 text-2xl font-black" style={{ color: c.color }}>{c.value.toLocaleString()}</p>
                <p className="text-[11px] text-muted">{c.sub}</p>
              </div>
            ))}
          </section>
          <section className="grid gap-4 lg:grid-cols-2">
            <div className="surface p-4">
              <h3 className="surface-title mb-3 text-sm">제안 상태별</h3>
              <div className="space-y-2">
                {STATUS_ORDER.map((st) => {
                  const n = reqStats.byStatus[st] ?? 0;
                  const m = statusMeta(st);
                  return (
                    <div key={st} className="flex items-center gap-2 text-xs">
                      <span className="w-16 shrink-0" style={{ color: m.dot }}>{m.label}</span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full" style={{ width: `${Math.round((n / Math.max(1, reqStats.total)) * 100)}%`, background: m.dot }} />
                      </div>
                      <span className="w-8 text-right font-mono text-muted">{n}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="surface p-4">
              <h3 className="surface-title mb-3 text-sm">제안 카테고리별</h3>
              <div className="space-y-2">
                {Object.keys(reqStats.byCategory).length === 0 && <p className="text-xs text-muted">데이터 없음</p>}
                {Object.entries(reqStats.byCategory).map(([cat, n]) => (
                  <div key={cat} className="flex items-center gap-2 text-xs">
                    <span className="w-16 shrink-0 text-slate-600">{categoryMeta(cat).label}</span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-teal-500" style={{ width: `${Math.round((n / Math.max(1, reqStats.total)) * 100)}%` }} />
                    </div>
                    <span className="w-8 text-right font-mono text-muted">{n}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ── 제안 관리 ── */}
      {tab === "requests" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <MessageSquare size={15} className="text-teal-700" />
            <span className="text-sm font-semibold text-ink">제안 {filteredRequests.length}건</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="ml-auto rounded-md border border-slate-200 px-2 py-1 text-xs">
              <option value="all">전체 상태</option>
              {STATUS_ORDER.map((st) => <option key={st} value={st}>{statusMeta(st).label}</option>)}
            </select>
          </div>
          {loading ? (
            <p className="py-10 text-center text-sm text-muted">불러오는 중…</p>
          ) : filteredRequests.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">접수된 제안이 없습니다.</p>
          ) : (
            filteredRequests.map((r) => (
              <RequestCard
                key={`${r.id}:${r.responded_at ?? "new"}`}
                row={r}
                passcode={passcode}
                onSaved={(updated) => setRequests((list) => list.map((x) => (x.id === updated.id ? updated : x)))}
              />
            ))
          )}
        </div>
      )}

      {/* ── 접속통계 ── */}
      {tab === "analytics" && (
        <div className="space-y-5">
          <section className="surface p-4">
            <h3 className="surface-title mb-3 text-sm">일자별 방문 (최근 14일)</h3>
            <div className="flex h-40 items-end gap-1.5">
              {analytics.days.map((d) => (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-1" title={`${d.day} · ${d.count}`}>
                  <div className="flex w-full items-end" style={{ height: 130 }}>
                    <div className="w-full rounded-t bg-teal-500" style={{ height: `${Math.round((d.count / maxDay) * 100)}%`, minHeight: d.count ? 3 : 0 }} />
                  </div>
                  <span className="text-[9px] text-slate-400">{d.day.slice(5)}</span>
                </div>
              ))}
            </div>
          </section>
          <section className="surface p-4">
            <h3 className="surface-title mb-3 text-sm">페이지별 인기 TOP {analytics.topPaths.length}</h3>
            <div className="space-y-1.5">
              {analytics.topPaths.length === 0 && <p className="text-xs text-muted">데이터 없음</p>}
              {analytics.topPaths.map((p) => (
                <div key={p.path} className="flex items-center gap-2 text-xs">
                  <span className="w-40 shrink-0 truncate font-mono text-slate-600">{p.path}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-teal-500" style={{ width: `${Math.round((p.count / maxPath) * 100)}%` }} />
                  </div>
                  <span className="w-10 text-right font-mono text-muted">{p.count}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ── 방문자/세션 ── */}
      {tab === "sessions" && (
        <div className="surface overflow-hidden">
          <div className="surface-header pb-2">
            <div>
              <h3 className="surface-title">방문자 세션 {sessionList.length}</h3>
              <p className="surface-subtitle">익명 세션 단위 활동 (개인식별정보 없음)</p>
            </div>
          </div>
          <div className="table-scroll p-2">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs text-muted">
                  <th className="px-3 py-2">세션</th>
                  <th className="px-3 py-2 text-right">조회수</th>
                  <th className="px-3 py-2 text-right">페이지</th>
                  <th className="px-3 py-2">최근 활동</th>
                </tr>
              </thead>
              <tbody>
                {sessionList.length === 0 && (
                  <tr><td className="px-3 py-6 text-center text-muted" colSpan={4}>방문 기록이 없습니다.</td></tr>
                )}
                {sessionList.map((s) => (
                  <tr key={s.sessionId} className="border-b border-slate-50">
                    <td className="px-3 py-2 font-mono text-xs text-slate-500">{s.sessionId.slice(0, 16)}…</td>
                    <td className="px-3 py-2 text-right font-mono">{s.count}</td>
                    <td className="px-3 py-2 text-right font-mono text-muted">{s.paths.size}</td>
                    <td className="px-3 py-2 text-xs text-muted">{new Date(s.lastAt).toLocaleString("ko-KR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
