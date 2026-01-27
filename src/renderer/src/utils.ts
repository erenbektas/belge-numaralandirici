export function extractNumber(filename: string) {
    // Logic from original HTML
    const match = filename.match(/^(\d+)([.\-/])?([a-z])?/i);

    let cleanName = filename;
    let display = '';
    let sortKey = Infinity;
    let mainNumber = '';
    let subLetter = '';

    if (match) {
        const num = parseInt(match[1]);
        let letter = match[3] ? match[3].toLowerCase() : '';

        // Validate letter suffix: only accept if followed by space or dash
        if (letter) {
            const charAfterMatch = filename[match[0].length];
            const isValidLetter = charAfterMatch === ' ' || charAfterMatch === '-';
            if (!isValidLetter) {
                // Ignore the letter - it's part of the filename (e.g., "1.araç.pdf")
                letter = '';
            }
        }

        display = letter ? `${match[1]}.${letter}` : match[1];
        sortKey = num + (letter ? letter.charCodeAt(0) / 1000 : 0);
        mainNumber = match[1];
        subLetter = letter;

        // Calculate where the "clean" name starts
        // If letter was valid, skip the full match. If not, skip only number + separator.
        const skipLength = letter
            ? match[0].length
            : match[1].length + (match[2] ? match[2].length : 0);
        let tempName = filename.substring(skipLength);
        cleanName = tempName.replace(/^[\s.\-_]+/, '');
    }

    return {
        display,
        sortKey,
        mainNumber,
        subLetter,
        cleanName
    };
}
