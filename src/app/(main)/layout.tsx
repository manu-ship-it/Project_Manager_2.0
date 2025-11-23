import { Sidebar } from '@/components/layout/Sidebar'

export default function MainLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 lg:ml-64 min-h-screen bg-gray-100">
                {children}
            </main>
        </div>
    )
}
