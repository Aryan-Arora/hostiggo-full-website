'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, GripVertical, Star } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Photo {
  id: string | number;
  url: string;
  fileName: string;
  isPrimary?: boolean;
}

export default function ListingPhotosManager({ listingId }: { listingId: number }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load the listing's existing photos (with their DB ids + cover flag) so the
  // manager reflects what's actually saved and can drive the set-cover control.
  const loadPhotos = useCallback(async () => {
    if (!listingId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/host/listings/${listingId}`);
      if (!res.ok) throw new Error('Failed to load photos');
      const { data } = await res.json();
      const rows: any[] = Array.isArray(data) ? data : [];
      const mapped: Photo[] = rows.map((r) => ({
        id: r.id,
        url: r.media_url,
        fileName: '',
        isPrimary: Boolean(r.is_cover),
      }));
      // Deterministic cover (Rule C): if none is flagged, treat the first as cover.
      if (mapped.length > 0 && !mapped.some((p) => p.isPrimary)) {
        mapped[0].isPrimary = true;
      }
      setPhotos(mapped);
    } catch (error) {
      console.error('Error loading photos:', error);
      toast.error('Failed to load photos');
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    const file = files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/host/listings/${listingId}/photos`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload photo');
      }

      const data = await response.json();
      const newPhoto: Photo = {
        id: data.data.id,
        url: URL.createObjectURL(file),
        fileName: file.name,
        isPrimary: photos.length === 0, // First photo is primary
      };

      setPhotos([newPhoto, ...photos]);
      toast.success('Photo added successfully');

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (id: string | number) => {
    try {
      const response = await fetch(`/api/host/listings/${listingId}/photos`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId: id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete photo');
      }

      setPhotos(photos.filter(p => p.id !== id));
      toast.success('Photo removed');
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error('Failed to delete photo');
    }
  };

  const handleMakePrimary = async (id: string | number) => {
    // Newly uploaded (not-yet-persisted) photos carry a numeric client id; only
    // real DB rows (uuid strings) can be persisted as the cover.
    if (typeof id !== 'string') {
      setPhotos(photos.map((p) => ({ ...p, isPrimary: p.id === id })));
      return;
    }

    const currentCoverId = photos.find((p) => p.isPrimary)?.id;
    if (id === currentCoverId) return;

    setSavingId(id);
    try {
      const res = await fetch(`/api/host/listings/${listingId}/cover`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId: id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update cover photo');
      }
      // Rule D: re-read so the new cover shows immediately, not after a reload.
      await loadPhotos();
      toast.success('Cover photo updated');
    } catch (error) {
      console.error('Error setting cover photo:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update cover photo');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        onDragOver={() => setDragOver(true)}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFileSelect(e.dataTransfer.files);
        }}
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-12 transition-all text-center cursor-pointer',
          dragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={uploading}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full"
        >
          <div className="flex flex-col items-center gap-3">
            {uploading ? (
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            ) : (
              <Upload className="w-12 h-12 text-gray-400" />
            )}
            <div>
              <p className="font-semibold text-gray-900 text-lg">
                {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                PNG, JPG, GIF up to 5MB
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Photos Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : photos.length > 0 ? (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 text-lg">
            Your Photos ({photos.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="relative group rounded-xl overflow-hidden bg-gray-200 aspect-video"
              >
                {/* Image */}
                <img
                  src={photo.url}
                  alt={photo.fileName}
                  className="w-full h-full object-cover"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  {/* Make Primary Button */}
                  <button
                    onClick={() => handleMakePrimary(photo.id)}
                    disabled={savingId === photo.id}
                    className={cn(
                      'p-3 rounded-lg transition-all disabled:cursor-not-allowed',
                      photo.isPrimary
                        ? 'bg-yellow-500 text-white'
                        : 'bg-white/90 text-gray-700 hover:bg-white'
                    )}
                    title={photo.isPrimary ? 'Cover photo' : 'Make cover photo'}
                  >
                    {savingId === photo.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Star className={cn('w-5 h-5', photo.isPrimary && 'fill-current')} />
                    )}
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="p-3 rounded-lg bg-red-500/90 text-white hover:bg-red-600 transition-all"
                    title="Delete photo"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Primary Badge */}
                {photo.isPrimary && (
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

      {/* Info Box */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200 space-y-2">
        <p className="text-sm font-semibold text-blue-900">📸 Photo Tips</p>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use high-quality photos with good lighting</li>
          <li>• Upload at least 5-10 photos for better bookings</li>
          <li>• The cover photo is shown first on your listing card and in search results</li>
          <li>• Show different rooms and key features</li>
        </ul>
      </div>
    </div>
  );
}
