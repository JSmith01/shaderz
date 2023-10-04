export async function passViaWebRTC(stream, bitrate) {
    let resultResolver;
    const result = new Promise(resolve => {
        resultResolver = resolve;
    });

    const [track] = stream.getVideoTracks();
    const pc1 = new RTCPeerConnection();
    const pc2 = new RTCPeerConnection();
    pc1.onicecandidate = e => pc2.addIceCandidate(e.candidate);
    pc2.onicecandidate = e => pc1.addIceCandidate(e.candidate);
    pc2.ontrack = e => { resultResolver(new MediaStream([e.track])); }
    const sender = pc1.addTrack(track);
    const params = sender.getParameters();
    params.encodings[0].maxBitrate = bitrate;
    await sender.setParameters(params);
    const offer = await pc1.createOffer();
    await pc1.setLocalDescription(offer);
    await pc2.setRemoteDescription(offer);
    const answer = await pc2.createAnswer();
    await pc2.setLocalDescription(answer);
    await pc1.setRemoteDescription(answer);

    return result;
}
