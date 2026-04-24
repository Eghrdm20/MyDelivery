export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const { paymentId } = await request.json()

    if (!paymentId) {
      return Response.json({ error: "Missing paymentId" }, { status: 400 })
    }

    const apiKey = process.env.PI_API_KEY

    if (!apiKey) {
      return Response.json({ error: "Missing PI_API_KEY" }, { status: 500 })
    }

    const piResponse = await fetch(
      `https://api.minepi.com/v2/payments/${encodeURIComponent(paymentId)}/approve`,
      {
        method: "POST",
        headers: {
          Authorization: `Key ${apiKey}`
        }
      }
    )

    const text = await piResponse.text()
    let data: any = text

    try {
      data = JSON.parse(text)
    } catch {}

    return Response.json(data, { status: piResponse.status })
  } catch (error) {
    return Response.json({ error: "Approval failed" }, { status: 500 })
  }
}
