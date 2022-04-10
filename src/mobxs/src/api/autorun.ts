import {
    EMPTY_OBJECT,
    IEqualsComparer,
    IReactionDisposer,
    IReactionPublic,
    Lambda,
    Reaction,
    action,
    comparer,
    getNextId,
    isAction,
    isFunction,
    isPlainObject,
    die,
    allowStateChanges
} from "../internal"

export interface IAutorunOptions {
    delay?: number
    name?: string
    /**
     * Experimental.
     * Warns if the view doesn't track observables
     */
    requiresObservable?: boolean
    scheduler?: (callback: () => void) => any
    onError?: (error: any) => void
}

/**
 * Creates a named reactive view and keeps it alive, so that the view is always
 * updated if one of the dependencies changes, even when the view is not further used by something else.
 * @param view The reactive view
 * @returns disposer function, which can be used to stop the view from being updated in the future.
 */
export function autorun(
    view: (r: IReactionPublic) => any,
    opts: IAutorunOptions = EMPTY_OBJECT
): IReactionDisposer {
    if (__DEV__) {
        if (!isFunction(view)) die("Autorun expects a function as first argument")
        if (isAction(view)) die("Autorun does not accept actions since actions are untrackable")
    }

    const name: string =
        opts?.name ?? (__DEV__ ? (view as any).name || "Autorun@" + getNextId() : "Autorun")
    const runSync = !opts.scheduler && !opts.delay
    let reaction: Reaction

    if (runSync) {
        // normal autorun
        reaction = new Reaction(
            name,
            function (this: Reaction) {
                this.track(reactionRunner)
            },
            opts.onError,
            opts.requiresObservable
        )
    } else {
        const scheduler = createSchedulerFromOptions(opts)
        // debounced autorun
        let isScheduled = false

        reaction = new Reaction(
            name,
            () => {
                if (!isScheduled) {
                    isScheduled = true
                    scheduler(() => {
                        isScheduled = false
                        if (!reaction.isDisposed_) reaction.track(reactionRunner)
                    })
                }
            },
            opts.onError,
            opts.requiresObservable
        )
    }

    function reactionRunner() {
        view(reaction)
    }

    reaction.schedule_()
    return reaction.getDisposer_()
}

export type IReactionOptions<T> = IAutorunOptions & {
    fireImmediately?: boolean
    equals?: IEqualsComparer<T>
}

const run = (f: Lambda) => f()

function createSchedulerFromOptions(opts: IAutorunOptions) {
    return opts.scheduler
        ? opts.scheduler
        : opts.delay
        ? (f: Lambda) => setTimeout(f, opts.delay!)
        : run
}

export function reaction<T>(
    expression: (r: IReactionPublic) => T,
    effect: (arg: T, prev: T, r: IReactionPublic) => void,
    opts: IReactionOptions<T> = EMPTY_OBJECT
): IReactionDisposer {
    if (__DEV__) {
        if (!isFunction(expression) || !isFunction(effect))
            die("First and second argument to reaction should be functions")
        if (!isPlainObject(opts)) die("Third argument of reactions should be an object")
    }
    const name = opts.name ?? (__DEV__ ? "Reaction@" + getNextId() : "Reaction")
    
    const effectAction = action(
        name,
        opts.onError ? wrapErrorHandler(opts.onError, effect) : effect
    )
    const runSync = !opts.scheduler && !opts.delay
    const scheduler = createSchedulerFromOptions(opts)

    let firstTime = true
    let isScheduled = false
    let value: T
    let oldValue: T = undefined as any // only an issue with fireImmediately

    const equals: IEqualsComparer<T> = (opts as any).compareStructural
        ? comparer.structural
        : opts.equals || comparer.default

    const r = new Reaction(
        name,
        () => {
            if (firstTime || runSync) {
                reactionRunner()
            } else if (!isScheduled) {
                isScheduled = true
                scheduler!(reactionRunner)
            }
        },
        opts.onError,
        opts.requiresObservable
    )

    function reactionRunner() {//在set时会再度调用此方法 runReactionsHelper会调用Reaction中runReaction_方法进而调用这里
        isScheduled = false
        if (r.isDisposed_) return
        let changed: boolean = false
        r.track(() => {
            //将globalState.allowStateChanges设置为false 意思是以下操作不会修改状态
            //如果在reaction的读取操作中，未将响应值返回出来此处得不到值只会获取到undifined新值旧值一直相等就不会调用响应逻辑
            const nextValue = allowStateChanges(false, () => expression(r))
            changed = firstTime || !equals(value, nextValue)//用来判断新的值与旧的值是否相等是否发生改变
            oldValue = value
            value = nextValue
            console.log(changed,'changed','r.track内部代码被执行')
        })
        if (firstTime && opts.fireImmediately!) {
            //初始reaction并未执行 调用什么方法才能让if或者else执行，难道是autorun
            effectAction(value, oldValue, r)
        } 
        else if (!firstTime && changed){
             //初始reaction并未执行，在set时会执行到这
            effectAction(value, oldValue, r)
        } 
        firstTime = false
    }

    r.schedule_()
    return r.getDisposer_()
}

function wrapErrorHandler(errorHandler, baseFn) {
    return function () {
        try {
            return baseFn.apply(this, arguments)
        } catch (e) {
            errorHandler.call(this, e)
        }
    }
}
