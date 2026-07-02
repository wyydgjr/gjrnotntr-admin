/**
 * Export 工具函数测试
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock exceljs
vi.mock('exceljs', () => {
  const MockWorksheet = {
    columns: [],
    addRow: vi.fn(),
    getRow: vi.fn(() => ({
      font: {},
      fill: {},
      alignment: {},
      height: 0,
    })),
    eachRow: vi.fn(),
    views: [],
    autoFilter: {},
  }

  const MockWorkbook = {
    creator: '',
    created: null,
    addWorksheet: vi.fn(() => MockWorksheet),
    xlsx: {
      writeBuffer: vi.fn(() => Promise.resolve(new ArrayBuffer(0))),
    },
  }

  return {
    default: { Workbook: vi.fn(() => MockWorkbook) },
    Workbook: vi.fn(() => MockWorkbook),
  }
})

import ExcelJS from 'exceljs'
import { exportExcel, exportWord } from '../export'

describe('Export Utils', () => {
  const mockData = [
    { name: '商品A', price: 100, stock: 50 },
    { name: '商品B', price: 200, stock: 30 },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    global.URL.createObjectURL = vi.fn(() => 'blob:mock')
    global.URL.revokeObjectURL = vi.fn()
    global.Blob = vi.fn(() => ({}))
  })

  describe('exportExcel', () => {
    it('应调用 exceljs 导出 Excel', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      await exportExcel(mockData, '测试导出')
      expect(ExcelJS.Workbook).toHaveBeenCalled()
      warnSpy.mockRestore()
    })

    it('空数据应打印警告而不导出', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      await exportExcel([], '空导出')
      expect(warnSpy).toHaveBeenCalledWith('[Export] 无数据可导出')
      warnSpy.mockRestore()
    })

    it('应支持自定义列配置', async () => {
      await exportExcel(mockData, '列配置', {
        columns: [
          { header: '名称', key: 'name', width: 30 },
          { header: '价格', key: 'price', width: 15 },
        ],
      })
      expect(ExcelJS.Workbook).toHaveBeenCalled()
    })
  })

  describe('exportWord', () => {
    it('应生成并下载 Word 文件', () => {
      const mockAnchor = { href: '', download: '', click: vi.fn() }
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor)

      exportWord('测试文档', [{ heading: '基本信息', fields: [{ label: '名称', value: '测试' }] }])

      expect(mockAnchor.click).toHaveBeenCalled()
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock')
    })

    it('应支持表格数据导出', () => {
      const mockAnchor = { href: '', download: '', click: vi.fn() }
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor)

      exportWord('报表', [
        {
          heading: '数据表',
          headers: ['列1', '列2'],
          rows: [
            ['A', 'B'],
            ['C', 'D'],
          ],
        },
      ])

      expect(mockAnchor.click).toHaveBeenCalled()
    })
  })
})
