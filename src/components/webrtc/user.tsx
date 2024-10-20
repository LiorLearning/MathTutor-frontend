'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Mic, MicOff, Video, VideoOff } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"

// Define type for WebSocket messages
type WebSocketMessage = {
  type: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  state?: boolean;
};

const UserVideo: React.FC<{ username: string; style?: React.CSSProperties }> = ({ username, style }) => {
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);
  const [isAudioOn, setIsAudioOn] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);

  const startMedia = async () => {
    try {
      // Ensure at least one of audio or video is requested
      if (!isAudioOn && !isVideoOn) {
        console.warn('Neither audio nor video is enabled. No media will be requested.');
        return null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoOn,
        audio: isAudioOn
      });
      
      localStream.current = stream;
      
      const videoElement = document.getElementById('user-video') as HTMLVideoElement;
      if (videoElement) {
        videoElement.srcObject = stream;
      }

      if (peerConnection.current) {
        stream.getTracks().forEach(track => {
          if (peerConnection.current) {
            peerConnection.current.addTrack(track, stream);
          }
        });
      }
      
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      return null;
    }
  };

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendWebSocketMessage({ type: 'ice-candidate', candidate: event.candidate });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", pc.iceConnectionState);
    };

    return pc;
  }, []);

  const createAndSendOffer = async () => {
    if (!peerConnection.current) return;

    try {
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      sendWebSocketMessage({ type: 'offer', offer });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  const handleIncomingOffer = async (offer: RTCSessionDescriptionInit) => {
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    peerConnection.current = createPeerConnection();
    await startMedia();
    
    try {
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      sendWebSocketMessage({ type: 'answer', answer });

      while (iceCandidatesQueue.current.length) {
        const candidate = iceCandidatesQueue.current.shift();
        if (candidate) {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      }
    } catch (error) {
      console.error('Error handling incoming offer:', error);
    }
  };

  const sendWebSocketMessage = (message: WebSocketMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  const connectWebSocket = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    ws.current = new WebSocket(`${process.env.NEXT_PUBLIC_WS_BASE_URL}/rtc/user/${username}`);

    ws.current.onopen = async () => {
      await startMedia();
      await createAndSendOffer();
    };

    ws.current.onmessage = async (message) => {
      const data = JSON.parse(message.data);

      if (data.type === 'offer') {
        await handleIncomingOffer(data.offer);
      } else if (data.type === 'answer') {
        console.log('Received answer:', data.answer);
        if (peerConnection.current && peerConnection.current.signalingState === 'have-local-offer') {
          console.log('Setting remote description with answer');
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.answer));

          while (iceCandidatesQueue.current.length) {
            const candidate = iceCandidatesQueue.current.shift();
            if (candidate) {
              console.log('Adding ICE candidate from queue:', candidate);
              await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
            }
          }
        } else {
          console.warn('Received answer in unexpected state:', peerConnection.current?.signalingState);
        }
      } else if (data.type === 'ice-candidate') {
        console.log('Received ICE candidate:', data.candidate);
        if (peerConnection.current?.remoteDescription) {
          console.log('Adding ICE candidate to peer connection:', data.candidate);
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } else {
          console.log('Queueing ICE candidate as remote description is not set:', data.candidate);
          iceCandidatesQueue.current.push(data.candidate);
        }
      } else if (data.type === 'request-stream') {
        await startMedia();
        await createAndSendOffer();
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.current.onclose = () => {
      setTimeout(connectWebSocket, 1000);
    };
  }, []);

  
  const toggleAudio = async () => {
    const newAudioState = !isAudioOn;
    setIsAudioOn(newAudioState);

    sendWebSocketMessage({ type: 'audio-toggle', state: newAudioState });

    const cleanupAudioTracks = () => {
        if (localStream.current) {
            const audioTracks = localStream.current.getAudioTracks();
            audioTracks.forEach(track => {
                track.enabled = false;
                track.stop();
                localStream.current?.removeTrack(track);
            });
        }

        if (peerConnection.current) {
            peerConnection.current.getSenders()
                .filter(sender => sender.track?.kind === 'audio')
                .forEach(sender => {
                    if (sender.track) {
                        sender.track.enabled = false;
                        sender.track.stop();
                        peerConnection.current?.removeTrack(sender);
                    }
                });
        }
    };

    if (!newAudioState) {
        cleanupAudioTracks();
        await createAndSendOffer();
        return;
    }

    if (newAudioState) {
        try {
            const newStream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            const audioTrack = newStream.getAudioTracks()[0];
            
            if (localStream.current) {
                localStream.current.addTrack(audioTrack);
            } else {
                localStream.current = new MediaStream([audioTrack]);
            }

            if (peerConnection.current) {
                peerConnection.current.addTrack(audioTrack, localStream.current);
                await createAndSendOffer();
            }
        } catch (error) {
            console.error('Error restarting audio:', error);
            setIsAudioOn(false);
            cleanupAudioTracks();
            throw new Error(`Failed to start audio: ${error}`);
        }
    }
};

  const toggleVideo = async () => {
    const newVideoState = !isVideoOn;
    setIsVideoOn(newVideoState);

    sendWebSocketMessage({ type: 'video-toggle', state: newVideoState });

    const cleanupVideoTracks = () => {
        if (localStream.current) {
            const videoTracks = localStream.current.getVideoTracks();
            videoTracks.forEach(track => {
                track.enabled = false;
                track.stop();
                localStream.current?.removeTrack(track);
            });
        }

        if (peerConnection.current) {
            peerConnection.current.getSenders()
                .filter(sender => sender.track?.kind === 'video')
                .forEach(sender => {
                    if (sender.track) {
                        sender.track.enabled = false;
                        sender.track.stop();
                        peerConnection.current?.removeTrack(sender);
                    }
                });
        }

        const videoElement = document.getElementById('user-video') as HTMLVideoElement;
        if (videoElement && videoElement.srcObject) {
            videoElement.srcObject = null;
        }
    };

    if (!newVideoState) {
        cleanupVideoTracks();
        await createAndSendOffer();
        return;
    }

    if (newVideoState) {
        try {
            const newStream = await navigator.mediaDevices.getUserMedia({ 
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            const videoTrack = newStream.getVideoTracks()[0];
            
            if (localStream.current) {
                localStream.current.addTrack(videoTrack);
            } else {
                localStream.current = new MediaStream([videoTrack]);
            }

            const videoElement = document.getElementById('user-video') as HTMLVideoElement;
            if (videoElement) {
                videoElement.srcObject = localStream.current;
            }

            if (peerConnection.current) {
                peerConnection.current.addTrack(videoTrack, localStream.current);
                await createAndSendOffer();
            }
        } catch (error) {
            console.error('Error restarting video:', error);
            setIsVideoOn(false);
            cleanupVideoTracks();
        }
    }
};

  useEffect(() => {
    peerConnection.current = createPeerConnection();
    connectWebSocket();

    return () => {
      if (localStream.current) {
        localStream.current.getTracks().forEach(track => track.stop());
      }
      peerConnection.current?.close();
      ws.current?.close();
    };
  }, [createPeerConnection, connectWebSocket]);

  return (
    <div className="w-full h-full bg-card rounded-lg shadow-lg overflow-hidden flex flex-col" style={style}>
      <div className="relative aspect-video bg-muted flex-grow">
        <video
          id="user-video"
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${isVideoOn ? "" : "hidden"}`}
          style={{ transform: "scaleX(-1)" }}
        />
        {!isVideoOn && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 lg:w-20 lg:h-20 bg-muted-foreground rounded-full flex items-center justify-center">
              <span className="text-lg lg:text-2xl text-primary-foreground">{username[0]}</span>
            </div>
          </div>
        )}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-background/50 hover:bg-background/75 rounded-full w-8 h-8"
                  onClick={toggleAudio}
                >
                  {isAudioOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isAudioOn ? "Turn off mic" : "Turn on mic"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-background/50 hover:bg-background/75 rounded-full w-8 h-8"
                  onClick={toggleVideo}
                >
                  {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isVideoOn ? "Turn off cam" : "Turn on cam"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};

export default UserVideo;