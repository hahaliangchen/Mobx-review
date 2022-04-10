import { parseCraft } from "./lcutils";

const testObj={
    a:{
      a1:1,
      a2:{
           a21:1
           },
      a3:{
           a31:1,
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
    },
    b:1,
    c:{
      c1:1,
      c2:2,
      c3:{
          c31:1,
          c32:{
                c321:3
            }
        }
      }
    }
    
    
    window.parseCraft=parseCraft
    window.parseProcess=(test=testObj)=>{
        //解析前准备入栈阶段，也包含某些字符串入债
        //开始解析 实际执行的是迭代一次 用改变数组索引的方式遍历栈数组
        //使用数组length监听一旦发生变化并执行相应回调，如入栈出栈都会改变length
      const {
        parseContext,
        prepareParse,
        startParse
        }=parseCraft
       const {processQueue,transformStringStack,TSProcessInx}=parseContext
       prepareParse(test,parseContext)
       console.log(processQueue,transformStringStack,TSProcessInx,'栈信息')
       const result= startParse(parseContext)
       console.log(result,'遍历结果')
       return result
    }
    window.loopParseProcess=(test=null)=>{
        let r={done:false,value:test}
        while(!r.done){
           r=window.parseProcess(r.value)
        }
    }
    window.parseLaterPeriod=()=>{
        //解析后期 相应出栈
        //开始合并解析出来的字符串
      const context=parseCraft.parseContext
      parseCraft.rollBackStack(context)//出栈操作
     const info= parseCraft.combineString(context)//合并字符串
     console.log(info)
     parseCraft.storeCombinationString(...info)//存储合并的字符串
    }
    window.autoParse=(test=testObj) => {
      window.loopParseProcess(test)
      window.parseLaterPeriod()
      while(parseCraft.parseContext.parseFinish===false){
        window.loopParseProcess()
        window.parseLaterPeriod()
      }
      console.log(`{\n${parseCraft.parseContext.transformStringStack.join()}\n}`)
    }