import { useState, useEffect } from 'react';
import { DragZone } from './components/DragZone';
import { FileTable } from './components/FileTable';
import { PreviewGrid } from './components/PreviewGrid';
import { DocumentItem, PageItem } from './types';
import { extractNumber } from './utils';
import { getPdfPageCount, createStampedPDF } from './logic/pdfLogic';
import { ArrowRight, Download, Info, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

function App() {
  const [view, setView] = useState<'upload' | 'preview'>('upload');
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [isStamping, setIsStamping] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const handleStampAndDownload = async () => {
    if (pages.length === 0) return;

    setIsStamping(true);
    try {
      // Build page data for stamping
      const pageDataPromises = pages.map(async (page) => {
        const doc = documents.find(d => d.id === page.docId);
        if (!doc) throw new Error(`Document not found for page ${page.globalPageNum}`);

        // Fetch the PDF buffer (convertFile handles both native PDFs and conversion)
        const uint8 = await window.api.convertFile(doc.path);

        return {
          docBuffer: uint8.buffer as ArrayBuffer,
          pageNum: page.pageNum,
          rotation: page.rotation,
          stampText: page.stampText || undefined, // Use document number, not page number
          type: doc.type
        };
      });

      const pageData = await Promise.all(pageDataPromises);

      // Create stamped PDF
      const pdfBytes = await createStampedPDF(pageData);

      // Trigger download
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HASAR BELGELERİ.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('[App] PDF stamped and downloaded successfully');
    } catch (e: any) {
      console.error('[App] Stamping failed:', e);
      alert(`Stamping failed: ${e.message}`);
    } finally {
      setIsStamping(false);
    }
  };

  // Process pending documents
  useEffect(() => {
    const processNext = async () => {
      const pendingDoc = documents.find(d => d.status === 'pending');
      if (!pendingDoc) return;

      // Mark converting
      setDocuments(prev => prev.map(d => d.id === pendingDoc.id ? { ...d, status: 'converting' } : d));

      try {
        // 1. Expand Folder if unknown/folder (Wait, we rely on DragZone/Scan for folders, 
        // but if we dragged a folder, the initial 'file' object might be a directory handle or just a file in it.
        // But we can clean this up. Let's assume handleFilesDropped calls scanFolder for paths.

        // 2. Convert if needed
        let buffer: ArrayBuffer | null = null;
        let pageCount = 1;

        if (pendingDoc.type === 'image') {
          // Images are 1 page, no conversion needed
          pageCount = 1;
        } else if (pendingDoc.type === 'office' || pendingDoc.type === 'msg') {
          const uint8 = await window.api.convertFile(pendingDoc.path);
          buffer = uint8.buffer as ArrayBuffer;
          pageCount = await getPdfPageCount(buffer);
        } else if (pendingDoc.type === 'pdf') {
          // Read PDF to get page count
          const uint8 = await window.api.convertFile(pendingDoc.path);
          buffer = uint8.buffer as ArrayBuffer;
          pageCount = await getPdfPageCount(buffer);
        }

        setDocuments(prev => prev.map(d => d.id === pendingDoc.id ? {
          ...d,
          status: 'ready',
          pageCount: pageCount,
          // After conversion, treat office/msg as pdf for preview
          type: (pendingDoc.type === 'office' || pendingDoc.type === 'msg') ? 'pdf' : pendingDoc.type
        } : d));
      } catch (e) {
        console.error(e);
        setDocuments(prev => prev.map(d => d.id === pendingDoc.id ? { ...d, status: 'error' } : d));
      }
    };

    processNext();
  }, [documents]);

  const handleFilesDropped = async (files: File[]) => {
    // Recursive scan first
    // We get Files. 'path' property is available.
    // We send all paths to scanFolder.
    console.log("App: handleFilesDropped called with", files);
    const paths = files.map(f => {
      // Debug: Log all symbol properties (Electron uses Symbols for path sometimes)
      console.log(`App: Processing file '${f.name}'`, f);
      try {
        const p = window.api.getFilePath(f);
        console.log(`App: getFilePath returned: '${p}'`);
        return p;
      } catch (err) {
        console.error(`App: getFilePath failed for '${f.name}'`, err);
        // Fallback?
        // @ts-ignore
        return f.path;
      }
    });
    console.log("App: Paths extracted:", paths);

    if (paths.some(p => !p)) {
      alert("Error: Some files do not have a path. Are you running in a browser instead of Electron?");
      return;
    }

    let allPaths: string[] = [];

    for (const p of paths) {
      try {
        console.log("App: Scanning path:", p);
        const scanned = await window.api.scanFolder(p);
        console.log("App: Scanned results for", p, scanned);
        allPaths.push(...scanned);
      } catch (e: any) {
        console.error("Scan error", e);
        alert(`Scan Error for ${p}: ${e.message}`);
      }
    }

    const newDocs: DocumentItem[] = [];
    for (const p of allPaths) {
      const name = p.split(/[\\/]/).pop() || '';
      const ext = name.split('.').pop()?.toLowerCase() || '';

      let type: DocumentItem['type'] = 'unknown';
      if (ext === 'pdf') type = 'pdf';
      else if (['png', 'jpg', 'jpeg'].includes(ext)) type = 'image';
      else if (['docx', 'xlsx', 'pptx', 'doc', 'xls', 'ppt', 'txt'].includes(ext)) type = 'office';
      else if (ext === 'msg') type = 'msg';

      if (type === 'unknown') continue;

      const { display, sortKey, cleanName } = extractNumber(name);

      newDocs.push({
        id: uuidv4(),
        file: null, // We work with paths now
        path: p,
        name: name,
        cleanName,
        type,
        pageCount: 0,
        numberDisplay: display,
        sortKey,
        status: 'pending'
      });
    }

    setDocuments(prev => {
      const combined = [...prev, ...newDocs];
      // Remove duplicates by path
      const unique = Array.from(new Map(combined.map(item => [item.path, item])).values());
      return unique.sort((a, b) => a.sortKey - b.sortKey);
    });
  };

  const goToPreview = async () => {
    // Generate pages with stamp logic from legacy code
    const allPages: PageItem[] = [];
    let globalNum = 1;
    const seenNumbers: Record<string, boolean> = {};

    for (const doc of documents) {
      if (doc.status !== 'ready') continue;

      const count = doc.pageCount > 0 ? doc.pageCount : 1;
      for (let i = 1; i <= count; i++) {
        // Stamp logic: only first page of each unique document number
        let stampText: string | null = null;
        if (i === 1 && doc.numberDisplay) {
          const key = doc.numberDisplay; // e.g., "1", "2.a", etc.
          if (!seenNumbers[key]) {
            seenNumbers[key] = true;
            stampText = doc.numberDisplay;
          }
        }

        allPages.push({
          docId: doc.id,
          pageNum: i,
          globalPageNum: globalNum++,
          rotation: 0,
          stampText
        });
      }
    }
    setPages(allPages);
    setView('preview');
  };

  const handleRotate = (index: number) => {
    setPages(prev => prev.map((p, i) =>
      i === index ? { ...p, rotation: (p.rotation + 90) % 360 } : p
    ));
  };

  const goBack = () => {
    setView('upload');
  };

  return (
    <div className="h-screen flex flex-col bg-pure-black text-text-main overflow-hidden p-4 gap-4">
      {/* Header - Glass Panel */}
      <header className="h-20 glass-panel flex items-center px-8 justify-between flex-shrink-0 shadow-2xl">
        <div className="flex items-center gap-6">
          {view === 'preview' && (
            <button
              onClick={goBack}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-110 active:scale-90 transition-all"
              title="Geri Dön"
            >
              <ArrowRight size={20} className="rotate-180" />
            </button>
          )}
          <div className="flex flex-col">
            <h1 className="font-bold text-2xl tracking-tight text-white">Belge Düzenleyici</h1>
            <span className="text-[10px] text-white/30 font-medium uppercase tracking-[0.2em]">Grup Sigorta Ekspertiz Hizmetleri Limited Şirketi</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {view === 'upload' && documents.length > 0 && (
            (() => {
              const total = documents.length;
              const completed = documents.filter(d => d.status === 'ready' || d.status === 'error').length;
              const isProcessing = completed < total;

              if (isProcessing) {
                const progress = Math.round((completed / total) * 100);
                return (
                  <div className="flex flex-col items-end gap-1.5 min-w-[140px]">
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">İşleniyor {progress}%</span>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                );
              }

              return (
                <button
                  onClick={goToPreview}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] transition-all active:scale-95 animate-in fade-in zoom-in duration-300"
                >
                  Devam <ArrowRight size={18} />
                </button>
              );
            })()
          )}
          {view === 'preview' && (
            isStamping ? (
              <div className="flex flex-col items-end gap-1.5 min-w-[140px]">
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Oluşturuluyor...</span>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full w-1/3 bg-white rounded-full animate-pulse" style={{ animation: 'indeterminate 1.2s ease-in-out infinite' }} />
                </div>
              </div>
            ) : (
              <button
                onClick={handleStampAndDownload}
                className="bg-white text-black hover:bg-gray-100 px-8 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 transition-all active:scale-95"
              >
                Oluştur <Download size={18} />
              </button>
            )
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {view === 'upload' ? (
          <div className="h-full flex gap-4">
            <div className="w-1/3 min-w-[340px] flex flex-col h-full">
              <DragZone onFilesDropped={handleFilesDropped} />
            </div>
            <div className="flex-1 h-full glass-panel overflow-hidden">
              <FileTable documents={documents} onRemove={(id) => setDocuments(prev => prev.filter(d => d.id !== id))} />
            </div>
          </div>
        ) : (
          <div className="h-full glass-panel overflow-hidden relative">
            <PreviewGrid pages={pages} documents={documents} onRotate={handleRotate} />
          </div>
        )}
      </main>

      {/* Reactive Footer Toast/Info */}
      {documents.length > 0 && view === 'upload' && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 bg-surface-light border border-border-dark shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-2xl">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-sm font-medium text-white/70">
            {documents.length} dosya yüklendi — Toplam {documents.reduce((acc, d) => acc + d.pageCount, 0)} sayfa
          </span>
        </div>
      )}
      {/* Bottom Info Bar */}
      <footer className="h-8 border-t border-white/5 flex items-center px-6 justify-end flex-shrink-0 bg-black/50">
        <button
          onClick={() => setShowInfo(true)}
          className="text-white/20 hover:text-white/60 transition-colors p-1"
          title="Hakkında"
        >
          <Info size={14} />
        </button>
      </footer>

      {/* Info Modal / Popup */}
      {showInfo && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-surface-light border border-white/10 p-8 rounded-3xl shadow-2xl relative max-w-sm w-full mx-4 animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setShowInfo(false)}
              className="absolute top-4 right-4 text-white/20 hover:text-white/60 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-500 mb-2">
                <Info size={32} />
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-widest">Belge Düzenleyici</h3>
              <div className="h-px w-12 bg-blue-500/50" />
              <p className="text-white/70 font-bold text-lg">Y. Eren Bektaş</p>
              <p className="text-white/30 text-xs font-medium uppercase tracking-[0.2em]">Aralık 2025</p>

              <button
                onClick={() => setShowInfo(false)}
                className="mt-6 w-full py-3 bg-white text-black rounded-xl font-black text-sm hover:bg-gray-200 transition-all active:scale-95"
              >
                KAPAT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
