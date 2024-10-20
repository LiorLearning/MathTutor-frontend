'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react';

// Define type for WebSocket messages
type WebSocketMessage = {
  type: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  state?: boolean;
};

const AdminVideo: React.FC<{ username: string }> = ({ username }) => {
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const remoteStream = useRef<MediaStream | null>(null);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    pc.ontrack = (event) => {
      console.log("PC On track event received: ", event);
      const videoElement = document.getElementById('admin-video') as HTMLVideoElement | null;
      if (videoElement) {
        console.log("Admin video element found.");
        if (!remoteStream.current) {
          remoteStream.current = new MediaStream();
          console.log("Created new remote MediaStream.");
        }
        const trackExists = remoteStream.current.getTracks().some(track => track.id === event.track.id);
        if (!trackExists) {
          remoteStream.current.addTrack(event.track);
          console.log("Added new track to remote stream:", event.track);
        } else {
          console.log("Track already exists in remote stream:", event.track);
        }
        videoElement.srcObject = remoteStream.current;
        console.log("Set remote stream as video element's source object.");
        
        videoElement.onloadedmetadata = () => {
          videoElement.play().catch(e => console.error('Error playing video:', e));
          console.log("Video metadata loaded, attempting to play video.");
        };
      } else {
        console.warn("Admin video element not found.");
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendWebSocketMessage({ 
          type: 'ice-candidate', 
          candidate: event.candidate 
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state changed:", pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed') {
        console.log("ICE connection failed, restarting...");
        pc.restartIce();
      }
    };

    return pc;
  }, []);

  const connectWebSocket = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    ws.current = new WebSocket(`${process.env.NEXT_PUBLIC_WS_BASE_URL}/rtc/admin/${username}`);

    ws.current.onopen = async () => {
      console.log("WebSocket connection opened");
      await requestUserStream();
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.current.onclose = () => {
      console.log("WebSocket connection closed");
      setTimeout(connectWebSocket, 2000);
    };

    ws.current.onmessage = async (message) => {
      try {
        const data = JSON.parse(message.data);
        await handleWebSocketMessage(data);
      } catch (error) {
        console.error('Error handling message:', error);
      }
    };
  }, []);

  const handleWebSocketMessage = async (data: any) => {
    try {
      if (data.type === 'answer') {
        await handleAnswer(data.answer);
      } else if (data.type === 'ice-candidate') {
        await handleIceCandidate(data.candidate);
      } else if (data.type === 'offer') {
        await handleIncomingOffer(data.offer);
      } else if (data.type === 'audio-toggle') {
        toggleAudio(data.state);
      } else if (data.type === 'video-toggle') {
        toggleVideo(data.state);
      }
    } catch (error) {
      console.error('Error in handleWebSocketMessage:', error);
    }
  };

  const requestUserStream = async () => {
    console.log("Requesting user stream");
    sendWebSocketMessage({ type: 'request-stream' });
  };

  const createAndSendOffer = async () => {
    if (!peerConnection.current) return;

    try {
      const offer = await peerConnection.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await peerConnection.current.setLocalDescription(offer);
      sendWebSocketMessage({ type: 'offer', offer });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    try {
      if (peerConnection.current && peerConnection.current.signalingState !== 'stable') {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
        console.log("Remote description set successfully");

        while (iceCandidatesQueue.current.length) {
          const candidate = iceCandidatesQueue.current.shift();
          if (candidate) {
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
            console.log("Queued ICE candidate added");
          }
        }
      } else {
        console.warn('Received answer in unexpected state:', peerConnection.current?.signalingState);
      }
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    try {
      if (peerConnection.current?.remoteDescription) {
        console.log('Adding ICE candidate:', candidate);
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        console.log('Queueing ICE candidate:', candidate);
        iceCandidatesQueue.current.push(candidate);
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  };

  const handleIncomingOffer = async (offer: RTCSessionDescriptionInit) => {
    console.log("Handling incoming offer");
    if (peerConnection.current) {
      remoteStream.current?.getTracks().forEach(track => track.stop());
      peerConnection.current.close();
    }

    peerConnection.current = createPeerConnection();
    remoteStream.current = null;

    try {
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
      console.log("Remote description set for incoming offer");
      
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      console.log("Local description set for answer");
      
      sendWebSocketMessage({ type: 'answer', answer });

      while (iceCandidatesQueue.current.length) {
        const candidate = iceCandidatesQueue.current.shift();
        if (candidate) {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
          console.log("Queued ICE candidate added for incoming offer");
        }
      }
    } catch (error) {
      console.error('Error handling incoming offer:', error);
    }
  };

  const sendWebSocketMessage = (message: WebSocketMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent:', message);
    }
  };

  const toggleAudio = (state?: boolean) => {
    const newState = state !== undefined ? state : !isAudioOn;
    setIsAudioOn(newState);
    const videoElement = document.getElementById('admin-video') as HTMLVideoElement;
    if (videoElement) {
      videoElement.muted = !newState;
    }
  };

  const toggleVideo = (state?: boolean) => {
    const newState = state !== undefined ? state : !isVideoOn;
    setIsVideoOn(newState);
    const videoElement = document.getElementById('admin-video') as HTMLVideoElement;
    if (videoElement) {
      videoElement.style.display = newState ? 'block' : 'none';
    }
  };

  useEffect(() => {
    peerConnection.current = createPeerConnection();
    connectWebSocket();

    return () => {
      if (remoteStream.current) {
        remoteStream.current.getTracks().forEach(track => track.stop());
      }
      if (peerConnection.current) {
        peerConnection.current.close();
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [createPeerConnection, connectWebSocket]);

  return (
    <div className="flex flex-col items-center justify-center p-1">
      <div className="w-full max-w-[90%] bg-white rounded-lg shadow overflow-hidden">
        <div className="relative aspect-video bg-gray-900">
          <video
            id="admin-video"
            autoPlay
            playsInline
            muted={!isAudioOn}
            className={`w-full h-full object-cover ${isVideoOn ? "" : "hidden"}`}
            style={{ transform: "scaleX(-1)" }}
          />
          {!isVideoOn && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-4xl text-white">JD</span>
              </div>
            </div>
          )}
          <div className="absolute top-4 left-4 bg-gray-900 bg-opacity-50 text-white px-2 py-1 rounded-md">
            Remote User
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminVideo;