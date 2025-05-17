import { GridSettings } from './types';

export interface GridCell {
  x: number;
  y: number;
  width: number;
  height: number;
  settings: GridSettings;
}

export function createGrid(width: number, height: number, settings: GridSettings): GridCell[] {
  const cells: GridCell[] = [];
  const cellWidth = settings.cellSize;
  const cellHeight = settings.cellSize;

  for (let y = 0; y < height; y += cellHeight) {
    for (let x = 0; x < width; x += cellWidth) {
      cells.push({
        x,
        y,
        width: cellWidth,
        height: cellHeight,
        settings
      });
    }
  }

  return cells;
} 