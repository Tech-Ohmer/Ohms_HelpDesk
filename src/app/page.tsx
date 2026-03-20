import Link from 'next/link'
import TicketForm from '@/components/forms/TicketForm'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Helpdesk</h1>
          <p className="text-gray-600 text-lg">
            Submit a support request and we'll get back to you.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <TicketForm />
        </div>

        {/* Footer links */}
        <div className="text-center mt-6 text-sm text-gray-500 space-x-4">
          <Link href="/track" className="hover:text-blue-600 underline underline-offset-2">
            Track my ticket
          </Link>
          <span>·</span>
          <Link href="/admin" className="hover:text-blue-600 underline underline-offset-2">
            Admin
          </Link>
        </div>
      </div>
    </main>
  )
}
