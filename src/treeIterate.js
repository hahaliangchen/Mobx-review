const plainObjectString = Object.toString()
const isString=(value)=>{
    return typeof value==='string'
}
function isObject(value) {
    return value !== null && typeof value === "object"
}
export function isPlainObject(value) {
    if (!isObject(value)) return false
    const proto = Object.getPrototypeOf(value)
    if (proto == null) return true
    return proto.constructor?.toString() === plainObjectString
}
const isFunction = (obj) => typeof obj === 'function'
const isArr = (obj) => Array.isArray(obj)

const $obj=Symbol('obj')
const $array=Symbol('array')
const $key=Symbol('key')
const $value=Symbol('value')
const $obsArr=Symbol('obsArr')

const a={
    a1:1,
    a2:{
         a21:'h'
         },
    a3:{
         a31:'s',
         a32:{
                  a321:1,
                  a322:2
              }
       },
    a4:4,
    /* a5:[
        [1,2],
        [{a51:1}]
    ] */
  }
export function isES6Map(thing) {
  return thing instanceof Map
}

export function isES6Set(thing) {
  return thing instanceof Set
}

class ObservableArray{
    value_=[]
    oldLength=0
    currentInx=0
    iterateObj=false
    iterateResult=()=>null
    name=undefined
    popReaction=[]
    pushReaction=[]
    constructor(value,iterateResult,name){
       if(isArr(value)) this.value_=value
       if(isFunction(iterateResult)) this.iterateResult=iterateResult
       if(isString(name)) this.name=name
       this.value_[$obsArr]=this
    }
    addPopReaction(handle){
        if(isFunction(handle))
        this.popReaction.push(handle)
        else console.error('类型错误需要添加函数')
    }
    addPushReaction(handle){
        if(isFunction(handle))
        this.pushReaction.push(handle)
        else console.error('类型错误需要添加函数')
    }
    pushEvent(value){
       this.value_.push(value)
       this.pushReaction.forEach((handler)=>{
        handler(value)
    })
       return this.value_length
    }
    popEvent(){
        const prevStack=this.value_.pop()
        this.popReaction.forEach((handler)=>{
            handler(prevStack)
        })
        return prevStack
    }
    spliceEvent(index, deleteCount, newItems){
        return this.value_.splice(index, deleteCount, ...newItems)
    }
    set_(inx,value){
        this.value_[inx]=value
    }

}
const arrayOverwriting={
    push(value){
        const obsArr=this[$obsArr]
        obsArr.pushEvent(value)
        return obsArr.value_.length
    },
    pop(){
        const obsArr=this[$obsArr]
        return obsArr.popEvent()
    },
    concat(...args){
        const obsArr=this[$obsArr]
        return obsArr.value_.concat.apply(obsArr.value_,args)
    },
    splice(index ,deleteCount ,...newItems) {
        const obsArr=this[$obsArr]
            switch (arguments.length) {
                case 0:
                    return []
                case 1:
                    return obsArr.spliceEvent(index)
                case 2:
                    return obsArr.spliceEvent(index, deleteCount)
               default:
                return obsArr.spliceEvent(index, deleteCount, newItems)
            }
            
        }
   
    
}
 const handler={
    get:function(obj,prop){
        const obsArr=obj[$obsArr]
        
        if(obsArr.hasOwnProperty(prop)) {
            return obsArr[prop]
        } 
        if (isString(prop) && !isNaN(parseInt(prop))) {
            const value=obsArr.value_[parseInt(prop)]
            //if(obsArr.iterateObj) return obsArr.iterateObj[value] //取消直接返回对象值的方式
           return value
        }
         if(arrayOverwriting[prop]){
             return arrayOverwriting[prop]
         }
        return obj[prop]},
    set:function(obj,prop,value){
        const obsArr=obj[$obsArr]
        if(obsArr.hasOwnProperty(prop)) {
            obsArr[prop]=value
            return true
        }
        if (typeof prop === "symbol" || isNaN(prop)) {
            obj[prop] = value
        } else {
            obsArr.set_(parseInt(prop), value)
        }
       
        return true
    }
}
const testNode=new ObservableArray()
export const proxyArr=new Proxy(testNode.value_,handler)
const createObservableArr=(...arg)=>{
    const observableArr=new ObservableArray(...arg)
    return new Proxy(observableArr.value_,handler)
}

//传参 开始遍历 压栈 迭代发现数组或者object 压栈 迭代完 出栈
const parseContext = {
    processQueue: createObservableArr(),
    TSProcessInx: [],
    transformStringStack: [],
    parseFinish:false,
  }
 
const popHandler=(node)=>{
    console.log(node,'出栈信息')
}
parseContext.processQueue[$obsArr].addPopReaction(popHandler)
const pushHandler=(node)=>{
    console.log(node,'入栈信息',node.name)
}
parseContext.processQueue[$obsArr].addPushReaction(pushHandler)
 function iterateObjResult(key){
    const value=this.iterateObj[key]
    this.currentInx+=1//索引加1
    return {[$key]:key,[$value]:value}
  }
function iterateArrResult(value){
    this.currentInx+=1
    return value
}
 //对于一般的递归其代码分为入栈时的执行逻辑和出栈时执行逻辑
 /* 如 function a(arg){
     let count=arg
     if(count>1){
         count--  
         a(count) 递归的简单示例，在此行代码之上为函数入栈时后执行的逻辑，而else段则为开始出栈时执行的逻辑
     }else{
         console.log('递归结束')
     }
 } */
 // 将出栈和入栈分为两个方法，每个方法都传入context这个上下文将需要的变量存入进去，第二参传入压栈出栈时机的方法
 //每个注入此体系的方法都会收到压栈和入栈方法 加上传入的上下文context
 //压栈和出栈的逻辑可否写成react useEffect 方式 useEffect(()=>{console.log(更新时执行);return ()=>console.log(卸载时执行)})
 //此体系下的放入的函数，使用call时会压栈 (call,context) => {call(sthmethod) console.log(context),return () => console.log(context)}
 // 此方法返回的方法会作为出栈逻辑
 // 入栈出栈都可以中断
 //让其可以在压栈前或出栈后做什么
 // 仍然需要让对象可被一步步迭代
 //将key压入栈 将当前遍历对象暂存到context?
 // 思维发散 下面两个方法有一个共用语句 如果可以自动注入相应代码位置就好了
 //@dependencesInject 
 /* 
    @公共代码段
    1,const {processQueue}=context
    2,const generateParseQueue = Object.keys(parseObj)
    3,generateParseQueue.iterateObj=parseObj
    4,processQueue.push(generateParseQueue)
    
    那么下面两个方法咱们可以这么写 
    pushObjToStack=[1,2,3,4] 数组从左至右是执行顺序
    pushArrayToStack=[1,4]
    如果成功效率大大提升
    */
//注意{a:[...]}和{a:{...}}的情况 ，主要是之前键值的处理
const pushObjToStack=(parseObj,context)=>{
    const {processQueue}=context
    let preStack
    let name=undefined
    if(processQueue.length>=1){
         preStack=processQueue[processQueue.length-1]
         //const obs=preStack[$obsArr]
         //不能数组索引访问因为如果是对象会直接得到值，我们要得到key
         //name=obs.value_[obs.currentInx]
         name=preStack[preStack.currentInx]
         
    }
    
    const generateParseQueue =createObservableArr(Object.keys(parseObj),iterateObjResult,name) 
    generateParseQueue.iterateObj=parseObj
    generateParseQueue.currentInx=0
    processQueue.push(generateParseQueue)
    return generateParseQueue
}

const pushArrayToStack=(parseArray,context)=>{
    const {processQueue}=context
    const generateParseQueue =createObservableArr(parseArray,iterateArrResult)
    generateParseQueue.currentInx=0
   // processQueue.push(createObservableArr(parseArray,iterateArrResult))
   processQueue.push(generateParseQueue)
    return generateParseQueue
}

const getStackTop=(stack)=>{
    return stack[stack.length-1]
}
//设置一个在currentInx增加前也就是迭代前的一个时机钩子，来做一些事情，比如结果合并处理，当然需要一个默认执行的规则
//对于这种currentInx增加前的时机方法需要返回一个布尔值来决定，是需要增加进行下次迭代
//迭代器只提供最基本迭代和入栈出栈操作，如何处理数据，何时入栈何时出栈应可自定义
// 栈节点应该为一个对象，提供执行的些信息
class StackNode{
    operateValue=[]
    currentInx=0
    extraInfo
    constructor(operateQueue){
        this.operateValue=operateQueue
        this.extraInfo=new Map()
    }
}


const generateIterator=(parseThing=a)=>{
    let iterateFinish=false
    const context=parseContext
    const {processQueue}=context
    const push=(parseThing,currentInx)=>{
        if(isPlainObject(parseThing)){
            pushObjToStack(parseThing,context,currentInx)
           return true
        }
        if(isArr(parseThing)){
             pushArrayToStack(parseThing,context)
            return true
        }
        return  false
    }
    push(parseThing);
    const next=()=>{
        if(iterateFinish) return {done:true,value:'finish'}

        let currentQueue
        let currentInx
        let currentValue
        let  currentResult
        const popAndPushEffect=()=>{
            currentQueue= getStackTop(processQueue)
            currentInx=currentQueue[$obsArr].currentInx
            currentValue=currentQueue[currentInx]
            currentResult=currentQueue.iterateResult(currentValue)
        }
        popAndPushEffect()
        console.log('currentInx',currentInx,currentQueue.length)
        while(currentInx>=currentQueue.length) {
            processQueue.pop()
           
             popAndPushEffect()
        }
        
        while(push(currentResult[$value])){
            currentQueue[$obsArr].currentInx+=1
            popAndPushEffect()
        }
        console.log(parseContext)
          return {done:false ,value:currentQueue.iterateResult(currentResult)}
    }
    return {
        next
    }
    
}
export {generateIterator} 