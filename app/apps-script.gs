// NorskDive feedback → Google Sheet
// Paste this into Extensions → Apps Script of the feedback Sheet
// (owned by sprakanorsk@gmail.com). Keep SECRET identical to the
// FEEDBACK_SECRET environment variable in Vercel.

const SECRET = 'IfLDygOEgYd9-qhCVZfhFyAsB4jz13Zz';
const SHEET_NAME = 'Feedback';
const HEADERS = ['Tidspunkt', 'Type', 'Melding', 'E-post', 'Nivåpar', 'Status'];

// Opening the Web app URL in a browser shows this, to confirm it's live.
function doGet() {
  return out({ ok: true, service: 'NorskDive feedback' });
}

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.secret !== SECRET) return out({ ok: false });

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(HEADERS);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    }

    sheet.appendRow([
      new Date(),
      clean(d.type, 20),
      clean(d.message, 2000),
      clean(d.email, 200),
      clean(d.pair, 10),
      'Ny',
    ]);
    return out({ ok: true });
  } catch (err) {
    return out({ ok: false });
  }
}

// Stops text like "=HYPERLINK(...)" from running as a spreadsheet formula.
function clean(v, max) {
  let s = String(v || '').slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
