import React, { useState } from 'react';
import { Download, CheckCircle, Circle } from 'lucide-react';

import { API_BASE_URL } from '../api';

const Gallery = ({ photos, onScanAgain }) => {
    const formatUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        // API_BASE_URL is http://.../api
        // context path is /api
        // relative url is /api/photo/download/...
        // We want http://.../api/photo/download/...
        return `${API_BASE_URL.replace('/api', '')}${url}`;
    };
    const [selectedPhotos, setSelectedPhotos] = useState([]);

    const toggleSelect = (id) => {
        setSelectedPhotos(prev =>
            prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
        );
    };

    const downloadPhoto = async (url, id) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `photo_${id}.jpg`;
            link.click();
        } catch (e) {
            console.error("Download failed", e);
        }
    };

    const downloadSelected = async () => {
        const photosToDownload = photos.filter(p => selectedPhotos.includes(p.id));
        for (const photo of photosToDownload) {
            await downloadPhoto(formatUrl(photo.downloadUrl), photo.id);
        }
    };

    const downloadAll = async () => {
        for (const photo of photos) {
            await downloadPhoto(formatUrl(photo.downloadUrl), photo.id);
        }
    };

    if (!photos || photos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                <h3 className="text-2xl font-bold mb-2">No Photos Found 😢</h3>
                <p className="mb-6">We couldn't match any photos with your face.</p>
                <button onClick={onScanAgain} className="px-6 py-2 bg-primary text-white rounded-full font-semibold hover:bg-opacity-90 active:scale-95 transition-transform">
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                <h2 className="text-2xl font-bold text-gray-800">Found {photos.length} Photos!</h2>
                <div className="flex flex-wrap justify-center gap-3">
                    <button
                        onClick={downloadSelected}
                        disabled={selectedPhotos.length === 0}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors ${selectedPhotos.length === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                        <Download size={18} /> Download Selected
                    </button>
                    <button
                        onClick={downloadAll}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full font-semibold hover:bg-opacity-90 active:scale-95 transition-transform"
                    >
                        <Download size={18} /> Download All
                    </button>
                    <button
                        onClick={onScanAgain}
                        className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 text-gray-600 rounded-full font-medium hover:bg-gray-50"
                    >
                        Scan Again
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map(photo => (
                    <div key={photo.id}
                        className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer group transition-all duration-200 ${selectedPhotos.includes(photo.id) ? 'ring-4 ring-primary ring-inset' : 'hover:shadow-lg'}`}
                        onClick={() => toggleSelect(photo.id)}
                    >
                        <img
                            src={formatUrl(photo.downloadUrl)}
                            alt={`Event Photo ${photo.id}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                        <div className="absolute top-2 right-2 drop-shadow-md">
                            {selectedPhotos.includes(photo.id) ?
                                <CheckCircle className="text-green-500 fill-white w-6 h-6" /> :
                                <Circle className="text-white w-6 h-6 opacity-70 group-hover:opacity-100 transition-opacity" />
                            }
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Gallery;
