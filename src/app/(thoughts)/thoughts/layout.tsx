import { ThoughtsSidebar } from '@/components/thoughts/ThoughtsSidebar'

export default function ThoughtsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen bg-gray-50">
            <ThoughtsSidebar />
            <main className="flex-1 md:ml-80 min-h-screen transition-all duration-300">
                {children}
            </main>
        </div>
    )
}
