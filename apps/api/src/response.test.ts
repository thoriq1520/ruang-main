import {expect, test} from 'bun:test'
import {apiResponse} from './response'

test('response API konsisten untuk sukses dan gagal', () => {
  expect(apiResponse(200, 'OK', {id: 1})).toEqual({
    success: true,
    statusCode: 200,
    message: 'OK',
    data: {id: 1},
    error: null,
  })
  expect(apiResponse(500, 'Gagal', null, 'INTERNAL_SERVER_ERROR')).toEqual({
    success: false,
    statusCode: 500,
    message: 'Gagal',
    data: null,
    error: {code: 'INTERNAL_SERVER_ERROR'},
  })
})
