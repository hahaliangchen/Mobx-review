

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

export function isES6Map(thing) {
  return thing instanceof Map
}

export function isES6Set(thing) {
  return thing instanceof Set
}

const identifier={
   'obj':Symbol('obj'),
   'array':Symbol('array')
}
const hierarchyFormat=(spacing,str)=>{
    return spacing+str
  }

const parseContext = {
  processQueue: [],
  TSProcessInx: [],
  transformStringStack: [],
  parseFinish:false,
  hierarchyFormat,
  options:{
     format:true
  }
}
const validityCombineProcess=(processQueue,TSProcessInx,parseFinish)=>{
    
    if(!processQueue||!TSProcessInx){
         console.error('processQueue或TSProcessInx有异常')
         throw 'processQueue或TSProcessInx有异常'
    } 
    if(parseFinish){
        console.error('解析结束')
        throw '解析结束'
    }
    const currentParseArray=processQueue[processQueue.length-1]
    const currentInx=TSProcessInx[TSProcessInx.length-1]-1//此时Inx已经指向下一步了当前应该再减一例如[{key:a,value:1},{key:b,value:1}]遍历完Inx是2
    //但我们为了组合字符串应该访问{key:b,value:1} 而它在数组的索引为1
    const currentParseValue=currentParseArray[currentInx]
    const prefixString=`${currentParseValue.key}:`
    return prefixString
}
//处理数组的相关方法
const prepareArrayParse = (parseArray,context) =>{
  const {processQueue}=context
  processQueue.push(parseArray)
}
const arrayLineBackFormat=(str)=>{
    return `[\n${str}\n]`
 }
const arrayFormatFlow=(...args)=>{
    const [context,prefixString,str/*对象大括号内的内容如{a:1}则是a:1 */]=args
    if(args.length===3){
        if(!(isString(prefixString)&&isString(str))){
             throw '第二参数和第三参数不是字符串'
        }
    }
    //会存在这种情况[[1,2]]或是{a:[1,2]}
    //第一种无前缀第二种有前缀'a:'
    if(prefixString!=='undefined'){
        const hierarchyStr=spacingFormat(prefixString,context)
        const postfixStr=arrayLineBackFormat(str)
        return  hierarchyStr+postfixStr
    }
  else  return arrayLineBackFormat(str)
}
const combineArrayStr=(str,context,arrayFormatFlow)=>{
    const {processQueue,TSProcessInx,parseFinish}=context
     try{
        const prefixString= validityCombineProcess(processQueue,TSProcessInx,parseFinish)
        if( isFunction(arrayFormatFlow) ) return arrayFormatFlow(str)
        else return `${prefixString}[${str}]`//合并字符串准备替换identifier标识符所在transformStringStack的位置
     }catch(e){
           console.error(e)
     }
}


//解析obj相关方法
const prepareObjParse = (parseObj,context) =>{
  const {processQueue}=context
  const generateParseQueue = Object.keys(parseObj).map((key) =>{
    return { key, value:parseObj[key] }
   })
  processQueue.push(generateParseQueue)
}

const combineKeyAndValueString=({key,value},context)=>{
    const {options}=context
    if(options.format){
      return `${key}:${value}`
    }
    else return `${key}:${value}`
  }

  const objLineBackFormat=(str)=>{
    return `{\n${str}\n}`
 }

 const objFormatFlow=(...args)=>{
     const [context,prefixString,str/*对象大括号内的内容如{a:1}则是a:1 */]=args
     if(args.length===3){
         if(!(isString(prefixString)&&isString(str))){
              throw '第二参数和第三参数不是字符串'
         }
     }
     //prefixString 前面添加空格 如'a:'前缀添加完为'  a:1'为了相同层级的键对齐
    const hierarchyStr=spacingFormat(prefixString,context)
    //后缀字符内容并相应添加\n
    const postfixStr=objLineBackFormat(str)
    return hierarchyStr+postfixStr
  }
  
  const combineObjStr=(str,context,objFormatFlow)=>{
    const {processQueue,TSProcessInx,parseFinish}=context
    try{
        const prefixString =validityCombineProcess(processQueue,TSProcessInx,parseFinish)
        
        if( isFunction(objFormatFlow) ) return objFormatFlow(context,prefixString,str)
        else return `${prefixString}{${str}}`//合并字符串准备替换identifier标识符所在transformStringStack的位置
    }
    catch(e){
        console.error(e)
    }
  }
//prepareObjParse combineKeyAndValueString objLineBackFormat objFormatFlow combineObjStr
//以上是处理obj相关方法

const immediatelyStoreStr=(parseStr,context,formatStrHandle)=>{
   const {transformStringStack}=context
   const currentStringInfo=isArr(transformStringStack[transformStringStack.length-1])
   ?transformStringStack[transformStringStack.length-1]
   :transformStringStack
   if(isFunction(formatStrHandle)){
    const formatStr=formatStrHandle(parseStr,context)
    currentStringInfo.push(formatStr)
   }
   else currentStringInfo.push(parseStr)
   return transformStringStack
}
const processParseThing=(parseThing)=>{
   if(isPlainObject(parseThing)) {
      return {
         runPrepareWork:(context)=>{
          const {TSProcessInx}=context
          TSProcessInx.push(0)
          prepareObjParse(parseThing,context)
         },
         runStoreStrProc:(context)=>{
             immediatelyStoreStr(identifier['obj'],context).push([])
         }
      }
   }else if(isArr(parseThing)){
       return {
        runPrepareWork:(context)=>{
            const {TSProcessInx}=context
            TSProcessInx.push(0)
            prepareArrayParse(parseThing,context)
           },
           runStoreStrProc:(context)=>{
               immediatelyStoreStr(identifier['array'],context).push([])
           }
       }
   }
   else {
     return {
        runStoreStrProc:(context)=>{
            immediatelyStoreStr(parseThing,context,spacingFormat)
        }
     }
   }
}
const prepareParse = (parseThing,context) =>{
     if(parseThing===null||parseThing===undefined||parseThing==='error'||parseThing==='finish') return
     const processedThing= processParseThing(parseThing)
     Object.keys(processedThing).forEach((key)=>{
         if(isFunction(processedThing[key])){
          processedThing[key](context)
         }
     })
}

const wholeParseProcessIsFinish =(context)=>{
   const {processQueue,TSProcessInx}=context
   return processQueue.length===0||TSProcessInx.length===0
}

const iterateResult=({key,value},context)=>{
  if(isPlainObject(value)) return value
   else return combineKeyAndValueString({key,value},context)
}
const startParse=(context)=>{
    const {processQueue,TSProcessInx}=context
    if(context.parseFinish) return {done:true,value:'finish'}
    let currentInx=TSProcessInx[TSProcessInx.length-1]
    const currentQueue= processQueue[processQueue.length-1]
    if(currentInx===currentQueue.length) return {done:true,value:null}

    if (typeof currentInx==='number'){
      const currentValue=currentQueue[currentInx]
      currentInx+=1
      TSProcessInx[TSProcessInx.length-1]=currentInx
      return {done:false ,value:iterateResult(currentValue,context)}
    }
    else return {done:true,value:'error'}
}

const rollBackStack=(context)=>{
      if(context.parseFinish) return
      const {processQueue,TSProcessInx}=context
      processQueue.pop()
      TSProcessInx.pop()
      context.parseFinish=wholeParseProcessIsFinish(context)
}

const storeCombinationString=(place,str)=>{
   if(place[place.length-1]===identifier['obj']||place[place.length-1]===identifier['array']) place[place.length-1]=str
   else console.error('出现错误place应该为数组')
}

const spacingFormat=(prefixString,context)=>{
    const {transformStringStack,hierarchyFormat}=context
    const hierarchy=transformStringStack.length-1
    //获取层级因为在合并字符串时栈已经弹出,但开头已经有标识符压入也就是{a1:1,a2:{a21:1}}键a1,a2位于一级
    //此时解析{a1:1,a2:{a21:1}}transformStringStack中会是[Symbol(obj),['a1:1', Symbol(obj)]],
    //未弹出之前是[Symbol(obj),['a1:1', Symbol(obj)],['a21:1']]
    //前缀的层级空格如a:{a1:1}中key a前面应该空几个空格
     
      return hierarchyFormat((new Array(hierarchy)).fill(' ').join(''),prefixString)
}





const combineHandle={
   head:(transformStringStack,tempStr)=>[transformStringStack,tempStr],
   [identifier['obj']]:(replacePosition,tempStr,context)=>{
     const {options}=context
    const combinationStr=combineObjStr(tempStr,context,options.format?objFormatFlow:null)
    return [
      replacePosition,
      combinationStr
    ]
   },
   [identifier['array']]:(replacePosition,tempStr,context)=>{
    const {options}=context
   const combinationStr=combineArrayStr(tempStr,context,options.format?arrayFormatFlow:null)
   return [
     replacePosition,
     combinationStr
   ]
  },
   '*':()=>{
      console.warn('什么都没匹配到')
      return [
         [],
         '没有匹配到所执行逻辑'
      ]
   }
}

const getCurrentStringCombineHandle=(transformStringStack,tempStr,combineHandle)=>{
    if(typeof transformStringStack[transformStringStack.length-1]==='symbol'){
      //证明到了栈的最开头只需将此开头位置的内容设置成需要替换的字符串
           return combineHandle['head'].bind(null,transformStringStack,tempStr)   
    }
    const currentStringInfo=isArr(transformStringStack[transformStringStack.length-1])
    ?transformStringStack[transformStringStack.length-1]
    :[]/*保证其为数组可以正常运行，但不会更改 transformStringStack*/
    if(currentStringInfo[currentStringInfo.length-1]===identifier['obj']){
      const key=identifier['obj']
       return combineHandle[key].bind(null,currentStringInfo,tempStr)
    }else if(currentStringInfo[currentStringInfo.length-1]===identifier['array']){
        const key=identifier['array']
        return combineHandle[key].bind(null,currentStringInfo,tempStr)
    }
    else {
      return combineHandle['*']
    }
}
const combineString=(context)=>{
  const {transformStringStack,options}=context
    const tempStr=transformStringStack[transformStringStack.length-1].join(options.format?',\n':',')
    transformStringStack.pop()//将尾部弹出并得到字符串开始合并字符串

    if (typeof tempStr!=='string') throw '合并需要的变量不是字符串在combineString中'
    const currentCombineHandle=getCurrentStringCombineHandle(transformStringStack,tempStr,combineHandle)
    return currentCombineHandle(context)
}
export const parseCraft= {
   parseContext,
   prepareParse,
   prepareObjParse,
   startParse,
   rollBackStack,
   wholeParseProcessIsFinish,
   combineString,
   storeCombinationString
}