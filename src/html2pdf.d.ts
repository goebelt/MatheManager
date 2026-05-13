declare module 'html2canvas' {
  interface Html2CanvasOptions {
    scale?: number;
    useCORS?: boolean;
    allowTaint?: boolean;
    backgroundColor?: string | null;
    logging?: boolean;
    width?: number;
    height?: number;
    windowWidth?: number;
    windowHeight?: number;
    onclone?: (clonedDoc: Document, clonedElement: HTMLElement) => void;
  }

  function html2canvas(element: HTMLElement, options?: Html2CanvasOptions): Promise<HTMLCanvasElement>;
  export default html2canvas;
}
