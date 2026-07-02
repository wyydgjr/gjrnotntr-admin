/**
 * Error Codes 工具测试
 */
import { describe, it, expect } from 'vitest'
import { ErrorCode, HTTP_ERROR_MAP, ErrorMessages, extractError } from '../error-codes'

describe('Error Codes', () => {
  describe('ErrorCode 枚举', () => {
    it('应包含所有认证错误码', () => {
      expect(ErrorCode.UNAUTHORIZED).toBe('UNAUTHORIZED')
      expect(ErrorCode.TOKEN_EXPIRED).toBe('TOKEN_EXPIRED')
      expect(ErrorCode.INVALID_CREDENTIALS).toBe('INVALID_CREDENTIALS')
      expect(ErrorCode.ACCOUNT_DISABLED).toBe('ACCOUNT_DISABLED')
    })

    it('应包含所有资源错误码', () => {
      expect(ErrorCode.NOT_FOUND).toBe('NOT_FOUND')
      expect(ErrorCode.ALREADY_EXISTS).toBe('ALREADY_EXISTS')
    })

    it('应包含所有网络错误码', () => {
      expect(ErrorCode.NETWORK_ERROR).toBe('NETWORK_ERROR')
      expect(ErrorCode.TIMEOUT).toBe('TIMEOUT')
    })
  })

  describe('HTTP_ERROR_MAP', () => {
    it('401 应对应 UNAUTHORIZED', () => {
      expect(HTTP_ERROR_MAP[401]).toBe(ErrorCode.UNAUTHORIZED)
    })

    it('404 应对应 NOT_FOUND', () => {
      expect(HTTP_ERROR_MAP[404]).toBe(ErrorCode.NOT_FOUND)
    })

    it('429 应对应 RATE_LIMITED', () => {
      expect(HTTP_ERROR_MAP[429]).toBe(ErrorCode.RATE_LIMITED)
    })
  })

  describe('extractError', () => {
    it('应提取 401 错误', () => {
      const error = { response: { status: 401, data: { message: '未登录' } } }
      const result = extractError(error)
      expect(result.code).toBe(ErrorCode.UNAUTHORIZED)
      expect(result.message).toBe('未登录')
    })

    it('应提取 404 错误并使用默认消息', () => {
      const error = { response: { status: 404, data: {} } }
      const result = extractError(error)
      expect(result.code).toBe(ErrorCode.NOT_FOUND)
      expect(result.message).toBe(ErrorMessages[ErrorCode.NOT_FOUND])
    })

    it('应提取超时错误', () => {
      const error = { code: 'ECONNABORTED' }
      const result = extractError(error)
      expect(result.code).toBe(ErrorCode.TIMEOUT)
    })

    it('应提取网络错误', () => {
      const error = { request: {}, response: undefined }
      const result = extractError(error)
      expect(result.code).toBe(ErrorCode.NETWORK_ERROR)
    })

    it('应处理未知错误', () => {
      const error = { message: 'Something went wrong' }
      const result = extractError(error)
      expect(result.code).toBe(ErrorCode.INTERNAL_ERROR)
    })
  })

  describe('ErrorMessages', () => {
    it('每个 ErrorCode 都应有对应消息', () => {
      for (const key of Object.values(ErrorCode)) {
        expect(ErrorMessages[key]).toBeDefined()
      }
    })
  })
})
