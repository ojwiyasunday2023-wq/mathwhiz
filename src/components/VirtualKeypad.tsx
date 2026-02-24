
"use client"

import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Minus, 
  X, 
  Divide, 
  Equal, 
  Superscript, 
  Hash 
} from "lucide-react";

// Custom Square Root icon
const SquareRootIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    width="16"
    height="16"
  >
    <path d="M3 11h2l4 8 7-16h5" />
  </svg>
);

// Custom Fraction icon
const FractionIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    width="16"
    height="16"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <circle cx="8" cy="6" r="1" fill="currentColor" />
    <circle cx="16" cy="18" r="1" fill="currentColor" />
  </svg>
);

interface VirtualKeypadProps {
  onKeyPress: (key: string) => void;
  onClear: () => void;
  onBackspace: () => void;
}

const keys = [
  { label: '7', value: '7' }, { label: '8', value: '8' }, { label: '9', value: '9' }, { label: '/', value: '/', icon: Divide },
  { label: '4', value: '4' }, { label: '5', value: '5' }, { label: '6', value: '6' }, { label: '*', value: '*', icon: X },
  { label: '1', value: '1' }, { label: '2', value: '2' }, { label: '3', value: '3' }, { label: '-', value: '-', icon: Minus },
  { label: '0', value: '0' }, { label: '.', value: '.' }, { label: '(', value: '(' }, { label: '+', value: '+', icon: Plus },
  { label: ')', value: ')' }, { label: '^', value: '^', icon: Superscript }, { label: '√', value: 'sqrt(', icon: SquareRootIcon }, { label: '=', value: '=', icon: Equal },
  { label: 'frac', value: '/', icon: FractionIcon }, { label: 'x', value: 'x' }, { label: 'y', value: 'y' }, { label: 'π', value: 'pi' }
];

export function VirtualKeypad({ onKeyPress, onClear, onBackspace }: VirtualKeypadProps) {
  return (
    <div className="grid grid-cols-4 gap-2 p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-border shadow-sm">
      <Button variant="outline" className="h-10 text-destructive font-bold text-xs" onClick={onClear}>AC</Button>
      <Button variant="outline" className="h-10 text-xs" onClick={onBackspace}>DEL</Button>
      <Button variant="outline" className="h-10 font-code text-xs" onClick={() => onKeyPress('x')}>x</Button>
      <Button variant="outline" className="h-10 font-code text-xs" onClick={() => onKeyPress('y')}>y</Button>
      
      {keys.map((key) => (
        <Button
          key={key.label}
          variant="secondary"
          className="h-10 font-semibold hover:bg-primary/10 hover:text-primary transition-colors text-xs"
          onClick={() => onKeyPress(key.value)}
        >
          {key.icon ? <key.icon className="h-4 w-4" /> : key.label}
        </Button>
      ))}
    </div>
  );
}
