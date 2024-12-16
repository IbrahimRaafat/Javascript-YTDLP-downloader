const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const fs = require("fs");
const path = require("path");
const YTDlpWrap = require("yt-dlp-wrap").default;

// Initialize Express app and server
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files (like index.html)
app.use(express.static(path.join(__dirname, "public")));

// Serve the index page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Function to download a video
function downloadVideo(url, socket) {
  console.log(`Downloading video from URL: ${url}`);

  // Initialize yt-dlp wrap instance
  const ytDlpWrap = new YTDlpWrap();

  // Start the download process
  const ytDlpEventEmitter = ytDlpWrap.exec([
    url,
    "-o", path.join(__dirname, "downloads", "%(title)s.%(ext)s"),  // Save in downloads folder
  ]);

  // Handle progress updates
  ytDlpEventEmitter.on("progress", (progress) => {
    socket.emit("progress", progress); // Emit progress data to client
  });

  // Handle errors
  ytDlpEventEmitter.on("error", (error) => {
    console.error("Error:", error);
    socket.emit("error", error); // Emit error to client
  });

  // Handle download completion
  ytDlpEventEmitter.on("close", () => {
    console.log("Download completed successfully!");
    socket.emit("completed", "Download completed successfully!"); // Notify client of completion
  });
}

// Set up socket.io connection
io.on("connection", (socket) => {
  console.log("A user connected");

  // Listen for download requests
  socket.on("download", (url) => {
    downloadVideo(url, socket); // Start download on server-side
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// Start server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
