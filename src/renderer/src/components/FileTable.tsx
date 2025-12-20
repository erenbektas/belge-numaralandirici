import { Trash2, FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react';
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
            <div className="p-6 flex items-center gap-3 border-b border-white/5">
                <FileText size={22} className="text-blue-400" />
                <h2 className="font-bold text-lg text-white">Yüklenen Dosyalar</h2>
                <span className="ml-auto bg-blue-500/10 text-blue-400 text-xs px-2.5 py-1 rounded-full font-bold tabular-nums border border-blue-500/10">
                    {documents.length}
                </span>
            </div>

            <div className="overflow-y-auto flex-1 custom-scrollbar">
                <table className="w-full border-collapse">
                    <thead className="sticky top-0 bg-surface-dark z-10">
                        <tr className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/30 border-b border-white/5">
                            <th className="p-4 pl-6 text-left w-20">No.</th>
                            <th className="p-4 text-left">Dosya Adı</th>
                            <th className="p-4 text-left w-24 text-center">Tür</th>
                            <th className="p-4 text-left w-24 text-center">Durum</th>
                            <th className="p-4 text-right pr-6 w-16"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02]">
                        {documents.map((doc) => (
                            <tr key={doc.id} className="hover:bg-white/[0.03] group transition-all duration-200">
                                <td className="p-4 pl-6">
                                    <span className="bg-white/5 text-white/70 px-2 py-0.5 rounded-md text-xs font-bold border border-white/5">
                                        {doc.numberDisplay || '-'}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors truncate max-w-[300px]">
                                        {doc.cleanName}
                                    </div>
                                    <div className="text-[10px] text-white/20 truncate max-w-[250px] font-medium mt-0.5">
                                        {doc.path}
                                    </div>
                                </td>
                                <td className="p-4 text-center">
                                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-white/5 text-white/40 border border-white/5">
                                        {doc.type}
                                    </span>
                                </td>
                                <td className="p-4 flex justify-center">
                                    {doc.status === 'ready' && <CheckCircle size={18} className="text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]" />}
                                    {doc.status === 'converting' && <Clock size={18} className="text-amber-500 animate-spin" />}
                                    {doc.status === 'error' && <AlertCircle size={18} className="text-rose-500" />}
                                    {doc.status === 'pending' && <div className="w-2 h-2 rounded-full bg-white/10" />}
                                </td>
                                <td className="p-4 text-right pr-6">
                                    <button
                                        onClick={() => onRemove(doc.id)}
                                        className="p-2 bg-white/0 hover:bg-rose-500/10 text-white/20 hover:text-rose-500 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={16} />
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
