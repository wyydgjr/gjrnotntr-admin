/**
 * Validation Schemas 测试
 */
import { describe, it, expect } from 'vitest'
import {
  usernameRule,
  passwordRule,
  emailRule,
  phoneRule,
  loginSchema,
  registerSchema,
  productFormSchema,
  categoryFormSchema,
  addressFormSchema,
  reviewSchema,
} from '../validation-schemas'

describe('Validation Schemas', () => {
  describe('usernameRule', () => {
    it('合法用户名应通过', () => {
      expect(usernameRule.safeParse('testuser').success).toBe(true)
      expect(usernameRule.safeParse('测试用户').success).toBe(true)
      expect(usernameRule.safeParse('user_123').success).toBe(true)
    })

    it('太短的用户名应拒绝', () => {
      expect(usernameRule.safeParse('a').success).toBe(false)
    })

    it('含特殊字符应拒绝', () => {
      expect(usernameRule.safeParse('user@test').success).toBe(false)
    })
  })

  describe('passwordRule', () => {
    it('合法密码应通过', () => {
      expect(passwordRule.safeParse('Test1234').success).toBe(true)
      expect(passwordRule.safeParse('Abcdefg1').success).toBe(true)
    })

    it('无大写字母应拒绝', () => {
      expect(passwordRule.safeParse('test1234').success).toBe(false)
    })

    it('无数字应拒绝', () => {
      expect(passwordRule.safeParse('Testtest').success).toBe(false)
    })

    it('太短应拒绝', () => {
      expect(passwordRule.safeParse('Ab1').success).toBe(false)
    })
  })

  describe('emailRule', () => {
    it('合法邮箱应通过', () => {
      expect(emailRule.safeParse('test@example.com').success).toBe(true)
    })

    it('无效邮箱应拒绝', () => {
      expect(emailRule.safeParse('not-an-email').success).toBe(false)
    })

    it('空字符串应通过', () => {
      expect(emailRule.safeParse('').success).toBe(true)
    })
  })

  describe('phoneRule', () => {
    it('合法手机号应通过', () => {
      expect(phoneRule.safeParse('13800138000').success).toBe(true)
    })

    it('无效手机号应拒绝', () => {
      expect(phoneRule.safeParse('12345').success).toBe(false)
    })

    it('空字符串应通过', () => {
      expect(phoneRule.safeParse('').success).toBe(true)
    })
  })

  describe('loginSchema', () => {
    it('有效登录数据应通过', () => {
      const result = loginSchema.safeParse({ username: 'admin', password: 'test' })
      expect(result.success).toBe(true)
    })

    it('空用户名应拒绝', () => {
      const result = loginSchema.safeParse({ username: '', password: 'test' })
      expect(result.success).toBe(false)
    })
  })

  describe('registerSchema', () => {
    it('有效注册数据应通过', () => {
      const result = registerSchema.safeParse({
        username: 'newuser',
        password: 'Test1234',
        confirmPassword: 'Test1234',
        email: 'test@example.com',
      })
      expect(result.success).toBe(true)
    })

    it('密码不匹配应拒绝', () => {
      const result = registerSchema.safeParse({
        username: 'newuser',
        password: 'Test1234',
        confirmPassword: 'Different1',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('productFormSchema', () => {
    it('有效商品数据应通过', () => {
      const result = productFormSchema.safeParse({
        name: '测试商品',
        category: '电子产品',
        price: 99.9,
        stock: 100,
      })
      expect(result.success).toBe(true)
    })

    it('负价格应拒绝', () => {
      const result = productFormSchema.safeParse({
        name: '测试',
        category: '电子',
        price: -1,
        stock: 10,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('categoryFormSchema', () => {
    it('有效分类应通过', () => {
      expect(categoryFormSchema.safeParse({ name: '电子产品' }).success).toBe(true)
    })

    it('空名称应拒绝', () => {
      expect(categoryFormSchema.safeParse({ name: '' }).success).toBe(false)
    })
  })

  describe('addressFormSchema', () => {
    it('有效地址应通过', () => {
      const result = addressFormSchema.safeParse({
        name: '张三',
        phone: '13800138000',
        province: '广东省',
        city: '深圳市',
        district: '南山区',
        detail: '科技园路1号',
      })
      expect(result.success).toBe(true)
    })

    it('缺必填字段应拒绝', () => {
      expect(addressFormSchema.safeParse({ name: '张三' }).success).toBe(false)
    })
  })

  describe('reviewSchema', () => {
    it('有效评论应通过', () => {
      expect(reviewSchema.safeParse({ rating: 5, content: '非常好' }).success).toBe(true)
    })

    it('评分为 0 应拒绝', () => {
      expect(reviewSchema.safeParse({ rating: 0, content: 'test' }).success).toBe(false)
    })
  })
})
