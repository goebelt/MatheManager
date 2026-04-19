$content = file_get_contents('C:/Users/Anwender/MatheManager/src/app/invoices/page.tsx');
$old = "    const fee = calculateAppointmentFee(appointment, invoiceItems[0]?.studentId, data.priceEntries || []);";
$new = "    const fee = calculateAppointmentFee(appointment, undefined, data.priceEntries || []);";
if (strpos($content, $old) !== false) {
    $content = str_replace($old, $new, $content);
    file_put_contents('C:/Users/Anwender/MatheManager/src/app/invoices/page.tsx', $content);
    echo "Fixed\n";
} else {
    echo "Not found\n";
    // Show context
    $idx = strpos($content, 'calculateAppointmentFee');
    echo substr($content, $idx, 150) . "\n";
}