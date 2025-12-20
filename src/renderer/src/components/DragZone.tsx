import React, { useState, useCallback, useRef } from 'react';
import { Upload } from 'lucide-react';
import clsx from 'clsx';

interface DragZoneProps {
    onFilesDropped: (files: File[]) => void;
    onFolderSelect: () => void;
}

export function DragZone({ onFilesDropped, onFolderSelect }: DragZoneProps) {
    const [isDragActive, setIsDragActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);

        // Access native FileList directly from dataTransfer
        const dt = e.dataTransfer;
        if (dt && dt.files && dt.files.length > 0) {
            const files = Array.from(dt.files);
            console.log("[DragZone] Native drop - files:", files);
            onFilesDropped(files);
        } else {
            console.warn("[DragZone] No files in drop event");
        }
    }, [onFilesDropped]);

    const handleClick = useCallback(() => {
        inputRef.current?.click();
    }, []);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            onFilesDropped(Array.from(files));
        }
    }, [onFilesDropped]);

    return (
        <div
            onClick={handleClick}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={clsx(
                "flex-1 bg-surface-dark border border-border-dark rounded-2xl flex flex-col items-center justify-center min-h-[250px] transition-all cursor-pointer relative overflow-hidden group",
                isDragActive ? "border-blue-500 bg-blue-500/5 shadow-[0_0_20px_rgba(59,130,246,0.1)]" : "hover:bg-white/[0.02]"
            )}
        >

            <input
                ref={inputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleInputChange}
            />

            <div className={clsx(
                "w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300",
                isDragActive ? "bg-blue-600 text-white scale-110" : "bg-white/5 text-blue-400 group-hover:scale-110 border border-white/5"
            )}>
                <Upload size={28} />
            </div>

            <div className="text-center z-10">
                <strong className="text-white block text-xl font-bold tracking-tight mb-2">
                    {isDragActive ? "Bırakın..." : "Dosyaları Seçin veya Sürükleyin"}
                </strong>
                <p className="text-sm text-white/40 font-medium">
                    PDF, Görseller, Word, Excel desteği
                </p>
            </div>
        </div>
    );
}
