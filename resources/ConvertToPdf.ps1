param (
    [string]$InputFile,
    [string]$OutputFile
)

$ErrorActionPreference = "Stop"

function Convert-Word {
    param($in, $out)
    Write-Host "Converting Word document: $in -> $out"
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = [microsoft.office.interop.word.WdAlertLevel]::wdAlertsNone
    
    try {
        Write-Host "Opening document..."
        $doc = $word.Documents.Open($in, $false, $true) # ReadOnly
        Write-Host "Saving as PDF..."
        $doc.SaveAs([ref] $out, [ref] 17) # wdFormatPDF = 17
        Write-Host "Closing document..."
        $doc.Close($false)
        Write-Host "Conversion complete."
    }
    finally {
        $word.Quit()
        [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
    }
}

function Convert-Excel {
    param($in, $out)
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    
    try {
        $wb = $excel.Workbooks.Open($in, $null, $true) # ReadOnly
        $wb.ExportAsFixedFormat(0, $out) # xlTypePDF = 0
        $wb.Close($false)
    }
    finally {
        $excel.Quit()
        [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
    }
}

function Convert-PowerPoint {
    param($in, $out)
    $ppt = New-Object -ComObject PowerPoint.Application
    # PowerPoint visible property behaves differently, usually needs to be visible to export?
    # Trying with minimized window if possible, or just standard.
    
    try {
        $presentation = $ppt.Presentations.Open($in, -1, 0, 0) # ReadOnly, Untitled, WithWindow=msoFalse
        $presentation.SaveAs($out, 32) # ppSaveAsPDF = 32
        $presentation.Close()
    }
    finally {
        $ppt.Quit()
        [System.Runtime.Interopservices.Marshal]::ReleaseComObject($ppt) | Out-Null
    }
}

function Convert-Outlook {
    param($in, $out)
    $outlook = New-Object -ComObject Outlook.Application
    # Outlook usually needs to be running or it starts. 
    # Requires security access sometimes.
    
    try {
        $namespace = $outlook.GetNamespace("MAPI")
        $namespace.Logon("", "", $false, $false)
        
        $item = $namespace.OpenSharedItem($in)
        $inspector = $item.GetInspector
        $doc = $inspector.WordEditor # Uses Word engine for editing
        
        $doc.SaveAs([ref] $out, [ref] 17) # wdFormatPDF = 17
        
        $item.Close(0) # olDiscard = 0
    }
    finally {
        # Do not quit Outlook as it might be the user's main instance.
        # Just release object.
        [System.Runtime.Interopservices.Marshal]::ReleaseComObject($outlook) | Out-Null
    }
}

if (-not (Test-Path $InputFile)) {
    Write-Error "Input file not found: $InputFile"
    exit 1
}

$ext = [System.IO.Path]::GetExtension($InputFile).ToLower()

try {
    switch ($ext) {
        ".docx" { Convert-Word $InputFile $OutputFile }
        ".doc" { Convert-Word $InputFile $OutputFile }
        ".xlsx" { Convert-Excel $InputFile $OutputFile }
        ".xls" { Convert-Excel $InputFile $OutputFile }
        ".pptx" { Convert-PowerPoint $InputFile $OutputFile }
        ".ppt" { Convert-PowerPoint $InputFile $OutputFile }
        ".txt" { Convert-Word $InputFile $OutputFile }
        ".msg" { Convert-Outlook $InputFile $OutputFile }
        default { throw "Unsupported file type: $ext" }
    }
}
catch {
    Write-Error "Conversion failed: $_"
    exit 1
}

exit 0
