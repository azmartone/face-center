interface IPoint {
    x: number
    y: number
}

type PointArray = IPoint[]

export function getPointsArrayCenter(points: PointArray):IPoint{
    const initialValue = { x: 0, y: 0 }
    const sums = points.reduce((prev, current) => {
        return { x: prev.x + current.x, y: prev.y + current.y }
    }, initialValue )
    return { x: sums.x/points.length, y: sums.y/points.length }
}


export function getAngleOfInclination(a: IPoint, b: IPoint){
    const slope = (b.y - a.y)/(b.x - a.x)
    return Math.atan(slope)
    //https://www.youtube.com/watch?v=kME3XP_F6vU
}

export function radToDeg(radians: number)
{
    const pi = Math.PI
    return radians * (180/pi)
}