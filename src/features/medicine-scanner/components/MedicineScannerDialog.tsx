import { useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  AlertTriangle,
  Camera,
  Clipboard,
  FileSearch,
  Info,
  Pill,
  RefreshCcw,
  ScanLine,
  ShieldAlert,
  Stethoscope,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useMedicineScanner } from "@/features/medicine-scanner/hooks/useMedicineScanner";

function formatConfidence(score: number): string {
  if (score >= 85) return "High OCR confidence";
  if (score >= 60) return "Medium OCR confidence";
  return "Low OCR confidence";
}

function copyResult(result: unknown) {
  return navigator.clipboard.writeText(JSON.stringify(result, null, 2));
}

export default function MedicineScannerDialog() {
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    analyzeFile,
    error,
    isBusy,
    ocrText,
    processedPreview,
    progress,
    reset,
    result,
    retry,
    sourcePreview,
  } = useMedicineScanner();

  const canRetry = Boolean(error);
  const progressValue = Math.round(progress.progress * 100);

  const confidenceTone = useMemo(() => {
    if (!result) return "secondary";
    if (result.ocrConfidence >= 85) return "default";
    if (result.ocrConfidence >= 60) return "secondary";
    return "destructive";
  }, [result]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      reset();
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    await analyzeFile(file);
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await copyResult(result);
      toast.success("Scan result copied");
    } catch {
      toast.error("Failed to copy result");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="glass-card p-4 flex items-center gap-4 w-full text-left hover:bg-primary/10 transition-all group">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 group-hover:from-cyan-500/30 group-hover:to-purple-500/30 transition-colors">
            <Pill size={24} className="text-cyan-400" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">Medicine Scanner</p>
            <p className="text-xs text-muted-foreground">Scan medicine packaging and extract text for structured analysis</p>
          </div>
          <Camera size={18} className="text-muted-foreground group-hover:text-cyan-400 transition-colors" />
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl bg-background/95 backdrop-blur-xl border-border/50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Pill size={22} className="text-cyan-400" /> Medicine Scanner
          </DialogTitle>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />

        {!result && (
          <div className="space-y-4 py-3">
            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
              <p className="text-sm text-foreground">Upload the back side of a medicine strip or box. The app will preprocess the image, run OCR, and analyze the extracted text.</p>
            </div>

            {sourcePreview ? (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="relative">
                  <img src={sourcePreview} alt="Selected medicine" className="w-full rounded-xl border border-border/50 max-h-56 object-cover" />
                  {!isBusy && (
                    <button
                      onClick={reset}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                      aria-label="Clear selected image"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
                  <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">OCR pipeline</p>
                  <p className="text-sm text-foreground/90">Grayscale, contrast boost, resize, denoise, sharpen, and thresholding are applied before Tesseract runs multiple PSM modes.</p>
                  {processedPreview && (
                    <img src={processedPreview} alt="Processed OCR preview" className="mt-3 w-full rounded-lg border border-border/50 max-h-36 object-cover" />
                  )}
                </div>
              </div>
            ) : (
              <div className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-cyan-500/30 bg-cyan-500/5 flex flex-col items-center justify-center gap-3">
                <div className="p-4 rounded-full bg-cyan-500/10">
                  <Camera size={36} className="text-cyan-400" />
                </div>
                <p className="text-sm text-muted-foreground text-center px-4">
                  Capture the back side of the medicine strip or box with text clearly visible
                </p>
              </div>
            )}

            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isBusy}
              className="w-full h-14 text-base font-semibold rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.02] disabled:hover:scale-100"
            >
              <Camera size={20} className="mr-2" />
              {sourcePreview ? "Choose Another Image" : "Open Camera"}
            </Button>

            {(isBusy || error) && (
              <div className="glass-card p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{progress.message}</p>
                    <p className="text-xs text-muted-foreground">OCR status</p>
                  </div>
                  <Badge variant={error ? "destructive" : "secondary"}>{error ? "Failed" : `${progressValue}%`}</Badge>
                </div>
                <Progress value={error ? 0 : progressValue} />

                {error && (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-foreground">
                    <p className="font-medium text-destructive">Scan Failed</p>
                    <p className="mt-1">{error}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  {canRetry && (
                    <Button onClick={() => void retry()} variant="outline" className="flex-1 rounded-xl">
                      <RefreshCcw size={16} className="mr-2" /> Retry
                    </Button>
                  )}
                  <Button onClick={reset} variant="ghost" className="flex-1 rounded-xl">
                    Scan Another
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {result && (
          <div className="space-y-3 py-2">
            {sourcePreview && (
              <img src={sourcePreview} alt="Scanned medicine" className="w-full rounded-xl border border-border/50 max-h-44 object-cover" />
            )}

            <div className="glass-card p-4 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Pill size={16} className="text-cyan-400" />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Medicine Name</p>
                </div>
                <p className="text-lg font-bold text-foreground">{result.medicineName ?? "Not confidently detected"}</p>
                <p className="text-sm text-muted-foreground mt-1">{result.manufacturer ?? "Manufacturer not found"}</p>
              </div>
              <Badge variant={confidenceTone === "destructive" ? "destructive" : "secondary"}>
                {formatConfidence(result.ocrConfidence)}
              </Badge>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Stethoscope size={16} className="text-blue-400" />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Uses</p>
                </div>
                <ul className="space-y-1">
                  {result.uses.map((item) => (
                    <li key={item} className="text-sm text-foreground/90">{item}</li>
                  ))}
                </ul>
              </div>

              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Info size={16} className="text-indigo-400" />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Conditions Treated</p>
                </div>
                <ul className="space-y-1">
                  {result.conditionsTreated.map((item) => (
                    <li key={item} className="text-sm text-foreground/90">{item}</li>
                  ))}
                </ul>
              </div>

              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileSearch size={16} className="text-cyan-400" />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Ingredients</p>
                </div>
                <ul className="space-y-1">
                  {(result.activeIngredients.length ? result.activeIngredients : ["Not available"]).map((item) => (
                    <li key={item} className="text-sm text-foreground/90">{item}</li>
                  ))}
                </ul>
              </div>

              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ScanLine size={16} className="text-emerald-400" />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Drug Class</p>
                </div>
                <p className="text-sm text-foreground/90">{result.drugClass ?? "Not available"}</p>
              </div>
            </div>

            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-yellow-400" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Common Side Effects</p>
              </div>
              <ul className="space-y-1">
                {(result.commonSideEffects.length ? result.commonSideEffects : ["Not available"]).map((item) => (
                  <li key={item} className="text-sm text-foreground/90">{item}</li>
                ))}
              </ul>
            </div>

            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert size={16} className="text-red-400" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Important Precautions</p>
              </div>
              <ul className="space-y-1">
                {(result.importantPrecautions.length ? result.importantPrecautions : ["Not available"]).map((item) => (
                  <li key={item} className="text-sm text-foreground/90">{item}</li>
                ))}
              </ul>
            </div>

            <div className="glass-card p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Summary</p>
              <p className="mt-2 text-sm text-foreground/90 leading-relaxed">{result.summary}</p>
            </div>

            <div className="glass-card p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Extracted OCR Text</p>
                <Badge variant="outline">{result.confidence} scan confidence</Badge>
              </div>
              <pre className="mt-2 whitespace-pre-wrap text-sm text-foreground/85">{ocrText || result.extractedText}</pre>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCopy} variant="outline" className="flex-1 rounded-2xl border-cyan-500/30 hover:bg-cyan-500/10">
                <Clipboard size={16} className="mr-2" /> Copy
              </Button>
              <Button
                onClick={reset}
                className="flex-1 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-semibold shadow-lg shadow-cyan-500/25"
              >
                <Camera size={18} className="mr-2" /> Scan Another Medicine
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
