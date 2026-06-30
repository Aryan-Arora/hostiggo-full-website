'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Lightbulb, Trash2, Loader2, Star } from 'lucide-react';
import { toast } from 'sonner';
import WizardShell from '../_components/WizardShell';
import { useListingDraft } from '@/context/ListingDraftContext';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const MAX_PHOTOS = 10;

export default function PhotosPage() {
  const { draft, update } = useListingDraft();
  const [photos, setPhotos] = useState<string[]>(draft.photoUrls ?? []);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const persist = (next: string[]) => {
    setPhotos(next);
    update({ photoUrls: next });
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const room = MAX_PHOTOS - photos.length;
    const picked = Array.from(files).filter((f) => f.type.startsWith('image/')).slice(0, room);
    if (picked.length === 0) {
      toast.error(room <= 0 ? 'You can upload up to 10 photos.' : 'Please choose image files.');
      return;
    }
    setUploading(true);
    const uploaded: string[] = [];
    try {
      for (const file of picked) {
        try {
          uploaded.push(await api.uploadPhoto(file));
        } catch (err) {
          console.error('[photos] upload failed:', err);
          toast.error(`Couldn't upload ${file.name}`);
        }
      }
      if (uploaded.length) {
        persist([...photos, ...uploaded]);
        toast.success(`${uploaded.length} photo${uploaded.length > 1 ? 's' : ''} uploaded`);
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = (url: string) => persist(photos.filter((p) => p !== url));
  const makePrimary = (url: string) => persist([url, ...photos.filter((p) => p !== url)]);

  return (
    <WizardShell
      step={5}
      title="Add some photos of your place"
      subtitle="Clear photos help guests book with confidence. The first photo is your cover."
    >
      <div className="max-w-4xl mx-auto">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {/* Upload area */}
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={cn(
            'border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center bg-white transition-all cursor-pointer min-h-[280px] mb-8 group',
            dragOver ? 'border-blue-500 bg-blue-50/50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/30',
            uploading && 'pointer-events-none opacity-70',
          )}
        >
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            {uploading ? (
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            ) : (
              <ImagePlus className="w-8 h-8 text-blue-600" />
            )}
          </div>
          <p className="text-xl font-bold text-gray-800 mb-1">
            {uploading ? 'Uploading…' : 'Drag and drop up to 10 photos'}
          </p>
          <p className="text-sm text-gray-500 mb-6">or click to browse your files</p>
          <span className="bg-blue-600 text-white px-8 py-3 rounded-full text-sm font-semibold">
            Upload from gallery
          </span>
        </div>

        {/* Quick links */}
        <div className="flex items-center justify-between mb-6">
          <span className="flex items-center gap-2 text-blue-600 text-sm font-medium">
            <Lightbulb className="w-5 h-5" />
            Bright, landscape photos work best
          </span>
          <p className="text-sm text-gray-500">{photos.length} / {MAX_PHOTOS} photos uploaded</p>
        </div>

        {/* Grid */}
        {photos.length === 0 ? (
          <div className="text-center py-10 text-sm text-gray-400 border border-dashed border-gray-200 rounded-2xl">
            No photos yet — add a few to make your listing stand out.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((url, i) => (
              <div
                key={url}
                className={cn(
                  'relative aspect-[4/3] rounded-2xl overflow-hidden shadow-card group',
                  i === 0 && 'col-span-2 md:col-span-2 aspect-[16/10]',
                )}
              >
                <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                {i === 0 && (
                  <div className="absolute top-3 left-3 bg-white/85 backdrop-blur-md px-3 py-1 rounded-full">
                    <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Cover</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  {i !== 0 && (
                    <button
                      onClick={() => makePrimary(url)}
                      title="Make cover"
                      className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-amber-500 shadow-lg hover:scale-110 transition-transform"
                    >
                      <Star className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => remove(url)}
                    title="Remove"
                    className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-red-500 shadow-lg hover:scale-110 transition-transform"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </WizardShell>
  );
}
