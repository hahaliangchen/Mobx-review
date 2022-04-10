
import './App.css';
import {Button} from 'antd'
import { testMobx } from './testMobx';
import AliplayVideo from './aliplayer';


function App() {
  
  return (
    <div className="App">
      <Button type='primary' onClick={()=>{testMobx.increment()}}>哈哈</Button>
      <AliplayVideo/>
    </div>
  );
}

export default App;

