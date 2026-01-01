import React, { useEffect, useState } from 'react';

// Use explicit casting when accessing window.aistudio to avoid conflicts 
// with existing global type definitions of AIStudio.

interface ApiKeyManagerProps {
  onReady: (ready: boolean) => void;
}

export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ onReady }) => {
  const [hasKey, setHasKey] = useState(false);
  const [checking, setChecking] = useState(true);

  const checkKey = async () => {
    // Access aistudio safely bypassing strict type checks that cause conflicts
    const aistudio = (window as any).aistudio;
    
    if (aistudio) {
      try {
        const selected = await aistudio.hasSelectedApiKey();
        setHasKey(selected);
        onReady(selected);
      } catch (e) {
        console.error("Error checking API key status", e);
        // Fallback: If not in the specific environment, we assume process.env is handled externally
        // and allow the app to proceed, though Veo calls might fail if not billed.
        setHasKey(true); 
        onReady(true);
      }
    } else {
      // Not in the specific AI Studio wrapper environment, assume standard usage
      setHasKey(true);
      onReady(true);
    }
    setChecking(false);
  };

  useEffect(() => {
    checkKey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      await aistudio.openSelectKey();
      // Assume success after interaction to avoid race conditions
      setHasKey(true);
      onReady(true);
    }
  };

  if (checking) return null;

  if (!hasKey) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-gold-600 text-black p-4 text-center z-50 flex items-center justify-center gap-4">
        <span className="font-medium">To use Veo (Kling-style video), a billed API key is required.</span>
        <button 
          onClick={handleConnect}
          className="bg-black text-gold-500 px-4 py-2 rounded font-bold hover:bg-gray-900 transition-colors"
        >
          Connect Google AI Studio
        </button>
      </div>
    );
  }

  return null;
};