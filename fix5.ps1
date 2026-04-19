$c = Get-Content 'C:\Users\Anwender\MatheManager\src\app\invoices\page.tsx' -Raw -Encoding UTF8
# Replace the old multiline type with InvoiceData
$pattern = 'useState<\{\s*\r?\n\s*invoice:\s*any;\s*\r?\n\s*items:\s*InvoiceItem\[\];\s*\r?\n\s*total:\s*number;\s*\r?\n\}\s*\|\s*null>'
$replacement = 'useState<InvoiceData | null>'
if ($c -match $pattern) {
    $c = $c -replace $pattern, $replacement
    Write-Host "Matched and replaced"
} else {
    Write-Host "Pattern not matched, trying simpler replacement"
    # Just replace the exact known text
    $c = $c -replace 'const [invoiceData, setInvoiceData] = useState<{[^}]*} | null>', 'const [invoiceData, setInvoiceData] = useState<InvoiceData | null>'
}
Set-Content -Path 'C:\Users\Anwender\MatheManager\src\app\invoices\page.tsx' -Value $c -Encoding UTF8