"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

// --- CONFIGURATION ---
const WS_URL = "ws://10.10.12.174:8080/BetaVoltHome/";
const USER_AUDIO_SAMPLE_RATE = 16000;
const AI_SAMPLE_RATE = 24000;

interface Message {
  text: string;
  isUser: boolean;
}

type SupportView = "call";

interface ChatbotWidgetProps {
  onRegisterWSSend?: (sendFn: (msg: string) => boolean) => void;
  onDeviceSignal?: (deviceId: string, action: "turn_on" | "turn_off") => void;
}

export function ChatbotWidget({ onRegisterWSSend, onDeviceSignal }: ChatbotWidgetProps) {
  // --- UI STATE ---
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [view, setView] = useState<SupportView>("call");
  const [hasUnread, setHasUnread] = useState(false); // Demo notification badge

  // Keep onDeviceSignal in a ref so the WS onmessage handler always has the latest version
  const onDeviceSignalRef = useRef(onDeviceSignal);
  useEffect(() => { onDeviceSignalRef.current = onDeviceSignal; }, [onDeviceSignal]);

  // --- CHAT STATE ---
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const callMessagesEndRef = useRef<HTMLDivElement>(null);

  // --- CALL STATE ---
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);

  // --- REFS ---
  const webSocket = useRef<WebSocket | null>(null);
  const mediaStream = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamInterval = useRef<NodeJS.Timeout | null>(null);

  const userAudioContext = useRef<AudioContext | null>(null);
  const userAudioProcessor = useRef<ScriptProcessorNode | null>(null);
  const aiAudioContext = useRef<AudioContext | null>(null);
  const nextStartTime = useRef(0);

  const ringingInterval = useRef<NodeJS.Timeout | null>(null);
  const ringingAudioCtx = useRef<AudioContext | null>(null);

  // ------------------------------------------------------------------
  // AUDIO: Ringing Tone
  // ------------------------------------------------------------------
  const playRingingTone = () => {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!ringingAudioCtx.current) ringingAudioCtx.current = new Ctx();
    const ctx = ringingAudioCtx.current;
    if (!ctx) return;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.frequency.value = 440;
    osc2.frequency.value = 480;
    osc1.type = "sine";
    osc2.type = "sine";

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.5, now + 0.1);
    gain.gain.setValueAtTime(0.9, now + 0.4);
    gain.gain.linearRampToValueAtTime(0, now + 0.9);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.6);
    osc2.stop(now + 0.6);
  };

  // ------------------------------------------------------------------
  // AUDIO: Connection Beep
  // ------------------------------------------------------------------
  const playConnectedSound = () => {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(1000, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  };

  // ------------------------------------------------------------------
  // LOGIC: Stop Call
  // ------------------------------------------------------------------
  const stopCall = useCallback(() => {
    if (ringingInterval.current) clearInterval(ringingInterval.current);
    if (ringingAudioCtx.current) {
      ringingAudioCtx.current.close();
      ringingAudioCtx.current = null;
    }
    if (streamInterval.current) clearInterval(streamInterval.current);
    if (webSocket.current?.readyState === WebSocket.OPEN) webSocket.current.close();
    if (mediaStream.current) mediaStream.current.getTracks().forEach((t) => t.stop());
    if (userAudioProcessor.current) userAudioProcessor.current.disconnect();
    if (userAudioContext.current?.state !== "closed") userAudioContext.current?.close();
    if (aiAudioContext.current?.state !== "closed") aiAudioContext.current?.close();

    webSocket.current = null;
    mediaStream.current = null;
    nextStartTime.current = 0;

    setConnectionStatus("Disconnected");
    setIsAiSpeaking(false);
  }, []);

  // ------------------------------------------------------------------
  // LOGIC: Send Video Frame
  // ------------------------------------------------------------------
  const sendVideoFrame = useCallback(() => {
    if (
      webSocket.current?.readyState === WebSocket.OPEN &&
      videoRef.current &&
      canvasRef.current
    ) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video.readyState < 3) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Data = canvas.toDataURL("image/jpeg", 0.7).split(",")[1];
        webSocket.current.send(JSON.stringify({ type: "video", data: base64Data }));
      }
    }
  }, []);

  // ------------------------------------------------------------------
  // LOGIC: Play AI Audio Chunk  (robust scheduler — no gaps / crackling)
  // ------------------------------------------------------------------
  const pendingSources = useRef<AudioBufferSourceNode[]>([]);
  const speakingTimer = useRef<NodeJS.Timeout | null>(null);

  const playAudioChunk = useCallback((base64Data: string) => {
    try {
      if (!aiAudioContext.current) return;

      // Resume context if suspended (browser autoplay policy)
      if (aiAudioContext.current.state === "suspended") {
        aiAudioContext.current.resume();
      }

      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      const int16Data = new Int16Array(bytes.buffer);
      const float32Data = new Float32Array(int16Data.length);
      for (let i = 0; i < int16Data.length; i++) float32Data[i] = int16Data[i] / 32768.0;

      const buffer = aiAudioContext.current.createBuffer(1, float32Data.length, AI_SAMPLE_RATE);
      buffer.copyToChannel(float32Data, 0);

      const source = aiAudioContext.current.createBufferSource();
      source.buffer = buffer;
      source.connect(aiAudioContext.current.destination);

      const ctx = aiAudioContext.current;
      const now = ctx.currentTime;

      // Jitter buffer: keep at least 100ms ahead to absorb network jitter
      const JITTER_BUFFER = 0.1;
      if (nextStartTime.current < now + JITTER_BUFFER) {
        nextStartTime.current = now + JITTER_BUFFER;
      }

      source.start(nextStartTime.current);
      nextStartTime.current += buffer.duration;

      // Track pending sources so we know when speech truly ends
      pendingSources.current.push(source);
      setIsAiSpeaking(true);

      source.onended = () => {
        pendingSources.current = pendingSources.current.filter((s) => s !== source);
        // Only mark as not speaking when ALL queued chunks have finished
        if (pendingSources.current.length === 0) {
          if (speakingTimer.current) clearTimeout(speakingTimer.current);
          speakingTimer.current = setTimeout(() => setIsAiSpeaking(false), 200);
        }
      };
    } catch (e) {
      console.error("playAudioChunk error:", e);
    }
  }, []);


  // ------------------------------------------------------------------
  // LOGIC: Start Call
  // ------------------------------------------------------------------
  const startCall = useCallback(async () => {
    try {
      setConnectionStatus("Calling...");
      playRingingTone();
      ringingInterval.current = setInterval(playRingingTone, 2000);

      mediaStream.current = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: USER_AUDIO_SAMPLE_RATE },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream.current;
        videoRef.current.play();
      }

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      aiAudioContext.current = new AudioCtx({ sampleRate: AI_SAMPLE_RATE });

      webSocket.current = new WebSocket(WS_URL);

      webSocket.current.onopen = () => {
        if (ringingInterval.current) clearInterval(ringingInterval.current);
        if (ringingAudioCtx.current) {
          ringingAudioCtx.current.close().catch(console.error);
          ringingAudioCtx.current = null;
        }
        playConnectedSound();
        setConnectionStatus("Connected");
        streamInterval.current = setInterval(sendVideoFrame, 150);

        if (mediaStream.current) {
          userAudioContext.current = new AudioCtx({ sampleRate: USER_AUDIO_SAMPLE_RATE });
          const source = userAudioContext.current.createMediaStreamSource(mediaStream.current);
          userAudioProcessor.current = userAudioContext.current.createScriptProcessor(4096, 1, 1);
          source.connect(userAudioProcessor.current);
          userAudioProcessor.current.connect(userAudioContext.current.destination);

          userAudioProcessor.current.onaudioprocess = (e) => {
            if (webSocket.current?.readyState === WebSocket.OPEN) {
              const input = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(input.length);
              for (let i = 0; i < input.length; i++) {
                const s = Math.max(-1, Math.min(1, input[i]));
                int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
              }
              // Safe chunked btoa — avoids call stack overflow on large buffers
              const bytes = new Uint8Array(int16.buffer);
              let binary = "";
              const chunkSize = 8192;
              for (let i = 0; i < bytes.length; i += chunkSize) {
                binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
              }
              const b64 = btoa(binary);
              console.log(`[chatbot-ws] USER audio chunk sent — ${bytes.length} bytes`);
              webSocket.current?.send(JSON.stringify({ type: "audio", data: b64 }));
            }
          };
        }
      };

      webSocket.current.onmessage = (event) => {
        // Log every raw message from the AI backend
        console.log("[chatbot-ws] RAW message received:", event.data);
        try {
          const msg = JSON.parse(event.data);
          console.log("[chatbot-ws] Parsed type:", msg.type);

          if (msg.type === "audio") {
            playAudioChunk(msg.data);
          } else if (msg.type === "text") {
            console.log("[chatbot-ws] Text from AI:", msg.data);
            setMessages((prev) => [...prev, { text: msg.data, isUser: false }]);
          } else if (msg.type === "device_signal") {
            const { device_id, device_name, action, reason } = msg.data;
            console.log(`[chatbot-ws] Device signal — ${action} "${device_name}" (${device_id}). Reason: ${reason}`);
            if (action === "turn_on" || action === "turn_off") {
              onDeviceSignalRef.current?.(device_id, action);
            }
          }
        } catch (e) {
          console.warn("[chatbot-ws] Failed to parse message:", e);
        }
      };

      webSocket.current.onclose = () => {
        setConnectionStatus("Disconnected");
        console.log("[chatbot-ws] WebSocket closed.");
      };

      webSocket.current.onerror = (err) => {
        console.error("WebSocket error:", err);
        setConnectionStatus("Error");
        stopCall();
      };
    } catch (err) {
      console.error("startCall failed:", err);
      setConnectionStatus("Failed");
      if (ringingInterval.current) clearInterval(ringingInterval.current);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sendVideoFrame, stopCall]);


  // --- REGISTER WS SEND with parent ---
  // Returns true if WS was open and message was sent, false otherwise
  const wsSendFn = useCallback((msg: string): boolean => {
    if (webSocket.current?.readyState === WebSocket.OPEN) {
      webSocket.current.send(JSON.stringify({ type: "text", data: msg }));
      console.log("[chatbot-ws] Injected message via existing WS:", msg);
      return true;
    }
    console.log("[chatbot-ws] WS not open — message not sent");
    return false;
  }, []);

  useEffect(() => {
    if (onRegisterWSSend) onRegisterWSSend(wsSendFn);
  }, [onRegisterWSSend, wsSendFn]);

  // --- SEND MESSAGE ---
  const handleSend = () => {
    if (!inputValue.trim()) return;
    setMessages((prev) => [...prev, { text: inputValue, isUser: true }]);
    const txtToSend = inputValue;
    setInputValue("");

    if (webSocket.current?.readyState === WebSocket.OPEN) {
      console.log("[chatbot-ws] USER text sent:", txtToSend);
      webSocket.current.send(JSON.stringify({ type: "text", data: txtToSend }));
    }
  };


  // Open the modal AND start the call — only on explicit user click
  const openSupport = () => {
    setView("call");
    setIsChatOpen(true);
    setHasUnread(false);
    startCall();
  };
  const closeModal = () => {
    setIsChatOpen(false);
    stopCall();
  };

  useEffect(() => {
    if (view === "call") callMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, view]);

  return (
    <>
      {/* FLOATING BUTTON */}
      {!isChatOpen && (
        <button
          onClick={openSupport}
          aria-label="Open AI voice assistant"
          className="fixed bottom-7 right-7 z-[9999] w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center transition-all hover:scale-105 hover:shadow-xl"
        >
          {hasUnread && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-background">
              1
            </span>
          )}
          {/* Microphone SVG */}
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" x2="12" y1="19" y2="22"/>
          </svg>
        </button>
      )}

      {/* MODAL */}
      {isChatOpen && (
        <div
          className="fixed inset-0 flex items-end justify-end p-5 z-[9999]"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div
            className="w-[340px] h-[550px] bg-background rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom border"
          >
            {/* HEADER */}
            <div className="bg-primary text-primary-foreground px-5 py-4 font-semibold flex justify-between items-center text-[15px]">
              <div className="flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <span>AI Voice Agent</span>
              </div>
              <button
                onClick={closeModal}
                className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* VIEW 2: CALL */}
            {view === "call" && (
              <div className="flex-1 flex flex-col relative text-foreground overflow-hidden bg-card">
                <video ref={videoRef} playsInline muted style={{ display: "none" }} />
                <canvas ref={canvasRef} style={{ display: "none" }} />

                {/* AI Visualizer */}
                <div className="flex-none flex flex-col items-center pt-8 pb-4">
                  <div
                    className="w-[90px] h-[90px] rounded-full flex items-center justify-center text-4xl transition-all duration-300"
                    style={{
                      background: isAiSpeaking ? "hsl(var(--primary)/0.2)" : "hsl(var(--primary)/0.1)",
                      boxShadow: isAiSpeaking
                        ? "0 0 0 12px hsl(var(--primary)/0.15), 0 0 0 24px hsl(var(--primary)/0.05)"
                        : "0 0 0 8px hsl(var(--primary)/0.05)",
                    }}
                  >
                    🤖
                  </div>
                  <h3 className="mt-6 font-semibold text-lg text-foreground">
                    BetaVolt Assistant
                  </h3>
                  <p className="opacity-70 text-sm mt-1">
                    {connectionStatus}
                  </p>
                </div>

                {/* In-call chat messages */}
                <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-2">
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`px-3 py-2 rounded-xl text-[13px] max-w-[85%] shadow-sm ${
                        msg.isUser
                          ? "self-end bg-primary text-primary-foreground ml-4"
                          : "self-start bg-muted text-muted-foreground mr-4"
                      }`}
                    >
                      {msg.text}
                    </div>
                  ))}
                  <div ref={callMessagesEndRef} />
                </div>

                {/* Input + End Call */}
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex bg-muted rounded-full p-1 pl-4 items-center border">
                    <input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSend()}
                      placeholder="Type a message..."
                      className="flex-1 bg-transparent border-none outline-none text-foreground text-[14px] placeholder:text-muted-foreground"
                    />
                    <button
                      onClick={handleSend}
                      className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold transition-transform hover:scale-105"
                    >
                      ↑
                    </button>
                  </div>

                  {/* End Call */}
                  <div className="flex justify-center mt-2">
                    <button
                      onClick={() => {
                        stopCall();
                        setView("call"); // Not switching view anymore, just stays in call (ended)
                      }}
                      className="w-14 h-14 rounded-full bg-destructive border-none cursor-pointer flex items-center justify-center shadow-md hover:scale-105 transition-transform"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                        <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}
