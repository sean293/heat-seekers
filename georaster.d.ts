declare module 'georaster' {
  export default function parseGeoraster(
    input: ArrayBuffer | Blob | File | string
  ): Promise<any>;
}

declare module 'georaster-layer-for-leaflet' {
  import * as L from 'leaflet';
  
  export default class GeoRasterLayer extends L.Layer {
    constructor(options: any);
    getBounds(): L.LatLngBounds;
  }
}