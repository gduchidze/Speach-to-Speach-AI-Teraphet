import React, { useEffect, useRef } from "react";

interface CameraComponentProps {
  onCapture: (imageBlob: Blob) => void; 
}

const CameraComponent: React.FC<CameraComponentProps> = ({ onCapture }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const capturePhoto = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const video = document.createElement("video");

        video.srcObject = stream;
        await video.play();

        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = 300;
          canvas.height = 300;
          const context = canvas.getContext("2d");
          if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            // ბლობის შექმნა
            canvas.toBlob(
              (blob) => {
                if (blob) {
                 
                  onCapture(blob); // გამოსახულების ბლობის გაგზავნა
                }
              },
              "image/png",
              1.0 // ხარისხი (PNG-სთვის იგნორირდება)
            );
          }
        }

        // კამერის გათიშვა
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
      } catch (error) {
        console.error("Error accessing the camera:", error);
      }
    };

    capturePhoto();
  }, [onCapture]);

  return (
    <div>
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

export default CameraComponent;
