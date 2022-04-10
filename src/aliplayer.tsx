import {useEffect,useState,useRef,MutableRefObject} from 'react'
interface aliplayInstance{
    dispose:()=>any
}
const AliplayVideo=(props)=>{
    const player:MutableRefObject<null|aliplayInstance>=useRef(null)
    useEffect(()=>{
        player.current= new Aliplayer({
            id: "player-con",
            source: "https://api.bilibili.com/x/player/playurl?cid=237817546&qn=80&type=&otype=json&fourk=1&bvid=BV11a4y1j7A1&fnver=0&fnval=976&session=f006121b5bfabc7b28721a7254de34d1",//"https://player.alicdn.com/video/editor.mp4",
            width: "100%",
            height: "500px",
            cover: 'https://img.alicdn.com/tps/TB1EXIhOFXXXXcIaXXXXXXXXXXX-760-340.jpg',
            /* To set an album art, you must set 'autoplay' and 'preload' to 'false' */
            autoplay: false,
            preload: false,
            isLive: false
          }, function (player) {
            console.log("The player is created");
          });
        return ()=>{
            if(player.current!==null){
                player.current.dispose()
            }
           
        }
    },[])
    return <div id="player-con">

    </div>
}
export default AliplayVideo