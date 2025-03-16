'use client'

import { useState, useRef, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'

type FilterType = 'normal' | 'grayscale' | 'sepia' | 'invert' | 'blur' | 'brightness' | 'contrast' | 'hue-rotate'
type HalftoneArrangement = 'grid' | 'hexagonal' | 'spiral' | 'concentric' | 'random'
type HalftoneShape = 'circle' | 'square' | 'line' | 'cross' | 'diamond'

export default function SimpleImageEditor() {
  const [image, setImage] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('normal')
  const [filterValue, setFilterValue] = useState(100)
  const [zoom, setZoom] = useState(100)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const originalImageDataRef = useRef<string | null>(null)
  
  // Halftone settings
  const [halftoneEnabled, setHalftoneEnabled] = useState(false)
  const [halftoneCellSize, setHalftoneCellSize] = useState(5)
  const [halftoneMix, setHalftoneMix] = useState(100)
  const [halftoneColored, setHalftoneColored] = useState(false)
  const [halftoneArrangement, setHalftoneArrangement] = useState<HalftoneArrangement>('grid')
  const [halftoneShape, setHalftoneShape] = useState<HalftoneShape>('circle')
  
  // Handle file drop
  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      const reader = new FileReader()
      
      reader.onload = (e) => {
        if (e.target?.result) {
          const imageData = e.target.result as string
          setImage(imageData)
          originalImageDataRef.current = imageData
          setFilter('normal')
          setFilterValue(100)
          setZoom(100)
          setHalftoneEnabled(false)
        }
      }
      
      reader.readAsDataURL(file)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1
  })

  // Apply filter to canvas
  useEffect(() => {
    if (!image || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return
    
    const img = new Image()
    img.onload = () => {
      // Set canvas dimensions to match image
      const scale = zoom / 100
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Create a temporary canvas for the filtered image
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = canvas.width
      tempCanvas.height = canvas.height
      const tempCtx = tempCanvas.getContext('2d')
      
      if (!tempCtx) return
      
      // Reset filters
      tempCtx.filter = 'none'
      
      // Apply the selected filter
      switch (filter) {
        case 'grayscale':
          tempCtx.filter = `grayscale(${filterValue}%)`
          break
        case 'sepia':
          tempCtx.filter = `sepia(${filterValue}%)`
          break
        case 'invert':
          tempCtx.filter = `invert(${filterValue}%)`
          break
        case 'blur':
          tempCtx.filter = `blur(${filterValue / 20}px)`
          break
        case 'brightness':
          tempCtx.filter = `brightness(${filterValue}%)`
          break
        case 'contrast':
          tempCtx.filter = `contrast(${filterValue}%)`
          break
        case 'hue-rotate':
          tempCtx.filter = `hue-rotate(${filterValue * 3.6}deg)`
          break
        default:
          tempCtx.filter = 'none'
      }
      
      // Draw the filtered image on the temporary canvas
      tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height)
      
      // Apply halftone effect if enabled
      if (halftoneEnabled) {
        applyHalftoneEffect(ctx, tempCanvas)
      } else {
        // Just copy the filtered image to the main canvas
        ctx.drawImage(tempCanvas, 0, 0)
      }
    }
    img.src = image
  }, [image, filter, filterValue, zoom, halftoneEnabled, halftoneCellSize, halftoneMix, halftoneColored, halftoneArrangement, halftoneShape])
  
  // Function to apply halftone effect
  const applyHalftoneEffect = (ctx: CanvasRenderingContext2D, sourceCanvas: HTMLCanvasElement) => {
    const width = sourceCanvas.width
    const height = sourceCanvas.height
    
    // Get the pixel data from the source canvas
    const sourceCtx = sourceCanvas.getContext('2d')
    if (!sourceCtx) return
    
    const imageData = sourceCtx.getImageData(0, 0, width, height)
    const pixels = imageData.data
    
    // Clear the destination canvas
    ctx.clearRect(0, 0, width, height)
    
    // Set a background color (white)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    
    // Cell size should be at least 1
    const cellSize = Math.max(1, halftoneCellSize)
    
    // Calculate number of cells
    const cols = Math.ceil(width / cellSize)
    const rows = Math.ceil(height / cellSize)
    
    // Draw halftone pattern
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        // Cell position
        let centerX = x * cellSize + cellSize / 2
        let centerY = y * cellSize + cellSize / 2
        
        // Adjust position based on arrangement
        if (halftoneArrangement === 'hexagonal' && y % 2 === 0) {
          centerX += cellSize / 2
        } else if (halftoneArrangement === 'spiral') {
          const angle = Math.atan2(centerY - height / 2, centerX - width / 2)
          const distance = Math.sqrt(Math.pow(centerX - width / 2, 2) + Math.pow(centerY - height / 2, 2))
          const offset = distance / 20
          centerX += Math.cos(angle) * offset
          centerY += Math.sin(angle) * offset
        } else if (halftoneArrangement === 'concentric') {
          const distance = Math.sqrt(Math.pow(centerX - width / 2, 2) + Math.pow(centerY - height / 2, 2))
          const rings = Math.floor(distance / cellSize)
          if (rings % 2 === 0) {
            centerX += cellSize / 4
            centerY += cellSize / 4
          }
        } else if (halftoneArrangement === 'random') {
          centerX += (Math.random() - 0.5) * cellSize / 2
          centerY += (Math.random() - 0.5) * cellSize / 2
        }
        
        // Get the pixel at this position (clamped to image boundaries)
        const pixelX = Math.min(width - 1, Math.max(0, Math.floor(centerX)))
        const pixelY = Math.min(height - 1, Math.max(0, Math.floor(centerY)))
        const pixelIndex = (pixelY * width + pixelX) * 4
        
        // Calculate dot size (0 to cellSize) based on pixel brightness
        const r = pixels[pixelIndex]
        const g = pixels[pixelIndex + 1]
        const b = pixels[pixelIndex + 2]
        
        // Calculate brightness (0 to 1) - Perceived luminance approach
        const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255
        
        // Invert brightness for dot size (darker pixels = bigger dots)
        const dotSizeRatio = 1 - brightness
        
        // Calculate max dot size
        const maxDotSize = cellSize * 0.9
        
        // Calculate actual dot size
        const dotSize = maxDotSize * dotSizeRatio
        
        // Set the color based on settings
        if (halftoneColored) {
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
        } else {
          ctx.fillStyle = '#000000'
        }
        
        // Draw the dot in the desired shape
        ctx.beginPath()
        
        switch (halftoneShape) {
          case 'square':
            ctx.rect(centerX - dotSize / 2, centerY - dotSize / 2, dotSize, dotSize)
            break
          case 'line':
            ctx.moveTo(centerX - dotSize / 2, centerY)
            ctx.lineTo(centerX + dotSize / 2, centerY)
            ctx.lineWidth = dotSize / 2
            ctx.stroke()
            continue // Skip the fill for lines
          case 'cross':
            ctx.moveTo(centerX - dotSize / 2, centerY - dotSize / 2)
            ctx.lineTo(centerX + dotSize / 2, centerY + dotSize / 2)
            ctx.moveTo(centerX - dotSize / 2, centerY + dotSize / 2)
            ctx.lineTo(centerX + dotSize / 2, centerY - dotSize / 2)
            ctx.lineWidth = dotSize / 4
            ctx.stroke()
            continue // Skip the fill for crosses
          case 'diamond':
            ctx.moveTo(centerX, centerY - dotSize / 2)
            ctx.lineTo(centerX + dotSize / 2, centerY)
            ctx.lineTo(centerX, centerY + dotSize / 2)
            ctx.lineTo(centerX - dotSize / 2, centerY)
            break
          case 'circle':
          default:
            ctx.arc(centerX, centerY, dotSize / 2, 0, Math.PI * 2)
            break
        }
        
        ctx.fill()
      }
    }
    
    // Apply the original image with reduced opacity for mixing
    if (halftoneMix < 100) {
      ctx.globalAlpha = 1 - (halftoneMix / 100)
      ctx.drawImage(sourceCanvas, 0, 0)
      ctx.globalAlpha = 1
    }
  }

  // Load a random image from Unsplash
  const loadRandomImage = () => {
    const width = 800
    const height = 600
    const randomId = Math.floor(Math.random() * 1000)
    const imageUrl = `https://picsum.photos/${width}/${height}?random=${randomId}`
    
    // Fetch the image
    fetch(imageUrl)
      .then(response => response.blob())
      .then(blob => {
        const reader = new FileReader()
        reader.onload = (e) => {
          if (e.target?.result) {
            const imageData = e.target.result as string
            setImage(imageData)
            originalImageDataRef.current = imageData
            setFilter('normal')
            setFilterValue(100)
            setZoom(100)
            setHalftoneEnabled(false)
          }
        }
        reader.readAsDataURL(blob)
      })
      .catch(error => {
        console.error('Error loading random image:', error)
      })
  }

  // Reset image to original
  const resetImage = () => {
    if (originalImageDataRef.current) {
      setImage(originalImageDataRef.current)
      setFilter('normal')
      setFilterValue(100)
      setZoom(100)
      setHalftoneEnabled(false)
      setHalftoneCellSize(5)
      setHalftoneMix(100)
      setHalftoneColored(false)
      setHalftoneArrangement('grid')
      setHalftoneShape('circle')
    }
  }

  // Download the edited image
  const downloadImage = () => {
    if (!canvasRef.current) return
    
    const link = document.createElement('a')
    link.download = 'imagetweaker-edited.png'
    link.href = canvasRef.current.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="flex flex-col space-y-6">
      {!image ? (
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-lg font-medium">Drag & drop an image here</p>
            <p className="text-sm text-gray-500 mt-1">or click to select a file</p>
            <button 
              onClick={(e) => {
                e.stopPropagation()
                loadRandomImage()
              }}
              className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              Load Random Image
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-auto">
            <canvas 
              ref={canvasRef} 
              className="mx-auto border border-gray-200 rounded shadow-sm max-w-full bg-gray-50"
            />
          </div>
          
          <div className="bg-gray-100 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Filter</label>
                <select 
                  className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as FilterType)}
                >
                  <option value="normal">Normal</option>
                  <option value="grayscale">Grayscale</option>
                  <option value="sepia">Sepia</option>
                  <option value="invert">Invert</option>
                  <option value="blur">Blur</option>
                  <option value="brightness">Brightness</option>
                  <option value="contrast">Contrast</option>
                  <option value="hue-rotate">Hue Rotate</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Effect Intensity</label>
                <input 
                  type="range" 
                  min="0" 
                  max={filter === 'blur' ? 100 : 200} 
                  value={filterValue}
                  onChange={(e) => setFilterValue(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>{filterValue}%</span>
                  <span>{filter === 'blur' ? 100 : 200}%</span>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4 mb-2">
              <div className="flex items-center mb-3">
                <input 
                  type="checkbox" 
                  id="halftone-enabled" 
                  checked={halftoneEnabled}
                  onChange={(e) => setHalftoneEnabled(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="halftone-enabled" className="ml-2 text-sm font-medium text-gray-700">
                  Enable Halftone Effect
                </label>
              </div>
              
              {halftoneEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cell Size</label>
                    <input 
                      type="range" 
                      min="1" 
                      max="20" 
                      value={halftoneCellSize}
                      onChange={(e) => setHalftoneCellSize(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>1px</span>
                      <span>{halftoneCellSize}px</span>
                      <span>20px</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mix</label>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={halftoneMix}
                      onChange={(e) => setHalftoneMix(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0%</span>
                      <span>{halftoneMix}%</span>
                      <span>100%</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center mb-2">
                      <input 
                        type="checkbox" 
                        id="halftone-colored" 
                        checked={halftoneColored}
                        onChange={(e) => setHalftoneColored(e.target.checked)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="halftone-colored" className="ml-2 text-sm font-medium text-gray-700">
                        Colored Dots
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Arrangement</label>
                    <select 
                      className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
                      value={halftoneArrangement}
                      onChange={(e) => setHalftoneArrangement(e.target.value as HalftoneArrangement)}
                    >
                      <option value="grid">Grid</option>
                      <option value="hexagonal">Hexagonal</option>
                      <option value="spiral">Spiral</option>
                      <option value="concentric">Concentric</option>
                      <option value="random">Random</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Shape</label>
                    <select 
                      className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
                      value={halftoneShape}
                      onChange={(e) => setHalftoneShape(e.target.value as HalftoneShape)}
                    >
                      <option value="circle">Circle</option>
                      <option value="square">Square</option>
                      <option value="line">Line</option>
                      <option value="cross">Cross</option>
                      <option value="diamond">Diamond</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zoom</label>
                <input 
                  type="range" 
                  min="10" 
                  max="200" 
                  value={zoom}
                  onChange={(e) => setZoom(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>10%</span>
                  <span>{zoom}%</span>
                  <span>200%</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={downloadImage}
              className="flex-1 min-w-24 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Download Image
            </button>
            <button 
              onClick={resetImage}
              className="flex-1 min-w-24 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors"
            >
              Reset Changes
            </button>
            <button 
              onClick={() => {
                setImage(null)
                originalImageDataRef.current = null
              }}
              className="flex-1 min-w-24 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors"
            >
              New Image
            </button>
          </div>
        </>
      )}
    </div>
  )
} 