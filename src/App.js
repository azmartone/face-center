import React, {useRef}  from 'react';
import './App.css';
import styled from 'styled-components';
import {useCallbackRef} from "use-callback-ref";
import 'face-api.js'

const MainCanvas = styled.canvas`
    border: 1px solid red;
`

function App() {

Promise.all([
    faceapi.nets.faceRecognitionNet.loadFromUri('images/face/'),
    faceapi.nets.faceLandmark68Net.loadFromUri('images/face/'),
    faceapi.nets.ssdMobilenetv1.loadFromUri('images/face/')
]).then(start)

    function start(){
    console.log('loadedd')
    }

    // const loadImage = ()=> {
    //     var imageObj1 = new Image();
    //     imageObj1.src = 'images/face/MVIMG_20190918_084958.jpg'
    //     imageObj1.onload = handleLoaded
    // }

    // const canvasEl = useCallbackRef(null, loadImage);

  return (
    <div className="App">
      <header className="App-header">
        <img src="images/face/20200103_221942.jpg" className="App-logo" alt="logo" />
        <MainCanvas id="mainCanvas" width="500" height="500"     />
      </header>
    </div>
  );
}

export default App;
