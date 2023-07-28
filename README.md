# Media Transform Demo

このDemoアプリは[`MediaStreamTrack`](https://developer.mozilla.org/docs/Web/API/MediaStreamTrack)を利用して映像ストリームからQRコードを検出し、検出結果を直接映像に描画しています。<br>
加工した映像ストリームはWebRTCの(擬似的な)P2P接続により同一ページ内で配信&受信しています。

(DeepL)<br>
This Demo app uses [`MediaStreamTrack`](https://developer.mozilla.org/docs/Web/API/MediaStreamTrack) to detect QR codes from the video stream and draws the detection result directly on the video.<br>
The processed video stream is delivered and received in the same page using WebRTC's (pseudo) P2P connection.

## Dependency

See `package.json`

## Setup

```
npm install
```

## Usage

```
npm run dev
```

## License

This software is released under the MIT License, see LICENSE.

## Authors

[@eddybean](https://github.com/eddybean)

## References

https://developer.chrome.com/articles/mediastreamtrack-insertable-media-processing/
