import { makeObservable, observable, computed, action, flow,reaction } from "./mobxs/src/mobx"

class Doubler {
    value=0
    array=[]
    constructor(value) {
        makeObservable(this, {
            value: observable,
            array:observable,
            double: computed,
            increment: action,
        })
       
    }

    get double() {
        return this.value * 2
    }
   
    increment() {
        console.log('增加',this.value)
        this.array.push(1)
        this.value++
        console.log('增加完',this.value)
    }
    incrementDouble() {
        console.log('增加',this.value)
        this.value+=2
    }
   
}
const testMobx=new Doubler()
window.testMobx=testMobx

// reaction((r)=>{
//     console.log(testMobx.value,'测试全局state存入的reaction')
//     //未将响应值返回出来此处得不到值只会获取到undifined新值旧值一直相等就不会调用响应逻辑
//     return testMobx.value},value=>{console.error(value,'获取响应')/* 此方法自动被action包裹执行action名为Reaction */})
reaction((r)=>{
    //testMobx.array.push(1) //会造成无限循环限制为100
    console.log(testMobx.array.length,'看看array',r)
    //正常而言在这个阶段读取值会注入响应依赖，可只有在返回时读好使要弄明白咋回事，
    return testMobx.array.length
},value=>{console.error(value,'array响应')})
/* testMobx.value=2
testMobx.value=3 */
export {testMobx}