import React, { useEffect, useRef, useState }  from 'react'
import './App.css'
import * as faceapi from 'face-api.js'
import { Input, Image, Box } from '@chakra-ui/react'
import {getAngleOfInclination, getPointsArrayCenter, radToDeg} from './util/math'

const MODEL_URL = '/models'

const LEFT_EYE_IDS = [36, 37, 38, 39, 40, 41] // zero based off of landmark68
const RIGHT_EYE_IDS = [42, 43, 44, 45, 46, 47] // zero based off of landmark68

function App() {
  const inputRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [imageAngle, setImageAngle] = useState(0)

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
    if (!inputRef.current || !canvasRef.current ||!inputRef.current.files) return

    const image = await faceapi.bufferToImage(inputRef.current.files[0])

    // const centeredCanvas = await faceapi.imageToSquare(image, 500, true)

    if(imageRef.current) imageRef.current.src = image.src

    const apiCanvas = faceapi.createCanvasFromMedia(image)

    const displaySize = { width: apiCanvas.width, height: apiCanvas.height }
    faceapi.matchDimensions(apiCanvas, displaySize)

    const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors()

    const resizedDetections = faceapi.resizeResults(detections, displaySize)

    const alignmentLandmarks = {
      leftEyeMid: getPointsArrayCenter(resizedDetections[0].landmarks.getLeftEye()),
      rightEyeMid: getPointsArrayCenter(resizedDetections[0].landmarks.getRightEye()),
      eyesMid: { x:0, y:0 }
    }
    alignmentLandmarks.eyesMid = getPointsArrayCenter([alignmentLandmarks.leftEyeMid, alignmentLandmarks.rightEyeMid])

    //Align face
    //const alignedBox = faceapi.FaceLandmarks.prototype.align(resizedDetections[0].detection, { useDlibAlignment: true })

    console.log({ alignmentLandmarks })

    const angle = getAngleOfInclination(alignmentLandmarks.rightEyeMid, alignmentLandmarks.eyesMid)

    // console.log({ angle })

    setImageAngle(radToDeg(angle))

    // if(imageRef.current) imageRef.current.style=`transform: rotateZ(${radToDeg(angle)})`

    faceapi.draw.drawDetections(apiCanvas, resizedDetections)
    faceapi.draw.drawFaceLandmarks(apiCanvas, resizedDetections)
    //
    canvasRef.current.width = apiCanvas.width
    canvasRef.current.height = apiCanvas.height


    const destCtx = canvasRef.current.getContext('2d')

    if (destCtx){
      //Draw Source Image
      destCtx.drawImage(apiCanvas, 0, 0)

      //Draw detections
      destCtx.drawImage(apiCanvas, 0, 0)
    }
  }

  return (
      <div className="App">
        <Input ref={inputRef} type="file" id="ImageUpload" onChange={handleChange}/>
        <Box pos="relative" border="1px solid red">
          <Image ref={imageRef} transform={`rotateZ(${-imageAngle}deg)`} border="1px solid green"/>
          <Box pos="absolute" left="50%" top={0} border="1px solid blue" transform="translate(-50%, 0)">
            <canvas ref={canvasRef}></canvas>
          </Box>
        </Box>
      </div>
  )
}

export default App;
