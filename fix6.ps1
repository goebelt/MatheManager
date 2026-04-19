$lines = Get-Content 'C:\Users\Anwender\MatheManager\src\app\invoices\page.tsx' -Encoding UTF8
$output = @()
$replaced = $false
foreach ($line in $lines) {
    if ($line -match 'invoice:\s*any' -and $line -notmatch 'interface' -and -not $replaced) {
        # Replace this line and skip the next 3 lines (items and total)
        $output += 'const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);'
        $replaced = $true
    } elseif ($line -match 'items:\s*InvoiceItem\[\]' -and -not $replaced) {
        # Skip (already handled)
    } elseif ($line -match 'total:\s*number' -and -not $replaced) {
        # Skip (already handled)
    } elseif ($line -match '\}\s*\|\s*null' -and -not $replaced) {
        # Skip closing brace (already handled)
    } else {
        $output += $line
    }
}
Set-Content -Path 'C:\Users\Anwender\MatheManager\src\app\invoices\page.tsx' -Value $output -Encoding UTF8
Write-Host "Replaced: $replaced"