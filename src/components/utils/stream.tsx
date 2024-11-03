import { useState } from 'react';
import { useTTS } from '@cartesia/cartesia-js/react';

const VOICE_ID = "573e3144-a684-4e72-ac2b-9b2063a50b53"

export function TextToSpeech() {
	const tts = useTTS({
		apiKey: "f964901e-d4e2-4613-8aef-4e042e79337a",
		sampleRate: 44100,
	})

	const [text, setText] = useState("");

	const handlePlay = async () => {
		// Begin buffering the audio.
		const response = await tts.buffer({
			model_id: "sonic-english",
			voice: {
        		mode: "id",
        		id: VOICE_ID,
                __experimental_controls: {
                    emotion: [
                        "curiosity:high",
                        "positivity:high",
                        "surprise:high",
                    ],
                    speed: "slow",
                }
        	},
			transcript: text,
		});

		// Immediately play the audio. (You can also buffer in advance and play later.)
		await tts.play();
	}

	return (
		<div>
			<input type="text" value={text} onChange={(event) => setText(event.target.value)} />
			<button onClick={handlePlay}>Play</button>

			<div>
				{tts.playbackStatus} | {tts.bufferStatus} | {tts.isWaiting}
			</div>
		</div>
	);
}
