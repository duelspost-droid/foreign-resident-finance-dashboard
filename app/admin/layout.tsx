import type { Metadata } from "next";

// 관리자(/admin·/admin/console)는 검색 색인 대상이 아니다.
export const metadata: Metadata = {
  title: "운영",
  robots: { index: false, follow: false }
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
