import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const cleanTextForPDF = (text) => {
  if (!text) return "";
  return text.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim();
};

export const exportarPDF = (dados) => {
  const doc = new jsPDF();
  doc.setFillColor(63, 81, 181); doc.rect(0, 0, 210, 30, 'F'); 
  doc.setTextColor(255, 255, 255); doc.setFontSize(24); doc.setFont('helvetica', 'bold'); doc.text("ESCALA CHORUSAPP", 105, 18, { align: 'center' });
  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 105, 25, { align: 'center' });

  const dadosAgrupados = {}; const datasOrdenadas = [];
  dados.forEach(row => { if (!dadosAgrupados[row.Data]) { dadosAgrupados[row.Data] = []; datasOrdenadas.push(row.Data); } dadosAgrupados[row.Data].push(row); });

  let finalY = 40;
  datasOrdenadas.forEach((data) => {
    const itensDoDia = dadosAgrupados[data];
    if (finalY > 250) { doc.addPage(); finalY = 20; }
    
    autoTable(doc, {
      startY: finalY, head: [[cleanTextForPDF(data).toUpperCase()]], body: [], theme: 'plain',
      headStyles: { fillColor: [240, 242, 245], textColor: [63, 81, 181], fontSize: 11, fontStyle: 'bold', halign: 'left', cellPadding: { top: 6, bottom: 6, left: 10 } },
      margin: { left: 14, right: 14 },
    });

    const rows = itensDoDia.map(item => [cleanTextForPDF(item.Funcao).toUpperCase(), cleanTextForPDF(item.Voluntario)]);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY, body: rows, theme: 'grid',
      styles: { fontSize: 9, cellPadding: 4, lineColor: [230, 230, 230], lineWidth: 0.1, textColor: [50, 50, 50] },
      columnStyles: { 0: { fontStyle: 'bold', textColor: [100, 100, 100], cellWidth: 70 }, 1: { textColor: [0, 0, 0] } },
      head: [], margin: { left: 14, right: 14 },
      didParseCell: function(data) {
        if (data.row.index % 2 === 0) data.cell.styles.fillColor = [255, 255, 255]; else data.cell.styles.fillColor = [252, 252, 253];
        if (data.row.raw[1] === "Não designado") { if (data.column.index === 1) { data.cell.styles.textColor = [180, 180, 180]; data.cell.styles.fontStyle = 'italic'; } }
      }
    });
    finalY = doc.lastAutoTable.finalY + 8;
  });
  doc.save('escala_chorusapp.pdf');
};

export const exportarExcel = (dados) => {
  const ws = XLSX.utils.json_to_sheet(dados); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Escala"); XLSX.writeFile(wb, "escala_chorusapp.xlsx");
};

export const exportarICS = (dados) => {
  let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//ChorusApp//App//PT\n";
  dados.forEach(row => {
    if (row.Voluntario === "Não designado") return;
    const match = row.Data.match(/(\d{1,2})\/(\d{1,2})/); if (!match) return;
    const [_, dia, mes] = match; const ano = new Date().getFullYear(); const pad = (n) => n < 10 ? '0'+Number(n) : n;
    const dtStart = `${ano}${pad(mes)}${pad(dia)}T190000`; const dtEnd = `${ano}${pad(mes)}${pad(dia)}T220000`;
    icsContent += "BEGIN:VEVENT\n"; icsContent += `SUMMARY:ChorusApp - ${row.Funcao}\n`; icsContent += `DESCRIPTION:Voluntário: ${row.Voluntario}\n`; icsContent += `DTSTART;TZID=America/Sao_Paulo:${dtStart}\n`; icsContent += `DTEND;TZID=America/Sao_Paulo:${dtEnd}\n`; icsContent += "END:VEVENT\n";
  });
  icsContent += "END:VCALENDAR";
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" }); saveAs(blob, "escala_chorusapp.ics");
};

export const copiarWhatsApp = async (dados) => {
  if (!dados.length) throw new Error("Nenhuma escala para copiar.");
  const agrupado = Object.groupBy ? Object.groupBy(dados, ({ Data }) => Data) : dados.reduce((acc, item) => { (acc[item.Data] = acc[item.Data] || []).push(item); return acc; }, {});
  let texto = "*🗓️ ESCALA CHORUSAPP*\n\n";
  Object.keys(agrupado).forEach(data => {
    texto += `*${data}*\n`;
    agrupado[data].forEach(row => {
      let icone = "👤"; if (row.Funcao.includes("PRODUÇÃO")) icone = "🎬"; if (row.Funcao.includes("Câmera") || row.Funcao.includes("FILMAGEM")) icone = "🎥"; if (row.Funcao.includes("Fotografo") || row.Funcao.includes("TAKE")) icone = "📸"; if (row.Funcao.includes("ILUMINAÇÃO")) icone = "💡"; if (row.Funcao.includes("PROJEÇÃO")) icone = "💻";
      const nome = row.Voluntario === "Não designado" ? "_Vago_" : `*${row.Voluntario}*`;
      texto += `${icone} ${row.Funcao}: ${nome}\n`;
    });
    texto += "──────────────────\n";
  });
  try { await navigator.clipboard.writeText(texto); return true; } catch (err) { throw new Error("Falha ao acessar área de transferência"); }
};