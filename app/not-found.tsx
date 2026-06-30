import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없음",
  robots: { index: false, follow: false }
};

export default function NotFound() {
  return (
    <section className="mx-auto max-w-lg px-4 py-20 text-center">
      <p className="text-6xl font-black text-teal-700">404</p>
      <h1 className="mt-3 text-xl font-bold text-ink">페이지를 찾을 수 없습니다</h1>
      <p className="mt-2 text-sm text-muted">
        주소가 바뀌었거나 삭제된 페이지일 수 있습니다. 대시보드 홈에서 원하는 분석으로 이동하세요.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
      >
        대시보드로 가기
      </Link>
    </section>
  );
}
