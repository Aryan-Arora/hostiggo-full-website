'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Upload, X, Loader2, Image as ImageIcon, Star } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

interface Photo {
  id: number;
  media_url: string;
  is_cover: boolean;
}

export default function ListingPhotosManager({ listingId }: { listingId: number }) {
  const { userId } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/host/listings/${listingId}/photos`);
        if (!res.ok) throw new Error('Failed to load photos');
        const { data } = (await res.json()) as { data: Photo[] };
        if (active) setPhotos(data ?? []);
      } catch (err) {
        console.error('Failed to load photos:', err);
        if (active) toast.error('Failed to load photos');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [listingId]);

  const handleFileSelect = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!userId) {
      toast.error('Please sign in again.');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPG, PNG and WEBP images are allowed');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error('File size must be less than 8MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);
      const res = await fetch(`/api/host/listings/${listingId}/photos`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to upload photo');
      }
      const { data } = (await res.json()) as { data: Photo };
      setPhotos((prev) => [...prev, data]);
      toast.success('Photo added');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Error uploading photo:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/host/listings/${listingId}/photos`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, photoId: id }),
      });
      if (!res.ok) throw new Error('Failed to delete photo');
      const { data } = (await res.json()) as { data: Photo[] };
      setPhotos(data ?? []);
      toast.success('Photo removed');
    } catch (err) {
      console.error('Error deleting photo:', err);
      toast.error('Failed to delete photo');
    }
  };

  const handleMakeCover = async (id: number) => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/host/listings/${listingId}/photos`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, photoId: id, action: 'make-cover' }),
      });
      if (!res.ok) throw new Error('Failed to update cover photo');
      const { data } = (await res.json()) as { data: Photo[] };
      setPhotos(data ?? []);
      toast.success('Cover photo updated');
    } catch (err) {
      console.error('Error updating cover photo:', err);
      toast.error('Failed to update cover photo');
    }
  };

  return (
    <div className="space-y-6">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFileSelect(e.dataTransfer.files);
        }}
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-12 transition-all text-center',
          dragOver ? 'border-figma-navy bg-figma-navy/5' : 'border-gray-300 bg-gray-50 hover:border-gray-400',
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={uploading}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full"
        >
          <div className="flex flex-col items-center gap-3">
            {uploading ? (
              <Loader2 className="w-12 h-12 text-figma-navy animate-spin" />
            ) : (
              <Upload className="w-12 h-12 text-gray-400" />
            )}
            <div>
              <p className="font-semibold text-gray-900 text-lg">
                {uploading ? 'Uploading…' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-sm text-gray-600 mt-1">JPG, PNG or WEBP up to 8MB</p>
            </div>
          </div>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-figma-navy" />
        </div>
      ) : photos.length > 0 ? (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 text-lg">Your Photos ({photos.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="relative group rounded-xl overflow-hidden bg-gray-200 aspect-video"
              >
                <Image
                  src={photo.media_url}
                  alt="Listing photo"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => handleMakeCover(photo.id)}
                    className={cn(
                      'p-3 rounded-lg transition-all',
                      photo.is_cover
                        ? 'bg-yellow-500 text-white'
                        : 'bg-white/90 text-gray-700 hover:bg-white',
                    )}
                    title={photo.is_cover ? 'Cover photo' : 'Make cover photo'}
                  >
                    <Star className={cn('w-5 h-5', photo.is_cover && 'fill-current')} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(photo.id)}
                    className="p-3 rounded-lg bg-red-500/90 text-white hover:bg-red-600 transition-all"
                    title="Delete photo"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {photo.is_cover && (
                  <div className="absolute top-3 right-3 px-3 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    Cover
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No photos yet</p>
          <p className="text-sm text-gray-500 mt-1">Upload your first photo to get started</p>
        </div>
      )}

      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200 space-y-2">
        <p className="text-sm font-semibold text-blue-900">📸 Photo Tips</p>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use high-quality photos with good lighting</li>
          <li>• Upload at least 5-10 photos for better bookings</li>
          <li>• The cover photo is shown in search results</li>
          <li>• Show different rooms and key features</li>
        </ul>
      </div>
    </div>
  );
}
