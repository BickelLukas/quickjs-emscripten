import { QuickJSContext, QuickJSHandle } from './context'
import { QuickJSAsyncEmscriptenModule } from './emscripten-types'
import { QuickJSAsyncFFI } from './ffi-asyncify'
import { JSRuntimePointer } from './ffi-types'
import { Lifetime } from './quickjs'
import { QuickJSModuleCallbacks } from './quickjs-module'
import { QuickJSRuntimeAsync } from './runtime-asyncify'
import { VmCallResult } from './vm-interface'

export type AsyncFunctionImplementation = (
  this: QuickJSHandle,
  ...args: QuickJSHandle[]
) => Promise<QuickJSHandle | VmCallResult<QuickJSHandle> | void>

/**
 * Asyncified version of [QuickJSContext].
 *
 * *Asyncify* allows normally synchronous code to wait for asynchronous Promises
 * or callbacks. The asyncified version of QuickJSContext can wait for async
 * host functions as though they were synchronous.
 */
export class QuickJSContextAsync extends QuickJSContext {
  public declare runtime: QuickJSRuntimeAsync
  protected declare module: QuickJSAsyncEmscriptenModule
  protected declare ffi: QuickJSAsyncFFI
  protected declare rt: Lifetime<JSRuntimePointer>
  protected declare callbacks: QuickJSModuleCallbacks

  /**
   * Asyncified version of [evalCode].
   */
  async evalCodeAsync(
    code: string,
    filename: string = 'eval.js'
  ): Promise<VmCallResult<QuickJSHandle>> {
    const resultPtr = await this.memory
      .newHeapCharPointer(code)
      .consume(charHandle =>
        this.ffi.QTS_Eval_MaybeAsync(this.ctx.value, charHandle.value, filename)
      )
    const errorPtr = this.ffi.QTS_ResolveException(this.ctx.value, resultPtr)
    if (errorPtr) {
      this.ffi.QTS_FreeValuePointer(this.ctx.value, resultPtr)
      return { error: this.memory.heapValueHandle(errorPtr) }
    }
    return { value: this.memory.heapValueHandle(resultPtr) }
  }

  /**
   * Similar to [newFunction].
   * Convert an async host Javascript function into a synchronous QuickJS function value.
   *
   * Whenever QuickJS calls this function, the VM's stack will be unwound while
   * waiting the async function to complete, and then restored when the returned
   * promise resolves.
   *
   * Asyncified functions must never call other asyncified functions or
   * `import`, even indirectly, because the stack cannot be unwound twice.
   *
   * See [Emscripten's docs on Asyncify](https://emscripten.org/docs/porting/asyncify.html).
   */
  newAsyncifiedFunction(name: string, fn: AsyncFunctionImplementation): QuickJSHandle {
    const fnId = ++this.fnNextId
    this.fnMap.set(fnId, fn as any)
    return this.memory.heapValueHandle(this.ffi.QTS_NewAsyncFunction(this.ctx.value, fnId, name))
  }
}