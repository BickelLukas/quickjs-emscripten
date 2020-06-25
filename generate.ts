// Generate symbols list
// Generate header file
import * as fs from 'fs'
const INTERFACE_FILE_PATH = process.env.HEADER_FILE_PATH || './c/interface.c'
const FFI_TYPES_PATH = process.env.FFI_TYPES_PATH || './ts/ffi-types.ts'
const INCLUDE_RE = /^#include.*$/gm
const TYPEDEF_RE = /^\s*typedef\s+(.+)$/gm
const DECL_RE = /^([\w*]+[\s*]+)(QTS_\w+)(\((.*?)\)) ?{$/gm

function writeFile(filename: string, content: string) {
  if (filename === '-') {
    console.log(content)
    return
  }

  fs.writeFileSync(filename, content + '\n', 'utf-8')
}

function main() {
  const [, , command, destination] = process.argv

  if (!command || !destination) {
    throw new Error('Usage: generate.ts [symbols | header | ffi] WRITE_PATH')
  }

  const interfaceFile = fs.readFileSync(INTERFACE_FILE_PATH, 'utf-8')
  const matches = matchAll(DECL_RE, interfaceFile)
  const includeMatches = matchAll(INCLUDE_RE, interfaceFile)
  const typedefMatches = matchAll(TYPEDEF_RE, interfaceFile)

  if (command === 'symbols') {
    const symbols = matches
      .map(match => {
        const name = match[2]
        return `_${name}`
      })
      .concat('_malloc', '_free')
    writeFile(destination, JSON.stringify(symbols))
    return
  }

  if (command === 'header') {
    const includes = includeMatches.map(match => match[0]).join('\n')
    const typedefs = typedefMatches.map(match => match[0]).join('\n')
    const decls = matches
      .map(match => {
        const returnType = match[1]
        const name = match[2]
        const params = match[3]
        return `${returnType}${name}${params};`
      })
      .join('\n')
    writeFile(destination, [includes, typedefs, decls].join('\n\n'))
    return
  }

  if (command === 'ffi') {
    writeFile(destination, buildFFI(matches))
    return
  }

  throw new Error('Bad command. Usage: generate.ts [symbols | header | ffi] WRITE_PATH')
}

function cTypeToTypescriptType(ctype: string) {
  // simplify
  let type = ctype
  // remove const: ignored in JS
  type = ctype.replace(/\bconst\b/, '').trim()
  // collapse spaces (around a *, maybe)
  type = type.split(' ').join('')

  // mapping
  if (type.includes('char*')) {
    return { ffi: 'string', typescript: 'string', ctype }
  }

  let typescript = type.replace(/\*/g, 'Pointer')
  let ffi: string | null = 'number'

  if (type === 'bool') {
    ffi = 'boolean'
    typescript = 'boolean'
  }
  if (type === 'void') {
    ffi = null
  }
  if (type === 'double' || type === 'int') {
    ffi = 'number'
    typescript = 'number'
  }
  if (type.includes('*')) {
    ffi = 'number'
  }

  return { typescript, ffi, ctype }
}

function buildFFI(matches: RegExpExecArray[]) {
  const parsed = matches.map(match => {
    const [, returnType, functionName, , rawParams] = match
    const params = parseParams(rawParams)
    return { functionName, returnType: cTypeToTypescriptType(returnType.trim()), params }
  })
  const decls = parsed.map(fn => {
    const typescriptParams = fn.params
      .map(param => {
        // Allow JSValue wherever JSValueConst is accepted.
        const tsType =
          param.type.typescript === 'JSValueConstPointer'
            ? 'JSValuePointer | JSValueConstPointer'
            : param.type.typescript

        return `${param.name}: ${tsType}`
      })
      .join(', ')
    const typescriptFnType = `(${typescriptParams}) => ${fn.returnType.typescript}`
    const ffiParams = JSON.stringify(fn.params.map(param => param.type.ffi))
    const cwrap = `this.module.cwrap(${JSON.stringify(fn.functionName)}, ${JSON.stringify(
      fn.returnType.ffi
    )}, ${ffiParams})`
    return `  ${fn.functionName}: ${typescriptFnType} =\n    ${cwrap}`
  })
  const ffiTypes = fs.readFileSync(FFI_TYPES_PATH, 'utf-8').replace(/\btype\b/g, 'export type')
  const classString = `
// This file generated by "generate.ts ffi" in the root of the repo.
import { QuickJSEmscriptenModule } from "./emscripten-types"

${ffiTypes}

/**
 * Low-level FFI bindings to QuickJS's Emscripten module.
 * See instead [[QuickJSVm]], the public Javascript interface exposed by this
 * library.
 *
 * @unstable The FFI interface is considered private and may change.
 */
export class QuickJSFFI {
  constructor(private module: QuickJSEmscriptenModule) {}

${decls.join('\n\n')}
}
  `.trim()
  return classString
}

function parseParams(paramListString: string) {
  if (paramListString.trim().length === 0) {
    return []
  }
  const params = paramListString.split(',')
  return params.map(paramString => {
    const lastWord = /\b\w+$/
    const name = paramString.match(lastWord)
    const type = paramString.replace(lastWord, '').trim()
    return { name: name ? name[0] : '', type: cTypeToTypescriptType(type) }
  })
}

function matchAll(regexp: RegExp, text: string) {
  // We're using .exec, which mutates the regexp by setting the .lastIndex
  const initialLastIndex = regexp.lastIndex
  const result: RegExpExecArray[] = []
  let match = null
  while ((match = regexp.exec(text)) !== null) {
    result.push(match)
  }
  regexp.lastIndex = initialLastIndex
  return result
}

main()
