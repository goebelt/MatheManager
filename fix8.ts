const fs = require('fs');
const content = fs.readFileSync('C:/Users/Anwender/MatheManager/src/app/invoices/page.tsx', 'utf8');
const oldStr = "    const fee = calculateAppointmentFee(appointment, invoiceItems[0]?.studentId, data.priceEntries || []);";
const newStr = "    const fee = calculateAppointmentFee(appointment, undefined, data.priceEntries || []);";
if (content.includes(oldStr)) {
    fs.writeFileSync('C:/Users/Anwender/MatheManager/src/app/invoices/page.tsx', content.split(oldStr).join(newStr));
    console.log('Fixed');
} else {
    console.log('Not found');
    const idx = content.indexOf('calculateAppointmentFee');
    console.log(content.slice(idx, idx+200));
}