import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEvent } from './hooks/useEvent';
import { useFaceMatch } from './hooks/useFaceMatch';
import CameraCapture from './components/CameraCapture';
import Gallery from './components/Gallery';
import Register from './components/Register';
import Login from './components/Login';
import './App.css';

const queryClient = new QueryClient();

const handleLogout = () => {
  localStorage.clear();
  queryClient.clear();
  window.location.reload();
};

function EventApp() {
  const [eventId, setEventId] = useState(null);
  const [matchedPhotos, setMatchedPhotos] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  // Extract eventId from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('eventId');
    if (id) setEventId(id);
  }, []);

  const { data: eventInfo, isLoading: isEventLoading, error: eventError } = useEvent(eventId);
  const { mutate: matchFace, isPending: isMatching } = useFaceMatch();

  const handleCapture = (imageBlob) => {
    matchFace({ eventId, imageBlob }, {
      onSuccess: (data) => {
        setMatchedPhotos(data);
      },
      onError: (err) => {
        alert("Failed to match face: " + err.message);
      }
    });
  };

  if (showRegister) {
    return (
      <div className="min-h-screen bg-bg p-4 flex flex-col">
        <Register
          onBack={() => setShowRegister(false)}
          onLoginClick={() => { setShowRegister(false); setShowLogin(true); }}
        />
      </div>
    );
  }

  if (showLogin) {
    return (
      <div className="min-h-screen bg-bg p-4 flex flex-col">
        <Login
          onBack={() => setShowLogin(false)}
          onRegisterClick={() => { setShowLogin(false); setShowRegister(true); }}
        />
      </div>
    );
  }

  if (!eventId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg p-4 text-center">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-4">
          📸 Event Photo Gallery
        </h1>
        <p className="text-xl text-gray-600 mb-8">Please scan a QR code to access an event.</p>
        <button
          onClick={() => setShowRegister(true)}
          className="text-primary font-bold hover:underline"
        >
          Are you an Administrator? Create an account here
        </button>
      </div>
    );
  }

  if (isEventLoading) return <div className="min-h-screen flex items-center justify-center text-xl text-primary font-medium">Loading Event...</div>;
  if (eventError) return <div className="min-h-screen flex items-center justify-center text-xl text-red-500 font-medium">Error loading event. It may be expired.</div>;

  return (
    <div className="min-h-screen bg-bg font-sans text-text flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">
            {eventInfo.replace('Event ', '')} Gallery
          </h1>
          <div className="flex gap-4">
            {localStorage.getItem('authToken') ? (
              <button
                onClick={handleLogout}
                className="text-sm font-semibold text-red-500 hover:text-red-700 transition-colors"
              >
                Logout
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowLogin(true)}
                  className="text-sm font-semibold text-gray-500 hover:text-primary transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => setShowRegister(true)}
                  className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-opacity-90 transition-all"
                >
                  Admin Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col p-4">
        {!matchedPhotos ? (
          <div className="flex-grow flex flex-col items-center justify-center max-w-4xl mx-auto w-full">
            {isMatching ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="spinner mb-4"></div>
                <p className="text-xl font-medium text-gray-600 animate-pulse">Analyzing Face...</p>
              </div>
            ) : (
              <div className="w-full text-center">
                <h2 className="text-3xl font-extrabold text-gray-800 mb-2">Welcome! 👋</h2>
                <p className="text-gray-500 mb-8">Scan your face to find your photos instantly.</p>
                <CameraCapture onCapture={handleCapture} />
              </div>
            )}
          </div>
        ) : (
          <Gallery photos={matchedPhotos} onScanAgain={() => setMatchedPhotos(null)} />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <EventApp />
    </QueryClientProvider>
  );
}
