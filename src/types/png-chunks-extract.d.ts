declare module 'png-chunks-extract' {
  function extractChunks(buffer: Uint8Array): any[];
  export default extractChunks;
} 