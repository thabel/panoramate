'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Upload, Calendar, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert } from '@/components/ui/Alert';
import ComparisonViewer  from '@/components/viewer/ComparisonViewerTest';;

interface ComparisonImage {
    id: string;
    filename: string;
    originalName: string;
    captureDate: string;
    width: number;
    height: number;
}

interface Comparison {
    id: string;
    title: string | null;
    images: ComparisonImage[];
}

export default function ComparisonDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [comparison, setComparison] = useState<Comparison | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchComparison();
    }, [params.id]);

    const fetchComparison = async () => {
        try {
            const response = await fetch(`/api/comparisons/${params.id}`);
            const data = await response.json();
            if (data.success) {
                setComparison(data.data);
            } else {
                setError(data.error || 'Failed to fetch comparison');
            }
        } catch (err) {
            setError('An error occurred while fetching comparison');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const captureDate = prompt('Please enter the capture date (YYYY-MM-DD):', format(new Date(), 'yyyy-MM-dd'));
        if (!captureDate) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('captureDate', captureDate);

        try {
            const response = await fetch(`/api/comparisons/${params.id}/images`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            if (data.success) {
                fetchComparison();
            } else {
                alert(data.error || 'Upload failed');
            }
        } catch (err) {
            alert('An error occurred during upload');
        } finally {
            setUploading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12 h-[60vh]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!comparison) {
        return (
            <div className="p-8">
                <Alert variant="error">{error || 'Comparison not found'}</Alert>
                <Link href="/comparisons" className="inline-block mt-4 text-primary-500 hover:underline">
                    Back to comparisons
                </Link>
            </div>
        );
    }

    const image1 = comparison.images[0];
    const image2 = comparison.images[1];

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex items-center justify-between mb-2 shrink-0">
                <div className="flex items-center gap-4">
                    <Link
                        href="/comparisons"
                        className="p-2 transition-colors rounded-lg text-dark-400 hover:text-white hover:bg-dark-800"
                    >
                        <ChevronLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-white uppercase tracking-tight truncate max-w-[300px] md:max-w-md">
                            {comparison.title || 'Untitled Comparison'}
                        </h1>
                        <p className="text-[10px] md:text-xs text-dark-500 font-medium">
                            Synchronized viewing session • 2 versions
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {comparison.images.length < 2 && (
                        <label className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-all rounded-lg shadow-lg cursor-pointer bg-primary-600 hover:bg-primary-700 shadow-primary-900/40">
                            <Upload size={18} />
                            {uploading ? 'Uploading...' : `Upload Image ${comparison.images.length + 1}`}
                            <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} accept="image/*" />
                        </label>
                    )}
                </div>
            </div>

            <div className="flex-1 min-h-[500px] h-[calc(100vh-220px)] relative">
                {comparison.images.length === 2 ? (
                    <ComparisonViewer image1={image1} image2={image2} />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-2xl border-dark-700 bg-dark-900/30 backdrop-blur-sm">
                        <div className="flex items-center justify-center w-16 h-16 mb-6 border shadow-xl rounded-2xl bg-dark-800 text-primary-500 border-dark-600">
                            <Upload size={32} />
                        </div>
                        <h2 className="text-xl font-bold tracking-tight text-white">Comparison Setup</h2>
                        <p className="max-w-md mt-2 text-sm leading-relaxed text-dark-400">
                            Upload two images with their respective capture dates to enable the side-by-side synchronized viewer.
                        </p>
                        <div className="flex gap-4 mt-8">
                            {comparison.images.length === 1 && (
                                <div className="flex items-center gap-3 px-4 py-3 border shadow-lg rounded-xl bg-dark-800/80 border-dark-700">
                                    <div className="flex items-center justify-center w-10 h-10 font-bold border rounded-lg bg-primary-500/20 text-primary-500 border-primary-500/30">
                                        1
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs font-bold text-white uppercase tracking-wider truncate max-w-[150px]">{comparison.images[0].originalName}</p>
                                        <p className="text-[10px] text-dark-500 font-medium">Captured: {format(new Date(comparison.images[0].captureDate), 'MMM d, yyyy')}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
