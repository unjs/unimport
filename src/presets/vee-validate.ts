import { defineUnimportPreset } from '../utils'

export default defineUnimportPreset({
  from: 'vee-validate',
  imports: [
    // https://vee-validate.logaretm.com/v4/guide/composition-api/api-review
    // https://github.com/logaretm/vee-validate/blob/main/packages/vee-validate/src/index.ts
    'validate',
    'defineRule',
    'configure',
    'useField',
    'useForm',
    'useFieldArray',
    'useResetForm',
    'useIsFieldDirty',
    'useIsFieldTouched',
    'useIsFieldValid',
    'useIsSubmitting',
    'useValidateField',
    'useIsFormDirty',
    'useIsFormTouched',
    'useIsFormValid',
    'useValidateForm',
    'useSubmitCount',
    'useFieldValue',
    'useFormValues',
    'useFormErrors',
    'useFieldError',
    'useSubmitForm',
    'FormContextKey',
    'FieldContextKey',
  ],
})
