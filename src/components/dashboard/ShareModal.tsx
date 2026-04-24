'use client';

import React from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  tourId: string;
  tourTitle: string;
  isPublic: boolean;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  tourId,
  tourTitle,
  isPublic,
}) => {
  const [shareData, setShareData] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      fetchShareData();
    }
  }, [isOpen]);

  const fetchShareData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/tours/${tourId}/share`);

      if (response.ok) {
        const data = await response.json();
        setShareData(data.data);
      } else {
        const errorData = await response.json();
        console.error('Fetch share data error:', errorData.error);
      }
    } catch (error) {
      console.error('Fetch share data error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePublic = async () => {
    try {
      setIsLoading(true);

      const response = await fetch(`/api/tours/${tourId}/share`, {
        method: shareData?.isPublic ? 'DELETE' : 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setShareData(data.data);
        toast.success(
          data.data.isPublic ? 'Tour is now public' : 'Tour is now private'
        );
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update share status');
      }
    } catch (error) {
      toast.error('Failed to update share status');
      console.error('Toggle public error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const iframeCode = shareData?.shareLink
    ? `<iframe src="${shareData.shareLink}?embed=true" width="100%" height="600" frameborder="0" allowfullscreen style="border-radius: 8px;"></iframe>`
    : '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Tour" size="lg">
      <div className="space-y-6">
        {/* Public Toggle */}
        <div>
          <h3 className="text-white font-semibold mb-3">Visibility</h3>
          <div className="flex items-center justify-between bg-dark-700 rounded-lg p-4">
            <div>
              <p className="text-white font-medium">
                {shareData?.isPublic ? 'Public' : 'Private'}
              </p>
              <p className="text-dark-400 text-sm mt-1">
                {shareData?.isPublic
                  ? 'Anyone with the link can view'
                  : 'Only invited people can view'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={shareData?.isPublic || false}
                onChange={togglePublic}
                disabled={isLoading}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-dark-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>

        {shareData?.isPublic && (
          <>
            {/* Share Link */}
            <div>
              <h3 className="text-white font-semibold mb-3">Share Link</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareData?.shareLink || ''}
                  readOnly
                  className="flex-1 px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-dark-300 text-sm"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => window.open(shareData?.shareLink, '_blank')}
                  title="Open link"
                >
                  <ExternalLink size={16} />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    copyToClipboard(shareData?.shareLink || '')
                  }
                  className="flex items-center gap-1"
                >
                  {copied ? (
                    <Check size={16} />
                  ) : (
                    <Copy size={16} />
                  )}
                </Button>
              </div>
            </div>

            {/* Embed Code */}
            <div>
              <h3 className="text-white font-semibold mb-3">Embed Code</h3>
              <div className="flex gap-2">
                <textarea
                  value={iframeCode}
                  readOnly
                  rows={3}
                  className="flex-1 px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-dark-300 text-sm font-mono resize-none"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => copyToClipboard(iframeCode)}
                  className="flex items-center gap-1"
                >
                  {copied ? (
                    <Check size={16} />
                  ) : (
                    <Copy size={16} />
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-4 border-t border-dark-700">
          <Button
            variant="ghost"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
