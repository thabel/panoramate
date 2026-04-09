'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Trash2, Calendar, Image as ImageIcon, ExternalLink, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface Comparison {
    id: string;
    title: string | null;
    createdAt: string;
    images: {
        id: string;
        captureDate: string;
    }[];
}

export default function ComparisonsPage() {
    const [comparisons, setComparisons] = useState<Comparison[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [comparisonToDelete, setComparisonToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchComparisons();
    }, []);

    const fetchComparisons = async () => {
        try {
            const response = await fetch('/api/comparisons');
            const data = await response.json();
            if (data.success) {
                setComparisons(data.data);
            } else {
                setError(data.error || 'Failed to fetch comparisons');
            }
        } catch (err) {
            setError('An error occurred while fetching comparisons');
        } finally {
            setIsLoading(false);
        }
    };

    const confirmDelete = async () => {
        if (!comparisonToDelete) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/comparisons/${comparisonToDelete}`, {
                method: 'DELETE',
            });
            const data = await response.json();
            if (data.success) {
                setComparisons(comparisons.filter((c) => c.id !== comparisonToDelete));
                setIsDeleteModalOpen(false);
            } else {
                alert(data.error || 'Failed to delete comparison');
            }
        } catch (err) {
            alert('An error occurred while deleting the comparison');
        } finally {
            setIsDeleting(false);
            setComparisonToDelete(null);
        }
    };

    const handleDeleteClick = (id: string) => {
        setComparisonToDelete(id);
        setIsDeleteModalOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Image Comparisons</h1>
                    <p className="text-dark-400">Compare different versions of the same element over time.</p>
                </div>
                <Link
                    href="/comparisons/new"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg bg-primary-600 hover:bg-primary-700"
                >
                    <Plus size={18} />
                    New Comparison
                </Link>
            </div>

            {error && <Alert variant="error">{error}</Alert>}

            {comparisons.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-xl border-dark-700 bg-dark-800/50">
                    <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-dark-700 text-dark-400">
                        <ImageIcon size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-white">No comparisons yet</h3>
                    <p className="max-w-xs mt-1 text-dark-400">
                        Create your first image comparison to track changes over time.
                    </p>
                    <Link
                        href="/comparisons/new"
                        className="px-4 py-2 mt-6 text-sm font-medium text-white transition-colors rounded-lg bg-primary-600 hover:bg-primary-700"
                    >
                        Create Comparison
                    </Link>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {comparisons.map((comparison) => (
                        <div
                            key={comparison.id}
                            className="overflow-hidden transition-all border group rounded-xl bg-dark-800 border-dark-700 hover:border-primary-500/50"
                        >
                            {/* <div className="relative flex items-center justify-center aspect-video bg-dark-700">
                                <ImageIcon className="text-dark-600" size={48} />
                                <div className="absolute flex gap-2 transition-opacity opacity-0 top-2 right-2 group-hover:opacity-100">
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleDeleteClick(comparison.id);
                                        }}
                                        className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div> */}
                            <div className="p-4">

                                <Link href={`/comparisons/${comparison.id}`} className="block group/link">
                                    <h3 className="text-lg font-semibold text-white truncate transition-colors group-hover/link:text-primary-400">
                                        {comparison.title || 'Untitled Comparison'}
                                    </h3>
                                </Link>
                                <div className="flex items-center justify-between mt-2 text-sm text-dark-400">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar size={14} />
                                        <span>Created {format(new Date(comparison.createdAt), 'MMM d, yyyy')}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <ImageIcon size={14} />
                                        <span>{comparison.images.length}/2 images</span>
                                    </div>
                                </div>
                                <div className='flex items-stretch justify-center w-full gap-2 mt-4'>
                                    <Link
                                        href={`/comparisons/${comparison.id}`}
                                        className="flex items-center justify-center flex-1 gap-2 px-4 py-2 text-sm font-medium text-white transition-colors border rounded-lg border-dark-600 hover:bg-dark-700"
                                    >
                                        <ExternalLink size={16} />
                                        View Comparison
                                    </Link>

                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleDeleteClick(comparison.id);
                                        }}
                                        className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Comparison"
                size="sm"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-red-500">
                        <AlertTriangle size={24} />
                        <p className="font-semibold">Are you absolutely sure?</p>
                    </div>
                    <p className="text-sm text-dark-300">
                        This action will permanently delete the comparison and all its associated images. This cannot be undone.
                    </p>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            variant="secondary"
                            onClick={() => setIsDeleteModalOpen(false)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            onClick={confirmDelete}
                            isLoading={isDeleting}
                        >
                            Delete
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
