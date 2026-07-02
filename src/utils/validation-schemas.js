/**
 * 统一表单校验 Schema（基于 Zod）
 * 所有表单组件共用这些校验规则，确保一致性
 */
import { z } from 'zod'

// ── 基础校验规则 ──

/** 用户名：2-20 字符，仅允许中英文、数字、下划线 */
export const usernameRule = z
  .string()
  .min(2, '用户名至少 2 个字符')
  .max(20, '用户名最多 20 个字符')
  .regex(/^[\u4e00-\u9fa5a-zA-Z0-9_]+$/, '用户名只能包含中英文、数字和下划线')

/** 密码：8-32 字符，必须包含大小写字母和数字 */
export const passwordRule = z
  .string()
  .min(8, '密码至少 8 个字符')
  .max(32, '密码最多 32 个字符')
  .regex(/(?=.*[a-z])/, '密码必须包含小写字母')
  .regex(/(?=.*[A-Z])/, '密码必须包含大写字母')
  .regex(/(?=.*[0-9])/, '密码必须包含数字')

/** 邮箱 */
export const emailRule = z
  .string()
  .email('请输入有效的邮箱地址')
  .max(100, '邮箱最多 100 个字符')
  .optional()
  .or(z.literal(''))

/** 手机号（中国大陆） */
export const phoneRule = z
  .string()
  .regex(/^1[3-9]\d{9}$/, '请输入有效的手机号')
  .optional()
  .or(z.literal(''))

/** 必填字符串 */
export const requiredString = z.string().min(1, '此项为必填')

/** 价格：正数，最多 2 位小数 */
export const priceRule = z
  .number({ invalid_type_error: '请输入有效价格' })
  .positive('价格必须大于 0')
  .max(99999999.99, '价格不能超过 99,999,999.99')

/** 库存：非负整数 */
export const stockRule = z
  .number({ invalid_type_error: '请输入有效库存' })
  .int('库存必须为整数')
  .nonnegative('库存不能为负数')

/** 数量：正整数 */
export const quantityRule = z
  .number({ invalid_type_error: '请输入有效数量' })
  .int('数量必须为整数')
  .positive('数量必须大于 0')

// ── 组合 Schema ──

/** 登录表单 */
export const loginSchema = z.object({
  username: requiredString,
  password: z.string().min(1, '请输入密码'),
})

/** 注册表单 */
export const registerSchema = z
  .object({
    username: usernameRule,
    password: passwordRule,
    confirmPassword: z.string(),
    email: emailRule,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '两次密码不一致',
    path: ['confirmPassword'],
  })

/** 用户编辑表单 */
export const userFormSchema = z.object({
  username: usernameRule,
  email: emailRule,
  phone: phoneRule,
  role: z.enum(['user', 'admin']),
  status: z.enum(['active', 'inactive']),
})

/** 商品表单 */
export const productFormSchema = z.object({
  name: requiredString.max(100, '商品名称最多 100 个字符'),
  category: requiredString,
  price: priceRule,
  stock: stockRule,
  description: z.string().max(500, '描述最多 500 个字符').optional().default(''),
  status: z.enum(['active', 'inactive']).default('active'),
})

/** 分类表单 */
export const categoryFormSchema = z.object({
  name: requiredString.max(50, '分类名称最多 50 个字符'),
  description: z.string().max(200, '描述最多 200 个字符').optional().default(''),
})

/** 地址表单 */
export const addressFormSchema = z.object({
  name: requiredString.max(20, '收件人最多 20 个字符'),
  phone: phoneRule,
  province: requiredString,
  city: requiredString,
  district: requiredString,
  detail: requiredString.max(200, '详细地址最多 200 个字符'),
  isDefault: z.boolean().default(false),
})

/** 个人资料更新 */
export const profileSchema = z.object({
  username: usernameRule,
  email: emailRule,
  phone: phoneRule,
  password: passwordRule.optional().or(z.literal('')),
})

/** 评论表单 */
export const reviewSchema = z.object({
  rating: z.number().int().min(1, '请选择评分').max(5),
  content: requiredString.max(500, '评论内容最多 500 个字符'),
})
