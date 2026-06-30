"use client";

import { useEffect } from "react";

// 라우트 렌더 중 예외를 잡는 에러 바운더리(App Router 규약). 클라이언트 컴포넌트여야 한다.
export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto max-w-lg px-4 py-20 text-center">
      <p className="text-5xl font-black text-rose-600">!</p>
      <h1 className="mt-3 text-xl font-bold text-ink">문제가 발생했습니다</h1>
      <p className="mt-2 text-sm text-muted">
        이 화면을 불러오는 중 오류가 발생했습니다. 다시 시도하거나 대시보드 홈으로 이동하세요.
      </p>
      {error?.digest && <p className="mt-1 text-xs text-slate-400">오류 코드: {error.digest}</p>}
      <div className="mt-6 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
        >
          다시 시도
        </button>
        <a
          href="/"
          className="inline-flex items-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          홈으로
        </a>
      </div>
    </section>
  );
}
