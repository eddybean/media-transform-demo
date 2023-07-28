import { MediaStreamTrackTransformer } from './trackTransformer';

(() => {
  if (
    !(
      'MediaStreamTrackProcessor' in window &&
      'MediaStreamTrackGenerator' in window
    )
  ) {
    return alert('Insertable streams for `MediaStreamTrack` is not supported.');
  }

  async function getLocalStream() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  }

  function showLocalVideo(stream: MediaStream) {
    const localVideo = document.getElementById(
      'local-video',
    ) as HTMLVideoElement;
    localVideo.srcObject = stream;
  }

  function onRemoteTrackEvent(e: RTCTrackEvent) {
    const remoteVideo = document.getElementById(
      'remote-video',
    ) as HTMLVideoElement;
    if (remoteVideo && remoteVideo.srcObject !== e.streams[0]) {
      remoteVideo.srcObject = e.streams[0];
      console.log('received remote stream', e.streams[0]);
    }
  }

  async function connectPeer() {
    const stream = await getLocalStream();
    const localPC = new RTCPeerConnection();
    const remotePC = new RTCPeerConnection();

    remotePC.addEventListener('track', onRemoteTrackEvent);

    if (stream) {
      showLocalVideo(stream);

      stream.getTracks().forEach((track) => {
        if (track.kind === 'video') {
          const transformer = new MediaStreamTrackTransformer();
          const transformStream = transformer.setupTransformer(
            track as MediaStreamVideoTrack,
          );
          localPC.addTrack(
            transformStream.getVideoTracks()[0],
            transformStream,
          );
        } else {
          localPC.addTrack(track, stream as MediaStream);
        }
      });
    }

    const offerDescription = await localPC.createOffer();
    await localPC.setLocalDescription(offerDescription);
    await remotePC.setRemoteDescription(offerDescription);

    remotePC.addEventListener('icecandidate', (e) => {
      if (e.candidate) {
        localPC.addIceCandidate(e.candidate);
      }
    });
    console.log(`sdp:\n${offerDescription.sdp}`);

    const answerDescription = await remotePC.createAnswer();
    await remotePC.setLocalDescription(answerDescription);
    await localPC.setRemoteDescription(answerDescription);

    localPC.addEventListener('icecandidate', (e) => {
      if (e.candidate) {
        remotePC.addIceCandidate(e.candidate);
      }
    });
  }

  const btnConnect = document.getElementById('btn-connect');
  if (btnConnect) {
    btnConnect.addEventListener('click', connectPeer, false);
  }
})();
