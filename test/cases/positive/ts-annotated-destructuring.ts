// Regression: a type-annotated destructuring must not stretch the local
// declaration scan to a later bracket, hiding identifiers used in between.

const { value }: Props = props

const hooks = [
  useState,
  useEffect,
]

const config = { value }
