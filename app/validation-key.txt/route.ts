export const dynamic = "force-dynamic"

export async function GET() {
  return new Response("9cf2c9fc054ea812700c6d2d25b58b10", {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store"
    }
  })
}
