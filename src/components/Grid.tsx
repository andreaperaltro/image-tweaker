/**
 * Grid and Split Tree Utility Functions
 * 
 * This module provides functionality for:
 * 1. Dividing canvas into grid cells
 * 2. Creating recursive splits with controlled probabilities
 * 3. Applying rotations and effects to grid cells
 */

export type GridCell = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  children: GridCell[];
};

export type GridSettings = {
  enabled: boolean;
  columns: number;
  rows: number;
  applyRotation: boolean;
  maxRotation: number;
  splitEnabled: boolean;
  splitProbability: number;
  maxSplitLevels: number;
  minCellSize: number;
};

/**
 * Create a grid of cells based on supplied settings
 */
export function createGrid(width: number, height: number, settings: GridSettings): GridCell[] {
  if (!settings.enabled) return [];
  
  const { columns, rows } = settings;
  const cellWidth = width / columns;
  const cellHeight = height / rows;
  const cells: GridCell[] = [];
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const cell: GridCell = {
        x: col * cellWidth,
        y: row * cellHeight,
        width: cellWidth,
        height: cellHeight,
        rotation: settings.applyRotation ? (Math.random() - 0.5) * settings.maxRotation : 0,
        children: []
      };
      
      // Apply recursive splitting if enabled
      if (settings.splitEnabled) {
        createSplitTree(
          cell, 
          settings.splitProbability, 
          settings.maxSplitLevels, 
          settings.minCellSize, 
          settings.applyRotation,
          settings.maxRotation,
          1 // Start at level 1
        );
      }
      
      cells.push(cell);
    }
  }
  
  return cells;
}

/**
 * Recursively split cells to create a tree structure
 */
function createSplitTree(
  cell: GridCell, 
  probability: number, 
  maxLevels: number,
  minCellSize: number,
  applyRotation: boolean,
  maxRotation: number,
  currentLevel: number
): void {
  // Stop recursion if reached max level or cell too small
  if (currentLevel >= maxLevels || 
      cell.width < minCellSize * 2 || 
      cell.height < minCellSize * 2) {
    return;
  }
  
  // Decide whether to split this cell (reduced probability with each level)
  const levelProbabilityFactor = (maxLevels - currentLevel + 1) / maxLevels;
  const adjustedProbability = probability * levelProbabilityFactor;
  
  if (Math.random() > adjustedProbability) {
    return;
  }
  
  // Choose split direction (horizontal or vertical)
  const splitHorizontal = Math.random() < 0.5;
  
  // Create two child cells
  if (splitHorizontal) {
    // Random split point between 0.3 and 0.7 of the cell
    const splitPoint = 0.3 + Math.random() * 0.4;
    const height1 = cell.height * splitPoint;
    const height2 = cell.height - height1;
    
    const child1: GridCell = {
      x: cell.x,
      y: cell.y,
      width: cell.width,
      height: height1,
      rotation: applyRotation ? (Math.random() - 0.5) * maxRotation : 0,
      children: []
    };
    
    const child2: GridCell = {
      x: cell.x,
      y: cell.y + height1,
      width: cell.width,
      height: height2,
      rotation: applyRotation ? (Math.random() - 0.5) * maxRotation : 0,
      children: []
    };
    
    cell.children.push(child1, child2);
    
    // Continue recursively
    createSplitTree(child1, probability, maxLevels, minCellSize, applyRotation, maxRotation, currentLevel + 1);
    createSplitTree(child2, probability, maxLevels, minCellSize, applyRotation, maxRotation, currentLevel + 1);
  } else {
    // Random split point between 0.3 and 0.7 of the cell
    const splitPoint = 0.3 + Math.random() * 0.4;
    const width1 = cell.width * splitPoint;
    const width2 = cell.width - width1;
    
    const child1: GridCell = {
      x: cell.x,
      y: cell.y,
      width: width1,
      height: cell.height,
      rotation: applyRotation ? (Math.random() - 0.5) * maxRotation : 0,
      children: []
    };
    
    const child2: GridCell = {
      x: cell.x + width1,
      y: cell.y,
      width: width2,
      height: cell.height,
      rotation: applyRotation ? (Math.random() - 0.5) * maxRotation : 0,
      children: []
    };
    
    cell.children.push(child1, child2);
    
    // Continue recursively
    createSplitTree(child1, probability, maxLevels, minCellSize, applyRotation, maxRotation, currentLevel + 1);
    createSplitTree(child2, probability, maxLevels, minCellSize, applyRotation, maxRotation, currentLevel + 1);
  }
}

/**
 * Render a grid cell and its children
 */
export function renderGridCell(
  ctx: CanvasRenderingContext2D, 
  cell: GridCell,
  sourceCanvas: HTMLCanvasElement,
  settings: GridSettings
): void {
  // Save the current context state
  ctx.save();
  
  // If the cell has a rotation, apply it
  if (cell.rotation !== 0) {
    const centerX = cell.x + cell.width / 2;
    const centerY = cell.y + cell.height / 2;
    
    ctx.translate(centerX, centerY);
    ctx.rotate((cell.rotation * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);
  }
  
  // Draw the cell content from the source canvas
  ctx.drawImage(
    sourceCanvas,
    cell.x, cell.y, cell.width, cell.height,
    cell.x, cell.y, cell.width, cell.height
  );
  
  // If the cell has children, render them instead of the cell itself
  if (cell.children.length > 0) {
    // Clear what we just drew for this cell
    ctx.clearRect(cell.x, cell.y, cell.width, cell.height);
    
    // Draw each child cell
    for (const childCell of cell.children) {
      renderGridCell(ctx, childCell, sourceCanvas, settings);
    }
  }
  
  // Restore the context state
  ctx.restore();
} 