$c = Get-Content 'C:\Users\Anwender\MatheManager\src\app\invoices\page.tsx' -Raw -Encoding UTF8
# Fix the merged line
$c = $c -replace 'useState<DataContainer \|const \[invoiceData, setInvoiceData\] = useState<InvoiceData \| null>\(null\);', 'useState<DataContainer | null>(null);' + "`n" + '  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);'
Set-Content -Path 'C:\Users\Anwender\MatheManager\src\app\invoices\page.tsx' -Value $c -Encoding UTF8
Write-Host 'Done'