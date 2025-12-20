import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

export async function getPdfPageCount(buffer: ArrayBuffer): Promise<number> {
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
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
            const sourcePdf = await PDFDocument.load(pageData.docBuffer);
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
