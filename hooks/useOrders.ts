"use client"

import { useEffect, useState } from "react"

export type OrderStatus =
  | "pending"
  | "accepted"
  | "in_progress"
  | "delivered"
  | "cancelled"
  | "Pending"
  | "Accepted"
  | "InProgress"
  | "Delivered"
  | "Cancelled"

export type Order = {
  id: string
  pickup?: string
  pickupLocation?: string
  dropoff?: string
  deliveryLocation?: string
  details?: string
  packageDetails?: string
  phone?: string
  type?: string
  price: number
  time?: string
  estimatedTime?: string
  distance?: number
  status: OrderStatus
  partner?: string
  createdAt?: string
}

const STORAGE_KEY = "delivery_fast_orders_v1"

function normalizeOrders(value: unknown): Order[] {
  if (!Array.isArray(value)) return []

  return value.map((order: any) => ({
    id: String(order.id || "DF" + Date.now()),
    pickup: order.pickup || order.pickupLocation || "",
    pickupLocation: order.pickupLocation || order.pickup || "",
    dropoff: order.dropoff || order.deliveryLocation || "",
    deliveryLocation: order.deliveryLocation || order.dropoff || "",
    details: order.details || order.packageDetails || "",
    packageDetails: order.packageDetails || order.details || "",
    phone: order.phone || "",
    type: order.type || "standard",
    price: Number(order.price) || 0,
    time: order.time || order.estimatedTime || "",
    estimatedTime: order.estimatedTime || order.time || "",
    distance: Number(order.distance) || 0,
    status: order.status || "pending",
    partner: order.partner || "Waiting for partner",
    createdAt: order.createdAt || new Date().toLocaleString(),
  }))
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    try {
      const savedOrders = localStorage.getItem(STORAGE_KEY)

      if (savedOrders) {
        const parsedOrders = JSON.parse(savedOrders)
        setOrders(normalizeOrders(parsedOrders))
      }
    } catch (error) {
      console.error("Failed to load orders:", error)
      setOrders([])
    } finally {
      setIsLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!isLoaded) return

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
    } catch (error) {
      console.error("Failed to save orders:", error)
    }
  }, [orders, isLoaded])

  function addOrder(order: Order) {
    setOrders((currentOrders) => [order, ...currentOrders])
  }

  function updateOrderStatus(id: string, status: OrderStatus) {
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === id
          ? {
              ...order,
              status,
            }
          : order
      )
    )
  }

  function deleteOrder(id: string) {
    setOrders((currentOrders) => currentOrders.filter((order) => order.id !== id))
  }

  function clearOrders() {
    setOrders([])
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    orders,
    setOrders,
    addOrder,
    updateOrderStatus,
    deleteOrder,
    clearOrders,
    isLoaded,
  }
}
