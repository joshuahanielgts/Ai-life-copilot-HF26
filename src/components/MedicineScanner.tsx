import { useState, useRef } from "react";
import { Camera, X, Pill, AlertTriangle, Info, ShieldAlert } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface MedicineResult {
  name: string;
  purpose: string;
  sideEffects: string[];
  interactions: string;
}

const MedicineScanner = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MedicineResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setResult(null);
    setPreview(null);
    setLoading(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) reset();
  };

  const handleCapture = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setPreview(base64);
      await analyzeImage(base64);
    };
    reader.readAsDataURL(file);

    // Reset input so the same file can be re-selected
    e.target.value = "";
  };

  const analyzeImage = async (base64Image: string) => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/medicine-scanner`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY}`,
          },
          body: JSON.stringify({ base64Image }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to analyze medication");
      }

      const data: MedicineResult = await response.json();
      setResult(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to analyze medication. Try again.");
    } finally {
      setLoading(false);
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
            <p className="text-xs text-muted-foreground">Scan any pill or medicine for AI analysis</p>
          </div>
          <Camera size={18} className="text-muted-foreground group-hover:text-cyan-400 transition-colors" />
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg bg-background/95 backdrop-blur-xl border-border/50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Pill size={22} className="text-cyan-400" /> Medicine Scanner
          </DialogTitle>
        </DialogHeader>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* No result yet — show capture UI */}
        {!result && !loading && (
          <div className="flex flex-col items-center gap-4 py-6">
            {preview ? (
              <div className="relative w-full">
                <img src={preview} alt="Captured" className="w-full rounded-xl border border-border/50 max-h-48 object-cover" />
                <button
                  onClick={reset}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-cyan-500/30 bg-cyan-500/5 flex flex-col items-center justify-center gap-3">
                <div className="p-4 rounded-full bg-cyan-500/10">
                  <Camera size={36} className="text-cyan-400" />
                </div>
                <p className="text-sm text-muted-foreground text-center px-4">
                  Take a photo of any medicine, pill bottle, or ointment
                </p>
              </div>
            )}

            <Button
              onClick={handleCapture}
              className="w-full h-14 text-base font-semibold rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.02]"
            >
              <Camera size={20} className="mr-2" />
              {preview ? "Retake Photo" : "Open Camera"}
            </Button>

            {preview && (
              <Button
                onClick={() => analyzeImage(preview)}
                variant="outline"
                className="w-full h-12 rounded-2xl border-cyan-500/30 hover:bg-cyan-500/10"
              >
                Analyze This Image
              </Button>
            )}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center gap-4 py-10">
            {preview && (
              <img src={preview} alt="Analyzing" className="w-full rounded-xl border border-border/50 max-h-32 object-cover opacity-60" />
            )}
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
              <Pill size={24} className="absolute text-cyan-400 animate-pulse" />
            </div>
            <p className="text-sm font-medium text-cyan-400 animate-pulse">Analyzing Medication...</p>
            <p className="text-xs text-muted-foreground">AI is identifying the medicine</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-3 py-2">
            {preview && (
              <img src={preview} alt="Scanned medicine" className="w-full rounded-xl border border-border/50 max-h-32 object-cover" />
            )}

            {/* Name */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-1">
                <Pill size={16} className="text-cyan-400" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Medicine Name</p>
              </div>
              <p className="text-lg font-bold text-foreground">{result.name}</p>
            </div>

            {/* Purpose */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-1">
                <Info size={16} className="text-blue-400" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Purpose</p>
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed">{result.purpose}</p>
            </div>

            {/* Side Effects */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-yellow-400" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Side Effects</p>
              </div>
              <ul className="space-y-1">
                {result.sideEffects.map((effect, i) => (
                  <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                    <span className="text-yellow-400 mt-0.5">•</span>
                    {effect}
                  </li>
                ))}
              </ul>
            </div>

            {/* Interactions */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-1">
                <ShieldAlert size={16} className="text-red-400" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Interactions</p>
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed">{result.interactions}</p>
            </div>

            {/* Scan another */}
            <Button
              onClick={reset}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-semibold shadow-lg shadow-cyan-500/25"
            >
              <Camera size={18} className="mr-2" /> Scan Another Medicine
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MedicineScanner;
