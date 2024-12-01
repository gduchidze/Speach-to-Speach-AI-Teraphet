import React, { useState, useRef, useEffect } from "react";
import { Bars } from "react-loader-spinner";
import { IMessages } from "../pages/Chatbot";
interface  AudioRecorderProps{
  setMessages: (obj:IMessages)=> void;
}
const AudioRecorder: React.FC<AudioRecorderProps> = ({setMessages}) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>("");

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [audioUrl]);

  const checkSilence = () => {
    if (analyserNodeRef.current && dataArrayRef.current) {
      analyserNodeRef.current.getByteTimeDomainData(dataArrayRef.current);
      const maxAmplitude = Math.max(...dataArrayRef.current);
      const silenceThreshold = 130;

      if (maxAmplitude < silenceThreshold) {
        if (!silenceTimeoutRef.current) {
          silenceTimeoutRef.current = setTimeout(() => {
            console.log("Silence detected, stopping recording...");
            stopRecording(true); // Pass true to auto-upload
          }, 2000);
        }
      } else {
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
      }

      requestAnimationFrame(checkSilence);
    }
  };

  const startRecording = async () => {
    try {
      setAudioBlob(null);
      setUploadStatus("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream);

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 2048;

      source.connect(analyserNode);
      analyserNodeRef.current = analyserNode;

      const dataArray = new Uint8Array(analyserNode.fftSize);
      dataArrayRef.current = dataArray;

      const audioChunks: BlobPart[] = [];
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        setAudioBlob(audioBlob);
        const newAudioUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(newAudioUrl);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      checkSilence();
    } catch (error) {
      console.error("Error starting recording: ", error);
      setUploadStatus("Error starting recording");
    }
  };

  const stopRecording = async (autoUpload: boolean = false) => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
      audioContextRef.current = null;
    }
    setIsRecording(false);

    // Auto-upload if specified or silence detected
    if (autoUpload) {
      await uploadAudio();
    }
  };

  const uploadAudio = async () => {
    if (!audioBlob) {
        setUploadStatus("No audio recorded");
        return;
    }

    const formData = new FormData();
    formData.append("audio_file", audioBlob, "recorded-audio.wav");

    console.log("the blob is",audioBlob);

    try {
        setUploadStatus("Uploading...");
        const response = await fetch("http://localhost:8000/continuous-response/", {
            method: "POST",
            body: formData,
        });
        const data = await response.json();
        console.log("Audio uploaded successfully:", data);

        setUploadStatus("Upload successful");
        send("ai", data?.text_response)
        // Play an audio notification
        // loading-true -> true -> no send voice -> takeresponsefunc-> talk-> loding false -> change url of audio
        
    } catch (error) {
        send("user", "Something went wrong")
        console.error("Error uploading audio:", error);
        setUploadStatus("Upload failed");
    }
};


  const send = (sender:string,text:string ) => {
    const userMessage: IMessages = { sender, text };
  
    // Use setMessages correctly
    setMessages(userMessage);
  };
  

  return (
    <div className="flex flex-col items-center justify-center gap-3 w-full">
        

      <button
        onClick={isRecording ? () => stopRecording() : startRecording}
        className="flex flex-col items-center"
      >
        {isRecording ? (
          <>
            <Bars
              height="30"
              width="30"
              color="#000"
              ariaLabel="bars-loading"
              wrapperStyle={{}}
              wrapperClass=""
              visible={true}
            />
          </>
        ) : (
          <>
            <img src="audio.png" alt="Start recording" className="w-9 h-9" />
          </>
        )}
      </button>

      {audioBlob && !isRecording && (
        <div className="flex flex-col items-center gap-2">
          <p>Recorded Audio:</p>
          <div className="flex gap-2 items-center">
            <img
              src="send.png"
              alt="Send voice"
              onClick={uploadAudio}
              className="w-8 h-8 cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
