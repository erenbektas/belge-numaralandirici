
import { ipcMain, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

async function convertWithPowerShell(inputPath: string, outputPath: string): Promise<void> {
    const RESOURCES_PATH = app.isPackaged
        ? path.join(process.resourcesPath, 'resources')
        : path.join(__dirname, '../../resources');

    const scriptPath = path.join(RESOURCES_PATH, 'ConvertToPdf.ps1');

    return new Promise((resolve, reject) => {
        const ps = spawn('powershell.exe', [
            '-ExecutionPolicy', 'Bypass',
            '-File', scriptPath,
            '-InputFile', inputPath,
            '-OutputFile', outputPath
        ]);

        let stderr = '';
        ps.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        ps.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`PowerShell script failed with code ${code}: ${stderr} `));
            }
        });
    });
}

export function setupFileHandlers() {
    ipcMain.handle('scan-folder', async (_, targetPath: string) => {
        console.log(`[Main] scan-folder called with: ${targetPath}`);
        try {
            const stat = await fs.promises.stat(targetPath);
            console.log(`[Main] stat result: isFile=${stat.isFile()}, isDirectory=${stat.isDirectory()}`);
            if (stat.isFile()) {
                return [targetPath];
            }
            return await scanDirectoryRecursive(targetPath);
        } catch (error) {
            console.error(`[Main] Error scanning path '${targetPath}':`, error);
            throw new Error(`Failed to scan path '${targetPath}': ${(error as any).message}`);
        }
    });

    ipcMain.handle('convert-to-pdf', async (_, filePath: string) => {
        const ext = path.extname(filePath).toLowerCase();

        if (['.docx', '.doc', '.xlsx', '.xls', '.pptx', '.ppt', '.txt', '.msg'].includes(ext)) {
            try {
                // Use temp directory to avoid path issues with special characters/spaces
                const os = await import('os');
                const tempDir = os.tmpdir();
                const baseName = path.basename(filePath).replace(/[^a-zA-Z0-9._-]/g, '_');
                const tempFileName = `converted_${Date.now()}_${baseName}.pdf`;
                const tempPdfPath = path.join(tempDir, tempFileName);

                console.log(`[Main] Converting ${filePath} -> ${tempPdfPath}`);

                // Convert using PowerShell
                await convertWithPowerShell(filePath, tempPdfPath);

                // Verify output exists
                try {
                    await fs.promises.access(tempPdfPath);
                } catch {
                    throw new Error(`PowerShell conversion did not produce output file`);
                }

                // Read the result
                const pdfBuf = await fs.promises.readFile(tempPdfPath);
                console.log(`[Main] Conversion successful, PDF size: ${pdfBuf.length} bytes`);

                // Clean up
                await fs.promises.unlink(tempPdfPath);

                return pdfBuf;
            } catch (err: any) {
                console.error(`[Main] Conversion failed for ${filePath}:`, err);
                throw new Error(`Conversion failed for ${filePath}: ${err.message}`);
            }
        }

        // Default read
        return fs.promises.readFile(filePath);
    });

    ipcMain.handle('read-file', async (_, filePath: string) => {
        console.log(`[Main] read-file called with: ${filePath}`);
        try {
            const buffer = await fs.promises.readFile(filePath);
            return buffer;
        } catch (error) {
            console.error(`[Main] Error reading file '${filePath}':`, error);
            throw new Error(`Failed to read file '${filePath}': ${(error as any).message}`);
        }
    });
}

async function scanDirectoryRecursive(dirPath: string): Promise<string[]> {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            files.push(...await scanDirectoryRecursive(fullPath));
        } else {
            files.push(fullPath);
        }
    }
    return files;
}
