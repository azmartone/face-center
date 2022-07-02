import React, { useEffect, useRef }  from 'react'
import './App.css'
import styled from 'styled-components'
import * as faceapi from 'face-api.js'
import { Input, Image, Box } from '@chakra-ui/react'

const MainCanvas = styled.canvas`
    border: 1px solid red;
`
const MODEL_URL = '/models'

function App() {
    const inputRef = useRef()
    const imageRef = useRef()
    const canvasRef = useRef()

    const start = ()=>{
        console.log('loadedd')
    }

    useEffect(()=>{
        Promise.all([
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        ]).then(start)
    }, [])

    const handleChange = async ()=>{
        console.log('handleChange')
        const image = await faceapi.bufferToImage(inputRef.current.files[0])
        imageRef.current.src = image.src

        const apiCanvas = faceapi.createCanvasFromMedia(image)

        const displaySize = { width: image.width, height: image.height }
        faceapi.matchDimensions(apiCanvas, displaySize)

        const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors()

        const resizedDetections = faceapi.resizeResults(detections, displaySize)

        faceapi.draw.drawDetections(apiCanvas, resizedDetections)
        faceapi.draw.drawFaceLandmarks(apiCanvas, resizedDetections)

        canvasRef.current.width = apiCanvas.width
        canvasRef.current.height = apiCanvas.height
        const destCtx = canvasRef.current.getContext('2d')
        destCtx.drawImage(apiCanvas, 0, 0)
    }

  return (
    <div className="App">
        <Input ref={inputRef} type="file" id="ImageUpload" onChange={handleChange}/>
        <Box pos="relative">
            <Image ref={imageRef}/>
            <Box pos="absolute" left={0} top={0}><canvas ref={canvasRef}></canvas></Box>
        </Box>
    </div>
  )
}

export default App;
