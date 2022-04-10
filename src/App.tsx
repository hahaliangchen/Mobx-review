
import './App.css';
import {Button} from 'antd'
import { testMobx } from './testMobx';



function App() {
  
  return (
    <div className="App">
      <Button type='primary' onClick={()=>{testMobx.increment()}}>哈哈</Button>
     
    </div>
  );
}

export default App;

