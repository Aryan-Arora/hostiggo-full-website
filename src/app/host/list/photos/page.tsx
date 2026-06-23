'use client';

import { ImagePlus, Lightbulb, Pencil, Trash2, MoreHorizontal, Plus } from 'lucide-react';
import WizardShell from '../_components/WizardShell';

const PHOTOS = [
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=500&fit=crop&q=80',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=400&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=400&h=400&fit=crop&q=80',
  'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400&h=400&fit=crop&q=80',
];

export default function PhotosPage() {
  return (
    <WizardShell
      step={5}
      title="Add some photos of your place"
      subtitle="Clear photos help guests understand your space and book with confidence. Drag to rearrange."
    >
      <div className="max-w-4xl mx-auto">
        {/* Upload area */}
        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 flex flex-col items-center justify-center bg-white transition-all hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer min-h-[320px] mb-8 group">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <ImagePlus className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-xl font-bold text-gray-800 mb-1">
            Drag and drop up to 10 photos
          </p>
          <p className="text-sm text-gray-500 mb-6">or click to browse your files</p>
          <span className="bg-blue-600 text-white px-8 py-3 rounded-full text-sm font-semibold hover:bg-blue-700 transition-colors">
            Upload from gallery
          </span>
        </div>

        {/* Quick links */}
        <div className="flex items-center justify-between mb-6">
          <button className="flex items-center gap-2 text-blue-600 text-sm font-medium hover:underline">
            <Lightbulb className="w-5 h-5" />
            Photo tips
          </button>
          <p className="text-sm text-gray-500">4 / 10 photos uploaded</p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Primary */}
          <div className="md:col-span-2 lg:col-span-2 aspect-[16/10] relative rounded-2xl overflow-hidden shadow-card group">
            <img src={PHOTOS[0]} alt="Primary" className="w-full h-full object-cover" />
            <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/40">
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                Primary Photo
              </span>
            </div>
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
              <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-lg hover:scale-110 transition-transform">
                <Pencil className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-red-500 shadow-lg hover:scale-110 transition-transform">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Secondary */}
          {PHOTOS.slice(1).map((src, i) => (
            <div
              key={i}
              className="aspect-square relative rounded-2xl overflow-hidden shadow-card group"
            >
              <img src={src} alt={`Photo ${i + 2}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Add more */}
          <div className="aspect-square border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center bg-white hover:border-blue-400 hover:bg-blue-50/30 transition-colors cursor-pointer group">
            <Plus className="w-8 h-8 text-gray-400 group-hover:text-blue-600 transition-colors mb-2" />
            <span className="text-sm font-medium text-gray-500 group-hover:text-blue-600 transition-colors">
              Add more
            </span>
          </div>
        </div>
      </div>
    </WizardShell>
  );
}
