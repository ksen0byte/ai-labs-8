import React, {Component} from 'react';
import './App.scss';
import CanvasContainer from "./components/CanvasContainer";

class App extends Component {
    render() {
        return (
            <div className="App">
                <div className="canvasWrapper">
                    <CanvasContainer id={1} size={700} pixel={50} clickEnabled={true}/>
                    {/*<CanvasContainer id={2} size={350} pixel={25}/>*/}
                </div>
            </div>
        );
    }
}

export default App;
