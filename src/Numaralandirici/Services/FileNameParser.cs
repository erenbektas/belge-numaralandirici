using System.IO;
using Numaralandirici.Models;

namespace Numaralandirici.Services;

public static class FileNameParser
{
    public static OrderPrefix Parse(string filePath)
    {
        var fileName = Path.GetFileNameWithoutExtension(filePath);
        var segments = new List<OrderSegment>();
        int pos = 0;

        // Must start with digits
        if (!TryReadDigits(fileName, ref pos, out int firstNumber))
            return new OrderPrefix(segments);

        segments.Add(new OrderSegment(firstNumber));

        while (pos < fileName.Length)
        {
            char sep = fileName[pos];

            // Space means stop
            if (sep == ' ')
                break;

            // Only dot and dash are valid separators
            if (sep != '.' && sep != '-')
                break;

            int sepPos = pos;
            pos++; // consume separator

            // Nothing after separator → stop
            if (pos >= fileName.Length)
                break;

            char next = fileName[pos];

            // Space after separator → stop (e.g. "1. belge", "1- belge")
            if (next == ' ')
            {
                pos = sepPos; // don't consume separator
                break;
            }

            // Digit after separator → continue reading next number
            if (char.IsDigit(next))
            {
                if (!TryReadDigits(fileName, ref pos, out int num))
                    break;
                segments.Add(new OrderSegment(num));
                continue;
            }

            // Letter after separator → check if it's a single letter (part of order)
            // or start of a word (part of name)
            if (char.IsLetter(next))
            {
                // Check if it's a single letter: next char must be space, end, dot, or dash
                bool isSingleLetter = (pos + 1 >= fileName.Length) ||
                                       fileName[pos + 1] == ' ' ||
                                       fileName[pos + 1] == '.' ||
                                       fileName[pos + 1] == '-';

                if (isSingleLetter)
                {
                    segments.Add(new OrderSegment(char.ToLowerInvariant(next)));
                    pos++; // consume the letter
                    continue;
                }
                else
                {
                    // It's a word (e.g. "1.belge") → stop, don't include
                    break;
                }
            }

            // Anything else → stop
            break;
        }

        return new OrderPrefix(segments);
    }

    private static bool TryReadDigits(string text, ref int pos, out int value)
    {
        value = 0;
        int start = pos;
        while (pos < text.Length && char.IsDigit(text[pos]))
        {
            value = value * 10 + (text[pos] - '0');
            pos++;
        }
        return pos > start;
    }
}
