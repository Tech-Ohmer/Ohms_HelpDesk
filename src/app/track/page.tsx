'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function TrackPage() {
  const [token, setToken] = useState('')
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (token.trim()) router.push(`/track/${token.trim()}`)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Track Your Ticket</h1>
        <p className="text-gray-500 text-sm mb-6">
          Enter the tracking token from your confirmation email.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste your tracking token here"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!token.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
          >
            Find My Ticket
          </button>
        </form>
        <a href="/" className="block text-center mt-4 text-sm text-blue-600 hover:underline">
          ← Submit a new ticket
        </a>
      </div>
    </main>
  )
}
