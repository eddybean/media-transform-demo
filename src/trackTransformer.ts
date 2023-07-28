import jsQR, { QRCode } from 'jsqr';

const qrLineMargin = 6;
const qrLineWidth = 6;
const qrLineColor = 'red';
const qrTextFont = '28px Arial';

export class MediaStreamTrackTransformer {
  canvas: OffscreenCanvas;
  ctx: OffscreenCanvasRenderingContext2D;

  constructor() {
    this.canvas = new OffscreenCanvas(1, 1);
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
  }

  setupTransformer(videoTrack: MediaStreamVideoTrack) {
    const self = this;
    const trackProcessor = new MediaStreamTrackProcessor({ track: videoTrack });
    const trackGenerator = new MediaStreamTrackGenerator({ kind: 'video' });

    const transformer = new TransformStream({
      async transform(videoFrame, controller) {
        const newFrame = await self.processingReadQR(videoFrame);
        videoFrame.close();
        controller.enqueue(newFrame);
      },
    });

    trackProcessor.readable
      .pipeThrough(transformer)
      .pipeTo(trackGenerator.writable);

    return new MediaStream([trackGenerator]);
  }

  async processingReadQR(videoFrame: VideoFrame) {
    const timestamp = videoFrame.timestamp;
    const bitmap = await createImageBitmap(videoFrame);
    const { width, height } = {
      width: videoFrame.displayWidth,
      height: videoFrame.displayHeight,
    };

    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const code = jsQR(
      this.ctx.getImageData(0, 0, width, height).data,
      width,
      height,
    );
    if (code) {
      this.drawQRRectangle(code);
    }

    const newBitmap = await createImageBitmap(this.canvas);
    return new VideoFrame(newBitmap, { timestamp });
  }

  drawQRRectangle(code: QRCode) {
    this.ctx.strokeStyle = qrLineColor;
    this.ctx.fillStyle = qrLineColor;
    this.ctx.lineWidth = qrLineWidth;
    this.ctx.font = qrTextFont;

    this.ctx.fillText(
      code.data,
      code.location.topLeftCorner.x - qrLineMargin * 2,
      code.location.topLeftCorner.y - qrLineMargin * 3,
    );

    this.ctx.beginPath();
    this.ctx.moveTo(
      code.location.topLeftCorner.x - qrLineMargin,
      code.location.topLeftCorner.y - qrLineMargin,
    );
    this.ctx.lineTo(
      code.location.topRightCorner.x + qrLineMargin,
      code.location.topRightCorner.y - qrLineMargin,
    );
    this.ctx.lineTo(
      code.location.bottomRightCorner.x + qrLineMargin,
      code.location.bottomRightCorner.y + qrLineMargin,
    );
    this.ctx.lineTo(
      code.location.bottomLeftCorner.x - qrLineMargin,
      code.location.bottomLeftCorner.y + qrLineMargin,
    );
    this.ctx.closePath();

    this.ctx.stroke();
  }
}
