import React, { useEffect, useRef }  from 'react'
import './App.css'
import styled from 'styled-components'
import * as faceapi from 'face-api.js'
import { Input, Image, Box } from '@chakra-ui/react'

const MODEL_URL = '/models'

const LEFT_EYE_IDS = [36, 37, 38, 39, 40, 41] // zero based off of landmark68
const RIGHT_EYE_IDS = [42, 43, 44, 45, 46, 47] // zero based off of landmark68

function App() {
    const inputRef = useRef()
    // const imageRef = useRef()
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

        const centeredCanvas = await faceapi.imageToSquare(image, 500, true)

        // imageRef.current.src = image.src

        const apiCanvas = centeredCanvas//faceapi.createCanvasFromMedia(image)

        const displaySize = { width: centeredCanvas.width, height: centeredCanvas.height }
        faceapi.matchDimensions(apiCanvas, displaySize)

        const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors()

        const resizedDetections = faceapi.resizeResults(detections, displaySize)

        console.log({ resizedDetections })

        faceapi.draw.drawDetections(apiCanvas, resizedDetections)
        faceapi.draw.drawFaceLandmarks(apiCanvas, resizedDetections)
        //
        canvasRef.current.width = apiCanvas.width
        canvasRef.current.height = apiCanvas.height


        const destCtx = canvasRef.current.getContext('2d')

        //Draw Source Image
        destCtx.drawImage(centeredCanvas, 0, 0)

        //Draw detections
        // destCtx.drawImage(apiCanvas, 0, 0)
    }

  return (
    <div className="App">
        <Input ref={inputRef} type="file" id="ImageUpload" onChange={handleChange}/>
        <Box pos="relative" border="1px solid red">
            {/*<Image ref={imageRef} border="1px solid green"/>*/}
            <Box pos="absolute" left="50%" top={0} border="1px solid blue" transform="translate(-50%, 0)">
                <canvas ref={canvasRef} border="1px solid black"></canvas>
            </Box>
        </Box>
    </div>
  )
}

export default App;
