"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { MapPin, Package, Clock, Star, Menu, User, Truck, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useOrders, type OrderType } from "@/hooks/useOrders"

const ORDER_TYPE_INFO: Record<OrderType, { name: string; icon: string; time: number; price: number }> = {
  food: { name: "Food & Restaurants", icon: "🍕", time: 20, price: 15 },
  groceries: { name: "Groceries", icon: "🛒", time: 40, price: 20 },
  pharmacy: { name: "Pharmacy", icon: "💊", time: 15, price: 12 },
  documents: { name: "Documents", icon: "📄", time: 25, price: 10 },
  other: { name: "Other", icon: "📦", time: 35, price: 18 },
}

export default function HomePage() {
  const [pickupAddress, setPickupAddress] = useState("")
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [packageDetails, setPackageDetails] = useState("")
  const [orderType, setOrderType] = useState<OrderType | null>(null)
  const [quote, setQuote] = useState<{ price: number; time: number; orderId: string } | null>(null)
  const [successMessage, setSuccessMessage] = useState("")
  const { createOrder, isLoaded } = useOrders()

  const handleGetQuote = () => {
    if (!pickupAddress.trim()) {
      alert("Please enter pickup address")
      return
    }
    if (!deliveryAddress.trim()) {
      alert("Please enter delivery address")
      return
    }
    if (!packageDetails.trim()) {
      alert("Please enter package details")
      return
    }
    if (!orderType) {
      alert("Please select order type")
      return
    }

    const info = ORDER_TYPE_INFO[orderType]
    const newOrder = createOrder(orderType, pickupAddress, deliveryAddress, packageDetails)

    setQuote({
      price: info.price,
      time: info.time,
      orderId: newOrder.id,
    })
  }

  const handleConfirmOrder = () => {
    if (quote) {
      setSuccessMessage(`Order ${quote.orderId} created successfully!`)
      setTimeout(() => {
        setPickupAddress("")
        setDeliveryAddress("")
        setPackageDetails("")
        setOrderType(null)
        setQuote(null)
        setSuccessMessage("")
      }, 2000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-blue-600">Deliveryfast</h1>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="flex flex-col gap-4 mt-8">
                <Link href="/" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100">
                  <Package className="w-5 h-5" />
                  <span>Place Order</span>
                </Link>
                <Link href="/orders" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100">
                  <Clock className="w-5 h-5" />
                  <span>My Orders</span>
                </Link>
                <Link href="/delivery" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100">
                  <Truck className="w-5 h-5" />
                  <span>Become Delivery Partner</span>
                </Link>
                <Link href="/profile" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100">
                  <User className="w-5 h-5" />
                  <span>Profile</span>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Hero Section */}
      <div className="p-4 text-center py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Fast Local Delivery</h2>
        <p className="text-gray-600 mb-6">Quick delivery within your city - groceries, food, packages & more</p>

        <div className="flex justify-center gap-4 mb-8">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            15-40 min
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Star className="w-4 h-4" />
            10-25 MAD
          </Badge>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mx-4 mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-green-800">{successMessage}</div>
        </div>
      )}

      {/* Order Form */}
      {!quote && (
        <div className="p-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Place New Order
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="from">Pickup Location *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="from"
                    placeholder="Enter pickup address"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="to">Delivery Location *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="to"
                    placeholder="Enter delivery address"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="package">Package Details *</Label>
                <Textarea
                  id="package"
                  placeholder="Describe your package (size, weight, special instructions)"
                  value={packageDetails}
                  onChange={(e) => setPackageDetails(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Order Type *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(ORDER_TYPE_INFO) as Array<[OrderType, typeof ORDER_TYPE_INFO[OrderType]]>).map(
                    ([type, info]) => (
                      <button
                        key={type}
                        onClick={() => setOrderType(type)}
                        className={`p-3 rounded-lg border-2 transition-all text-center ${
                          orderType === type
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="text-xl mb-1">{info.icon}</div>
                        <div className="text-xs font-medium">{info.name}</div>
                        <div className="text-xs text-gray-500">{info.price} MAD</div>
                      </button>
                    )
                  )}
                </div>
              </div>

              <Button onClick={handleGetQuote} className="w-full" size="lg">
                Get Delivery Quote
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quote Card */}
      {quote && (
        <div className="p-4">
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                Delivery Quote
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Order Type:</span>
                  <span className="font-semibold">{orderType && ORDER_TYPE_INFO[orderType].name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">From:</span>
                  <span className="font-semibold text-sm text-right">{pickupAddress}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">To:</span>
                  <span className="font-semibold text-sm text-right">{deliveryAddress}</span>
                </div>
                <div className="border-t pt-3 flex items-center justify-between">
                  <span className="text-gray-600">Estimated Time:</span>
                  <span className="font-semibold text-blue-600">{quote.time} minutes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-bold text-lg text-green-600">{quote.price} MAD</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setQuote(null)
                    setOrderType(null)
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button onClick={handleConfirmOrder} className="flex-1 bg-green-600 hover:bg-green-700">
                  Confirm Order {quote.orderId}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delivery Categories */}
      {!quote && (
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Delivery Prices</h3>
          <div className="grid grid-cols-2 gap-3">
            {(Object.entries(ORDER_TYPE_INFO) as Array<[OrderType, typeof ORDER_TYPE_INFO[OrderType]]>).map(
              ([_, info]) => (
                <Card key={info.name} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl mb-2">{info.icon}</div>
                    <div className="text-sm font-medium">{info.name}</div>
                    <div className="text-xs text-gray-500 flex items-center justify-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {info.time} min
                    </div>
                    <div className="text-xs font-semibold text-blue-600 mt-1">{info.price} MAD</div>
                  </CardContent>
                </Card>
              )
            )}
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t">
        <div className="flex justify-around py-2">
          <Link href="/" className="flex flex-col items-center p-2 text-blue-600">
            <Package className="w-5 h-5" />
            <span className="text-xs mt-1">Order</span>
          </Link>
          <Link href="/orders" className="flex flex-col items-center p-2 text-gray-500">
            <Clock className="w-5 h-5" />
            <span className="text-xs mt-1">Orders</span>
          </Link>
          <Link href="/delivery" className="flex flex-col items-center p-2 text-gray-500">
            <Truck className="w-5 h-5" />
            <span className="text-xs mt-1">Deliver</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center p-2 text-gray-500">
            <User className="w-5 h-5" />
            <span className="text-xs mt-1">Profile</span>
          </Link>
        </div>
      </div>

      {/* Bottom spacing for fixed navigation */}
      <div className="h-16"></div>
    </div>
  )
}
