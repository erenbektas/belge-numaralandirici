namespace Numaralandirici.Models;

public class OrderSegment
{
    public int? NumericValue { get; }
    public char? LetterValue { get; }

    public OrderSegment(int numericValue)
    {
        NumericValue = numericValue;
    }

    public OrderSegment(char letterValue)
    {
        LetterValue = letterValue;
    }

    public bool IsNumeric => NumericValue.HasValue;

    public override string ToString() =>
        IsNumeric ? NumericValue!.Value.ToString() : LetterValue!.Value.ToString();

    public int CompareTo(OrderSegment other)
    {
        if (IsNumeric && other.IsNumeric)
            return NumericValue!.Value.CompareTo(other.NumericValue!.Value);
        if (!IsNumeric && !other.IsNumeric)
            return LetterValue!.Value.CompareTo(other.LetterValue!.Value);
        // Numeric segments come before letter segments
        return IsNumeric ? -1 : 1;
    }
}

public class OrderPrefix : IComparable<OrderPrefix>
{
    public List<OrderSegment> Segments { get; }
    public string DisplayText { get; }

    public OrderPrefix(List<OrderSegment> segments)
    {
        Segments = segments;
        DisplayText = BuildDisplayText();
    }

    private string BuildDisplayText()
    {
        if (Segments.Count == 0)
            return "Numarasız";

        var parts = new List<string>();
        for (int i = 0; i < Segments.Count; i++)
        {
            parts.Add(Segments[i].ToString());
        }
        return string.Join(".", parts);
    }

    public bool IsEmpty => Segments.Count == 0;

    public int CompareTo(OrderPrefix? other)
    {
        if (other is null) return 1;

        // Empty prefixes (unnumbered files) sort last
        if (IsEmpty && !other.IsEmpty) return 1;
        if (!IsEmpty && other.IsEmpty) return -1;

        int minLen = Math.Min(Segments.Count, other.Segments.Count);
        for (int i = 0; i < minLen; i++)
        {
            int cmp = Segments[i].CompareTo(other.Segments[i]);
            if (cmp != 0) return cmp;
        }
        return Segments.Count.CompareTo(other.Segments.Count);
    }

    public override string ToString() => DisplayText;
}
