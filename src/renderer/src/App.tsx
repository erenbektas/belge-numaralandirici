import { useState, useEffect } from 'react';
import clsx from 'clsx';
import jackAsset from './assets/jack.png';
import { DragZone } from './components/DragZone';
import { FileTable } from './components/FileTable';
import { PreviewGrid } from './components/PreviewGrid';
import { DownloadSummary } from './components/DownloadSummary';
import { DocumentItem, PageItem } from './types';
import { extractNumber } from './utils';
import { getPdfPageCount, createStampedPDF, compressPDF, CompressionSettings } from './logic/pdfLogic';
import { ArrowRight, Info, Github, FileStack } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

function App() {
  const [view, setView] = useState<'upload' | 'preview' | 'summary'>('upload');
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [isStamping, setIsStamping] = useState(false);
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [showCredits, setShowCredits] = useState(false);
  const [jackVisible, setJackVisible] = useState(true);
  const [jackFalling, setJackFalling] = useState(false);

  // Warning modal state
  const [warningModal, setWarningModal] = useState<{
    type: 'unnumbered' | 'unsupported' | null;
    files: string[];
  }>({ type: null, files: [] });

  const handleStampAndDownload = async () => {
    if (pages.length === 0) return;

    setIsStamping(true);
    try {
      // Build page data for stamping
      const pageDataPromises = pages.map(async (page) => {
        const doc = documents.find(d => d.id === page.docId);
        if (!doc) throw new Error(`Document not found for page ${page.globalPageNum}`);

        // Use cached PDF buffer or fetch if missing (fallback)
        let buffer: Uint8Array;
        if (doc.pdfBuffer) {
          buffer = doc.pdfBuffer;
        } else {
          console.warn(`[App] Buffer missing for ${doc.name}, fetching again...`);
          buffer = await window.api.convertFile(doc.path);
        }

        return {
          docBuffer: buffer.buffer as ArrayBuffer,
          pageNum: page.pageNum,
          rotation: page.rotation,
          stampText: page.stampText || undefined,
          type: doc.type
        };
      });

      const pageData = await Promise.all(pageDataPromises);

      // Create stamped PDF
      const pdfBytes = await createStampedPDF(pageData);
      setPdfData(pdfBytes);
      setView('summary');
      console.log('[App] PDF generated and summary view shown');
    } catch (e: any) {
      console.error('[App] PDF Generation failed:', e);
      alert(`Oluşturma Başarısız: ${e.message}`);
    } finally {
      setIsStamping(false);
    }
  };

  const handleDownloadOriginal = () => {
    if (!pdfData) return;
    downloadBlob(pdfData, 'HASAR BELGELERİ.pdf');
  };

  const handleDownloadCompressed = async (settings: CompressionSettings) => {
    if (!pdfData) return;
    setIsCompressing(true);
    setCompressionProgress(0);
    try {
      const compressed = await compressPDF(pdfData.buffer as ArrayBuffer, settings, (current, total) => {
        setCompressionProgress(Math.round((current / total) * 100));
      });
      downloadBlob(compressed, 'HASAR BELGELERİ_SIKISTIRILMIS.pdf');
    } catch (e: any) {
      console.error('[App] Compression failed:', e);
      alert(`Sıkıştırma Başarısız: ${e.message}`);
    } finally {
      setIsCompressing(false);
    }
  };

  const downloadBlob = (data: Uint8Array, filename: string) => {
    const blob = new Blob([data as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

        let convertedBuffer: Uint8Array | null = null;
        let pageCount = 1;

        if (pendingDoc.type === 'image') {
          // Images are 1 page, no conversion needed
          pageCount = 1;
        } else if (pendingDoc.type === 'office' || pendingDoc.type === 'msg' || pendingDoc.type === 'pdf') {
          convertedBuffer = await window.api.convertFile(pendingDoc.path);
          pageCount = await getPdfPageCount(convertedBuffer.buffer as ArrayBuffer);
        }

        setDocuments(prev => prev.map(d => d.id === pendingDoc.id ? {
          ...d,
          status: 'ready',
          pageCount: pageCount,
          pdfBuffer: convertedBuffer || undefined,
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
    const readyDocs = documents.filter(d => d.status === 'ready');

    // Check for unsupported files first (type === 'unknown')
    const unsupportedDocs = documents.filter(d => d.type === 'unknown');
    if (unsupportedDocs.length > 0) {
      setWarningModal({
        type: 'unsupported',
        files: unsupportedDocs.map(d => d.name)
      });
      return;
    }

    // Check for unnumbered files (no numberDisplay)
    const unnumberedDocs = readyDocs.filter(d => !d.numberDisplay || d.numberDisplay.trim() === '');
    if (unnumberedDocs.length > 0) {
      setWarningModal({
        type: 'unnumbered',
        files: unnumberedDocs.map(d => d.name)
      });
      return;
    }

    // All checks passed, proceed to preview
    proceedToPreview(readyDocs);
  };

  const proceedToPreview = (docsToProcess: DocumentItem[]) => {
    // Generate pages with stamp logic from legacy code
    const allPages: PageItem[] = [];
    let globalNum = 1;
    const seenNumbers: Record<string, boolean> = {};

    for (const doc of docsToProcess) {
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

  const handleWarningCancel = () => {
    // Clear everything and go back to initial state
    setDocuments([]);
    setPages([]);
    setPdfData(null);
    setWarningModal({ type: null, files: [] });
  };

  const handleWarningSkip = () => {
    if (warningModal.type === 'unsupported') {
      // Remove unsupported files and re-run validation
      const filteredDocs = documents.filter(d => d.type !== 'unknown');
      setDocuments(filteredDocs);
      setWarningModal({ type: null, files: [] });
      // Re-trigger validation with filtered docs (via useEffect or direct call)
      setTimeout(() => {
        const readyDocs = filteredDocs.filter(d => d.status === 'ready');
        const unnumberedDocs = readyDocs.filter(d => !d.numberDisplay || d.numberDisplay.trim() === '');
        if (unnumberedDocs.length > 0) {
          setWarningModal({
            type: 'unnumbered',
            files: unnumberedDocs.map(d => d.name)
          });
        } else {
          proceedToPreview(readyDocs);
        }
      }, 0);
    } else if (warningModal.type === 'unnumbered') {
      // Remove unnumbered files and proceed
      const filteredDocs = documents.filter(d => d.numberDisplay && d.numberDisplay.trim() !== '');
      setDocuments(filteredDocs);
      setWarningModal({ type: null, files: [] });
      const readyDocs = filteredDocs.filter(d => d.status === 'ready');
      proceedToPreview(readyDocs);
    }
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
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-black text-white tracking-tight leading-none">Belge Düzenleyici</h1>
            <p className="text-white/20 text-[10px] font-black tracking-[0.3em]">Grup Sigorta Ekspertiz Hizmetleri Limited Şirketi</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
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
                Oluştur <FileStack size={18} />
              </button>
            )
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col gap-4">
        {view === 'upload' ? (
          <div className="h-full flex flex-col gap-4 relative">
            {documents.length === 0 ? (
              /* Initial State: Full Screen DragZone */
              <div className="flex-1 flex items-center justify-center animate-in fade-in zoom-in-95 duration-500">
                <DragZone onFilesDropped={handleFilesDropped} isFull />
              </div>
            ) : (
              /* Reactive State: Compact Layout */
              <>
                {/* Top Row: DragZone & Devam Card */}
                <div className="flex gap-4 h-28 flex-shrink-0 animate-in slide-in-from-top-4 duration-500">
                  <div className="flex-1 h-full">
                    <DragZone onFilesDropped={handleFilesDropped} />
                  </div>

                  {/* Action Card (Devam Button) */}
                  <div className="w-72 glass-panel flex items-center justify-center p-6 bg-white/[0.02] border-white/5">
                    {(() => {
                      const total = documents.length;
                      const completed = documents.filter(d => d.status === 'ready' || d.status === 'error').length;
                      const isProcessing = completed < total;

                      if (isProcessing) {
                        const progress = Math.round((completed / total) * 100);
                        return (
                          <div className="flex flex-col items-center gap-3 w-full">
                            <span className="text-[10px] font-black text-blue-500 tracking-widest text-center">İşleniyor {progress}%</span>
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        );
                      }

                      return (
                        <button
                          onClick={goToPreview}
                          className="w-full h-full bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-lg font-black flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_40px_rgba(37,99,235,0.5)] transition-all active:scale-[0.98] group"
                        >
                          Devam <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                      );
                    })()}
                  </div>
                </div>

                {/* Bottom Row: FileTable */}
                <div className="flex-1 glass-panel overflow-hidden animate-in slide-in-from-bottom-4 duration-700">
                  <FileTable documents={documents} onRemove={(id) => setDocuments(prev => prev.filter(d => d.id !== id))} />
                </div>
              </>
            )}
          </div>
        ) : view === 'preview' ? (
          <div className="h-full glass-panel overflow-hidden relative">
            <PreviewGrid pages={pages} documents={documents} onRotate={handleRotate} />
          </div>
        ) : (
          <DownloadSummary
            pdfData={pdfData!}
            pageCount={pages.length}
            onDownloadOriginal={handleDownloadOriginal}
            onDownloadCompressed={handleDownloadCompressed}
            onBack={goBack}
            isCompressing={isCompressing}
            progress={compressionProgress}
          />
        )}
      </main>

      {/* Reactive Footer Toast/Info */}
      {documents.length > 0 && view === 'upload' && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 bg-surface-light border border-border-dark shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-2xl">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-sm font-medium text-white/70">
            {documents.length} Dosya Yüklendi — Toplam {documents.reduce((acc, d) => acc + d.pageCount, 0)} Sayfa
          </span>
        </div>
      )}
      {/* Bottom Info Bar */}
      <footer className="h-8 border-t border-white/5 flex items-center px-6 justify-end flex-shrink-0 bg-black/50">
        <button
          onClick={() => setShowCredits(true)}
          className="text-white/20 hover:text-white/60 transition-colors p-1"
          title="Hakkında"
        >
          <Info size={14} />
        </button>
      </footer>

      {/* Credits Overlay */}
      {showCredits && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300"
          onClick={() => setShowCredits(false)}
        >
          <div
            className="bg-[#0A0F1E]/40 backdrop-blur-2xl border border-white/20 p-10 rounded-[2.5rem] max-w-md w-full animate-in zoom-in-95 duration-300 relative overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Subtle radial glow background */}
            <div className="absolute inset-0 bg-radial-at-t from-blue-500/10 to-transparent pointer-events-none" />
            <div className="flex flex-col items-center text-center gap-6">
              <div className="relative group/jack">
                {jackVisible && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setJackFalling(true);
                      setTimeout(() => setJackVisible(false), 2500);
                    }}
                    className={clsx(
                      "absolute left-[-26px] top-1 w-[44px] h-[62px] cursor-pointer transition-all select-none",
                      "rotate-[-13deg] z-0 origin-top-right",
                      jackFalling ? "animate-leaf-fall pointer-events-none" : "hover:rotate-[-20deg] hover:left-[-32px]"
                    )}
                  >
                    <img src={jackAsset} alt="Jack" className="w-full h-full object-contain" />
                  </div>
                )}
                <div className="w-20 h-20 rounded-3xl bg-blue-600/20 flex items-center justify-center text-blue-400 border border-blue-500/20 relative z-10 backdrop-blur-sm">
                  <Info size={40} />
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-black text-white mb-2">Belge Düzenleyici</h3>
                <p className="text-white/40 text-sm leading-relaxed">
                  Grup Sigorta Ekspertiz Hizmetleri Ltd. Şti.<br />
                  için özel olarak geliştirilmiştir.
                </p>
              </div>

              <div className="w-full h-px bg-white/5" />

              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={() => window.api.openExternal('https://github.com/erenbektas/belge-numaralandirici')}
                  className="flex items-center justify-center gap-3 w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md rounded-2xl text-white/70 hover:text-white transition-all group shadow-lg"
                >
                  <Github size={20} className="group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold">Açık Kaynak Kodları</span>
                </button>

                <p className="text-[10px] text-white/20 font-medium tracking-widest mt-2 whitespace-pre-line text-center">
                  Y. Eren Bektaş tarafından.
                </p>
              </div>

              <button
                onClick={() => setShowCredits(false)}
                className="mt-4 px-10 py-3 bg-white/10 hover:bg-white/20 text-white text-xs font-black rounded-xl border border-white/10 backdrop-blur-md transition-all active:scale-95 shadow-xl"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warning Modal */}
      {warningModal.type && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300"
          onClick={() => setWarningModal({ type: null, files: [] })}
        >
          <div
            className="bg-[#1A0A0A]/90 backdrop-blur-2xl border border-red-500/30 p-8 rounded-[2rem] max-w-lg w-full animate-in zoom-in-95 duration-300 relative overflow-hidden shadow-[0_0_60px_rgba(239,68,68,0.2)]"
            onClick={e => e.stopPropagation()}
          >
            {/* Red glow background */}
            <div className="absolute inset-0 bg-radial-at-t from-red-500/10 to-transparent pointer-events-none" />

            <div className="flex flex-col gap-5 relative z-10">
              {/* Icon and Title */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-600/20 flex items-center justify-center text-red-400 border border-red-500/30 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                    <path d="M12 9v4" /><path d="M12 17h.01" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-black text-red-400">
                    {warningModal.type === 'unnumbered' ? 'Numarasız Dosyalar Tespit Edildi' : 'Desteklenmeyen Dosyalar'}
                  </h3>
                  <p className="text-white/50 text-sm">
                    {warningModal.type === 'unnumbered'
                      ? 'Aşağıdaki dosyaların isimlerinin numaralandırılmamış olduğu tespit edildi.'
                      : 'Aşağıdaki dosya türleri desteklenmemektedir.'}
                  </p>
                </div>
              </div>

              {/* File List */}
              <div className="bg-black/40 border border-red-500/20 rounded-xl p-3 max-h-24 overflow-y-auto custom-scrollbar">
                <code className="text-xs text-red-300/80 font-mono whitespace-pre-wrap break-all">
                  {warningModal.files.join('\n')}
                </code>
              </div>

              <p className="text-white/40 text-sm">Nasıl ilerlemek istersiniz?</p>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleWarningCancel}
                  className="flex-1 px-5 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm font-bold rounded-xl border border-red-500/30 transition-all active:scale-95"
                >
                  İşlemi İptal Et
                </button>
                <button
                  onClick={handleWarningSkip}
                  className="flex-1 px-5 py-3 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-xl border border-white/10 transition-all active:scale-95"
                >
                  {warningModal.type === 'unnumbered' ? 'Numarasızları Atla' : 'Desteklenmeyenleri Atla'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
