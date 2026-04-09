'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { Alert } from '@/components/ui/Alert';

export default function NewComparisonPage() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/comparisons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title }),
            });

            const data = await response.json();
            if (data.success) {
                router.push(`/comparisons/${data.data.id}`);
            } else {
                setError(data.error || 'Failed to create comparison');
                setIsLoading(false);
            }
        } catch (err) {
            setError('An error occurred while creating the comparison');
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/comparisons"
                    className="p-2 transition-colors rounded-lg text-dark-400 hover:text-white hover:bg-dark-800"
                >
                    <ChevronLeft size={24} />
                </Link>
                <h1 className="text-2xl font-bold text-white">New Comparison</h1>
            </div>

            <div className="p-6 rounded-xl bg-dark-800 border border-dark-700 shadow-xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="title" className="text-sm font-medium text-dark-300">
                            Comparison Title
                        </label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Project X - Facade evolution"
                            required
                            className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                        />
                        <p className="text-xs text-dark-500">
                            Give your comparison a name to easily identify it later.
                        </p>
                    </div>

                    {error && <Alert variant="error">{error}</Alert>}

                    <div className="flex justify-end gap-3 pt-4">
                        <Link
                            href="/comparisons"
                            className="px-6 py-2.5 text-sm font-medium text-dark-300 transition-colors border border-dark-600 rounded-lg hover:bg-dark-700"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white transition-all rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/20"
                        >
                            <Save size={18} />
                            {isLoading ? 'Creating...' : 'Create Comparison'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
