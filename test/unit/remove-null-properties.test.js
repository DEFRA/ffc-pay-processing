const { removeNullProperties } = require('../../app/remove-null-properties')

describe('remove null properties', () => {
  test('should remove null properties from object', () => {
    const object = {
      a: 'a',
      b: null
    }
    const result = removeNullProperties(object)
    expect(result).toEqual({ a: 'a' })
  })

  test('should remove null properties from nested object', () => {
    const object = {
      a: 'a',
      b: {
        c: 'c',
        d: null
      }
    }
    const result = removeNullProperties(object)
    expect(result).toEqual({ a: 'a', b: { c: 'c' } })
  })

  test('should remove undefined properties from object', () => {
    const object = {
      a: 'a',
      b: undefined
    }
    const result = removeNullProperties(object)
    expect(result).toEqual({ a: 'a' })
  })

  test('should remove undefined properties from nested object', () => {
    const object = {
      a: 'a',
      b: {
        c: 'c',
        d: undefined
      }
    }
    const result = removeNullProperties(object)
    expect(result).toEqual({ a: 'a', b: { c: 'c' } })
  })
})
