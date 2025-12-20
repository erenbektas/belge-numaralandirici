import { useEffect, useRef, useState } from 'react';
import { PageItem, DocumentItem } from '../types';
import * as pdfjsLib from 'pdfjs-dist';
const workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

interface PreviewGridProps {
    pages: PageItem[];
    documents: DocumentItem[];
    onRotate: (index: number) => void;
}

function PageCard({ page, doc, onRotate }: { page: PageItem, doc: DocumentItem, onRotate: () => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [imageSrc, setImageSrc] = useState<string | null>(null);

    const renderTaskRef = useRef<any>(null);

    useEffect(() => {
        let cancelled = false;

        const render = async () => {
            setLoading(true);
            setError(null);
            setImageSrc(null);

            // Cancel any existing render task on this canvas
            if (renderTaskRef.current) {
                try { await renderTaskRef.current.cancel(); } catch (e) { }
            }

            try {
                if (doc.type === 'pdf' && doc.pdfBuffer && canvasRef.current) {
                    const arrayBuffer = doc.pdfBuffer.buffer as ArrayBuffer;

                    if (cancelled) return;

                    const bufferClone = arrayBuffer.slice(0);
                    const pdf = await pdfjsLib.getDocument({ data: bufferClone }).promise;
                    const pdfPage = await pdf.getPage(page.pageNum || 1);
                    const viewport = pdfPage.getViewport({ scale: 0.4, rotation: page.rotation || 0 });

                    const canvas = canvasRef.current;
                    const ctx = canvas.getContext('2d');
                    if (ctx && !cancelled) {
                        canvas.width = viewport.width;
                        canvas.height = viewport.height;

                        const renderTask = pdfPage.render({ canvasContext: ctx, viewport } as any);
                        renderTaskRef.current = renderTask;

                        try {
                            await renderTask.promise;
                        } catch (e: any) {
                            if (e.name === 'RenderingCancelledException') return;
                            throw e;
                        }
                    }
                } else if (doc.type === 'image' && doc.path) {
                    const uint8 = await window.api.readFile(doc.path);
                    if (cancelled) return;

                    const ext = doc.path.split('.').pop()?.toLowerCase() || '';
                    const mimeType = {
                        'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
                        'gif': 'image/gif', 'webp': 'image/webp', 'bmp': 'image/bmp'
                    }[ext] || 'image/jpeg';

                    let binary = '';
                    const bytes = new Uint8Array(uint8);
                    for (let i = 0; i < bytes.byteLength; i++) {
                        binary += String.fromCharCode(bytes[i]);
                    }
                    setImageSrc(`data:${mimeType};base64,${btoa(binary)}`);
                }
            } catch (e: any) {
                if (!cancelled) setError(e.message || "Hata");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        render();
        return () => {
            cancelled = true;
            if (renderTaskRef.current) {
                renderTaskRef.current.cancel();
            }
        };
    }, [page, doc]);

    return (
        <div
            onClick={onRotate}
            className="bg-surface-light border border-white/5 rounded-2xl p-4 cursor-pointer hover:border-blue-500/50 hover:bg-white/[0.05] hover:-translate-y-2 group relative transition-all duration-300"
        >
            <div className="bg-black/60 rounded-xl min-h-[250px] flex items-center justify-center overflow-hidden border border-white/5">
                {loading && (
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                        <span className="text-[10px] text-white/20 font-bold tracking-widest uppercase">Yükleniyor</span>
                    </div>
                )}
                {error && <div className="text-rose-500 text-[10px] font-bold p-4 text-center">{error}</div>}

                {doc.type === 'pdf' && !error && (
                    <canvas ref={canvasRef} className="max-w-full h-auto shadow-2xl transition-opacity duration-300" style={{ display: loading ? 'none' : 'block' }} />
                )}

                {doc.type === 'image' && !error && imageSrc && (
                    <img
                        className="max-w-full h-auto shadow-2xl transition-opacity duration-300"
                        style={{ display: loading ? 'none' : 'block', transform: `rotate(${page.rotation || 0}deg)` }}
                        src={imageSrc}
                        onLoad={() => setLoading(false)}
                        alt={doc.name}
                    />
                )}
            </div>

            <div className="flex items-center justify-between mt-4 px-1">
                <div className="flex flex-col">
                    <span className="text-[10px] text-white/30 font-black tracking-tighter uppercase">SAYFA</span>
                    <span className="text-xl font-black text-white leading-none">{page.globalPageNum}</span>
                </div>
                {page.stampText && (
                    <div className="w-8 h-8 rounded-full border-2 border-blue-500 flex items-center justify-center">
                        <span className="text-[10px] font-black text-blue-500">{page.stampText}</span>
                    </div>
                )}
            </div>

            <div className="absolute top-6 left-6 px-2 py-1 bg-black rounded-md border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0 pointer-events-none z-20">
                <span className="text-[10px] font-bold text-white/60">{doc.cleanName}</span>
            </div>

            {page.rotation !== 0 && (
                <div className="absolute top-6 right-6 w-8 h-8 bg-blue-600 shadow-xl rounded-full flex items-center justify-center text-[10px] font-black text-white z-20">
                    {page.rotation}°
                </div>
            )}

            <div className="absolute inset-0 flex items-center justify-center bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl">
                <div className="bg-white text-black px-4 py-2 rounded-full text-xs font-black shadow-2xl">DÖNDÜR</div>
            </div>
        </div>
    );
}

export function PreviewGrid({ pages, documents, onRotate }: PreviewGridProps) {
    if (pages.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center text-white/20 font-bold uppercase tracking-widest">
                Henüz sayfa yok
            </div>
        );
    }

    return (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-8 p-10 pb-24 overflow-y-auto h-full bg-pure-black custom-scrollbar">
            {pages.map((page, index) => {
                const doc = documents.find(d => d.id === page.docId);
                if (!doc) return null;
                return <PageCard key={`${page.docId}-${page.pageNum}-${index}`} page={page} doc={doc} onRotate={() => onRotate(index)} />;
            })}
        </div>
    );
}
