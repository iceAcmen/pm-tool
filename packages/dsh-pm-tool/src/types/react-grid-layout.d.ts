/** react-grid-layout 无自带 TS 类型，这里声明本期用到的最小 API 面。 */
declare module 'react-grid-layout' {
  import type { ComponentType, ReactNode } from 'react'

  export interface Layout {
    i: string
    x: number
    y: number
    w: number
    h: number
    minW?: number
    minH?: number
    maxW?: number
    maxH?: number
    static?: boolean
    isDraggable?: boolean
    isResizable?: boolean
  }

  export interface GridLayoutProps {
    className?: string
    layout?: Layout[]
    cols?: number
    rowHeight?: number
    margin?: [number, number]
    width?: number
    isDraggable?: boolean
    isResizable?: boolean
    compactType?: 'vertical' | 'horizontal' | null
    onLayoutChange?: (layout: Layout[]) => void
    children?: ReactNode
    [key: string]: unknown
  }

  export const WidthProvider: (component: ComponentType<GridLayoutProps>) => ComponentType<GridLayoutProps>
  const RGL: ComponentType<GridLayoutProps>
  export default RGL
}
