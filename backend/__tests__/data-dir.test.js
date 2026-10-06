const fs = require('fs')
const os = require('os')
const path = require('path')

describe('DATA_DIR configuration', () => {
  test('uses DATA_DIR when provided', () => {
    const original = process.env.DATA_DIR
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'medref-data-dir-'))

    process.env.DATA_DIR = tempDir
    jest.resetModules()

    require('../src/index')

    expect(fs.existsSync(path.join(tempDir, 'medref.db'))).toBe(true)

    if (original === undefined) delete process.env.DATA_DIR
    else process.env.DATA_DIR = original
    jest.resetModules()
  })
})
