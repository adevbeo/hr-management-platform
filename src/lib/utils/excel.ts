import ExcelJS from "exceljs";

export async function buildExcelBuffer(sheetName: string, rows: Record<string, any>[]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  if (!rows.length) {
    sheet.addRow(["No data"]);
  } else {
    const columns = Object.keys(rows[0]);
    sheet.columns = columns.map((key) => ({ header: key, key }));
    rows.forEach((row) => sheet.addRow(row));
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
