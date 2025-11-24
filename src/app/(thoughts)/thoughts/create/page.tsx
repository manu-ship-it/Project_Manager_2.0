'use client'

import { useRouter } from 'next/navigation'
import { IdeaForm } from '@/components/thoughts/IdeaForm'

export default function CreateIdeaPage() {
    const router = useRouter()

    return (
        <div className="h-full bg-gray-50 p-8 overflow-y-auto">
            <IdeaForm
                onCancel={() => router.back()}
                onSuccess={() => router.push('/thoughts')}
            />
        </div>
    )
}
