const fs = require('fs');
const c = fs.readFileSync('C:/Users/Anwender/MatheManager/src/app/invoices/page.tsx', 'utf8');
const oldStr = `  // Find matching price entry
  const findPriceEntry = (): any => {
    if (!data?.priceEntries) return null;
    for (const entry of data.priceEntries) {
      if (entry.type === appointmentType &&
          new Date(appointment.date) >= new Date(entry.validFrom)) {
        const validTo = entry.validTo ? new Date(entry.validTo) : null;
        if (!validTo || new Date(appointment.date) <= validTo) {
          return entry;
        }
      }
    }
    return null;
  };

  const calculateInvoice = () => {
    if (!data || invoiceItems.length === 0) return;

    const appointment = filteredAppointments[0];
    const priceEntry = findPriceEntry();`;

const newStr = `  // Find matching price entry
  const findPriceEntry = (appointment: any): any => {
    if (!data?.priceEntries) return null;
    for (const entry of data.priceEntries) {
      if (entry.type === appointmentType &&
          new Date(appointment.date) >= new Date(entry.validFrom)) {
        const validTo = entry.validTo ? new Date(entry.validTo) : null;
        if (!validTo || new Date(appointment.date) <= validTo) {
          return entry;
        }
      }
    }
    return null;
  };

  const calculateInvoice = () => {
    if (!data || invoiceItems.length === 0) return;

    const appointment = filteredAppointments[0];
    const priceEntry = findPriceEntry(appointment);`;

if (c.includes(oldStr)) {
  c = c.split(oldStr).join(newStr);
  fs.writeFileSync('C:/Users/Anwender/MatheManager/src/app/invoices/page.tsx', c);
  console.log('Fixed');
} else {
  console.log('Not found');
}