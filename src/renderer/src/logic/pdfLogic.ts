import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

export async function getPdfPageCount(buffer: ArrayBuffer): Promise<number> {
    // Slice to avoid detaching the original buffer
    const copy = buffer.slice(0);
    const pdf = await pdfjsLib.getDocument({ data: copy }).promise;
    return pdf.numPages;
}

export async function createStampedPDF(
    pages: { docBuffer: ArrayBuffer, pageNum: number, rotation: number, stampText?: string, type: string }[]
): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();

    // Embed font once
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    for (const pageData of pages) {
        let addedPage;

        if (pageData.type === 'pdf') {
            const sourcePdf = await PDFDocument.load(pageData.docBuffer.slice(0));
            const [copiedPage] = await pdfDoc.copyPages(sourcePdf, [pageData.pageNum - 1]);
            copiedPage.setRotation(degrees(pageData.rotation));
            addedPage = pdfDoc.addPage(copiedPage);
        } else {
            // Image
            let image;
            // Detect mime type or try both?
            // Simplified: try embedPng, catch -> embedJpg
            try {
                image = await pdfDoc.embedPng(pageData.docBuffer);
            } catch {
                image = await pdfDoc.embedJpg(pageData.docBuffer);
            }
            const { width, height } = image.scale(1);
            addedPage = pdfDoc.addPage([width, height]);
            if (pageData.rotation !== 0) {
                addedPage.setRotation(degrees(pageData.rotation));
            }
            addedPage.drawImage(image, { x: 0, y: 0, width, height });
        }

        // Stamping Logic
        if (pageData.stampText) {
            const { width, height } = addedPage.getSize();
            const rotation = pageData.rotation % 360;
            const fontSize = 18;
            const circleRadius = 21;
            const margin = 35;

            let drawX = margin, drawY = height - margin;
            let textRotationAngle = 0;

            // Adjust position based on page rotation (keep stamp in visual top-left)
            if (rotation === 0) {
                drawX = margin; drawY = height - margin; textRotationAngle = 0;
            } else if (rotation === 90) {
                drawX = margin; drawY = margin; textRotationAngle = 90;
            } else if (rotation === 180) {
                drawX = width - margin; drawY = margin; textRotationAngle = 180;
            } else if (rotation === 270) {
                drawX = width - margin; drawY = height - margin; textRotationAngle = 270;
            }

            // Draw Circle - reduced opacity (0.15 -> 0.1, 0.3 -> 0.2)
            addedPage.drawCircle({ x: drawX, y: drawY, size: circleRadius + 2, color: rgb(0.7, 0.7, 0.7), opacity: 0.1 }); // Border
            addedPage.drawCircle({ x: drawX, y: drawY, size: circleRadius, color: rgb(1, 1, 1), opacity: 0.2 }); // White fill

            // Draw Text - use rotation matrix for proper centering
            const textWidth = font.widthOfTextAtSize(pageData.stampText, fontSize);
            const verticalOffset = fontSize / 2.8;
            const rad = textRotationAngle * Math.PI / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);
            const localX = -textWidth / 2;
            const localY = -verticalOffset;
            const rotatedX = localX * cos - localY * sin;
            const rotatedY = localX * sin + localY * cos;
            const finalX = drawX + rotatedX;
            const finalY = drawY + rotatedY;

            addedPage.drawText(pageData.stampText, {
                x: finalX,
                y: finalY,
                size: fontSize,
                font: font,
                color: rgb(0, 0, 0),
                rotate: degrees(textRotationAngle)
            });
        }
    }

    return await pdfDoc.save();
}

export interface CompressionSettings {
    dpi: number;
    quality: number;
}

export async function compressPDF(
    pdfBuffer: ArrayBuffer,
    settings: CompressionSettings,
    onProgress?: (current: number, total: number) => void
): Promise<Uint8Array> {
    // Copy the buffer to avoid detachment issues if getDocument consumes it
    const dataCopy = pdfBuffer.slice(0);
    const pdf = await pdfjsLib.getDocument({ data: dataCopy }).promise;
    const numPages = pdf.numPages;
    const resultPdf = await PDFDocument.create();

    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: settings.dpi / 72 });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Could not get canvas context');

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
            canvasContext: context,
            viewport: viewport,
            canvas: canvas
        }).promise;

        const imageDataUrl = canvas.toDataURL('image/jpeg', settings.quality);

        // Manual base64 to Uint8Array to avoid 'fetch' issues in some Electron environments
        const base64Data = imageDataUrl.split(',')[1];
        const binaryString = atob(base64Data);
        const imageBytes = new Uint8Array(binaryString.length);
        for (let j = 0; j < binaryString.length; j++) {
            imageBytes[j] = binaryString.charCodeAt(j);
        }

        const image = await resultPdf.embedJpg(imageBytes);
        const newPage = resultPdf.addPage([viewport.width, viewport.height]);
        newPage.drawImage(image, {
            x: 0,
            y: 0,
            width: viewport.width,
            height: viewport.height,
        });

        if (onProgress) onProgress(i, numPages);

        // Cleanup to prevent memory leaks during processing
        canvas.width = 0;
        canvas.height = 0;
    }

    return await resultPdf.save();
}
