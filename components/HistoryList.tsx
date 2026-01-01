import React from 'react';
import { HistoryEntry } from '../types';
import { ResultCard } from './ResultCard';
import { Clock, ChefHat } from 'lucide-react';

interface HistoryListProps {
  history: HistoryEntry[];
}

export const HistoryList: React.FC<HistoryListProps> = ({ history }) => {
  if (history.length === 0) return null;

  return (
    <div className="space-y-12">
      <div className="flex items-center gap-4">
         <h2 className="text-2xl font-serif text-stone-900">Culinary Archive</h2>
         <div className="h-px flex-1 bg-stone-200"></div>
         <span className="text-xs font-mono text-stone-400 uppercase tracking-widest">{history.length} Sessions</span>
      </div>

      <div className="space-y-16">
        {history.map((entry) => (
          <div key={entry.id} className="relative group">
            {/* Timeline Connector */}
            <div className="absolute left-6 top-16 bottom-0 w-px bg-stone-200 -z-10 hidden lg:block group-last:hidden"></div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
              
              {/* Meta & Input */}
              <div className="w-full lg:w-64 flex-shrink-0 space-y-4">
                 <div className="flex items-center gap-2 text-stone-400 text-sm font-medium">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(entry.timestamp).toLocaleString(undefined, {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}</span>
                 </div>

                 <div className="relative aspect-square w-32 lg:w-full rounded-xl overflow-hidden border border-stone-200 shadow-sm">
                   <img src={entry.inputImage} alt="Input" className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-black/10"></div>
                   <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm">
                     Original
                   </div>
                 </div>
              </div>

              {/* Results Grid */}
              <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                 {/* Combine all results for this entry into a grid */}
                 {/* Nano Results */}
                 {entry.nanoResults.map((result) => (
                   <div key={result.id} className="h-64">
                     {/* History items are currently read-only for Guide generation to keep state simple */}
                     <ResultCard result={result} />
                   </div>
                 ))}
                 
                 {/* Pro Results */}
                 {entry.proResults.map((result) => (
                   <div key={result.id} className="h-64">
                     <ResultCard result={result} className="border-gold-500/20" />
                   </div>
                 ))}
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
};