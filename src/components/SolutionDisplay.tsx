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

/**
 * A helper component to render math text with better formatting.
 * Handles vertical fractions (x/b) and exponents (x^2).
 */
const FormattedMath = ({ text, className = "" }: { text: string; className?: string }) => {
  // Enhanced regex to catch simple fractions a/b or (a)/(b)
  // Avoids catching URLs or long text strings.
  const parts = text.split(/(\b[\d\w\(\)]+\/[\d\w\(\)]+\b)/g);

  return (
    <span className={`inline-flex flex-wrap items-baseline gap-1 ${className}`}>
      {parts.map((part, i) => {
        if (part.includes('/') && !part.startsWith('http')) {
          const [num, den] = part.split('/');
          const cleanNum = num.replace(/[\(\)]/g, '');
          const cleanDen = den.replace(/[\(\)]/g, '');
          
          return (
            <span key={i} className="inline-flex flex-col items-center align-middle mx-1 leading-none text-center min-w-[1.2em]">
              <span className="border-b border-foreground/40 px-1 pb-1 text-[0.95em] font-medium">{cleanNum}</span>
              <span className="pt-1 text-[0.95em] font-medium">{cleanDen}</span>
            </span>
          );
        }
        
        // Handle standard exponents if AI didn't use Unicode
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
        <CardContent className="p-12 flex flex-col items-center justify-center space-y-6">
          <div className="h-10 w-3/4 bg-muted rounded-full"></div>
          <div className="h-4 w-1/2 bg-muted rounded"></div>
          <div className="h-4 w-2/3 bg-muted rounded"></div>
          <div className="h-4 w-1/3 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (!solution) return null;

  // Split and clean steps
  const steps = solution
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 5); // Filter out very short lines that aren't steps

  return (
    <div className="space-y-8 animate-fade-in w-full max-w-3xl mx-auto pb-12">
      <Card className="border-2 border-primary/20 shadow-2xl overflow-hidden rounded-3xl">
        <CardHeader className="bg-primary p-8">
          <div className="flex items-center justify-between mb-4">
            <Badge variant="outline" className="border-white/40 text-white font-bold text-[10px] uppercase tracking-widest px-3 py-1 bg-white/10">
              Active Problem
            </Badge>
            <div className="flex gap-2">
              <Button size="icon" variant="ghost" className="h-9 w-9 text-white hover:bg-white/20 rounded-full" onClick={copyToClipboard}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardTitle className="font-code text-3xl text-white break-words leading-tight tracking-tight">
            <FormattedMath text={equation} />
          </CardTitle>
        </CardHeader>

        <CardContent className="p-8 md:p-10 space-y-12 bg-white">
          <div>
            <h3 className="text-xs font-headline uppercase tracking-widest text-muted-foreground/60 mb-8 font-black flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Step-by-Step Methodology
            </h3>
            
            <div className="space-y-10">
              {steps.map((step, idx) => (
                <div key={idx} className="flex gap-6 group items-start relative">
                  {/* Vertical Line Connector */}
                  {idx !== steps.length - 1 && (
                    <div className="absolute left-[1.125rem] top-10 bottom-[-2.5rem] w-px bg-gradient-to-b from-primary/20 to-transparent z-0" />
                  )}
                  
                  <span className="flex-shrink-0 w-9 h-9 rounded-2xl bg-primary text-white flex items-center justify-center text-sm font-bold font-code shadow-md shadow-primary/20 z-10">
                    {idx + 1}
                  </span>
                  
                  <div className="flex-1 pt-1.5">
                    <p className="font-body text-lg leading-relaxed text-foreground/90 whitespace-pre-wrap">
                      <FormattedMath text={step.replace(/^Step \d+:?\s*/i, '').replace(/^\d+\.\s*/, '')} />
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-10 border-t-2 border-dashed border-border/60">
            <h3 className="text-sm font-headline uppercase tracking-widest text-accent mb-6 font-black flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6" />
              Final Verified Result
            </h3>
            <div className="bg-accent/5 p-10 rounded-[2.5rem] border-2 border-accent/20 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:shadow-lg hover:bg-accent/[0.07] cursor-default">
              <p className="font-code text-5xl md:text-6xl font-bold text-accent break-words tracking-tighter text-center md:text-left">
                <FormattedMath text={answer} />
              </p>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="bg-muted/30 p-6 border-t border-border flex justify-between items-center">
           <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
             Verified by MATHWHIZ Engine
           </p>
           <div className="flex gap-2">
             <Button variant="outline" size="sm" className="gap-2 rounded-full font-bold px-5" onClick={copyToClipboard}>
               <Share2 className="h-4 w-4" />
               Share Solution
             </Button>
           </div>
        </CardFooter>
      </Card>
    </div>
  );
}
