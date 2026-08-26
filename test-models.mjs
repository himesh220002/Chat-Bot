import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

async function main() {
  const models = [
    "meta/llama-3.1-8b-instruct",
    "meta/llama-3.1-70b-instruct",
    "meta/llama-3.2-3b-instruct",
    "nvidia/llama-3.1-nemotron-70b-instruct",
    "mistralai/mistral-7b-instruct-v0.3",
    "google/gemma-2b"
  ];

  for (const model of models) {
    try {
      console.log(`Testing ${model}...`);
      const completion = await openai.chat.completions.create({
        model: model,
        messages: [{ role: "user", content: "Hi" }],
        max_tokens: 5
      });
      console.log(`✅ SUCCESS: ${model}`);
      console.log(completion.choices[0].message.content);
      return; // Stop on first success
    } catch (e) {
      console.log(`❌ FAILED: ${model} - ${e.message}`);
    }
  }
}

main();
