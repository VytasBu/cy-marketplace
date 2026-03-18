import { createSerwistRoute } from "@serwist/turbopack";
import type { NextRequest } from "next/server";

const serwistRoute = createSerwistRoute({
  swSrc: "src/app/sw.ts",
});

export const { dynamic, dynamicParams, revalidate } = serwistRoute;

// Serwist returns { path: string } but Next.js catch-all expects { path: string[] }
// Split the path string into segments for compatibility
export async function generateStaticParams() {
  const params = await serwistRoute.generateStaticParams();
  return params.map((p: { path: string }) => ({
    path: p.path.split("/"),
  }));
}

export const GET = async (
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) => {
  const { path: pathSegments } = await context.params;
  // Rejoin the segments since Serwist internally expects a single string path
  const joinedPath = pathSegments.join("/");
  return serwistRoute.GET(request, {
    params: Promise.resolve({ path: joinedPath }),
  });
};
