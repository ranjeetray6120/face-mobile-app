import React, { useRef, useState, useEffect } from 'react';
import { Camera, StopCircle, RefreshCw, AlertTriangle } from 'lucide-react';

const CameraCapture = ({ onCapture }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState(null);

    const startCamera = async () => {
        setError(null);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false,
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Camera Error:", err);
            if (window.isSecureContext === false) {
                setError("Camera access is blocked on HTTP. Please use HTTPS or enable 'Insecure origins treated as secure' in chrome://flags.");
            } else {
                setError("Unable to access camera. Please check permissions.");
            }
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const capture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            if (video.readyState !== 4) {
                console.warn("Video not ready yet");
                return;
            }
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);

            canvas.toBlob((blob) => {
                if (blob) {
                    onCapture(blob); // Pass blob to parent
                    stopCamera();
                }
            }, 'image/jpeg', 0.95);
        }
    };

    useEffect(() => {
        // Cleanup on unmount
        return () => stopCamera();
    }, []);

    // Auto-start camera on mount
    useEffect(() => {
        startCamera();
    }, []);

    return (
        <div className="w-full max-w-2xl mx-auto p-4 bg-white rounded-2xl shadow-lg my-8">
            {error ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-red-500">
                    <AlertTriangle size={48} className="mb-4" />
                    <p className="mb-6 font-medium" dangerouslySetInnerHTML={{ __html: error.replace(/\n/g, '<br/>') }} />
                    <button onClick={startCamera} className="px-6 py-2 bg-primary text-white rounded-full font-semibold hover:bg-opacity-90 active:scale-95 transition-transform">
                        Retry
                    </button>
                </div>
            ) : !stream ? (
                <div className="flex items-center justify-center aspect-video bg-gray-100 rounded-lg">
                    <p className="text-gray-500 font-medium animate-pulse">Starting Camera...</p>
                </div>
            ) : (
                <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-inner group">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />

                    <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 z-10">
                        <button
                            onClick={capture}
                            className="flex items-center gap-2 px-6 py-3 bg-white text-primary rounded-full font-bold shadow-lg hover:shadow-xl active:scale-95 transition-all"
                        >
                            <Camera size={24} /> Capture Face
                        </button>
                        <button
                            onClick={stopCamera}
                            className="flex items-center gap-2 px-6 py-3 bg-red-500/80 backdrop-blur-sm text-white rounded-full font-bold hover:bg-red-600 transition-colors"
                        >
                            <StopCircle size={24} /> Stop
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CameraCapture;
