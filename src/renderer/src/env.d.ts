export { };

declare global {
    interface Window {
        api: {
            scanFolder: (path: string) => Promise<string[]>;
            convertFile: (path: string) => Promise<Uint8Array>;
            readFile: (path: string) => Promise<Uint8Array>;
            getFilePath: (file: File) => string;
            openExternal: (url: string) => Promise<void>;
        }
    }
}
