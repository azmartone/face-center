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


export function getAngleOfInclination(){
    //https://www.youtube.com/watch?v=kME3XP_F6vU
}