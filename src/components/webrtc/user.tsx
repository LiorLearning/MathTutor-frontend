'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Mic, MicOff, Video, VideoOff } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"

const UserVideo = () => {
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);
  const [isAudioOn, setIsAudioOn] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

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

  const connectWebSocket = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    ws.current = new WebSocket(`${process.env.NEXT_PUBLIC_WS_BASE_URL}/rtc/user`);

    ws.current.onopen = async () => {
      setIsConnected(true);
      
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

          // Process any queued ICE candidates
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
      setIsConnected(false);
      setTimeout(connectWebSocket, 1000);
    };
  }, []);

  const sendWebSocketMessage = (message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  const toggleAudio = async () => {
    const newAudioState = !isAudioOn;
    setIsAudioOn(newAudioState);

    // Notify admin about audio state change
    sendWebSocketMessage({ type: 'audio-toggle', state: newAudioState });

    // Clean up existing audio stream
    const cleanupAudioTracks = () => {
        if (localStream.current) {
            const audioTracks = localStream.current.getAudioTracks();
            audioTracks.forEach(track => {
                track.enabled = false;  // Immediately disable the track
                track.stop();  // Release the microphone
                localStream.current?.removeTrack(track);
            });
        }

        // Clean up peer connection tracks
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

    // If turning audio off, cleanup existing tracks
    if (!newAudioState) {
        cleanupAudioTracks();
        // Renegotiate connection to inform peer about removed track
        await createAndSendOffer();
        return;
    }

    // If turning audio back on, get new audio stream
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
            
            // Add new track to existing stream
            if (localStream.current) {
                localStream.current.addTrack(audioTrack);
            } else {
                localStream.current = new MediaStream([audioTrack]);
            }

            // Add new track to peer connection
            if (peerConnection.current) {
                peerConnection.current.addTrack(audioTrack, localStream.current);
                // Renegotiate connection
                await createAndSendOffer();
            }
        } catch (error) {
            console.error('Error restarting audio:', error);
            setIsAudioOn(false); // Revert state if failed
            cleanupAudioTracks(); // Ensure cleanup on error
            throw new Error(`Failed to start audio: ${error}`);
        }
    }
};

  const toggleVideo = async () => {
    const newVideoState = !isVideoOn;
    setIsVideoOn(newVideoState);

    // Notify admin about video state change
    sendWebSocketMessage({ type: 'video-toggle', state: newVideoState });

    // Clean up existing video stream
    const cleanupVideoTracks = () => {
        if (localStream.current) {
            const videoTracks = localStream.current.getVideoTracks();
            videoTracks.forEach(track => {
                track.enabled = false;  // Immediately disable the track
                track.stop();  // Release the camera
                localStream.current?.removeTrack(track);
            });
        }

        // Clean up peer connection tracks
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

        // Clear video element
        const videoElement = document.getElementById('user-video') as HTMLVideoElement;
        if (videoElement && videoElement.srcObject) {
            videoElement.srcObject = null;
        }
    };

    // If turning video off, cleanup existing tracks
    if (!newVideoState) {
        cleanupVideoTracks();
        // Renegotiate connection to inform peer about removed track
        await createAndSendOffer();
        return;
    }

    // If turning video back on, get new video stream
    if (newVideoState) {
        try {
            const newStream = await navigator.mediaDevices.getUserMedia({ 
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            const videoTrack = newStream.getVideoTracks()[0];
            
            // Add new track to existing stream
            if (localStream.current) {
                localStream.current.addTrack(videoTrack);
            } else {
                localStream.current = new MediaStream([videoTrack]);
            }

            // Update video element
            const videoElement = document.getElementById('user-video') as HTMLVideoElement;
            if (videoElement) {
                videoElement.srcObject = localStream.current;
            }

            // Add new track to peer connection
            if (peerConnection.current) {
                peerConnection.current.addTrack(videoTrack, localStream.current);
                // Renegotiate connection
                await createAndSendOffer();
            }
        } catch (error) {
            console.error('Error restarting video:', error);
            setIsVideoOn(false); // Revert state if failed
            cleanupVideoTracks(); // Ensure cleanup on error
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
    <div className="flex flex-col items-center justify-center p-1">
      <div className="w-full max-w-[90%] bg-white rounded-lg shadow overflow-hidden">
        <div className="relative aspect-video bg-gray-900">
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
              <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-2xl text-white">ME</span>
              </div>
            </div>
          )}
          <div className="absolute bottom-[2%] left-1/2 transform -translate-x-1/2 flex space-x-8">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="bg-gray-900 bg-opacity-50 hover:bg-opacity-75 text-white rounded-full"
                    onClick={toggleAudio}
                  >
                    {isAudioOn ? <Mic className="h-3 w-3" /> : <MicOff className="h-3 w-3" />}
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
                    className="bg-gray-900 bg-opacity-50 hover:bg-opacity-75 text-white rounded-full"
                    onClick={toggleVideo}
                  >
                    {isVideoOn ? <Video className="h-3 w-3" /> : <VideoOff className="h-3 w-3" />}
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
    </div>
  )
};

export default UserVideo;