import { openai } from '@ai-sdk/openai';

const embeddingModel = openai.embedding('text-embedding-3-large', {
	dimensions: 1536 // for the index to work correctly
});

export async function embedText(text: string) {
	const content = text.replace(/\n/g, ' ');
	const embedding = await embeddingModel.doEmbed({ values: [content] });
	return embedding.embeddings[0];
}
