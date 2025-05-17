/**
 * PngMetadata.ts
 * A pure browser-compatible utility for adding PNG metadata
 */

/**
 * Adds metadata to a PNG file in the browser
 * This is a custom implementation that doesn't rely on Node.js modules
 */
export async function addPngMetadata(
  pngBlob: Blob, 
  metadata: Record<string, string>
): Promise<Blob> {
  // Convert blob to array buffer
  const arrayBuffer = await pngBlob.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);
  
  // PNG signature (first 8 bytes)
  // Check that this is actually a PNG file
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < 8; i++) {
    if (data[i] !== signature[i]) {
      throw new Error('Not a valid PNG file');
    }
  }
  
  // Create result array - will contain all chunks including metadata
  const result: Uint8Array[] = [];
  
  // Add PNG signature
  result.push(new Uint8Array(signature));
  
  // First chunk must be IHDR - add it directly
  let pos = 8; // After signature
  
  // Read length (4 bytes)
  const headerLength = readUInt32(data, pos);
  // Add the header chunk (length + type + data + CRC)
  result.push(data.slice(pos, pos + 4 + 4 + headerLength + 4));
  pos += 4 + 4 + headerLength + 4;
  
  // Create tEXt chunks for metadata
  for (const [key, value] of Object.entries(metadata)) {
    const textChunk = createTextChunk(key, value);
    result.push(textChunk);
  }
  
  // Add remaining chunks
  while (pos < data.length) {
    // Read length (4 bytes)
    const length = readUInt32(data, pos);
    
    // Get chunk type (4 bytes)
    const chunkType = String.fromCharCode(
      data[pos + 4],
      data[pos + 5],
      data[pos + 6],
      data[pos + 7]
    );
    
    // If IEND chunk, we've reached the end
    if (chunkType === 'IEND') {
      // Add the IEND chunk
      result.push(data.slice(pos, pos + 4 + 4 + length + 4));
      break;
    }
    
    // Add the current chunk (length + type + data + CRC)
    result.push(data.slice(pos, pos + 4 + 4 + length + 4));
    pos += 4 + 4 + length + 4;
  }
  
  // Concatenate all chunks
  const totalLength = result.reduce((sum, arr) => sum + arr.length, 0);
  const output = new Uint8Array(totalLength);
  
  let offset = 0;
  for (const chunk of result) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  
  // Create and return a new blob
  return new Blob([output], { type: 'image/png' });
}

/**
 * Creates a tEXt chunk for PNG metadata
 */
function createTextChunk(keyword: string, text: string): Uint8Array {
  // Keyword (null-terminated) + text data
  const keywordBytes = stringToBytes(keyword);
  const textBytes = stringToBytes(text);
  
  // tEXt chunk data: keyword + null separator + text
  const data = new Uint8Array(keywordBytes.length + 1 + textBytes.length);
  data.set(keywordBytes, 0);
  data[keywordBytes.length] = 0; // null separator
  data.set(textBytes, keywordBytes.length + 1);
  
  // Chunk length (4 bytes)
  const length = data.length;
  const lengthBytes = new Uint8Array(4);
  writeUInt32(lengthBytes, 0, length);
  
  // Chunk type (4 bytes) - "tEXt"
  const typeBytes = new Uint8Array([116, 69, 88, 116]); // "tEXt"
  
  // Calculate CRC (4 bytes)
  const crcData = new Uint8Array(4 + data.length);
  crcData.set(typeBytes, 0);
  crcData.set(data, 4);
  const crc = calculateCRC(crcData);
  const crcBytes = new Uint8Array(4);
  writeUInt32(crcBytes, 0, crc);
  
  // Combine all parts
  const chunk = new Uint8Array(4 + 4 + data.length + 4);
  chunk.set(lengthBytes, 0);
  chunk.set(typeBytes, 4);
  chunk.set(data, 8);
  chunk.set(crcBytes, 8 + data.length);
  
  return chunk;
}

/**
 * Convert string to byte array
 */
function stringToBytes(str: string): Uint8Array {
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i);
  }
  return bytes;
}

/**
 * Read a 32-bit unsigned integer from a byte array
 */
function readUInt32(data: Uint8Array, offset: number): number {
  return (
    (data[offset] << 24) |
    (data[offset + 1] << 16) |
    (data[offset + 2] << 8) |
    data[offset + 3]
  );
}

/**
 * Write a 32-bit unsigned integer to a byte array
 */
function writeUInt32(data: Uint8Array, offset: number, value: number): void {
  data[offset] = (value >> 24) & 0xff;
  data[offset + 1] = (value >> 16) & 0xff;
  data[offset + 2] = (value >> 8) & 0xff;
  data[offset + 3] = value & 0xff;
}

/**
 * CRC table for chunk verification
 */
const crcTable: number[] = (() => {
  const table: number[] = new Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) {
        c = 0xedb88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
    }
    table[n] = c;
  }
  return table;
})();

/**
 * Calculate CRC for PNG chunk
 */
function calculateCRC(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return crc ^ 0xffffffff;
} 