"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Gauge,
  Inbox,
  KeyRound,
  Lock,
  LogOut,
  MessageSquare,
  RefreshCw,
  Settings,
  Users
} from "lucide-react";
import {
  type FeatureRequestRow,
  type PageViewRow,
  fetchAllFeatureRequests,
  fetchPageViews
} from "@/lib/data/supabaseClient";
import { ADMIN_TOKEN_KEY, adminChangePassword, adminLogin, adminLogout, adminRespond, adminValidate } from "@/lib/data/adminApi";
import { STATUS_ORDER, categoryMeta, statusMeta } from "@/lib/feedback";

const TOKEN_KEY = ADMIN_TOKEN_KEY;
type Tab = "overview" | "requests" | "analytics" | "sessions" | "settings";

function dayKey(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-CA"); // YYYY-MM-DD (local)
  } catch {
    return "—";
  }
}

// ── 관리자 로그인 (비밀번호 → 토큰; 맛집 트래커 방식) ───────────────────────────────
// 비밀번호는 서버(admin 함수)가 PBKDF2로 검증하고 토큰을 발급. 클라이언트는 토큰만 보관.
function LoginCard({ onLogin }: { onLogin: (token: string) => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!pw || busy) return;
    setBusy(true);
    setErr("");
    const { ok, token, error } = await adminLogin(pw);
    setBusy(false);
    if (ok && token) {
      try { localStorage.setItem(TOKEN_KEY, token); } catch { /* ignore */ }
      onLogin(token);
    } else {
      setErr(error || "로그인 실패");
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl text-white" style={{ background: "linear-gradient(135deg,#155BFF,#061A40)" }}>
        <Lock size={22} aria-hidden />
      </span>
      <h2 className="mt-3 text-base font-bold text-slate-900">관리자 로그인</h2>
      <p className="mt-1 text-xs text-slate-500">운영 콘솔 비밀번호를 입력하세요.</p>
      <input
        type="password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400"
        placeholder="비밀번호"
        autoFocus
      />
      {err && <p className="mt-2 text-xs text-rose-600">⚠️ {err}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={busy || !pw}
        className="mt-3 w-full rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
      >
        {busy ? "확인 중…" : "로그인"}
      </button>
    </div>
  );
}

// ── 비밀번호 변경 (설정) ───────────────────────────────────────────────────────────
function ChangePasswordCard({ onChanged }: { onChanged: (token: string) => void }) {
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [next2, setNext2] = useState("");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy || !cur || !next) return;
    if (next.length < 8) { setMsg({ kind: "err", text: "새 비밀번호는 8자 이상이어야 합니다." }); return; }
    if (next !== next2) { setMsg({ kind: "err", text: "새 비밀번호가 일치하지 않습니다." }); return; }
    setBusy(true);
    setMsg(null);
    const { ok, token, error } = await adminChangePassword(cur, next);
    setBusy(false);
    if (ok && token) {
      try { localStorage.setItem(TOKEN_KEY, token); } catch { /* ignore */ }
      setCur(""); setNext(""); setNext2("");
      setMsg({ kind: "ok", text: "비밀번호가 변경됐습니다. 다른 기기 세션은 모두 로그아웃됩니다." });
      onChanged(token);
    } else {
      setMsg({ kind: "err", text: error || "변경 실패" });
    }
  }

  return (
    <div className="surface max-w-md p-5">
      <div className="flex items-center gap-2">
        <KeyRound size={16} className="text-teal-700" aria-hidden />
        <h3 className="surface-title text-sm">비밀번호 변경</h3>
      </div>
      <p className="surface-subtitle mt-0.5">변경 시 모든 기기의 세션이 무효화됩니다(현재 기기는 유지).</p>
      <div className="mt-3 space-y-2">
        <input type="password" value={cur} onChange={(e) => setCur(e.target.value)} placeholder="현재 비밀번호"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400" />
        <input type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="새 비밀번호 (8자 이상)"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400" />
        <input type="password" value={next2} onChange={(e) => setNext2(e.target.value)} placeholder="새 비밀번호 확인"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400" />
        {msg && <p className={`text-xs ${msg.kind === "ok" ? "text-teal-700" : "text-rose-600"}`}>{msg.text}</p>}
        <button type="button" onClick={submit} disabled={busy || !cur || !next || !next2}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">
          {busy ? "변경 중…" : "변경"}
        </button>
      </div>
    </div>
  );
}

// ── 제안 카드(답변 작성) ───────────────────────────────────────────────────────────
function RequestCard({ row, token, onSaved, onAuthExpired }: { row: FeatureRequestRow; token: string; onSaved: (r: FeatureRequestRow) => void; onAuthExpired: () => void }) {
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
    const { ok, authExpired } = await adminRespond(token, row.id, { status, adminResponse: response.trim() || undefined });
    setBusy(false);
    if (ok) {
      setSaved(true);
      onSaved({ ...row, status, admin_response: response.trim() || null, responded_at: new Date().toISOString() });
    } else {
      setFailed(true);
      if (authExpired) onAuthExpired(); // 세션 만료 → 재로그인
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
        placeholder="답변 내용 (제안자가 ‘과거 제안 이력’에서 확인)"
        className="mt-2 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-teal-400"
      />
      <p className="mt-1 text-[10px] text-amber-600">⚠ 이 답변은 ‘과거 제안 이력’에서 누구나 볼 수 있습니다. 비공개 내용은 적지 마세요.</p>
    </div>
  );
}

export default function AdminConsolePage() {
  // 비번 대신 세션 토큰만 보관. 새로고침 시 서버 검증으로 자동 재로그인.
  const [token, setToken] = useState("");
  const [authChecking, setAuthChecking] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [requests, setRequests] = useState<FeatureRequestRow[]>([]);
  const [views, setViews] = useState<PageViewRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // 마운트 시 저장된 토큰 검증 → 유효하면 자동 로그인.
  useEffect(() => {
    let t = "";
    try { t = localStorage.getItem(TOKEN_KEY) || ""; } catch { /* ignore */ }
    if (!t) { setAuthChecking(false); return; }
    void adminValidate(t).then((state) => {
      // valid·unreachable(전송 실패)면 토큰 유지(오프라인/블립에 로그아웃 방지). invalid만 제거.
      if (state === "valid" || state === "unreachable") setToken(t);
      else { try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } }
      setAuthChecking(false);
    });
  }, []);

  async function load() {
    setLoading(true);
    const [r, v] = await Promise.all([fetchAllFeatureRequests(500), fetchPageViews(3000)]);
    setRequests(r ?? []);
    setViews(v ?? []);
    setLoading(false);
  }
  useEffect(() => {
    if (token) void load();
  }, [token]);

  async function logout() {
    const t = token;
    setToken("");
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
    await adminLogout(t);
  }

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

  if (authChecking) {
    return <p className="mt-16 text-center text-sm text-slate-400">🔄 로그인 확인 중…</p>;
  }
  if (!token) return <LoginCard onLogin={(t) => setToken(t)} />;

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
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => void load()} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} aria-hidden /> 새로고침
          </button>
          <button type="button" onClick={() => void logout()} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            <LogOut size={13} aria-hidden /> 로그아웃
          </button>
        </div>
      </section>

      {/* 탭 */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {([
          ["overview", "개요", Gauge],
          ["requests", `제안 관리${reqStats.pending ? ` (${reqStats.pending})` : ""}`, Inbox],
          ["analytics", "접속통계", BarChart3],
          ["sessions", "방문자/세션", Users],
          ["settings", "설정", Settings]
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
                token={token}
                onSaved={(updated) => setRequests((list) => list.map((x) => (x.id === updated.id ? updated : x)))}
                onAuthExpired={() => void logout()}
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
            {analytics.days.every((d) => d.count === 0) && (
              <p className="mb-2 text-xs text-muted">최근 14일 방문 기록이 없습니다.</p>
            )}
            <div className="overflow-x-auto">
              <div className="flex h-40 min-w-[480px] items-end gap-1.5">
                {analytics.days.map((d) => (
                  <div key={d.day} className="flex flex-1 flex-col items-center gap-1" title={`${d.day} · ${d.count}`}>
                    <div className="flex w-full items-end" style={{ height: 130 }}>
                      <div className="w-full rounded-t bg-teal-500" style={{ height: `${Math.round((d.count / maxDay) * 100)}%`, minHeight: d.count ? 3 : 0 }} />
                    </div>
                    <span className="text-[9px] text-slate-400">{d.day.slice(5)}</span>
                  </div>
                ))}
              </div>
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

      {/* ── 설정 ── */}
      {tab === "settings" && (
        <div className="space-y-4">
          <ChangePasswordCard onChanged={(t) => setToken(t)} />
          <div className="surface max-w-md p-5">
            <div className="flex items-center gap-2">
              <LogOut size={16} className="text-slate-500" aria-hidden />
              <h3 className="surface-title text-sm">세션</h3>
            </div>
            <p className="surface-subtitle mt-0.5">세션은 8시간 후 만료됩니다. 공용 PC에서는 사용 후 로그아웃하세요.</p>
            <button type="button" onClick={() => void logout()} className="mt-3 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              로그아웃
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
