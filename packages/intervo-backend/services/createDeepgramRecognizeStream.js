const { createClient, LiveTranscriptionEvents } = require("@deepgram/sdk");
const WebSocket = require("ws");

async function createDeepgramRecognizeStream({ 
  timer, 
  ws, 
  wss, 
  ignoreNewTranscriptions, 
  isProcessingTTS, 
  processTranscription, 
  resetInactivityTimeout, // Keep for consistency, though Deepgram endpointing handles silence
  inactivityTimeout,
  endPointingMs
}) {
  const deepgramApiKey = process.env.DEEPGRAM_API_KEY;

  if (!deepgramApiKey) {
    console.error(`[${timer()}] Deepgram API Key not found. Please set DEEPGRAM_API_KEY environment variable.`);
    return { // Return dummy object
      write: () => {},
      end: () => { console.log(`[${timer()}] Deepgram stream ended (no API key).`); },
      pause: () => {},
      resume: () => {}
    };
  }

  const deepgramClient = createClient(deepgramApiKey);
  let connection = null;
  let isPaused = false;
  let isReady = false; // Flag to ensure connection is open before writing

  try {
    connection = deepgramClient.listen.live({
      model: "nova-2-phonecall", // Model optimized for telephony
      language: "en-US",
      encoding: "mulaw", 
      sample_rate: 8000, 
      punctuate: true,
      interim_results: false, // We only want final results
      endpointing: endPointingMs, // Milliseconds of silence to detect end of utterance (adjust as needed)
    });

    connection.on(LiveTranscriptionEvents.Open, () => {
      // console.log(`[${timer()}] Deepgram connection opened.`);
      isReady = true;
    });

    connection.on(LiveTranscriptionEvents.Transcript, async (data) => {
      // console.log(`[${timer()}] Deepgram Transcript received:`, JSON.stringify(data, null, 2));
      const transcript = data.channel?.alternatives?.[0]?.transcript;
      
      // We configured interim_results: false, but double-check is_final
      if (transcript && data.is_final) {
        if (ignoreNewTranscriptions || isProcessingTTS || isPaused) {
          console.log(`[${timer()}] Ignoring Deepgram transcript (processing, TTS, or paused)`);
          return;
        }
        
        // Send to UI clients
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN && client !== ws) {
            client.send(JSON.stringify({ event: "transcription", source: "user", text: transcript }));
          }
        });

        clearTimeout(inactivityTimeout); // Clear timer on final result
        await processTranscription(transcript);
      } else if (!data.is_final && transcript) {
          // console.log(`[${timer()}] Deepgram Interim: "${transcript}"`);
          // Handle interim if needed in the future, e.g., for UI
          // resetInactivityTimeout(transcript); // Maybe reset timeout on interim?
      }
    });

    connection.on(LiveTranscriptionEvents.UtteranceEnd, (data) => {
       console.log(`[${timer()}] Deepgram UtteranceEnd received.`);
       // This event might be useful if endpointing alone isn't sufficient,
       // potentially triggering processTranscription if no final transcript arrived shortly after.
    });

    connection.on(LiveTranscriptionEvents.Error, (error) => {
      console.error(`[${timer()}] Deepgram connection error:`);
      isReady = false; // Mark as not ready on error
      // Potentially attempt reconnection or notify handler
    });

    connection.on(LiveTranscriptionEvents.Close, (event) => {
      console.log(`[${timer()}] Deepgram connection closed:`);
      isReady = false; // Mark as not ready on close
    });
    
    // Return the interface object immediately 
    // `isReady` flag handles writes before 'open' fires
    return {
      write: (base64Chunk) => {
        if (!isReady) {
          // console.warn(`[${timer()}] Deepgram write called before connection is ready.`);
          return; // Don't send if not ready
        }
        if (isPaused) {
          // console.log(`[${timer()}] Deepgram stream paused, ignoring write.`);
          return;
        }
        if (connection) {
          try {
            // Deepgram expects raw audio buffer, not base64
            const rawAudio = Buffer.from(base64Chunk, 'base64');
            connection.send(rawAudio);
          } catch (error) {
            console.error(`[${timer()}] Error decoding or sending audio chunk to Deepgram:`);
          }
        } else {
             console.error(`[${timer()}] Deepgram write called, but connection is null.`);
        }
      },
      end: () => {
        console.log(`[${timer()}] Ending Deepgram stream.`);
        isReady = false;
        if (connection) {
           try {
               // Finish the connection gracefully
               connection.finish();
               console.log(`[${timer()}] Deepgram connection finish() called.`);
           } catch (error) {
               console.error(`[${timer()}] Error calling Deepgram connection.finish():`);
           }
           connection = null; 
        }
      },
      pause: () => {
        console.log(`[${timer()}] --- Deepgram Stream Paused ---`);
        isPaused = true;
      },
      resume: () => {
        console.log(`[${timer()}] --- Deepgram Stream Resumed ---`);
        isPaused = false;
      }
    };

  } catch (error) {
    console.error(`[${timer()}] Error setting up Deepgram connection:`);
     // Return dummy object on setup error
    return {
      write: () => {},
      end: () => { console.log(`[${timer()}] Deepgram stream ended (setup error).`); },
      pause: () => {},
      resume: () => {}
    };
  }
}

module.exports = createDeepgramRecognizeStream;