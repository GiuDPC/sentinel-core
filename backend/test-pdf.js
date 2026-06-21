const pdfmake = require('pdfmake');
console.log(typeof pdfmake.createPdf);
const doc = pdfmake.createPdf({ content: 'Test' });
doc.getBuffer((buffer) => {
  console.log('Buffer length:', buffer.length);
});
