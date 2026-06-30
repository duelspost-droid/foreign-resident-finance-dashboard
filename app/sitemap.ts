import type { MetadataRoute } from "next";
import { SITE, publicRoutes } from "@/lib/seo";

// 정적 export 호환: 공개 라우트만 색인. 관리자(/admin*)는 제외.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map((route) => ({
    url: `${SITE.url}${route === "/" ? "" : route}`,
    changeFrequency: route === "/" || route === "/financial-insights" ? "daily" : "weekly",
    priority: route === "/" ? 1 : 0.7
  }));
}
