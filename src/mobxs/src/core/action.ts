import {
    IDerivation,
    endBatch,
    globalState,
    isSpyEnabled,
    spyReportEnd,
    spyReportStart,
    startBatch,
    untrackedEnd,
    untrackedStart,
    isFunction,
    allowStateReadsStart,
    allowStateReadsEnd,
    ACTION,
    EMPTY_ARRAY,
    die,
    getDescriptor
} from "../internal"

// we don't use globalState for these in order to avoid possible issues with multiple
// mobx versions
let currentActionId = 0
let nextActionId = 1
const isFunctionNameConfigurable = getDescriptor(() => {}, "name")?.configurable ?? false

// we can safely recycle this object
const tmpNameDescriptor: PropertyDescriptor = {
    value: "action",
    configurable: true,
    writable: false,
    enumerable: false
}

export function  createAction(
    actionName: string,
    fn: Function,
    autoAction: boolean = false,
    ref?: Object
): Function {
   
    if (__DEV__) {
        if (!isFunction(fn)) die("`action` can only be invoked on functions")
        if (typeof actionName !== "string" || !actionName)
            die(`actions should have valid names, got: '${actionName}'`)
    }
    function res() {
        console.log('res被调用',actionName)
        return executeAction(actionName, autoAction, fn, ref || this as any, arguments)
    }
    res.isMobxAction = true
    if (isFunctionNameConfigurable) {
        tmpNameDescriptor.value = actionName
        Object.defineProperty(res, "name", tmpNameDescriptor)
    }
    return res
}

export function executeAction(
    actionName: string,
    canRunAsDerivation: boolean,
    fn: Function,
    scope?: any,
    args?: IArguments
) {
    const runInfo = _startAction(actionName, canRunAsDerivation, scope, args)
    try {
        return fn.apply(scope, args)
    } catch (err) {
        runInfo.error_ = err
        throw err
    } finally {
        _endAction(runInfo)
    }
}

export interface IActionRunInfo {
    prevDerivation_: IDerivation | null
    prevAllowStateChanges_: boolean
    prevAllowStateReads_: boolean
    notifySpy_: boolean
    startTime_: number
    error_?: any
    parentActionId_: number
    actionId_: number
    runAsAction_?: boolean
}

export function _startAction(
    actionName: string,
    canRunAsDerivation: boolean, // true for autoAction
    scope: any,
    args?: IArguments
): IActionRunInfo {
    const notifySpy_ = __DEV__ && isSpyEnabled() && !!actionName
    let startTime_: number = 0
    if (__DEV__ && notifySpy_) {
        startTime_ = Date.now()
        const flattenedArgs = args ? Array.from(args) : EMPTY_ARRAY
        spyReportStart({
            type: ACTION,
            name: actionName,
            object: scope,
            arguments: flattenedArgs
        })
    }
    const prevDerivation_ = globalState.trackingDerivation//默认为false 存储当下Reaction
    const runAsAction = !canRunAsDerivation || !prevDerivation_//canRunAsDerivation一般不是autoAction所以为false
    startBatch(); 
    let prevAllowStateChanges_ = globalState.allowStateChanges // by default preserve previous allow
    if (runAsAction) {
        untrackedStart()
        prevAllowStateChanges_ = allowStateChangesStart(true)
    }
    const prevAllowStateReads_ = allowStateReadsStart(true)
    const runInfo = {
        runAsAction_: runAsAction,
        prevDerivation_,
        prevAllowStateChanges_,
        prevAllowStateReads_,
        notifySpy_,
        startTime_,
        actionId_: nextActionId++,
        parentActionId_: currentActionId
    }
    currentActionId = runInfo.actionId_
    return runInfo
}

export function _endAction(runInfo: IActionRunInfo) {
    if (currentActionId !== runInfo.actionId_) {
        die(30)
    }
    currentActionId = runInfo.parentActionId_

    if (runInfo.error_ !== undefined) {
        globalState.suppressReactionErrors = true
    }
    allowStateChangesEnd(runInfo.prevAllowStateChanges_)//结束时将全局状态改变为先前值一般为false
    allowStateReadsEnd(runInfo.prevAllowStateReads_)
    console.log('endAction正在执行内部执行endBatch')
    endBatch()
    if (runInfo.runAsAction_) untrackedEnd(runInfo.prevDerivation_)
    if (__DEV__ && runInfo.notifySpy_) {
        spyReportEnd({ time: Date.now() - runInfo.startTime_ })
    }
    globalState.suppressReactionErrors = false
}

export function allowStateChanges<T>(allowStateChanges: boolean, func: () => T): T {
    const prev = allowStateChangesStart(allowStateChanges)
    try {
        return func()
    } finally {
        allowStateChangesEnd(prev)
    }
}

export function allowStateChangesStart(allowStateChanges: boolean) {
    const prev = globalState.allowStateChanges
    globalState.allowStateChanges = allowStateChanges
    return prev
}

export function allowStateChangesEnd(prev: boolean) {
    globalState.allowStateChanges = prev
}
