import React, { useState, useCallback, useRef } from 'react';
import { Upload } from 'lucide-react';
import clsx from 'clsx';

interface DragZoneProps {
    onFilesDropped: (files: File[]) => void;
    isFull?: boolean;
}

export function DragZone({ onFilesDropped, isFull }: DragZoneProps) {
    const [isDragActive, setIsDragActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const dragCounter = useRef(0);

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current++;
        setIsDragActive(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current--;
        if (dragCounter.current === 0) {
            setIsDragActive(false);
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
        dragCounter.current = 0;

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
                "bg-white/[0.02] border transition-all duration-500 cursor-pointer relative overflow-hidden group flex items-center justify-center",
                isFull
                    ? "flex-col gap-6 rounded-full w-[450px] h-[450px] aspect-square shadow-[0_0_80px_rgba(0,0,0,0.5)] border-white/10"
                    : "h-full w-full flex-row gap-6 px-10 rounded-3xl border-white/5",
                isDragActive
                    ? clsx(
                        "border-blue-500/50 bg-blue-500/10",
                        isFull && "shadow-[0_0_60px_rgba(59,130,246,0.1)] scale-[1.05]"
                    )
                    : clsx(
                        "hover:border-white/20 hover:bg-white/[0.04]",
                        isFull && "hover:scale-[1.05]"
                    )
            )}
        >
            <input
                ref={inputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleInputChange}
            />

            {/* Content Wrapper for counter-scaling in Full Mode */}
            <div className={clsx(
                "flex transition-all duration-500 z-10",
                isFull ? "flex-col items-center gap-6" : "flex-row items-center gap-6 w-full",
                isFull && (isDragActive ? "scale-[0.95]" : "group-hover:scale-[0.95]")
            )}>
                {/* Icon Wrapper */}
                <div className={clsx(
                    "flex items-center justify-center transition-all duration-500 flex-shrink-0 relative",
                    isFull ? "w-28 h-28 rounded-3xl bg-blue-600/10 text-blue-500 border-2 border-blue-500/20 shadow-2xl" : "w-14 h-14 rounded-2xl bg-white/5 text-blue-400 border border-white/10",
                    isDragActive ? "scale-110 bg-blue-600 text-white border-transparent" : "group-hover:scale-105 group-hover:text-blue-300"
                )}>
                    <Upload size={isFull ? 48 : 24} className={clsx("transition-transform duration-500 z-10", isDragActive ? "translate-y-[-4px]" : "")} />

                    {/* Smooth Breathing Glow when drag active */}
                    {isDragActive && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                            <div className={clsx("w-full h-full rounded-full bg-blue-500/40 animate-pulse", isFull ? "blur-2xl" : "blur-xl")} />
                            <div className={clsx("absolute w-1/2 h-1/2 rounded-full bg-blue-400/60 animate-pulse delay-75", isFull ? "blur-xl" : "blur-lg")} />
                        </div>
                    )}
                </div>

                {/* Text Content */}
                <div className={clsx("flex flex-col transition-all duration-500", isFull ? "items-center text-center" : "text-left")}>
                    <strong className={clsx(
                        "text-white block font-black tracking-tight leading-none transition-all",
                        isFull ? "text-4xl mb-4" : "text-xl mb-1.5",
                        isDragActive ? "text-blue-400" : ""
                    )}>
                        {isDragActive ? "Dosyaları Bırakın" : (isFull ? "Dosyaları Sürükleyin / Seçin" : "Dosyaları Sürükleyin veya Seçin")}
                    </strong>
                    <p className={clsx(
                        "text-white/30 font-bold tracking-[0.3em] transition-all",
                        isFull ? "text-base" : "text-[12px]",
                        isDragActive ? "text-blue-400/50" : ""
                    )}>
                        {isFull ? "PDF, Görsel, Office, MSG" : "PDF, Görsel, Office, MSG"}
                    </p>
                </div>
            </div>

            {/* Animated Grid Background */}
            <div className={clsx(
                "absolute inset-0 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-all duration-500",
                isFull && (isDragActive ? "scale-[0.95]" : "group-hover:scale-[0.95]")
            )}
                style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        </div>
    );
}
