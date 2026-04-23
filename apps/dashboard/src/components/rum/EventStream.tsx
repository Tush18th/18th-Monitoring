import React from 'react';
import { Card } from '../ui/Card';
import { Terminal, Globe, MousePointer, ShieldAlert } from 'lucide-react';

interface RumEvent {
  id: string;
  type: string;
  url: string;
  timestamp: string;
  metadata: any;
}

interface EventStreamProps {
  events: RumEvent[];
}

export const EventStream: React.FC<EventStreamProps> = ({ events }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'page_view': return <Globe className="w-4 h-4 text-blue-400" />;
      case 'click': return <MousePointer className="w-4 h-4 text-purple-400" />;
      case 'js_error': return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      default: return <Terminal className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <Card className="flex flex-col h-[600px] bg-slate-900/50 backdrop-blur-xl border-slate-800">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h3 className="font-semibold text-slate-200 flex items-center gap-2">
          <Terminal className="w-4 h-4" />
          Real-Time Event Stream
        </h3>
        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/20 animate-pulse">
          LIVE
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-hide">
        {events.map((event) => (
          <div key={event.id} className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 hover:border-slate-600 transition-colors group">
            <div className="flex justify-between items-start mb-1">
              <div className="flex items-center gap-2">
                {getIcon(event.type)}
                <span className="text-sm font-medium text-slate-200">{event.type.replace('_', ' ')}</span>
              </div>
              <span className="text-[10px] text-slate-500">{new Date(event.timestamp).toLocaleTimeString()}</span>
            </div>
            
            <div className="text-xs text-slate-400 truncate mb-2">
              {event.url}
            </div>
            
            {event.metadata && Object.keys(event.metadata).length > 0 && (
              <div className="bg-black/20 p-2 rounded text-[10px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                {JSON.stringify(event.metadata, null, 2)}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};
