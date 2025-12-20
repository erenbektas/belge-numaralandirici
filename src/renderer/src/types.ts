export interface DocumentItem {
    id: string; // Unique ID
    file: File | null; // Null if from filesystem scan? No, we might not have File object if remote, but here it's local.
    // Actually, if we use path, we might not have File object initially if scanned from main.
    // But we can construct it or just use path.
    path: string;
    name: string;
    cleanName: string;
    type: 'pdf' | 'image' | 'office' | 'msg' | 'unknown';
    pageCount: number;
    numberDisplay: string;
    sortKey: number;
    status: 'pending' | 'converting' | 'ready' | 'error';
}

export interface PageItem {
    docId: string;
    pageNum: number; // 1-based index in source doc
    globalPageNum: number;
    rotation: number;
    stampText: string | null; // Document number to stamp (null = don't stamp)
    imageBitmap?: ImageBitmap; // For preview
}
