import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";

const startBtn = document.getElementById("startBtn");
const video = document.getElementById("video");

let stream, recorder, videoFile;

const files = {
    videoName: "Youtube Clone Project Recordings.webm",
    videoMp4: "Youtube Clone Project Recordings.mp4",
    videoOutput: "output.mp4",
    thumbNailJpg: "thumbnail.jpg",

}

const downloadFiles = (fileUrl, fileName) => {
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
}

const handleDownload = async () => {
    startBtn.removeEventListener("click", handleDownload);
    startBtn.innerText = "Transcoding...";
    startBtn.disabled = true;

    const ffmpeg = createFFmpeg({ log: true });
    await ffmpeg.load();

    ffmpeg.FS("writeFile", files.videoName, await fetchFile(videoFile));

    // Webm -> mp4 video file
    await ffmpeg.run("-i", files.videoName, "-r", "60", files.videoOutput);

    // First 1sec Thumbnail
    await ffmpeg.run("-i",
        files.videoName,
        "-ss",
        "00:00:01",
        "-frames:v",
        "1",
        files.thumbNailJpg,
    );

    const mp4File = ffmpeg.FS("readFile", files.videoOutput);
    const thumbFile = ffmpeg.FS("readFile", files.thumbNailJpg);

    const mp4Blob = new Blob([mp4File.buffer], { type: "video/mp4" });
    const thumbBlob = new Blob([thumbFile.buffer], { type: "image/jpg" });

    const mp4Url = URL.createObjectURL(mp4Blob);
    const thumbUrl = URL.createObjectURL(thumbBlob);

    // Download files
    downloadFiles(mp4Url, files.videoMp4);
    downloadFiles(thumbUrl, files.thumbNailJpg);

    // Unlink files - save memory
    ffmpeg.FS("unlink", files.videoName);
    ffmpeg.FS("unlink", files.videoOutput);
    ffmpeg.FS("unlink", files.thumbNailJpg);

    URL.revokeObjectURL(thumbUrl);
    URL.revokeObjectURL(mp4Url);
    URL.revokeObjectURL(videoFile);

    // Start again
    startBtn.disabled = false;
    startBtn.innerText = "Record Again";
    startBtn.addEventListener("click", handleStart);
}

const handleStop = () => {
    startBtn.innerText = "Save Recording";
    startBtn.removeEventListener("click", handleStop);
    startBtn.addEventListener("click", handleDownload);

    recorder.stop();
}

const handleStart = () => {
    init();
    recorder = new MediaRecorder(stream);

    startBtn.innerText = "Stop Recording";
    startBtn.removeEventListener("click", handleStart);
    startBtn.addEventListener("click", handleStop);

    recorder.ondataavailable = (event) => {
        videoFile = URL.createObjectURL(event.data);
        video.srcObject = null;
        video.src = videoFile;
        video.loop = true;
        video.play();
    }
    recorder.start();

}

// Get a stream & Preview
const init = async () => {
    stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { width: 1024, height: 576 },
    });
    video.srcObject = stream;
    video.play();
}

init();

startBtn.addEventListener("click", handleStart);