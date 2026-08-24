'use client';

import { useState, useRef } from 'react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleMakePrimary = (id: string | number) => {
    setPhotos(photos.map(p => ({
      ...p,
      isPrimary: p.id === id,
    })));
    toast.success('Primary photo updated');
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
      {photos.length > 0 ? (
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
                    className={cn(
                      'p-3 rounded-lg transition-all',
                      photo.isPrimary
                        ? 'bg-yellow-500 text-white'
                        : 'bg-white/90 text-gray-700 hover:bg-white'
                    )}
                    title={photo.isPrimary ? 'Primary photo' : 'Make primary'}
                  >
                    <Star className={cn('w-5 h-5', photo.isPrimary && 'fill-current')} />
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
                    Primary
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
          <li>• The primary photo will be shown in search results</li>
          <li>• Show different rooms and key features</li>
        </ul>
      </div>
    </div>
  );
}
