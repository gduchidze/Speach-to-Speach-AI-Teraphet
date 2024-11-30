import React, { useState, useRef, useEffect } from 'react';

const AudioRecorder: React.FC = () => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(audioUrl);
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [audioUrl]);

  const checkSilence = () => {
    if (analyserNodeRef.current && dataArrayRef.current) {
      analyserNodeRef.current.getByteTimeDomainData(dataArrayRef.current);
      // მონაცემების მაქსიმალური ამპლიტუდის პოვნა
      const maxAmplitude = Math.max(...dataArrayRef.current);
      const silenceThreshold = 130; // სიჩუმის ზღურბლი
  
      // სიჩუმის შემოწმება
      if (maxAmplitude < silenceThreshold) {
        // თუ სიჩუმეა, დაიწყე ტაიმერი ჩაწერის გაჩერებისთვის
        if (!silenceTimeoutRef.current) {
          silenceTimeoutRef.current = setTimeout(() => {
            console.log("Silence detected, stopping recording...");
            stopRecording();
          }, 2000); // 2 წამის სიჩუმე
        }
      } else {
        // თუ ხმა კვლავ არის, ტაიმერი გააუქმე
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
      }
  
      // მონიტორინგი კვლავ განაგრძე
      requestAnimationFrame(checkSilence);
    }
  };
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream);
  
      // წინა ჩაწერის მონაცემების გასუფთავება
      setAudioBlob(null);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl); // წინა URL-ის გაუქმება
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
  
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioBlob(event.data); // ახალი ჩაწერის შენახვა
          const newAudioUrl = URL.createObjectURL(event.data);
          setAudioUrl(newAudioUrl); // ახალი URL-ის შექმნა
        }
      };
  
      mediaRecorderRef.current.start();
      setIsRecording(true);
      checkSilence();
    } catch (error) {
      console.error("Error starting recording: ", error);
    }
  };
  

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsRecording(false);
  };

  const uploadAudio = async () => {
    if (!audioBlob) {
      console.error("No audio recorded");
      return;
    }

    const formData = new FormData();
    formData.append("audio", audioBlob, "recorded-audio.wav");

    try {
      const response = await fetch('http://localhost:5000/upload_audio', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      console.log("Audio uploaded successfully:", data);
    } catch (error) {
      console.error("Error uploading audio:", error);
    }
  };

  return (
    <div>
      <button onClick={isRecording ? stopRecording : startRecording}>
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>
      {audioBlob && !isRecording && (
        <div>
          <audio controls>
            <source src={URL.createObjectURL(audioBlob)} type="audio/wav" />
            Your browser does not support the audio element.
          </audio>
          <button onClick={uploadAudio}>Upload Audio</button>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
