/**
 * 通用表单校验 Composable
 * 将 Zod schema 转换为 VeeValidate 可用的校验函数
 */
import { computed } from 'vue'
import { useField, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'

/**
 * @param {import('zod').ZodObject} schema - Zod 校验 schema
 * @param {object} initialValues - 表单初始值
 */
export function useFormValidation(schema, initialValues = {}) {
  const typedSchema = toTypedSchema(schema)
  const { handleSubmit, errors, meta, values, resetForm } = useForm({
    validationSchema: typedSchema,
    initialValues,
  })

  const isValid = computed(() => meta.value.valid)
  const isDirty = computed(() => meta.value.dirty)

  return {
    handleSubmit,
    errors,
    meta,
    values,
    isValid,
    isDirty,
    resetForm,
  }
}

export { useField }
