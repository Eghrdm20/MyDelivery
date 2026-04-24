"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Star,
  Package,
  Truck,
  Settings,
  HelpCircle,
  LogOut,
  Phone,
  Mail,
  MapPin,
  Wallet,
  ShieldCheck,
} from "lucide-react"
import { useOrders } from "@/hooks/useOrders"

declare global {
  interface Window {
    Pi?: any
  }
}

export default function ProfilePage() {
  const { orders, isLoaded } = useOrders()
  const [piUser, setPiUser] = useState("")
  const [paymentLoading, setPaymentLoading] = useState(false)

  const userStats = useMemo(() => {
    const totalOrders = orders.length

    const completedDeliveries = orders.filter(
      (order) => String(order.status).toLowerCase() === "delivered"
    ).length

    const totalEarnings = orders.reduce((sum, order) => {
      const price = Number(order.price) || 0
      return sum + price
    }, 0)

    const averageRating = 4.8

    return {
      totalOrders,
      completedDeliveries,
      rating: averageRating,
      totalEarnings: `${totalEarnings} MAD`,
      averageOrderValue: totalOrders > 0 ? Math.round(totalEarnings / totalOrders) : 0,
    }
  }, [orders])

  async function approvePayment(paymentId: string) {
    const response = await fetch("/api/payments/approve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentId }),
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
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentId, txid }),
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

  async function connectPi() {
    try {
      if (!window.Pi) {
        alert("Open this app inside Pi Browser to connect your Pi account.")
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
          memo: "Deliveryfast test payment",
          metadata: {
            type: "test_payment",
            app: "Deliveryfast",
          },
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
          },
        }
      )
    } catch (error) {
      console.error(error)
      alert("Payment failed. Open the app inside Pi Browser and try again.")
    } finally {
      setPaymentLoading(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="flex items-center gap-4 p-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Profile</h1>
        </div>
      </header>

      <div className="p-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <Avatar className="w-16 h-16">
              <AvatarImage src="/placeholder-user.jpg" alt="Profile" />
              <AvatarFallback className="text-lg bg-blue-100 text-blue-600">
                YB
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h2 className="text-xl font-semibold">Youssef Benali</h2>
              <p className="text-gray-600">Member since Jan 2024</p>

              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current text-yellow-500" />
                  {userStats.rating}
                </Badge>
                <Badge variant="outline">Verified</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="px-4 mb-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact Information</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="text-sm">+212 6 12 34 56 78</span>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-sm">youssef.benali@email.com</span>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-sm">Casablanca, Morocco</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="px-4 mb-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity Statistics</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <Package className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">
                  {userStats.totalOrders}
                </div>
                <div className="text-xs text-gray-600">Total Orders</div>
              </div>

              <div className="p-3 bg-green-50 rounded-lg text-center">
                <Truck className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">
                  {userStats.completedDeliveries}
                </div>
                <div className="text-xs text-gray-600">Completed</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">Total Earnings</span>
                  <div className="text-xl font-bold text-purple-600">
                    {userStats.totalEarnings}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">Average per Order</span>
                  <div className="text-lg font-bold text-orange-600">
                    {userStats.averageOrderValue} MAD
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="px-4 mb-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="w-5 h-5 text-purple-600" />
              Pi Sandbox Payment
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg bg-purple-50 p-3 text-sm text-purple-900">
              <ShieldCheck className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p>
                Connect from Pi Browser and process a 0.01 Test Pi payment to
                complete the Pi Developer setup.
              </p>
            </div>

            <Button onClick={connectPi} variant="outline" className="w-full">
              {piUser ? `Connected: ${piUser}` : "Connect Pi User"}
            </Button>

            <Button
              onClick={payTestPi}
              disabled={paymentLoading}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {paymentLoading ? "Processing Payment..." : "Pay 0.01 Test Pi"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="px-4 space-y-2">
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              <Link
                href="/settings"
                className="flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-gray-400" />
                  <span>Settings</span>
                </div>
                <span className="text-gray-400">&rsaquo;</span>
              </Link>

              <Link
                href="/help"
                className="flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-5 h-5 text-gray-400" />
                  <span>Help & Support</span>
                </div>
                <span className="text-gray-400">&rsaquo;</span>
              </Link>

              <button className="flex items-center justify-between p-4 hover:bg-gray-50 w-full text-red-600">
                <div className="flex items-center gap-3">
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </div>
                <span className="text-gray-400">&rsaquo;</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="p-4 mt-6 text-center">
        <div className="text-sm text-gray-500">
          <p className="font-medium mb-1">Deliveryfast v1.0.0</p>
          <p>Quick local delivery in your city</p>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t max-w-md mx-auto">
        <div className="flex justify-around py-2">
          <Link href="/" className="flex flex-col items-center p-2 text-gray-500">
            <Package className="w-5 h-5" />
            <span className="text-xs mt-1">Order</span>
          </Link>

          <Link href="/orders" className="flex flex-col items-center p-2 text-gray-500">
            <Package className="w-5 h-5" />
            <span className="text-xs mt-1">Orders</span>
          </Link>

          <Link href="/delivery" className="flex flex-col items-center p-2 text-gray-500">
            <Truck className="w-5 h-5" />
            <span className="text-xs mt-1">Deliver</span>
          </Link>

          <Link href="/profile" className="flex flex-col items-center p-2 text-blue-600">
            <Star className="w-5 h-5" />
            <span className="text-xs mt-1">Profile</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
