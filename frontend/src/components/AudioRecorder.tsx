import React, { useState, useRef, useEffect } from 'react';

const AudioRecorder: React.FC = () => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  useEffect(() => {
    // გაწმენდა: წინა URL-ების გაუქმება
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // ჩაწერის დაწყება
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
              }
          setAudioBlob(event.data); // ინახავს ჩაწერილ ხმას
          const newAudioUrl = URL.createObjectURL(event.data);
          setAudioUrl(newAudioUrl); // დააყენეთ ახალი URL
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording: ", error);
    }
  };

  // ჩაწერის გაჩერება
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
    }
    setIsRecording(false);
  };

  // აუდიოს ატვირთვა ბექენდზე
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
      {/* ჩაწერის დაწყება და გაჩერება */}
      <button onClick={isRecording ? stopRecording : startRecording}>
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>

      {/* აუდიო მოსმენის ელემენტი */}
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
