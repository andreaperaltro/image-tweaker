declare module 'png-metadata' {
  export function writeMetadata(buffer: Uint8Array, key: string, value: string): Uint8Array;
} 