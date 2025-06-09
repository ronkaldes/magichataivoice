const sdk = require("microsoft-cognitiveservices-speech-sdk");
const WebSocket = require("ws");
const { Transform } = require('stream');

function mulawToPcm(mulawData) {
  // µ-law to linear PCM conversion table
  const MULAW_DECODE_TABLE = new Int16Array([
    -32124, -31100, -30076, -29052, -28028, -27004, -25980, -24956,
    -23932, -22908, -21884, -20860, -19836, -18812, -17788, -16764,
    -15996, -15484, -14972, -14460, -13948, -13436, -12924, -12412,
    -11900, -11388, -10876, -10364, -9852, -9340, -8828, -8316,
    -7932, -7676, -7420, -7164, -6908, -6652, -6396, -6140,
    -5884, -5628, -5372, -5116, -4860, -4604, -4348, -4092,
    -3900, -3772, -3644, -3516, -3388, -3260, -3132, -3004,
    -2876, -2748, -2620, -2492, -2364, -2236, -2108, -1980,
    -1884, -1820, -1756, -1692, -1628, -1564, -1500, -1436,
    -1372, -1308, -1244, -1180, -1116, -1052, -988, -924,
    -876, -844, -812, -780, -748, -716, -684, -652,
    -620, -588, -556, -524, -492, -460, -428, -396,
    -372, -356, -340, -324, -308, -292, -276, -260,
    -244, -228, -212, -196, -180, -164, -148, -132,
    -120, -112, -104, -96, -88, -80, -72, -64,
    -56, -48, -40, -32, -24, -16, -8, 0,
    32124, 31100, 30076, 29052, 28028, 27004, 25980, 24956,
    23932, 22908, 21884, 20860, 19836, 18812, 17788, 16764,
    15996, 15484, 14972, 14460, 13948, 13436, 12924, 12412,
    11900, 11388, 10876, 10364, 9852, 9340, 8828, 8316,
    7932, 7676, 7420, 7164, 6908, 6652, 6396, 6140,
    5884, 5628, 5372, 5116, 4860, 4604, 4348, 4092,
    3900, 3772, 3644, 3516, 3388, 3260, 3132, 3004,
    2876, 2748, 2620, 2492, 2364, 2236, 2108, 1980,
    1884, 1820, 1756, 1692, 1628, 1564, 1500, 1436,
    1372, 1308, 1244, 1180, 1116, 1052, 988, 924,
    876, 844, 812, 780, 748, 716, 684, 652,
    620, 588, 556, 524, 492, 460, 428, 396,
    372, 356, 340, 324, 308, 292, 276, 260,
    244, 228, 212, 196, 180, 164, 148, 132,
    120, 112, 104, 96, 88, 80, 72, 64,
    56, 48, 40, 32, 24, 16, 8, 0
  ]);

  const pcmData = new Int16Array(mulawData.length);
  
  for (let i = 0; i < mulawData.length; i++) {
    const index = Math.max(0, Math.min(255, mulawData[i]));
    pcmData[i] = MULAW_DECODE_TABLE[index];
  }
  
  return Buffer.from(pcmData.buffer);
}

async function createAzureSpeechRecognizeStream({ 
  timer, 
  ws, 
  wss, 
  ignoreNewTranscriptions, 
  isProcessingTTS, 
  processTranscription, 
  resetInactivityTimeout, 
  inactivityTimeout, 
  endPointingMs
}) {

  console.log("azure speech recognize stream");
  const azureKey = process.env.AZURE_SPEECH_KEY;
  const azureRegion = process.env.AZURE_SPEECH_REGION;

  if (!azureKey || !azureRegion) {
    console.error(`[${timer()}] Azure Speech Key or Region not found. Please set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION environment variables.`);
    // Return a dummy stream object
    return {
      write: () => {},
      end: () => { console.log(`[${timer()}] Azure stream ended (no credentials).`); },
      pause: () => {},
      resume: () => {}
    };
  }

  let audioInputStream = null;
  let recognizer = null;
  let isPaused = false;
  let isReady = false;

  // Wrap setup in a Promise
  return new Promise((resolve, reject) => {
    try {
      // Configure speech config
      const speechConfig = sdk.SpeechConfig.fromSubscription(azureKey, azureRegion);
      speechConfig.speechRecognitionLanguage = "en-US";
      
      // Set segmentation silence timeout if provided
      const silenceTimeout = endPointingMs !== undefined ? endPointingMs : 800;
      speechConfig.setProperty(sdk.PropertyId.SpeechServiceConnection_SegmentationSilenceTimeoutMs, String(silenceTimeout));
      console.log(`[${timer()}] Azure segmentationSilenceTimeoutMs set to: ${silenceTimeout}`);

      // Create audio format: 8kHz sample rate, 16 bits per sample, 1 channel (PCM)
      const audioFormat = sdk.AudioStreamFormat.getWaveFormatPCM(8000, 16, 1);
      audioInputStream = sdk.AudioInputStream.createPushStream(audioFormat);
      const audioConfig = sdk.AudioConfig.fromStreamInput(audioInputStream);

      // Create the recognizer
      recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

      // --- Phrase list boosting --- 
      const phraseList = sdk.PhraseListGrammar.fromRecognizer(recognizer);
      phraseList.addPhrase("CodeDesign");
      phraseList.addPhrase("CodeDesign.ai");
      phraseList.addPhrase("Intervo");
      phraseList.addPhrase("Intervo.ai");
      // Add other relevant phrases if needed
      // --- End Phrase list --- 

      // --- Event Handlers --- 

      // Handle final recognition results
      recognizer.recognized = async (s, e) => {
        console.log(`[${timer()}] Azure RECOGNIZED: ResultReason=${sdk.ResultReason[e.result.reason]} Text="${e.result.text}"`);
        if (e.result.reason === sdk.ResultReason.RecognizedSpeech && e.result.text) {
          if (ignoreNewTranscriptions || isProcessingTTS || isPaused) {
            console.log(`[${timer()}] Ignoring Azure transcript (processing, TTS, or paused)`);
            return;
          }
          const transcription = e.result.text;
          
          // Send to UI clients
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN && client !== ws) {
              client.send(JSON.stringify({ event: "transcription", source: "user", text: transcription }));
            }
          });

          clearTimeout(inactivityTimeout); // Clear timer on final result
          await processTranscription(transcription);
        } else if (e.result.reason === sdk.ResultReason.NoMatch) {
          console.log(`[${timer()}] Azure NOMATCH: Speech could not be recognized.`);
        }
      };

      // Handle interim results (optional, currently just logging)
      recognizer.recognizing = (s, e) => {
        // console.log(`[${timer()}] Azure RECOGNIZING: Text="${e.result.text}"`);
        if (e.result.text && !ignoreNewTranscriptions && !isProcessingTTS && !isPaused) {
            // Optional: Can uncomment broadcasting if partial results are desired for UI
            /*
            wss.clients.forEach((client) => {
               if (client.readyState === WebSocket.OPEN && client !== ws) {
                   client.send(JSON.stringify({ event: "transcription", source: "user", text: e.result.text, isPartial: true }));
               }
            });
            resetInactivityTimeout(e.result.text); // Reset timer on partial result
            */
        }
      };

      // Handle cancellation
      recognizer.canceled = (s, e) => {
        console.error(`[${timer()}] Azure CANCELED: Reason=${sdk.CancellationReason[e.reason]}`);
        if (e.reason === sdk.CancellationReason.Error) {
          console.error(`[${timer()}] Azure CANCELED: ErrorCode=${e.errorCode}`);
          console.error(`[${timer()}] Azure CANCELED: ErrorDetails=${e.errorDetails}`);
          console.error(`[${timer()}] Azure CANCELED: Did you set the speech resource key and region values?`);
        }
        // Reject the promise if cancellation happens before ready
        if (!isReady) {
          reject(new Error(`Azure recognition canceled: ${e.errorDetails}`));
        }
        // Consider stopping permanently or attempting re-connection if needed
      };

      // Handle session events (start/stop)
      recognizer.sessionStarted = (s, e) => {
        console.log(`[${timer()}] Azure Session started: ${e.sessionId}`);
      };

      recognizer.sessionStopped = (s, e) => {
        console.log(`[${timer()}] Azure Session stopped: ${e.sessionId}`);
        // Recognition might stop unexpectedly, might need cleanup or restart logic here
         isReady = false; // Mark as not ready if session stops
      };
      
      // --- Start Recognition and Resolve Promise --- 
      recognizer.startContinuousRecognitionAsync(
        () => { // On success
          console.log(`[${timer()}] Azure continuous recognition started successfully.`);
          isReady = true;
          // Resolve with the stream interface object
          resolve({
            write: (base64Chunk) => {
              if (!isReady) {
                console.warn(`[${timer()}] Azure write called before recognizer is ready.`);
                return;
              }
              if (isPaused) {
                // console.log(`[${timer()}] Azure stream paused, ignoring write.`);
                return;
              }
              if (audioInputStream) {
                try {
                  const rawAudio = Buffer.from(base64Chunk, 'base64');
                  const pcmAudio = mulawToPcm(rawAudio);
                  // console.log(`[${timer()}] Writing ${pcmAudio.length} PCM bytes to Azure stream`);
                  audioInputStream.write(pcmAudio);
                } catch (error) {
                  console.error(`[${timer()}] Error processing or writing audio chunk to Azure:`, error);
                }
              } else {
                  console.error(`[${timer()}] Azure write called, but audioInputStream is null.`);
              }
            },
            end: () => {
              console.log(`[${timer()}] Ending Azure stream.`);
              isReady = false;
              if (recognizer) {
                recognizer.stopContinuousRecognitionAsync(
                  () => { console.log(`[${timer()}] Azure recognizer stopped.`); },
                  (err) => { console.error(`[${timer()}] Azure recognizer stop error:`, err); }
                );
                // It's good practice to close the recognizer and free resources
                // recognizer.close(); // May cause issues if called too soon after stop
                 recognizer = null; 
              }
              if (audioInputStream) {
                audioInputStream.close();
                audioInputStream = null;
              }
            },
            pause: () => {
              console.log(`[${timer()}] --- Azure Stream Paused ---`);
              isPaused = true;
            },
            resume: () => {
              console.log(`[${timer()}] --- Azure Stream Resumed ---`);
              isPaused = false;
            }
          });
        },
        (err) => { // On failure
          console.error(`[${timer()}] Azure startContinuousRecognitionAsync failed: ${err}`);
          // Clean up partial resources if start fails
           if (audioInputStream) { audioInputStream.close(); audioInputStream = null; }
           if (recognizer) { /* recognizer.close(); */ recognizer = null; } // SDK might auto-cleanup?
          reject(new Error(`Azure recognition failed to start: ${err}`));
        }
      );

    } catch (error) {
      console.error(`[${timer()}] Error setting up Azure speech recognition:`, error);
       if (audioInputStream) { audioInputStream.close(); audioInputStream = null; }
       if (recognizer) { /* recognizer.close(); */ recognizer = null; } 
      reject(error);
    }
  }); // End of Promise constructor
}

module.exports = createAzureSpeechRecognizeStream; 