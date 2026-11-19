declare module 'imagetracerjs' {
  interface ImageTracerImageData {
    width: number;
    height: number;
    data: Uint8ClampedArray;
  }

  interface ImageTracerOptions {
    numberofcolors?: number;
    scale?: number;
    strokewidth?: number;
    viewbox?: boolean;
    desc?: boolean;
    ltres?: number;
    qtres?: number;
    pathomit?: number;
    colorquantcycles?: number;
    linefilter?: boolean;
    rightangleenhance?: boolean;
  }

  interface ImageTracerApi {
    imagedataToSVG(imageData: ImageTracerImageData, options?: ImageTracerOptions): string;
  }

  const ImageTracer: ImageTracerApi;
  export default ImageTracer;
}
