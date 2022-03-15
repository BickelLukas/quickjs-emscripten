[quickjs-emscripten](../README.md) / [Exports](../modules.md) / QuickJSRuntime

# Class: QuickJSRuntime

A runtime represents a Javascript runtime corresponding to an object heap.
Several runtimes can exist at the same time but they cannot exchange objects.
Inside a given runtime, no multi-threading is supported.

You should create separate runtime instances for untrusted code from
different sources for isolation, or for better guarantees (at the cost of
memory usage), further isolate untrusted code into separate WebAssembly
modules using [newQuickJSWASMModule](../modules.md#newquickjswasmmodule).

Implement memory and CPU constraints with [setInterruptHandler](QuickJSRuntime.md#setinterrupthandler)
(called regularly while the interpreter runs) and [setMemoryLimit](QuickJSRuntime.md#setmemorylimit).
Use [computeMemoryUsage](QuickJSRuntime.md#computememoryusage) or [dumpMemoryUsage](QuickJSRuntime.md#dumpmemoryusage) to guide memory limit
tuning.

Configure ES module loading with [setModuleLoader](QuickJSRuntime.md#setmoduleloader).

## Hierarchy

- **`QuickJSRuntime`**

  ↳ [`QuickJSAsyncRuntime`](QuickJSAsyncRuntime.md)

## Implements

- [`Disposable`](../interfaces/Disposable.md)
- `RuntimeCallbacks`

## Table of contents

### Properties

- [context](QuickJSRuntime.md#context)

### Accessors

- [alive](QuickJSRuntime.md#alive)

### Methods

- [assertOwned](QuickJSRuntime.md#assertowned)
- [computeMemoryUsage](QuickJSRuntime.md#computememoryusage)
- [dispose](QuickJSRuntime.md#dispose)
- [dumpMemoryUsage](QuickJSRuntime.md#dumpmemoryusage)
- [executePendingJobs](QuickJSRuntime.md#executependingjobs)
- [hasPendingJob](QuickJSRuntime.md#haspendingjob)
- [newContext](QuickJSRuntime.md#newcontext)
- [removeInterruptHandler](QuickJSRuntime.md#removeinterrupthandler)
- [removeModuleLoader](QuickJSRuntime.md#removemoduleloader)
- [setInterruptHandler](QuickJSRuntime.md#setinterrupthandler)
- [setMemoryLimit](QuickJSRuntime.md#setmemorylimit)
- [setModuleLoader](QuickJSRuntime.md#setmoduleloader)

## Properties

### context

• **context**: `undefined` \| [`QuickJSContext`](QuickJSContext.md)

If this runtime was created as as part of a context, points to the context
associated with the runtime.

If this runtime was created stand-alone, this may or may not contain a context.
A context here may be allocated if one is needed by the runtime, eg for [computeMemoryUsage](QuickJSRuntime.md#computememoryusage).

#### Defined in

[ts/runtime.ts:79](https://github.com/justjake/quickjs-emscripten/blob/master/ts/runtime.ts#L79)

## Accessors

### alive

• `get` **alive**(): `boolean`

#### Returns

`boolean`

#### Implementation of

[Disposable](../interfaces/Disposable.md).[alive](../interfaces/Disposable.md#alive)

#### Defined in

[ts/runtime.ts:112](https://github.com/justjake/quickjs-emscripten/blob/master/ts/runtime.ts#L112)

## Methods

### assertOwned

▸ **assertOwned**(`handle`): `void`

Assert that `handle` is owned by this runtime.

**`throws`** QuickJSWrongOwner if owned by a different runtime.

#### Parameters

| Name | Type |
| :------ | :------ |
| `handle` | [`QuickJSHandle`](../modules.md#quickjshandle) |

#### Returns

`void`

#### Defined in

[ts/runtime.ts:298](https://github.com/justjake/quickjs-emscripten/blob/master/ts/runtime.ts#L298)

___

### computeMemoryUsage

▸ **computeMemoryUsage**(): [`QuickJSHandle`](../modules.md#quickjshandle)

Compute memory usage for this runtime. Returns the result as a handle to a
JSValue object. Use [QuickJSContext.dump](QuickJSContext.md#dump) to convert to a native object.
Calling this method will allocate more memory inside the runtime. The information
is accurate as of just before the call to `computeMemoryUsage`.
For a human-digestible representation, see [dumpMemoryUsage](QuickJSRuntime.md#dumpmemoryusage).

#### Returns

[`QuickJSHandle`](../modules.md#quickjshandle)

#### Defined in

[ts/runtime.ts:279](https://github.com/justjake/quickjs-emscripten/blob/master/ts/runtime.ts#L279)

___

### dispose

▸ **dispose**(): `void`

Dispose of the underlying resources used by this object.

#### Returns

`void`

#### Implementation of

[Disposable](../interfaces/Disposable.md).[dispose](../interfaces/Disposable.md#dispose)

#### Defined in

[ts/runtime.ts:116](https://github.com/justjake/quickjs-emscripten/blob/master/ts/runtime.ts#L116)

___

### dumpMemoryUsage

▸ **dumpMemoryUsage**(): `string`

#### Returns

`string`

a human-readable description of memory usage in this runtime.
For programmatic access to this information, see [computeMemoryUsage](QuickJSRuntime.md#computememoryusage).

#### Defined in

[ts/runtime.ts:290](https://github.com/justjake/quickjs-emscripten/blob/master/ts/runtime.ts#L290)

___

### executePendingJobs

▸ **executePendingJobs**(`maxJobsToExecute?`): [`ExecutePendingJobsResult`](../modules.md#executependingjobsresult)

Execute pendingJobs on the runtime until `maxJobsToExecute` jobs are
executed (default all pendingJobs), the queue is exhausted, or the runtime
encounters an exception.

In QuickJS, promises and async functions *inside the runtime* create
pendingJobs. These do not execute immediately and need to triggered to run.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `maxJobsToExecute` | `number` | `-1` | When negative, run all pending jobs. Otherwise execute at most `maxJobsToExecute` before returning. |

#### Returns

[`ExecutePendingJobsResult`](../modules.md#executependingjobsresult)

On success, the number of executed jobs. On error, the exception
that stopped execution, and the context it occurred in. Note that
executePendingJobs will not normally return errors thrown inside async
functions or rejected promises. Those errors are available by calling
[resolvePromise](QuickJSContext.md#resolvepromise) on the promise handle returned by the async function.

#### Defined in

[ts/runtime.ts:225](https://github.com/justjake/quickjs-emscripten/blob/master/ts/runtime.ts#L225)

___

### hasPendingJob

▸ **hasPendingJob**(): `boolean`

In QuickJS, promises and async functions create pendingJobs. These do not execute
immediately and need to be run by calling [executePendingJobs](QuickJSRuntime.md#executependingjobs).

#### Returns

`boolean`

true if there is at least one pendingJob queued up.

#### Defined in

[ts/runtime.ts:176](https://github.com/justjake/quickjs-emscripten/blob/master/ts/runtime.ts#L176)

___

### newContext

▸ **newContext**(`options?`): [`QuickJSContext`](QuickJSContext.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`ContextOptions`](../interfaces/ContextOptions.md) |

#### Returns

[`QuickJSContext`](QuickJSContext.md)

#### Defined in

[ts/runtime.ts:120](https://github.com/justjake/quickjs-emscripten/blob/master/ts/runtime.ts#L120)

___

### removeInterruptHandler

▸ **removeInterruptHandler**(): `void`

Remove the interrupt handler, if any.
See [setInterruptHandler](QuickJSRuntime.md#setinterrupthandler).

#### Returns

`void`

#### Defined in

[ts/runtime.ts:201](https://github.com/justjake/quickjs-emscripten/blob/master/ts/runtime.ts#L201)

___

### removeModuleLoader

▸ **removeModuleLoader**(): `void`

Remove the the loader set by [setModuleLoader](QuickJSRuntime.md#setmoduleloader). This disables module loading.

#### Returns

`void`

#### Defined in

[ts/runtime.ts:163](https://github.com/justjake/quickjs-emscripten/blob/master/ts/runtime.ts#L163)

___

### setInterruptHandler

▸ **setInterruptHandler**(`cb`): `void`

Set a callback which is regularly called by the QuickJS engine when it is
executing code. This callback can be used to implement an execution
timeout.

The interrupt handler can be removed with [removeInterruptHandler](QuickJSRuntime.md#removeinterrupthandler).

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | [`InterruptHandler`](../modules.md#interrupthandler) |

#### Returns

`void`

#### Defined in

[ts/runtime.ts:189](https://github.com/justjake/quickjs-emscripten/blob/master/ts/runtime.ts#L189)

___

### setMemoryLimit

▸ **setMemoryLimit**(`limitBytes`): `void`

Set the max memory this runtime can allocate.
To remove the limit, set to `-1`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `limitBytes` | `number` |

#### Returns

`void`

#### Defined in

[ts/runtime.ts:264](https://github.com/justjake/quickjs-emscripten/blob/master/ts/runtime.ts#L264)

___

### setModuleLoader

▸ **setModuleLoader**(`moduleLoader`): `void`

Set the loader for EcmasScript modules requested by any context in this
runtime.

The loader can be removed with [removeModuleLoader](QuickJSRuntime.md#removemoduleloader).

#### Parameters

| Name | Type |
| :------ | :------ |
| `moduleLoader` | [`JSModuleLoader`](../interfaces/JSModuleLoader.md) |

#### Returns

`void`

#### Defined in

[ts/runtime.ts:155](https://github.com/justjake/quickjs-emscripten/blob/master/ts/runtime.ts#L155)