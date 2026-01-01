import React, { useState } from 'react';
import { GenerationResult } from '../types';
import { Loader2, AlertCircle, CheckCircle2, BookOpen, Utensils } from 'lucide-react';

interface ResultCardProps {
  result: GenerationResult;
  className?: string;
  onGenerateGuide?: (id: string) => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({ result, className = "", onGenerateGuide }) => {
  const [showGuide, setShowGuide] = useState(false);

  const handleGuideClick = () => {
    if (!result.guideUrl && result.guideStatus !== 'loading' && onGenerateGuide) {
      onGenerateGuide(result.id);
      setShowGuide(true); // Switch to guide view to show loader
    } else {
      setShowGuide(!showGuide);
    }
  };

  // Determine what to show in the main area
  const isShowingGuide = showGuide && (result.guideStatus === 'loading' || result.guideUrl);
  const displayImage = isShowingGuide ? result.guideUrl : result.imageUrl;
  const isLoading = isShowingGuide ? result.guideStatus === 'loading' : result.status === 'loading';
  const error = isShowingGuide ? result.guideError : result.error;

  return (
    <div className={`bg-white border border-stone-200 rounded-xl overflow-hidden flex flex-col h-full shadow-lg transition-all duration-300 hover:border-gold-500/50 hover:shadow-xl group ${className}`}>
      {/* Header */}
      <div className="p-3 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
           <h3 className="font-serif text-lg text-stone-900 truncate">{result.label}</h3>
           <span className="text-[10px] font-mono text-stone-500 bg-stone-200 px-1.5 py-0.5 rounded whitespace-nowrap hidden sm:inline-block">
             {result.modelName}
           </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative bg-stone-100 flex items-center justify-center min-h-[150px] overflow-hidden">
        
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm z-10 p-4 text-center">
            <Loader2 className="w-6 h-6 text-gold-500 animate-spin mb-2" />
            <p className="text-stone-800 text-xs font-medium animate-pulse">
              {isShowingGuide ? "Creating step-by-step guide..." : "Plating..."}
            </p>
          </div>
        )}

        {/* Error State */}
        {(result.status === 'error' || (isShowingGuide && result.guideStatus === 'error')) && (
          <div className="flex flex-col items-center justify-center p-4 text-center text-red-500 z-10">
            <AlertCircle className="w-6 h-6 mb-2 opacity-80" />
            <p className="text-[10px]">{error || "Failed"}</p>
          </div>
        )}

        {/* Display Image (Dish or Guide) */}
        {!isLoading && displayImage && (
          <div className="relative w-full h-full group-hover:scale-105 transition-transform duration-700 ease-out">
            <img 
              src={displayImage} 
              alt={isShowingGuide ? "Step-by-step guide" : result.label} 
              className="w-full h-full object-cover absolute inset-0"
            />
            {/* Download Button */}
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
               <a href={displayImage} download={`michelin-${isShowingGuide ? 'guide' : 'dish'}-${result.id}.png`} className="bg-white/80 hover:bg-white text-stone-900 p-1.5 rounded-full backdrop-blur-md border border-stone-200 shadow-lg block" title="Download">
                 <CheckCircle2 className="w-4 h-4 text-gold-600" />
               </a>
            </div>
          </div>
        )}

        {/* Idle State */}
        {result.status === 'idle' && (
          <div className="text-stone-400 flex flex-col items-center">
            <div className="w-10 h-10 rounded-full border-2 border-dashed border-stone-300 flex items-center justify-center mb-2">
              <span className="text-lg font-serif text-stone-300">M</span>
            </div>
          </div>
        )}

        {/* Action Bar (Overlay) */}
        {result.status === 'success' && onGenerateGuide && (
           <div className="absolute top-2 right-2 flex gap-2 z-20">
              <button 
                onClick={handleGuideClick}
                disabled={result.guideStatus === 'loading'}
                className={`
                   flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-md border transition-all
                   ${showGuide 
                     ? 'bg-gold-500 text-white border-gold-400' 
                     : 'bg-white/90 text-stone-700 border-stone-200 hover:bg-white hover:text-gold-600'}
                `}
              >
                {showGuide ? <Utensils className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                {showGuide ? "Show Dish" : "Chef's Guide"}
              </button>
           </div>
        )}
      </div>
    </div>
  );
};