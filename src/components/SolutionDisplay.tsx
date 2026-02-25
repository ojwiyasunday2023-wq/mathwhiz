
"use client"

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ChevronRight, Share2, Copy, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface SolutionDisplayProps {
  equation: string;
  solution: string;
  answer: string;
  loading?: boolean;
}

const FormattedMath = ({ text, className = "" }: { text: string; className?: string }) => {
  const parts = text.split(/(\b[\d\w\(\)]+\/[\d\w\(\)]+\b)/g);

  return (
    <span className={`inline-flex flex-wrap items-baseline gap-1 ${className}`}>
      {parts.map((part, i) => {
        if (part.includes('/') && !part.startsWith('http')) {
          const [num, den] = part.split('/');
          const cleanNum = num.replace(/[\(\)]/g, '');
          const cleanDen = den.replace(/[\(\)]/g, '');
          
          return (
            <span key={i} className="inline-flex flex-col items-center align-middle mx-1 leading-none text-center min-w-[1em]">
              <span className="border-b border-foreground/40 px-0.5 pb-0.5 text-[0.9em] font-medium">{cleanNum}</span>
              <span className="pt-0.5 text-[0.9em] font-medium">{cleanDen}</span>
            </span>
          );
        }
        
        const expParts = part.split(/(\w+\^\d+)/g);
        return expParts.map((sub, j) => {
          if (sub.includes('^')) {
            const [base, exp] = sub.split('^');
            return <span key={`${i}-${j}`}>{base}<sup>{exp}</sup></span>;
          }
          return <span key={`${i}-${j}`}>{sub}</span>;
        });
      })}
    </span>
  );
};

export function SolutionDisplay({ equation, solution, answer, loading }: SolutionDisplayProps) {
  const { toast } = useToast();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${equation}\n\nSolution:\n${solution}\n\nAnswer: ${answer}`);
    toast({
      title: "Copied!",
      description: "Solution copied to clipboard.",
    });
  };

  if (loading) {
    return (
      <Card className="w-full border-2 border-primary/10 shadow-lg animate-pulse">
        <CardContent className="p-8 flex flex-col items-center justify-center space-y-4">
          <div className="h-8 w-3/4 bg-muted rounded-full"></div>
          <div className="h-3 w-1/2 bg-muted rounded"></div>
          <div className="h-3 w-2/3 bg-muted rounded"></div>
          <div className="h-3 w-1/3 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (!solution) return null;

  const steps = solution
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 5);

  return (
    <div className="space-y-4 animate-fade-in w-full max-w-2xl mx-auto pb-8">
      <Card className="border border-primary/20 shadow-xl overflow-hidden rounded-2xl">
        <CardHeader className="bg-primary p-5">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className="border-white/40 text-white font-bold text-[9px] uppercase tracking-widest px-2 py-0.5 bg-white/10">
              Active Problem
            </Badge>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" className="h-7 w-7 text-white hover:bg-white/20 rounded-full" onClick={copyToClipboard}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <CardTitle className="font-code text-xl text-white break-words leading-tight tracking-tight">
            <FormattedMath text={equation} />
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 md:p-8 space-y-8 bg-white">
          <div>
            <h3 className="text-[10px] font-headline uppercase tracking-widest text-muted-foreground/60 mb-6 font-black flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              Step-by-Step Methodology
            </h3>
            
            <div className="space-y-6">
              {steps.map((step, idx) => (
                <div key={idx} className="flex gap-4 group items-start relative">
                  {idx !== steps.length - 1 && (
                    <div className="absolute left-[0.75rem] top-8 bottom-[-1.5rem] w-px bg-gradient-to-b from-primary/20 to-transparent z-0" />
                  )}
                  
                  <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-primary text-white flex items-center justify-center text-[10px] font-bold font-code shadow-md shadow-primary/20 z-10">
                    {idx + 1}
                  </span>
                  
                  <div className="flex-1 pt-0.5">
                    <p className="font-body text-base leading-relaxed text-foreground/90 whitespace-pre-wrap">
                      <FormattedMath text={step.replace(/^Step \d+:?\s*/i, '').replace(/^\d+\.\s*/, '')} />
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-dashed border-border/60">
            <h3 className="text-[10px] font-headline uppercase tracking-widest text-accent mb-4 font-black flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              Final Verified Result
            </h3>
            <div className="bg-accent/5 p-6 rounded-2xl border border-accent/20 shadow-inner transition-all hover:bg-accent/[0.07] cursor-default">
              <p className="font-code text-3xl md:text-4xl font-bold text-accent break-words tracking-tighter text-center md:text-left">
                <FormattedMath text={answer} />
              </p>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="bg-muted/30 p-4 border-t border-border flex justify-between items-center">
           <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-tighter">
             Verified by MATHWHIZ Engine
           </p>
           <div className="flex gap-2">
             <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1.5 rounded-full font-bold px-3" onClick={copyToClipboard}>
               <Share2 className="h-3 w-3" />
               Share
             </Button>
           </div>
        </CardFooter>
      </Card>
    </div>
  );
}
