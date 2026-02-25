
"use client"

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { solveEquation } from '@/ai/flows/solve-equation-and-display-solution-flow';
import { localSolve } from '@/lib/local-solver';
import { SolvedEquation } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SidebarProvider, Sidebar, SidebarContent, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { VirtualKeypad } from '@/components/VirtualKeypad';
import { EquationHistory } from '@/components/EquationHistory';
import { SolutionDisplay } from '@/components/SolutionDisplay';
import { BrainCircuit, Keyboard, Wifi, WifiOff, Send, Sparkles, LogIn, User, UserPlus, Share2, Calculator, Camera, FileUp, FileText, X, AlertCircle, HelpCircle } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { Badge } from '@/components/Badge';
import { useAuth, useUser, useFirestore, useCollection } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { collection, doc, setDoc, deleteDoc, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const EXAMPLES = [
  "3x + 5 = 20",
  "derivative of x^2 + 5x",
  "integral of sin(x)",
  "What is 15% of 250?",
  "solve for y: 2y - 4 = 10"
];

export default function MathWhiz() {
  const [equation, setEquation] = useState('');
  const [isSolving, setIsSolving] = useState(false);
  const [currentSolution, setCurrentSolution] = useState<SolvedEquation | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [showKeypad, setShowKeypad] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [localHistory, setLocalHistory] = useState<SolvedEquation[]>([]);
  
  const [attachment, setAttachment] = useState<{ url: string; name: string; type: string } | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { auth } = useAuth();
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirestore();
  const { toast } = useToast();

  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-math');
  const brandingImage = PlaceHolderImages.find(img => img.id === 'footer-branding');

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const historyQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'history'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
  }, [firestore, user]);

  const { data: cloudHistory } = useCollection(historyQuery);

  const history = useMemo(() => {
    if (user && cloudHistory) {
      return cloudHistory.map(doc => ({
        id: doc.id,
        equation: doc.equation,
        stepByStepSolution: doc.stepByStepSolution,
        finalAnswer: doc.finalAnswer,
        timestamp: doc.timestamp?.seconds ? doc.timestamp.seconds * 1000 : Date.now(),
      } as SolvedEquation));
    }
    return localHistory;
  }, [user, cloudHistory, localHistory]);

  const handleLogin = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    console.log("Login attempt started...");
    
    if (!auth) {
      console.error("Firebase Auth instance is null");
      toast({ 
        variant: "destructive", 
        title: "Configuration Error", 
        description: "Firebase Auth not initialized correctly." 
      });
      return;
    }
    
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      console.log("Opening Firebase Popup...");
      const result = await signInWithPopup(auth, provider);
      console.log("Login Success:", result.user.email);
      
      setIsGuestMode(false);
      toast({ title: "Welcome!", description: `Successfully signed in as ${result.user.displayName}` });
    } catch (error: any) {
      console.error("Firebase Login Detailed Error:", error);
      let message = error.message;
      
      if (error.code === 'auth/unauthorized-domain') {
        message = "DOMAIN ERROR: This URL is not authorized. Go to Firebase Console > Auth > Settings > Authorized Domains and add this exact URL.";
      } else if (error.code === 'auth/popup-blocked') {
        message = "POPUP BLOCKED: Your browser blocked the login window. Please allow popups for this site.";
      } else if (error.code === 'auth/cancelled-popup-request') {
        message = "Login was cancelled by closing the window.";
      } else if (error.code === 'auth/internal-error') {
        message = "Internal Auth Error. Try refreshing the page.";
      }
      
      toast({ 
        variant: "destructive", 
        title: "Authentication Failed", 
        description: message 
      });
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      setIsGuestMode(false);
      toast({ description: "Signed out successfully." });
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleShareApp = () => {
    if (navigator.share) {
      navigator.share({
        title: 'MATHWHIZ',
        text: 'Check out this AI math solver!',
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ description: "Link copied to clipboard!" });
    }
  };

  const handleSolve = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!equation.trim() && !attachment) return;

    setIsSolving(true);
    setCurrentSolution(null);

    try {
      let result;
      if (isOnline) {
        result = await solveEquation({ 
          equation: equation || "Mathematical problem analysis", 
          mediaDataUri: attachment?.url 
        });
      } else {
        if (attachment) {
          throw new Error("Local mode does not support file processing. Please connect to the internet.");
        }
        result = await localSolve(equation);
      }
      
      const solutionData = {
        equation: equation || "Problem from scan/upload",
        stepByStepSolution: result.stepByStepSolution,
        finalAnswer: result.finalAnswer,
      };

      const newEntry: SolvedEquation = {
        id: Math.random().toString(36).substring(7),
        ...solutionData,
        timestamp: Date.now(),
      } as SolvedEquation;

      setCurrentSolution(newEntry);

      if (user && firestore) {
        const historyRef = doc(collection(firestore, 'users', user.uid, 'history'));
        setDoc(historyRef, { ...solutionData, timestamp: serverTimestamp() }).catch(async () => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: historyRef.path,
            operation: 'create',
            requestResourceData: solutionData
          }));
        });
      } else {
        setLocalHistory(prev => [newEntry, ...prev].slice(0, 20));
      }
      
      setAttachment(null);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Solver Error", description: error.message });
    } finally {
      setIsSolving(false);
    }
  };

  const clearHistory = async () => {
    if (user && firestore && cloudHistory) {
      cloudHistory.forEach(item => {
        deleteDoc(doc(firestore, 'users', user.uid, 'history', item.id));
      });
    } else {
      setLocalHistory([]);
    }
  };

  const openCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions to scan equations.',
      });
    }
  };

  const closeCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setAttachment({ url: dataUrl, name: 'camera-capture.jpg', type: 'image/jpeg' });
        closeCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setAttachment({ url: result, name: file.name, type: file.type });
    };
    reader.readAsDataURL(file);
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <BrainCircuit className="h-10 w-10 text-primary animate-pulse" />
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Loading MATHWHIZ...</p>
        </div>
      </div>
    );
  }

  if (!user && !isGuestMode) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="h-14 border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-primary p-1 rounded-lg shadow-sm">
                <BrainCircuit className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-lg font-bold text-primary tracking-tight">
                MATH<span className="text-accent">WHIZ</span>
              </h1>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleLogin} type="button" className="text-xs h-8">Sign In</Button>
              <Button size="sm" onClick={handleLogin} type="button" className="text-xs h-8 shadow-md">Sign Up</Button>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col">
          <section className="py-12 px-4 md:px-8">
            <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-5">
                <Badge variant="outline" className="px-3 py-0.5 text-[10px] text-primary border-primary/20 bg-primary/5 uppercase tracking-widest font-bold">
                  AI-Powered Math Companion
                </Badge>
                <h2 className="text-3xl lg:text-5xl font-bold tracking-tighter leading-tight">
                  Solve Complex Math <br /> 
                  <span className="text-primary italic">In Seconds.</span>
                </h2>
                <p className="text-base text-muted-foreground leading-relaxed max-w-lg">
                  The ultimate tool for students and professionals. Now featuring Photo Scanning and instant step-by-step AI guidance.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button size="lg" onClick={handleLogin} type="button" className="h-11 px-6 text-sm gap-2 shadow-lg">
                    <UserPlus className="h-4 w-4" />
                    Sign Up Now
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => setIsGuestMode(true)} type="button" className="h-11 px-6 text-sm gap-2">
                    <Calculator className="h-4 w-4" />
                    Continue In Offline Mode
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-4 bg-primary/10 rounded-3xl blur-3xl" />
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                  {heroImage && (
                    <Image 
                      src={heroImage.imageUrl} 
                      alt={heroImage.description} 
                      width={1080} 
                      height={720} 
                      className="object-cover"
                      data-ai-hint={heroImage.imageHint}
                    />
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="py-8 px-4 md:px-8 bg-white">
            <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl border border-border hover:border-primary/50 transition-all space-y-2 group bg-muted/5">
                <div className="bg-primary/10 w-9 h-9 rounded-lg flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                  <Sparkles className="h-4 w-4 text-primary group-hover:text-white" />
                </div>
                <h3 className="text-base font-bold">Smart AI Solving</h3>
                <p className="text-xs text-muted-foreground">Get detailed, step-by-step solutions for complex algebra, calculus, and word problems instantly.</p>
              </div>
              <div className="p-5 rounded-2xl border border-border hover:border-accent/50 transition-all space-y-2 group bg-muted/5">
                <div className="bg-accent/10 w-9 h-9 rounded-lg flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-colors">
                  <Camera className="h-4 w-4 text-accent group-hover:text-white" />
                </div>
                <h3 className="text-base font-bold">Photo Scan</h3>
                <p className="text-xs text-muted-foreground">No more typing! Just take a clear photo of your problem to get instant answers and steps.</p>
              </div>
              <div className="p-5 rounded-2xl border border-border hover:border-blue-400/50 transition-all space-y-2 group bg-muted/5">
                <div className="bg-blue-100 w-9 h-9 rounded-lg flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <WifiOff className="h-4 w-4 text-blue-600 group-hover:text-white" />
                </div>
                <h3 className="text-base font-bold">Offline Mode</h3>
                <p className="text-xs text-muted-foreground">Stay productive anywhere! Access our local mathematical engine to solve expressions.</p>
              </div>
            </div>
          </section>

          <section className="py-8 px-4 bg-primary/5 flex flex-col items-center">
            <div className="relative w-full max-w-lg aspect-[21/9] rounded-2xl overflow-hidden shadow-xl border-2 border-white">
               {brandingImage && (
                  <Image 
                    src={brandingImage.imageUrl} 
                    alt="LAMOGI Branding" 
                    fill
                    className="object-cover"
                    data-ai-hint={brandingImage.imageHint}
                  />
                )}
            </div>
            <div className="mt-4 text-center">
              <p className="text-[9px] font-black tracking-[0.3em] text-primary/50 uppercase">
                Design & Engineering by
              </p>
              <h4 className="text-lg font-bold text-primary mt-1">LAMOGI PRODUCTION</h4>
            </div>
          </section>
        </main>
        <footer className="py-4 border-t text-center text-[10px] text-muted-foreground bg-white">
          <p>&copy; {new Date().getFullYear()} MATHWHIZ. Developed by LAMOGI PRODUCTION.</p>
        </footer>
        <Toaster />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background font-body">
        <Sidebar className="hidden lg:flex border-r border-border">
          <SidebarContent>
            <EquationHistory 
              history={history} 
              onSelect={(item) => { setEquation(item.equation); setCurrentSolution(item); }} 
              onClear={clearHistory} 
            />
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          <header className="h-14 flex items-center justify-between px-4 md:px-6 bg-white border-b border-border sticky top-0 z-10 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="lg:hidden"><SidebarTrigger /></div>
              <div className="bg-primary p-1 rounded-lg shadow-sm"><BrainCircuit className="h-4 w-4 text-white" /></div>
              <h1 className="text-base font-headline font-bold text-primary tracking-tight hidden sm:block">
                MATH<span className="text-accent">WHIZ</span>
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  setIsOnline(!isOnline);
                  toast({
                    title: `Switched to ${!isOnline ? 'Online' : 'Offline'} Mode`,
                    description: !isOnline ? "AI Solver enabled." : "Using local math engine."
                  });
                }}
                className="focus:outline-none"
              >
                <Badge variant={isOnline ? "outline" : "destructive"} className="flex gap-1 py-0.5 px-2 cursor-pointer hover:bg-muted transition-colors text-[9px] uppercase tracking-tighter">
                  {isOnline ? <><Wifi className="h-3 w-3 text-green-600" /> Online</> : <><WifiOff className="h-3 w-3" /> Offline</>}
                </Badge>
              </button>

              <Button variant="ghost" size="icon" onClick={handleShareApp} className="h-8 w-8 text-muted-foreground hover:text-primary">
                <Share2 className="h-3.5 w-3.5" />
              </Button>
              
              <div className="h-5 w-px bg-border mx-1" />
              
              <div className="flex items-center gap-2">
                {user ? (
                  <>
                    <div className="hidden sm:flex flex-col items-end">
                      <span className="text-[10px] font-bold truncate max-w-[80px]">{user.displayName}</span>
                      <button onClick={handleLogout} className="text-[9px] text-muted-foreground hover:text-primary underline">Sign Out</button>
                    </div>
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="h-7 w-7 rounded-full border border-border" />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center"><User className="h-3.5 w-3.5" /></div>
                    )}
                  </>
                ) : (
                  <Button size="sm" variant="outline" onClick={handleLogin} type="button" className="h-8 text-xs gap-1.5">
                    <LogIn className="h-3.5 w-3.5" />
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-6 h-full">
              <div className={`space-y-4 ${currentSolution ? 'xl:col-span-5' : 'xl:col-span-8 xl:col-start-3'}`}>
                
                {!user && (
                   <Alert className="py-2 bg-amber-50 border-amber-200">
                    <AlertCircle className="h-3 w-3 text-amber-600" />
                    <AlertTitle className="text-amber-800 text-[10px] font-bold">GUEST MODE</AlertTitle>
                    <AlertDescription className="text-amber-700 text-[10px]">
                      History will be lost when you refresh. <button onClick={handleLogin} className="underline font-bold hover:text-amber-900">Sign in</button> to sync to the cloud.
                    </AlertDescription>
                  </Alert>
                )}

                {isOnline === false && (
                   <Alert className="py-2 bg-blue-50 border-blue-200">
                    <WifiOff className="h-3 w-3 text-blue-600" />
                    <AlertTitle className="text-blue-800 text-[10px] font-bold uppercase">Offline Mode Active</AlertTitle>
                    <AlertDescription className="text-blue-700 text-[10px]">
                      Advanced AI features are disabled. <button onClick={() => setIsOnline(true)} className="underline font-bold hover:text-blue-900">Go Online</button>.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="bg-white p-5 rounded-2xl border border-border shadow-md space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[10px] font-headline font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      <BrainCircuit className="h-3.5 w-3.5" />
                      Problem or Image
                    </h2>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowKeypad(!showKeypad)}
                      className="text-[9px] h-6 px-2 hover:bg-primary/5 hover:text-primary transition-colors"
                      type="button"
                    >
                      <Keyboard className="h-3 w-3 mr-1.5" />
                      {showKeypad ? 'Hide Keypad' : 'Show Keypad'}
                    </Button>
                  </div>
                  
                  <form onSubmit={handleSolve} className="space-y-4">
                    {attachment && (
                      <div className="relative group rounded-xl overflow-hidden border-2 border-primary/20 bg-muted/5 p-2">
                        {attachment.type.startsWith('image') ? (
                          <img src={attachment.url} alt="Attachment" className="max-h-32 rounded-lg mx-auto object-contain" />
                        ) : (
                          <div className="h-24 flex flex-col items-center justify-center gap-1.5">
                            <FileText className="h-6 w-6 text-primary" />
                            <span className="text-[10px] font-medium truncate max-w-xs">{attachment.name}</span>
                          </div>
                        )}
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          className="absolute top-2 right-2 h-5 w-5 rounded-full shadow-lg"
                          onClick={() => setAttachment(null)}
                          type="button"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}

                    <Textarea
                      value={equation}
                      onChange={(e) => setEquation(e.target.value)}
                      placeholder={isOnline ? "Type your math problem or scan it..." : "Type math expression (e.g., 'cos(45) * 2')"}
                      className="font-code text-base min-h-[120px] p-4 rounded-xl border-2 border-muted hover:border-primary/40 focus:border-primary bg-muted/5 resize-none shadow-sm transition-all"
                    />

                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                        <HelpCircle className="h-3 w-3" />
                        Try these examples:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {EXAMPLES.map((ex) => (
                          <button
                            key={ex}
                            type="button"
                            onClick={() => setEquation(ex)}
                            className="px-2.5 py-1 rounded-full bg-muted/50 hover:bg-primary/10 hover:text-primary border border-border text-[10px] font-medium transition-all"
                          >
                            {ex}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="flex gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          className="h-9 gap-2 text-xs font-semibold px-4 rounded-xl" 
                          onClick={openCamera}
                          disabled={!isOnline}
                        >
                          <Camera className="h-4 w-4 text-primary" />
                          Scan
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          className="h-9 gap-2 text-xs font-semibold px-4 rounded-xl" 
                          onClick={() => fileInputRef.current?.click()}
                          disabled={!isOnline}
                        >
                          <FileUp className="h-4 w-4 text-primary" />
                          Upload
                        </Button>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept="image/*,application/pdf,text/plain" 
                          onChange={handleFileUpload}
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => { setEquation(''); setAttachment(null); }} type="button" size="sm" className="h-9 text-xs font-medium px-4">Clear</Button>
                        <Button size="sm" disabled={isSolving || (!equation.trim() && !attachment)} type="submit" className="h-9 gap-2 px-6 shadow-lg text-xs font-bold rounded-xl">
                          {isSolving ? <Sparkles className="h-4 w-4 animate-pulse" /> : <Send className="h-4 w-4" />}
                          {isOnline ? 'Solve' : 'Calculate'}
                        </Button>
                      </div>
                    </div>
                  </form>

                  {showKeypad && (
                    <div className="pt-2 border-t border-dashed border-border/50">
                      <VirtualKeypad 
                        onKeyPress={(val) => setEquation(prev => prev + val)} 
                        onClear={() => setEquation('')} 
                        onBackspace={() => setEquation(prev => prev.slice(0, -1))} 
                      />
                    </div>
                  )}
                </div>
              </div>

              {currentSolution && (
                <div className="xl:col-span-7">
                  <SolutionDisplay 
                    equation={currentSolution.equation}
                    solution={currentSolution.stepByStepSolution}
                    answer={currentSolution.finalAnswer}
                    loading={isSolving}
                  />
                </div>
              )}
            </div>
          </main>
          <footer className="py-3 border-t text-center text-[9px] text-muted-foreground bg-white">
            <p>MATHWHIZ &copy; {new Date().getFullYear()} Developed by LAMOGI PRODUCTION.</p>
          </footer>
        </SidebarInset>
      </div>

      <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Scan Math Problem</DialogTitle>
          </DialogHeader>
          <div className="relative aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center border-2 border-primary/20">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
            {hasCameraPermission === false && (
              <Alert variant="destructive" className="absolute inset-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription className="text-xs">Please enable camera permissions in your browser settings.</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter className="sm:justify-between flex-row gap-2 pt-2">
            <Button variant="outline" onClick={closeCamera} className="text-xs">Cancel</Button>
            <Button onClick={capturePhoto} disabled={!hasCameraPermission} className="gap-2 text-xs font-bold shadow-lg">
              <Camera className="h-4 w-4" />
              Capture Problem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </SidebarProvider>
  );
}
