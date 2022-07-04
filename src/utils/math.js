export const get2DPointsArrayCenter = (points) => {
    let xTotal = 0
    let yTotal = 0
    points.forEach(({x, y})=>{
        xTotal += x
        yTotal += y
    })
    return {
        x: xTotal/points.length,
        y: yTotal/points.length
    }
}