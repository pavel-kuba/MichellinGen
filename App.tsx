import React, { useState, useCallback } from 'react';
import { Upload, ChefHat, Sparkles } from 'lucide-react';
import { fileToBase64, getMimeType } from './services/utils';
import { generateNanoBananaImage, generateNanoBananaProImage, generatePlatingGuide } from './services/genai';
import { GenerationResult, ModelType, UploadedFile, HistoryEntry } from './types';
import { ResultCard } from './components/ResultCard';
import { HistoryList } from './components/HistoryList';

// Helper to create initial empty states for 3 variations
const createInitialState = (type: ModelType, label: string, modelName: string, desc: string): GenerationResult[] => {
  return Array(3).fill(null).map((_, i) => ({
    id: `${type}_${Date.now()}_${i}`,
    type,
    status: 'idle',
    label: `${label} #${i + 1}`,
    modelName,
    description: desc
  }));
};

export default function App() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const [nanoResults, setNanoResults] = useState<GenerationResult[]>(
    createInitialState(
      ModelType.NANO_BANANA, 
      'Nano Banana', 
      'gemini-2.5-flash-image', 
      'Fast reimagining'
    )
  );

  const [proResults, setProResults] = useState<GenerationResult[]>(
    createInitialState(
      ModelType.NANO_BANANA_PRO, 
      'Nano Banana Pro', 
      'gemini-3-pro-image-preview', 
      'High-fidelity plating'
    )
  );

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await fileToBase64(file);
      const mimeType = getMimeType(file);
      
      setUploadedFile({
        file,
        previewUrl: URL.createObjectURL(file),
        base64,
        mimeType
      });

      // Reset results for new upload
      setNanoResults(createInitialState(
        ModelType.NANO_BANANA, 
        'Nano Banana', 
        'gemini-2.5-flash-image', 
        'Fast reimagining'
      ));
      setProResults(createInitialState(
        ModelType.NANO_BANANA_PRO, 
        'Nano Banana Pro', 
        'gemini-3-pro-image-preview', 
        'High-fidelity plating'
      ));

    } catch (e) {
      console.error("File upload error", e);
    }
  };

  const updateNanoResult = (index: number, update: Partial<GenerationResult>) => {
    setNanoResults(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...update };
      return next;
    });
  };

  const updateProResult = (index: number, update: Partial<GenerationResult>) => {
    setProResults(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...update };
      return next;
    });
  };

  const handleGenerateGuide = async (id: string) => {
    // Find the result in either nano or pro arrays
    let targetList = nanoResults;
    let setTargetList = setNanoResults;
    let index = targetList.findIndex(r => r.id === id);
    
    if (index === -1) {
      targetList = proResults;
      setTargetList = setProResults;
      index = targetList.findIndex(r => r.id === id);
    }

    if (index === -1) return; // Not found

    const result = targetList[index];
    if (!result.imageUrl) return;

    // Set Loading
    setTargetList(prev => {
      const next = [...prev];
      next[index] = { ...next[index], guideStatus: 'loading' };
      return next;
    });

    try {
      // Strip prefix for API if needed, but our helper logic handles parts usually
      // However, imageUrl stores "data:image/png;base64,..."
      // The generateContent inlineData needs JUST the base64 string.
      const base64 = result.imageUrl.split(',')[1];
      
      const guideUrl = await generatePlatingGuide(base64);
      
      setTargetList(prev => {
        const next = [...prev];
        next[index] = { ...next[index], guideStatus: 'success', guideUrl };
        return next;
      });
    } catch (e: any) {
      setTargetList(prev => {
        const next = [...prev];
        next[index] = { ...next[index], guideStatus: 'error', guideError: e.message };
        return next;
      });
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!uploadedFile || isGenerating) return;

    setIsGenerating(true);

    // Create fresh initial states for this run so we don't reuse IDs/Images
    const freshNanoState = createInitialState(
        ModelType.NANO_BANANA, 
        'Nano Banana', 
        'gemini-2.5-flash-image', 
        'Fast reimagining'
    );
    const freshProState = createInitialState(
        ModelType.NANO_BANANA_PRO, 
        'Nano Banana Pro', 
        'gemini-3-pro-image-preview', 
        'High-fidelity plating'
    );
    
    setNanoResults(freshNanoState.map(r => ({...r, status: 'loading'})));
    setProResults(freshProState.map(r => ({...r, status: 'loading'})));

    // Helper to generate and return the final result object
    const runGeneration = async (
      item: GenerationResult, 
      apiCall: (b64: string, mime: string) => Promise<string>,
      updateState: (idx: number, u: Partial<GenerationResult>) => void,
      index: number
    ): Promise<GenerationResult> => {
       try {
         const url = await apiCall(uploadedFile.base64, uploadedFile.mimeType);
         const successResult: GenerationResult = { ...item, status: 'success', imageUrl: url };
         updateState(index, { status: 'success', imageUrl: url });
         return successResult;
       } catch (e: any) {
         const errorResult: GenerationResult = { ...item, status: 'error', error: e.message };
         updateState(index, { status: 'error', error: e.message });
         return errorResult;
       }
    };

    // Parallel Execution
    const nanoPromise = Promise.all(
      freshNanoState.map((item, i) => runGeneration(item, generateNanoBananaImage, updateNanoResult, i))
    );
    
    const proPromise = Promise.all(
      freshProState.map((item, i) => runGeneration(item, generateNanoBananaProImage, updateProResult, i))
    );

    const [finalNano, finalPro] = await Promise.all([nanoPromise, proPromise]);

    // Add to History
    const newEntry: HistoryEntry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      inputImage: uploadedFile.previewUrl,
      nanoResults: finalNano,
      proResults: finalPro
    };

    setHistory(prev => [newEntry, ...prev]);
    setIsGenerating(false);

  }, [uploadedFile, isGenerating]);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 font-sans selection:bg-gold-500/30">
      
      {/* Navbar */}
      <nav className="border-b border-stone-200 bg-white/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-gold-500/20">
              <ChefHat size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold tracking-tight text-stone-900">Michelin<span className="text-gold-600">Gen</span></h1>
              <p className="text-xs text-stone-500 uppercase tracking-widest">AI Culinary Reimagining</p>
            </div>
          </div>
          <div className="text-sm text-stone-500 hidden sm:block">
            Powered by Gemini Nano & Pro
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-16">
        
        {/* Workspace Section */}
        <section className="relative">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* Input Column */}
            <div className="w-full lg:w-1/3 space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xl shadow-stone-200/50 sticky top-24">
                <h2 className="text-lg font-serif text-stone-900 mb-4 flex items-center gap-2">
                  <span className="w-6 h-px bg-gold-500"></span>
                  Current Kitchen
                </h2>
                
                <div className="aspect-square w-full bg-stone-50 rounded-xl border-2 border-dashed border-stone-300 overflow-hidden relative group transition-colors hover:border-gold-500/50">
                  {uploadedFile ? (
                    <img 
                      src={uploadedFile.previewUrl} 
                      alt="Original dish" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-400 p-4 text-center">
                      <Upload className="w-12 h-12 mb-4 text-stone-300 group-hover:text-gold-500 transition-colors" />
                      <p className="text-sm font-medium text-stone-500">Upload a photo of your food</p>
                      <p className="text-xs mt-2 text-stone-400">Supports JPG, PNG</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>

                {uploadedFile && (
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full mt-4 bg-gold-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-gold-500/20 hover:bg-gold-600 hover:shadow-gold-500/40 active:transform active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" />
                    {isGenerating ? "Cooking..." : "Recreate Plate"}
                  </button>
                )}
              </div>
            </div>

            {/* Results Grid */}
            <div className="w-full lg:w-2/3 space-y-10">
               
               {/* Nano Banana Section */}
               <div className="space-y-4">
                 <h2 className="text-2xl font-serif text-stone-900 border-l-4 border-gold-400 pl-4">
                   Standard Plating <span className="text-stone-400 text-lg font-sans font-normal ml-2">(Nano Banana)</span>
                 </h2>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {nanoResults.map((result) => (
                      <div key={result.id} className="h-[300px]">
                        <ResultCard 
                          result={result} 
                          onGenerateGuide={handleGenerateGuide}
                        />
                      </div>
                    ))}
                 </div>
               </div>

               {/* Nano Banana Pro Section */}
               <div className="space-y-4">
                 <h2 className="text-2xl font-serif text-stone-900 border-l-4 border-gold-600 pl-4">
                   Fine Dining Signature <span className="text-stone-400 text-lg font-sans font-normal ml-2">(Nano Banana Pro)</span>
                 </h2>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {proResults.map((result) => (
                      <div key={result.id} className="h-[300px]">
                        <ResultCard 
                           result={result} 
                           onGenerateGuide={handleGenerateGuide}
                        />
                      </div>
                    ))}
                 </div>
               </div>
            </div>
          </div>
        </section>

        {/* History Section */}
        {history.length > 0 && (
          <section className="pt-8 border-t border-stone-200">
            <HistoryList history={history} />
          </section>
        )}

      </main>

      <footer className="border-t border-stone-200 mt-12 py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center text-stone-500 text-sm">
          <p>© {new Date().getFullYear()} MichelinGen AI. Built with Google Gemini.</p>
        </div>
      </footer>
    </div>
  );
}