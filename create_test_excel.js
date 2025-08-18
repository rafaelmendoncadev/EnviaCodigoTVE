import XLSX from 'xlsx';

// Criar dados de teste
const testData = [
  ['Código', '', '', 'Descrição'], // Header
  ['', '', '', ''], // Linha 2 vazia
  ['ABC123', '', '', 'Código promocional 123'], // Linha 3
  ['DEF456', '', '', 'Código promocional 456'], // Linha 4  
  ['GHI789', '', '', 'Código promocional 789'], // Linha 5
  ['JKL012', '', '', 'Código promocional 012'], // Linha 6
];

// Criar workbook
const wb = XLSX.utils.book_new();

// Criar worksheet
const ws = XLSX.utils.aoa_to_sheet(testData);

// Adicionar worksheet ao workbook
XLSX.utils.book_append_sheet(wb, ws, 'Códigos');

// Salvar arquivo
XLSX.writeFile(wb, 'test_upload_real.xlsx');

console.log('Arquivo test_upload_real.xlsx criado com sucesso!');