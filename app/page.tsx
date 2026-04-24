"use client"

import { useEffect, useMemo, useState } from "react"

type OrderStatus = "Pending" | "Accepted" | "InProgress" | "Delivered" | "Cancelled"

type Order = {
  id: string
  pickup: string
  dropoff: string
  details: string
  phone: string
  type: string
  price: number
  time: string
  distance: number
  status: OrderStatus
  partner: string
  createdAt: string
}

declare global {
  interface Window {
    Pi?: any
  }
}

const STORAGE_KEY = "delivery_fast_orders_v1"

const typeInfo: Record<string, { label: string; multiplier: number; time: string }> = {
  standard: {
    label: "Standard",
    multiplier: 1,
    time: "30-60 min"
  },
  express: {
    label: "Express",
    multiplier: 1.35,
    time: "20-40 min"
  },
  urgent: {
    label: "Urgent",
    multiplier: 1.75,
    time: "10-25 min"
  }
}

function createId() {
  return "DF" + Math.floor(1000 + Math.random() * 9000)
}

function statusProgress(status: OrderStatus) {
  if (status === "Pending") return 20
  if (status === "Accepted") return 45
  if (status === "InProgress") return 75
  if (status === "Delivered") return 100
  return 0
}

export default function DeliveryFastApp() {
  const [tab, setTab] = useState<"order" | "orders" | "deliver" | "profile">("order")
  const [orders, setOrders] = useState<Order[]>([])
  const [pickup, setPickup] = useState("")
  const [dropoff, setDropoff] = useState("")
  const [details, setDetails] = useState("")
  const [phone, setPhone] = useState("")
  const [type, setType] = useState("standard")
  const [quote, setQuote] = useState<null | { price: number; time: string; distance: number }>(null)
  const [partnerOnline, setPartnerOnline] = useState(false)
  const [piUser, setPiUser] = useState<string>("")
  const [paymentLoading, setPaymentLoading] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setOrders(JSON.parse(saved))
      } catch {
        setOrders([])
      }
    }

    try {
      if (window.Pi) {
        window.Pi.init({ version: "2.0", sandbox: true })
      }
    } catch {}
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
  }, [orders])

  const stats = useMemo(() => {
    const completed = orders.filter((o) => o.status === "Delivered")
    const active = orders.filter((o) => !["Delivered", "Cancelled"].includes(o.status))
    const earnings = completed.reduce((sum, o) => sum + o.price, 0)

    return {
      total: orders.length,
      completed: completed.length,
      active: active.length,
      earnings
    }
  }, [orders])

  function calculateQuote() {
    if (!pickup || !dropoff || !details) {
      alert("Please enter pickup location, delivery location, and package details.")
      return
    }

    const baseDistance = Math.max(2, Math.min(14, Math.round((pickup.length + dropoff.length) / 7)))
    const price = Math.round((10 + baseDistance * 3) * typeInfo[type].multiplier)

    setQuote({
      price,
      time: typeInfo[type].time,
      distance: baseDistance
    })
  }

  function confirmOrder() {
    if (!quote) {
      alert("Please get a delivery quote first.")
      return
    }

    const newOrder: Order = {
      id: createId(),
      pickup,
      dropoff,
      details,
      phone,
      type,
      price: quote.price,
      time: quote.time,
      distance: quote.distance,
      status: "Pending",
      partner: "Waiting for partner",
      createdAt: new Date().toLocaleString()
    }

    setOrders([newOrder, ...orders])
    setPickup("")
    setDropoff("")
    setDetails("")
    setPhone("")
    setQuote(null)
    setTab("orders")
  }

  function updateOrder(id: string, status: OrderStatus) {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === id
          ? {
              ...order,
              status,
              partner: status === "Pending" ? "Waiting for partner" : "Youssef Benali"
            }
          : order
      )
    )
  }

  function cancelOrder(id: string) {
    updateOrder(id, "Cancelled")
  }

  function reorder(order: Order) {
    setPickup(order.pickup)
    setDropoff(order.dropoff)
    setDetails(order.details)
    setPhone(order.phone)
    setType(order.type)
    setQuote(null)
    setTab("order")
  }

  function navigate(order: Order) {
    const url =
      "https://www.google.com/maps/dir/?api=1&origin=" +
      encodeURIComponent(order.pickup) +
      "&destination=" +
      encodeURIComponent(order.dropoff)

    window.open(url, "_blank")
  }

  async function connectPi() {
    try {
      if (!window.Pi) {
        alert("Open this app inside Pi Browser to connect Pi Sandbox.")
        return
      }

      window.Pi.init({ version: "2.0", sandbox: true })

      const auth = await window.Pi.authenticate(["username"], onIncompletePaymentFound)

      setPiUser(auth?.user?.username || "Pi User")
      alert("Pi user connected successfully.")
    } catch (error) {
      console.error(error)
      alert("Pi authentication was cancelled or failed.")
    }
  }

  async function approvePayment(paymentId: string) {
    const response = await fetch("/api/payments/approve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ paymentId })
    })

    if (!response.ok) {
      const text = await response.text()
      console.error("Payment approval failed:", text)
      throw new Error("Payment approval failed")
    }

    return response.json()
  }

  async function completePayment(paymentId: string, txid: string) {
    const response = await fetch("/api/payments/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ paymentId, txid })
    })

    if (!response.ok) {
      const text = await response.text()
      console.error("Payment completion failed:", text)
      throw new Error("Payment completion failed")
    }

    return response.json()
  }

  async function onIncompletePaymentFound(payment: any) {
    try {
      const paymentId = payment?.identifier
      const txid = payment?.transaction?.txid

      if (paymentId && txid) {
        await completePayment(paymentId, txid)
      }
    } catch (error) {
      console.error("Incomplete payment handling failed:", error)
    }
  }

  async function payTestPi() {
    try {
      setPaymentLoading(true)

      if (!window.Pi) {
        alert("Open this app inside Pi Browser to make a Pi payment.")
        return
      }

      window.Pi.init({ version: "2.0", sandbox: true })

      await window.Pi.authenticate(["username", "payments"], onIncompletePaymentFound)

      await window.Pi.createPayment(
        {
          amount: 0.01,
          memo: "Delivery Fast test payment",
          metadata: {
            type: "test_payment",
            app: "Delivery Fast"
          }
        },
        {
          onReadyForServerApproval: async function (paymentId: string) {
            await approvePayment(paymentId)
          },

          onReadyForServerCompletion: async function (paymentId: string, txid: string) {
            await completePayment(paymentId, txid)
            alert("Payment completed successfully.")
          },

          onCancel: function () {
            alert("Payment cancelled.")
          },

          onError: function (error: any) {
            console.error("Payment error:", error)
            alert("Payment error. Please try again inside Pi Browser.")
          }
        }
      )
    } catch (error) {
      console.error(error)
      alert("Payment failed. Open the app inside Pi Browser and try again.")
    } finally {
      setPaymentLoading(false)
    }
  }

  return (
    <main className="app">
      <header className="header">
        <div className="brand">
          <div className="logo">🚚</div>
          <h1>Delivery Fast</h1>
        </div>
      </header>

      {tab === "order" && (
        <>
          <section className="hero">
            <h2>Fast Local Delivery</h2>
            <p>Quick delivery in your city for food, groceries, documents, packages and more.</p>

            <div className="badges">
              <span className="badge">⏱ 30-60 min</span>
              <span className="badge">⭐ Local Partners</span>
            </div>
          </section>

          <section className="content">
            <div className="card">
              <h3>📦 Place New Order</h3>

              <label className="label">Pickup Location</label>
              <input
                className="input"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                placeholder="Enter pickup address"
              />

              <label className="label">Delivery Location</label>
              <input
                className="input"
                value={dropoff}
                onChange={(e) => setDropoff(e.target.value)}
                placeholder="Enter delivery address"
              />

              <label className="label">Package Details</label>
              <textarea
                className="textarea"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Describe your package"
              />

              <label className="label">Phone Number</label>
              <input
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+212 6 00 00 00 00"
              />

              <label className="label">Delivery Type</label>
              <select className="select" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="standard">Standard - 30-60 min</option>
                <option value="express">Express - 20-40 min</option>
                <option value="urgent">Urgent - 10-25 min</option>
              </select>

              <button className="btn btn-primary" onClick={calculateQuote}>
                Get Delivery Quote
              </button>

              {quote && (
                <div className="quote">
                  <div className="quote-row">
                    <strong>Estimated Price</strong>
                    <span className="price">{quote.price} MAD</span>
                  </div>

                  <div className="quote-row">
                    <span>Estimated Time</span>
                    <strong>{quote.time}</strong>
                  </div>

                  <div className="quote-row">
                    <span>Distance</span>
                    <strong>{quote.distance} km</strong>
                  </div>

                  <button className="btn btn-green" onClick={confirmOrder}>
                    Confirm Order
                  </button>
                </div>
              )}
            </div>

            <h3>What can we deliver?</h3>

            <div className="grid">
              <div className="category">
                <span className="emoji">🍕</span>
                <strong>Food</strong>
                <p className="small">20-40 min</p>
              </div>

              <div className="category">
                <span className="emoji">🛒</span>
                <strong>Groceries</strong>
                <p className="small">30-60 min</p>
              </div>

              <div className="category">
                <span className="emoji">💊</span>
                <strong>Pharmacy</strong>
                <p className="small">15-30 min</p>
              </div>

              <div className="category">
                <span className="emoji">📄</span>
                <strong>Documents</strong>
                <p className="small">20-45 min</p>
              </div>
            </div>
          </section>
        </>
      )}

      {tab === "orders" && (
        <section className="content">
          <div className="card">
            <h3>🕘 My Orders</h3>

            {orders.length === 0 && <div className="empty">No orders yet. Create your first order.</div>}

            {orders.map((order) => (
              <div className="card order" key={order.id}>
                <div className="row">
                  <strong>Order #{order.id}</strong>
                  <span className={"status " + order.status}>{order.status}</span>
                </div>

                <div className="route">
                  <strong>From:</strong> {order.pickup}
                  <br />
                  <strong>To:</strong> {order.dropoff}
                  <br />
                  <strong>Package:</strong> {order.details}
                  <br />
                  <strong>Partner:</strong> {order.partner}
                </div>

                <div className="progress-bg">
                  <div className="progress-fill" style={{ width: statusProgress(order.status) + "%" }} />
                </div>

                <div className="row">
                  <span>{order.time}</span>
                  <strong>{order.price} MAD</strong>
                </div>

                {order.status !== "Delivered" && order.status !== "Cancelled" && (
                  <button className="btn btn-red" onClick={() => cancelOrder(order.id)}>
                    Cancel Order
                  </button>
                )}

                {order.status === "Delivered" && (
                  <button className="btn btn-blue" onClick={() => reorder(order)}>
                    Reorder
                  </button>
                )}

                <button className="btn btn-light" onClick={() => navigate(order)}>
                  Open Route
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "deliver" && (
        <section className="content">
          <div className="card">
            <div className="switch-row">
              <div>
                <h3>🚚 Delivery Partner</h3>
                <p className="small">{partnerOnline ? "Online - accepting orders" : "Offline - not accepting orders"}</p>
              </div>

              <button
                className={partnerOnline ? "switch on" : "switch"}
                onClick={() => setPartnerOnline(!partnerOnline)}
                aria-label="Toggle online"
              >
                <div className="knob" />
              </button>
            </div>
          </div>

          {!partnerOnline && <div className="empty">You are offline. Turn on availability to accept orders.</div>}

          {partnerOnline &&
            orders
              .filter((o) => o.status === "Pending" || o.status === "Accepted" || o.status === "InProgress")
              .map((order) => (
                <div className="card order" key={order.id}>
                  <div className="row">
                    <strong>Order #{order.id}</strong>
                    <span className={"status " + order.status}>{order.status}</span>
                  </div>

                  <div className="route">
                    <strong>From:</strong> {order.pickup}
                    <br />
                    <strong>To:</strong> {order.dropoff}
                    <br />
                    <strong>Package:</strong> {order.details}
                  </div>

                  <div className="row">
                    <span>{order.distance} km</span>
                    <strong>{order.price} MAD</strong>
                  </div>

                  {order.status === "Pending" && (
                    <button className="btn btn-blue" onClick={() => updateOrder(order.id, "Accepted")}>
                      Accept Order
                    </button>
                  )}

                  {order.status === "Accepted" && (
                    <button className="btn btn-primary" onClick={() => updateOrder(order.id, "InProgress")}>
                      Start Delivery
                    </button>
                  )}

                  {order.status === "InProgress" && (
                    <button className="btn btn-green" onClick={() => updateOrder(order.id, "Delivered")}>
                      Complete Delivery
                    </button>
                  )}

                  <button className="btn btn-light" onClick={() => navigate(order)}>
                    Navigate
                  </button>
                </div>
              ))}
        </section>
      )}

      {tab === "profile" && (
        <section className="content">
          <div className="card">
            <div className="profile-head">
              <div className="avatar">👤</div>

              <div>
                <h3 style={{ marginBottom: 6 }}>Youssef Benali</h3>
                <p className="small">Member since Jan 2024</p>
                <span className="badge">⭐ 4.9</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3>Contact Information</h3>
            <p>📞 +212 6 12 34 56 78</p>
            <p>✉️ youssef.benali@email.com</p>
            <p>📍 Casablanca, Morocco</p>
          </div>

          <div className="card">
            <h3>Statistics</h3>

            <div className="stats">
              <div className="stat">
                <strong>{stats.total}</strong>
                <span>Total Orders</span>
              </div>

              <div className="stat">
                <strong>{stats.completed}</strong>
                <span>Delivered</span>
              </div>

              <div className="stat">
                <strong>{stats.active}</strong>
                <span>Active</span>
              </div>

              <div className="stat">
                <strong>{stats.earnings}</strong>
                <span>MAD Earned</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3>Pi Sandbox</h3>
            <p className="small">Connect inside Pi Browser when testing from Pi Developer Sandbox.</p>

            <button className="btn btn-blue" onClick={connectPi}>
              {piUser ? "Connected: " + piUser : "Connect Pi User"}
            </button>

            <button className="btn btn-green" onClick={payTestPi} disabled={paymentLoading}>
              {paymentLoading ? "Processing Payment..." : "Pay 0.01 Test Pi"}
            </button>
          </div>

          <button
            className="btn btn-red"
            onClick={() => {
              if (confirm("Clear local data?")) {
                setOrders([])
                localStorage.removeItem(STORAGE_KEY)
              }
            }}
          >
            Clear Local Data
          </button>
        </section>
      )}

      <nav className="nav">
        <button className={tab === "order" ? "active" : ""} onClick={() => setTab("order")}>
          <span>📦</span>
          Order
        </button>

        <button className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")}>
          <span>🕘</span>
          Orders
        </button>

        <button className={tab === "deliver" ? "active" : ""} onClick={() => setTab("deliver")}>
          <span>🚚</span>
          Deliver
        </button>

        <button className={tab === "profile" ? "active" : ""} onClick={() => setTab("profile")}>
          <span>👤</span>
          Profile
        </button>
      </nav>
    </main>
  )
}
