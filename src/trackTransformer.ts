import BarcodeDetector from 'barcode-detector';

const qrLineWidth = 4;
const qrLineColor = 'red';
const qrTextFont = '26px Arial';

export class MediaStreamTrackTransformer {
  canvas: OffscreenCanvas;
  ctx: OffscreenCanvasRenderingContext2D;
  barcodeDetector: BarcodeDetector;

  constructor() {
    this.canvas = new OffscreenCanvas(1, 1);
    this.ctx = this.canvas.getContext('2d')!;
    this.barcodeDetector = new BarcodeDetector({
      formats: ['qr_code'],
    });
  }

  setupTransformer(videoTrack: MediaStreamVideoTrack) {
    const self = this;
    const trackProcessor = new MediaStreamTrackProcessor({ track: videoTrack });
    const trackGenerator = new MediaStreamTrackGenerator({ kind: 'video' });

    const transformer = new TransformStream({
      async transform(videoFrame, controller) {
        const newFrame = await self.processingDetectQR(videoFrame);
        controller.enqueue(newFrame);
      },
    });

    trackProcessor.readable
      .pipeThrough(transformer)
      .pipeTo(trackGenerator.writable);

    return new MediaStream([trackGenerator]);
  }

  async processingDetectQR(videoFrame: VideoFrame) {
    const timestamp = videoFrame.timestamp;
    const width = videoFrame.displayWidth;
    const height = videoFrame.displayHeight;
    const bitmap = await createImageBitmap(videoFrame);

    const detectedBarcodes = await this.barcodeDetector.detect(bitmap);
    // QRコードが検出されないときは元のVideoFrameをそのまま返す
    if (!detectedBarcodes.length) {
      bitmap.close();
      return videoFrame;
    }
    videoFrame.close();

    // videoFrameをCanvasへ描画する
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    await this.highlightBarcode(detectedBarcodes);

    const newBitmap = await createImageBitmap(this.canvas);
    return new VideoFrame(newBitmap, { timestamp });
  }

  async highlightBarcode(detectedBarcodes: any) {
    const floor = Math.floor;
    const ctx = this.ctx;
    ctx.strokeStyle = qrLineColor;
    ctx.fillStyle = qrLineColor;
    ctx.lineWidth = qrLineWidth;
    ctx.font = qrTextFont;

    detectedBarcodes.map((detectedBarcode: any) => {
      const { x, y, width, height } = detectedBarcode.boundingBox;
      ctx.strokeRect(floor(x), floor(y), floor(width), floor(height));
      const text = detectedBarcode.rawValue;
      const dimensions = ctx.measureText(text);
      ctx.fillText(
        text,
        floor(x + width / 2 - dimensions.width / 2),
        floor(y) + height + 20,
      );
    });
  }
}
