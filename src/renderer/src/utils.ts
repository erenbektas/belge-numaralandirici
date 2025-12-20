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
        const letter = match[3] ? match[3].toLowerCase() : '';

        display = match[3] ? `${match[1]}.${match[3]}` : match[1];
        sortKey = num + (letter ? letter.charCodeAt(0) / 1000 : 0);
        mainNumber = match[1];
        subLetter = letter;

        let tempName = filename.substring(match[0].length);
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
