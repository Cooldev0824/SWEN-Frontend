export function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function getDistanceFromLatLonInMi([lat1, lon1]: [number, number], [lat2, lon2]: [number, number]): number {
  let R = 3958.8; // Radius of the earth in miles
  let dLat = deg2rad(lat2 - lat1);
  let dLon = deg2rad(lon2 - lon1);
  let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
  let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  let d = R * c; // Distance in miles
  return d;
}

export function isWithinMi([lat1, lon1]: [number, number], [lat2, lon2]: [number, number], mile: number): boolean {
  let distance = getDistanceFromLatLonInMi([lat1, lon1], [lat2, lon2]);
  console.log("Distance Function")
  console.log(distance)
  console.log(mile)
  if(distance <= mile) {
    console.log("Distance is within range")
    return true;
  } else {
    console.log("Distance too far")
    return false;
  }
}