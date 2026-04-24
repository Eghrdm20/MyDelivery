import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Deliveryfast - Fast Delivery Across Morocco",
  description: "Send packages quickly and safely to any city in Morocco",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main className="max-w-md mx-auto bg-white min-h-screen">{children}</main>
      </body>
    </html>
  )
}
