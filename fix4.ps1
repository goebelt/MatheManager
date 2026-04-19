$c = Get-Content 'C:\Users\Anwender\MatheManager\src\app\invoices\page.tsx' -Raw -Encoding UTF8
$old = 'useState<{
  invoice: any;
  items: InvoiceItem[];
  total: number;
} | null>'
$new = 'useState<InvoiceData | null>'
$c = $c -replace [regex]::Escape($old), $new
Set-Content -Path 'C:\Users\Anwender\MatheManager\src\app\invoices\page.tsx' -Value $c -Encoding UTF8
Write-Host 'Done'