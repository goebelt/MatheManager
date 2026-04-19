const fs = require('fs');
let c = fs.readFileSync('C:/Users/Anwender/MatheManager/src/app/invoices/page.tsx', 'utf8');
// The bad line has CRLF between | and const
const bad = "useState<DataContainer |\r\nconst [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);";
const good = "useState<DataContainer | null>(null);\r\n  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);";
if (c.includes(bad)) {
  c = c.split(bad).join(good);
  fs.writeFileSync('C:/Users/Anwender/MatheManager/src/app/invoices/page.tsx', c);
  console.log('fixed');
} else {
  const idx = c.indexOf('useState<DataContainer |');
  console.log('not found, context:', JSON.stringify(c.slice(idx, idx + 100)));
}