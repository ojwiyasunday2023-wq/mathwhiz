
"use client"

import React from 'react';
import { SolvedEquation } from '@/lib/types';
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EquationHistoryProps {
  history: SolvedEquation[];
  onSelect: (item: SolvedEquation) => void;
  onClear: () => void;
}

export function EquationHistory({ history, onSelect, onClear }: EquationHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 space-y-4">
        <History className="h-12 w-12 opacity-20" />
        <p className="text-center text-sm">No history yet. Start solving to see your results here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
        <h2 className="text-lg font-headline font-bold flex items-center gap-2">
          <History className="h-5 w-5" />
          History
        </h2>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 hover:bg-sidebar-accent text-sidebar-foreground"
          onClick={onClear}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {history.map((item) => (
            <Card 
              key={item.id} 
              className="bg-sidebar-accent/50 border-sidebar-border hover:bg-sidebar-accent transition-colors cursor-pointer group"
              onClick={() => onSelect(item)}
            >
              <CardContent className="p-3">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-sidebar-foreground/60 flex items-center gap-1 font-body">
                      <Clock className="h-3 w-3" />
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="font-code text-sm truncate text-sidebar-foreground">
                    {item.equation}
                  </p>
                  <p className="font-code text-accent font-bold text-sm truncate">
                    = {item.finalAnswer}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
