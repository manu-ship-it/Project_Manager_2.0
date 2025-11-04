'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FolderKanban, Calendar, FileText } from 'lucide-react'

const menuItems = [
  {
    name: 'Projects',
    href: '/',
    icon: FolderKanban,
  },
  {
    name: 'Install Schedule',
    href: '/install-schedule',
    icon: Calendar,
  },
  {
    name: 'Quotes',
    href: '/quotes',
    icon: FileText,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 z-10 overflow-y-auto">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Project Manager</h2>
      </div>
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}

