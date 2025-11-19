import { Headphones } from 'lucide-react'
import TicketForm from '@/components/ticket-form'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-600 p-3 rounded-full">
                <Headphones className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Helpdesk Support
            </h1>
            <p className="text-gray-600">
              Submit a support ticket and our team will get back to you shortly
            </p>
          </div>

          {/* Ticket Form Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <TicketForm />
          </div>

          {/* Admin Link */}
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              Staff Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
