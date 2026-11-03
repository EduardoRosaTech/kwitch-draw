export async function GET() {
  return Response.json(
    { app: "kwitch-draw", status: "ok" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
