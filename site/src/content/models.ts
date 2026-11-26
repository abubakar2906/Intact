// Every model Intact has run, keyed by the id the service used. Logos are from LobeHub Icons (MIT).
// Kept free of TypeScript-only syntax beyond types, because scripts/build-data.ts imports it with plain Node.

export type Model = { name: string; maker: string; logo: string; via: string };

export const MODELS: Record<string, Model> = {
  'openai/gpt-oss-120b': { name: 'gpt-oss-120b', maker: 'OpenAI', logo: '/logos/openai.svg', via: 'Groq' },
  'minimaxai/minimax-m3.1-flash': { name: 'MiniMax M3.1 Flash', maker: 'MiniMax', logo: '/logos/minimax-color.svg', via: 'NVIDIA' },
  'qwen/qwen3.8-27b': { name: 'Qwen 3.8 27B', maker: 'Alibaba', logo: '/logos/qwen-color.svg', via: 'Groq' },
  'moonshotai/kimi-k3.1-pro': { name: 'Kimi K3.1 Pro', maker: 'Moonshot AI', logo: '/logos/kimi-color.svg', via: 'NVIDIA' },
  'z-ai/glm-5.3-flash': { name: 'GLM 5.3 Flash', maker: 'Z.ai', logo: '/logos/zhipu-color.svg', via: 'NVIDIA' },
};
