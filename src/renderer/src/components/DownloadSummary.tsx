import { Download, FileText, ArrowLeft, Zap, Gauge, HardDrive, Loader2 } from 'lucide-react';
import { CompressionSettings } from '../logic/pdfLogic';

interface DownloadSummaryProps {
    pdfData: Uint8Array;
    pageCount: number;
    onDownloadOriginal: () => void;
    onDownloadCompressed: (settings: CompressionSettings) => void;
    onBack: () => void;
    isCompressing: boolean;
    progress: number;
}

export function DownloadSummary({
    pdfData,
    pageCount,
    onDownloadOriginal,
    onDownloadCompressed,
    onBack,
    isCompressing,
    progress
}: DownloadSummaryProps) {
    const fileSizeMB = (pdfData.length / (1024 * 1024)).toFixed(2);
    const isTooLarge = parseFloat(fileSizeMB) > 12;

    const presets = [
        { id: 'low', name: 'Az Sıkıştırma', dpi: 150, quality: 0.8, icon: <Zap size={18} />, desc: 'Kalite Odaklı (150 DPI, %80 Kalite)' },
        { id: 'okunaki', name: 'Okunaklı Sıkıştırma', dpi: 130, quality: 0.45, icon: <FileText size={18} />, desc: 'Net Metin (130 DPI, %45 Kalite)' },
        { id: 'med', name: 'Orta Sıkıştırma', dpi: 100, quality: 0.6, icon: <Gauge size={18} />, desc: 'Dengeli (100 DPI, %60 Kalite)' },
        { id: 'high', name: 'Yüksek Sıkıştırma', dpi: 72, quality: 0.4, icon: <HardDrive size={18} />, desc: 'Düşük Boyut (72 DPI, %40 Kalite)' },
    ];

    return (
        <div className="h-full flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in duration-500 overflow-hidden">
            <div className="w-full max-w-2xl bg-surface-light border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-full overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center text-blue-400">
                                <FileText size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white tracking-wider leading-none mb-1">Dosya Hazır</h2>
                                <p className="text-white/40 text-[10px] font-medium tracking-tight">Hasar Belgeleri.pdf</p>
                            </div>
                        </div>

                        {/* Stats in Blue Area */}
                        <div className="flex items-center gap-3 ml-2 border-l border-white/10 pl-6">
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-white/20 tracking-[0.2em]">Sayfa</span>
                                <span className="text-sm font-black text-white tabular-nums">{pageCount}</span>
                            </div>
                            <div className="w-px h-6 bg-white/10 mx-1" />
                            <div className={`flex flex-col ${isTooLarge ? 'animate-[bounce_2s_infinite]' : ''}`}>
                                <span className={`text-[8px] font-black tracking-[0.2em] ${isTooLarge ? 'text-rose-400' : 'text-emerald-400/50'}`}>
                                    Boyut {isTooLarge ? '(Limit Üstü)' : ''}
                                </span>
                                <span className={`text-sm font-black tabular-nums ${isTooLarge ? 'text-rose-500' : 'text-emerald-500'}`}>
                                    {fileSizeMB} MB
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onBack}
                        className="text-white/20 hover:text-white/60 transition-colors flex items-center gap-2 text-xs font-black uppercase tracking-widest"
                    >
                        <ArrowLeft size={14} /> Vazgeç
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto custom-scrollbar flex-1 p-8">
                    {/* Compression Options */}
                    <div className="flex flex-col gap-4">
                        <button
                            onClick={onDownloadOriginal}
                            disabled={isCompressing}
                            className="group flex items-center justify-between py-6 px-10 bg-white/20 border border-white/30 rounded-2xl hover:bg-white/30 hover:border-white/50 transition-all disabled:opacity-50 shadow-[0_0_40px_rgba(255,255,255,0.03)] scale-[1.02]"
                        >
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white/60 group-hover:text-white transition-colors">
                                    <Download size={24} />
                                </div>
                                <div className="text-left">
                                    <div className="text-base font-black text-white tracking-wider">Orijinal Boyut (Hızlı)</div>
                                    <div className="text-[11px] text-white/30 font-medium italic">Hiçbir sıkıştırma uygulanmaz</div>
                                </div>
                            </div>
                            <span className="text-sm font-black text-white/50 group-hover:text-white transition-colors">{fileSizeMB} MB</span>
                        </button>

                        <div className="grid grid-cols-2 gap-3">
                            {presets.map(preset => (
                                <button
                                    key={preset.id}
                                    onClick={() => onDownloadCompressed({ dpi: preset.dpi, quality: preset.quality })}
                                    disabled={isCompressing}
                                    className="group flex flex-col items-start p-4 bg-blue-600/5 border border-blue-500/10 rounded-2xl hover:bg-blue-600/10 hover:border-blue-500/30 transition-all disabled:opacity-50 text-left gap-4"
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                            {preset.icon}
                                        </div>
                                        <Download size={16} className="text-blue-500 opacity-40 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-black text-white tracking-wider">{preset.name}</div>
                                        <div className="text-[10px] text-blue-400/50 font-medium mt-1 leading-tight">{preset.desc}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Compression Overlay */}
                {isCompressing && (
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-12 text-center z-50">
                        <div className="relative w-24 h-24 mb-6">
                            <Loader2 size={96} className="text-blue-500 animate-spin opacity-20" />
                            <div className="absolute inset-0 flex items-center justify-center text-xl font-black text-white tabular-nums">
                                %{progress}
                            </div>
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-widest mb-2">Sıkıştırılıyor</h2>
                        <p className="text-white/40 text-sm max-w-xs">Belgeler yeniden işleniyor ve optimize ediliyor. Lütfen bekleyin...</p>

                        <div className="w-64 h-1.5 bg-white/5 rounded-full mt-8 overflow-hidden">
                            <div
                                className="h-full bg-blue-500 transition-all duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
