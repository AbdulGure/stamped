export function cityPassportHref(cityId:string){return cityId==='tokyo'?'/passport/tokyo':`/passport/city?city=${encodeURIComponent(cityId)}`;}
export function memoryHref(cityId:string,experienceId:string){return cityId==='tokyo'?`/passport/tokyo/${encodeURIComponent(experienceId)}`:`/passport/memory?experience=${encodeURIComponent(experienceId)}`;}
