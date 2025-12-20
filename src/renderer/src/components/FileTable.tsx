import { Trash2, FileText, AlertCircle, Loader2, FileCheck } from 'lucide-react';
import { DocumentItem } from '../types';

interface FileTableProps {
    documents: DocumentItem[];
    onRemove: (id: string) => void;
}

export function FileTable({ documents, onRemove }: FileTableProps) {
    if (documents.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-white/20 h-full border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
                <FileText size={48} className="mb-4 opacity-20" />
                <p className="text-lg font-medium">Henüz dosya eklenmedi</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="p-6 flex items-center gap-3">
                <FileText size={22} className="text-blue-500 fill-blue-500/10" />
                <h2 className="font-black text-xl text-white tracking-tight">Yüklenen Dosyalar</h2>
                <div className="ml-auto w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <span className="text-blue-400 text-[10px] font-black tabular-nums">
                        {documents.length}
                    </span>
                </div>
            </div>

            <div className="overflow-y-auto flex-1 custom-scrollbar">
                <table className="w-full border-collapse">
                    <thead className="sticky top-0 bg-surface-dark z-10">
                        <tr className="text-[10px] font-black tracking-[0.2em] text-white/20 border-b border-white/[0.03]">
                            <th className="p-6 pl-8 text-left w-24">No.</th>
                            <th className="p-6 text-left">Dosya Adı</th>
                            <th className="p-6 text-center w-32">Tür</th>
                            <th className="p-6 text-center w-32">Durum</th>
                            <th className="p-6 text-right pr-8 w-20"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02]">
                        {documents.map((doc) => (
                            <tr key={doc.id} className="hover:bg-white/[0.02] group transition-all duration-200 border-b border-white/[0.03]">
                                <td className="p-5 pl-8">
                                    <div className="w-10 h-10 rounded-xl border border-white/5 bg-white/[0.03] flex items-center justify-center text-xs font-black text-white/40 group-hover:border-blue-500/30 group-hover:text-blue-400 transition-all">
                                        {doc.numberDisplay || '-'}
                                    </div>
                                </td>
                                <td className="p-5">
                                    <div className="text-[15px] font-bold text-white group-hover:text-blue-400 transition-colors truncate max-w-[400px]">
                                        {doc.cleanName}
                                    </div>
                                    <div className="text-[12px] text-white/20 truncate max-w-[400px] font-medium mt-1 tracking-tight">
                                        {doc.path}
                                    </div>
                                </td>
                                <td className="p-5 text-center">
                                    <span className="inline-block px-3 py-1 rounded-lg text-[10px] font-black tracking-widest bg-white/[0.03] text-white/40 border border-white/5">
                                        {doc.type}
                                    </span>
                                </td>
                                <td className="p-5">
                                    <div className="flex justify-center">
                                        {doc.status === 'ready' && (
                                            <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                                <FileCheck size={14} />
                                            </div>
                                        )}
                                        {doc.status === 'converting' && (
                                            <div className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 animate-spin">
                                                <Loader2 size={12} />
                                            </div>
                                        )}
                                        {doc.status === 'error' && (
                                            <div className="w-6 h-6 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                                                <AlertCircle size={14} />
                                            </div>
                                        )}
                                        {doc.status === 'pending' && <div className="w-2 h-2 rounded-full bg-white/10" />}
                                    </div>
                                </td>
                                <td className="p-5 text-right pr-8">
                                    <button
                                        onClick={() => onRemove(doc.id)}
                                        className="p-2.5 bg-white/0 hover:bg-rose-500/10 text-white/0 group-hover:text-white/20 hover:text-rose-500 rounded-xl transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
