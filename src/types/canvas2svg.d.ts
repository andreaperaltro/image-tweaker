declare module 'canvas2svg' {
  class C2S {
    constructor(width: number, height: number);
    getSerializedSvg(pretty: boolean): string;
    
    // Canvas context methods and properties
    save(): void;
    restore(): void;
    scale(x: number, y: number): void;
    rotate(angle: number): void;
    translate(x: number, y: number): void;
    transform(a: number, b: number, c: number, d: number, e: number, f: number): void;
    setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void;
    clearRect(x: number, y: number, w: number, h: number): void;
    fillRect(x: number, y: number, w: number, h: number): void;
    strokeRect(x: number, y: number, w: number, h: number): void;
    beginPath(): void;
    closePath(): void;
    moveTo(x: number, y: number): void;
    lineTo(x: number, y: number): void;
    bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void;
    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void;
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean): void;
    arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void;
    ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void;
    rect(x: number, y: number, w: number, h: number): void;
    fill(): void;
    stroke(): void;
    clip(): void;
    createLinearGradient(x0: number, y0: number, x1: number, y1: number): any;
    createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number): any;
    createPattern(image: any, repetition: string): any;
    drawImage(image: any, dx: number, dy: number): void;
    drawImage(image: any, dx: number, dy: number, dw: number, dh: number): void;
    drawImage(image: any, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number): void;
    createImageData(width: number, height: number): ImageData;
    createImageData(imagedata: ImageData): ImageData;
    getImageData(sx: number, sy: number, sw: number, sh: number): ImageData;
    putImageData(imagedata: ImageData, dx: number, dy: number): void;
    putImageData(imagedata: ImageData, dx: number, dy: number, dirtyX: number, dirtyY: number, dirtyWidth: number, dirtyHeight: number): void;
    
    // Properties
    fillStyle: string | CanvasGradient | CanvasPattern;
    strokeStyle: string | CanvasGradient | CanvasPattern;
    shadowOffsetX: number;
    shadowOffsetY: number;
    shadowBlur: number;
    shadowColor: string;
    globalCompositeOperation: string;
    font: string;
    globalAlpha: number;
    lineWidth: number;
    lineCap: 'butt' | 'round' | 'square';
    lineJoin: 'round' | 'bevel' | 'miter';
    miterLimit: number;
    lineDashOffset: number;
    textAlign: 'start' | 'end' | 'left' | 'right' | 'center';
    textBaseline: 'top' | 'hanging' | 'middle' | 'alphabetic' | 'ideographic' | 'bottom';
    direction: 'ltr' | 'rtl' | 'inherit';
    imageSmoothingEnabled: boolean;
  }
  
  export default C2S;
} 