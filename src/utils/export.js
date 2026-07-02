import ExcelJS from 'exceljs'

/**
 * 企业级 Excel 导出（使用 exceljs，无安全漏洞）
 * @param {Array<Object>} data - 数据数组
 * @param {string} filename - 文件名（不含扩展名）
 * @param {Object} [options] - 可选配置
 * @param {Array<{header:string, key:string, width?:number}>} [options.columns] - 列定义
 * @param {string} [options.sheetName='Sheet1'] - 工作表名
 */
export async function exportExcel(data, filename = 'export', options = {}) {
  if (!data || !data.length) {
    console.warn('[Export] 无数据可导出')
    return
  }

  const { columns, sheetName = 'Sheet1' } = options
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'VeStore'
  workbook.created = new Date()

  const worksheet = workbook.addWorksheet(sheetName)

  // 自动推断列
  const keys = columns ? columns.map((c) => c.key) : Object.keys(data[0] || {})

  const headers = columns ? columns.map((c) => c.header) : keys

  // 设置列宽
  worksheet.columns = keys.map((key, i) => ({
    header: headers[i],
    key,
    width: columns?.[i]?.width || 18,
  }))

  // 样式化表头
  const headerRow = worksheet.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4F46E5' },
  }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
  headerRow.height = 28

  // 添加数据行
  data.forEach((row) => {
    worksheet.addRow(row)
  })

  // 数据行样式
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    row.eachCell((cell) => {
      cell.alignment = { vertical: 'middle' }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      }
    })
  })

  // 冻结首行
  worksheet.views = [{ state: 'frozen', ySplit: 1 }]

  // 自动筛选
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: keys.length },
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * 企业级 Word 导出
 * @param {string} title - 文档标题
 * @param {Array} sections - 内容区块
 */
export function exportWord(title, sections) {
  let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:'Microsoft YaHei',sans-serif;padding:40px;color:#333}
h1{text-align:center;color:#4f46e5;font-size:24px;margin-bottom:30px}
h2{font-size:18px;border-bottom:2px solid #4f46e5;padding-bottom:8px;margin-top:30px}
table{width:100%;border-collapse:collapse;margin:16px 0}
th,td{border:1px solid #ddd;padding:10px 14px;text-align:left;font-size:14px}
th{background:#f1f5f9;font-weight:600}
.section{margin-bottom:24px}
.row{display:flex;padding:8px 0;border-bottom:1px solid #eee;font-size:14px}
.label{width:140px;color:#666;flex-shrink:0}
.total{font-size:20px;font-weight:700;color:#ef4444;text-align:right;margin-top:20px}
.footer{text-align:center;color:#999;font-size:12px;margin-top:50px;border-top:1px solid #eee;padding-top:20px}
</style></head><body><h1>${title}</h1>`
  for (const s of sections) {
    html += `<div class="section">`
    if (s.heading) html += `<h2>${s.heading}</h2>`
    if (s.rows) {
      html += `<table><thead><tr>${s.headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>`
      for (const r of s.rows) html += `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`
      html += `</tbody></table>`
    }
    if (s.fields) {
      for (const f of s.fields)
        html += `<div class="row"><div class="label">${f.label}</div><div>${f.value}</div></div>`
    }
    html += `</div>`
  }
  html += `<div class="footer">由 VeStore 系统生成 - ${new Date().toLocaleString()}</div></body></html>`

  const blob = new Blob([html], { type: 'application/msword' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title}_${new Date().toISOString().slice(0, 10)}.doc`
  a.click()
  URL.revokeObjectURL(url)
}
