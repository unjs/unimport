export function subFoo() {}

export type CustomType2 = ReturnType<typeof subFoo>
