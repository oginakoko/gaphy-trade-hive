import { createParser, type EventSourceMessage } from 'eventsource-parser';

export async function parseStream(stream: ReadableStream): Promise<ReadableStream<string>> {
  const decoder = new TextDecoder();
  
  return new ReadableStream({
    async start(controller) {
      const parser = createParser({
        onEvent(msg: EventSourceMessage) {
          try {
            // Skip processing messages
            if (msg.data === 'OPENROUTER PROCESSING') {
              return;
            }

            const data = JSON.parse(msg.data);
            // Only process actual content chunks
            const content = data.choices?.[0]?.delta?.content;
            if (content) {
              controller.enqueue(content);
            }
          } catch (e) {
            console.error('Error parsing SSE message:', e);
          }
        },
        onError(err) {
          console.error('Parser error:', err);
          controller.error(err);
        }
      });

      const reader = stream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          parser.feed(chunk);
        }
      } catch (error) {
        console.error('Error reading stream:', error);
      } finally {
        reader.releaseLock();
        controller.close();
      }
    }
  });
}
