// The 20 neural-network algorithms cheatsheet, as data. Pure, no React — the ML Lab explorer
// renders it, and it's searchable/filterable client-side so it's instant. Each entry carries a
// `motif` that maps to a small inline-SVG diagram in NeuralAlgos.jsx.

export const CATEGORIES = ['All', 'Foundations', 'Vision', 'Sequence', 'Transformers', 'Generative', 'Reinforcement', 'Unsupervised'];

export const ALGOS = [
  { n: 1, id: 'perceptron', name: 'Perceptron', cat: 'Foundations', motif: 'line', tagline: 'Basic binary classifier.', formula: 'ŷ = sign(wᵀx + b)', points: ['Simple, interpretable', 'Linear decision boundary'], use: 'spam detection, AND gate' },
  { n: 2, id: 'mlp', name: 'MLP', cat: 'Foundations', motif: 'layers', tagline: 'Multi-layer perceptron with hidden layers.', points: ['Learns complex patterns', 'Universal approximation'], use: 'digit recognition' },
  { n: 3, id: 'cnn', name: 'CNN', cat: 'Vision', motif: 'conv', tagline: 'Convolutional network for spatial data.', points: ['Detects local features', 'Translation invariant'], use: 'image classification' },
  { n: 4, id: 'rnn', name: 'RNN', cat: 'Sequence', motif: 'loop', tagline: 'Processes sequential data with memory.', points: ['Captures temporal context', 'Handles variable length'], use: 'language modeling' },
  { n: 5, id: 'lstm', name: 'LSTM', cat: 'Sequence', motif: 'cells', tagline: 'Advanced RNN that avoids vanishing gradients.', points: ['Remembers long-term context', 'Controls information flow'], use: 'speech recognition' },
  { n: 6, id: 'gru', name: 'GRU', cat: 'Sequence', motif: 'cells', tagline: 'Simplified LSTM variant.', points: ['Efficient memory unit', 'Fewer gates'], use: 'time-series forecasting' },
  { n: 7, id: 'transformers', name: 'Transformers', cat: 'Transformers', motif: 'attention', tagline: 'Attention-based architecture for parallel processing.', points: ['Focuses on relevant parts', 'Highly parallelizable'], use: 'language translation' },
  { n: 8, id: 'self-attention', name: 'Self-Attention', cat: 'Transformers', motif: 'attention', tagline: 'Attends to all positions in parallel.', points: ['Captures global context', 'Better dependencies'], use: 'text summarization' },
  { n: 9, id: 'bert', name: 'BERT', cat: 'Transformers', motif: 'block', tagline: 'Bidirectional encoder for deep understanding.', points: ['Understands context both ways', 'Rich representations'], use: 'QA, NLU' },
  { n: 10, id: 'gpt', name: 'GPT', cat: 'Transformers', motif: 'block', tagline: 'Generative pre-trained transformer.', points: ['Generates coherent text', 'Few-shot learning'], use: 'content generation' },
  { n: 11, id: 'resnet', name: 'ResNet', cat: 'Vision', motif: 'residual', tagline: 'Residual network for very deep training.', formula: 'x → F(x) → F(x) + x', points: ['Solves vanishing gradient', 'Enables deeper networks'], use: 'image recognition' },
  { n: 12, id: 'inception', name: 'InceptionNet', cat: 'Vision', motif: 'parallel', tagline: 'Multi-scale convolutions in parallel.', points: ['Captures multiple scales', 'Efficient architecture'], use: 'image classification' },
  { n: 13, id: 'gan', name: 'GAN', cat: 'Generative', motif: 'gan', tagline: 'Generative Adversarial Network.', formula: 'G ⇄ D', points: ['Generates realistic data', 'Learns via competition'], use: 'image generation' },
  { n: 14, id: 'autoencoder', name: 'Autoencoder', cat: 'Generative', motif: 'auto', tagline: 'Learns compact representations.', points: ['Compresses data', 'Reduces dimensionality'], use: 'feature learning' },
  { n: 15, id: 'dqn', name: 'DQN', cat: 'Reinforcement', motif: 'rl', tagline: 'Deep Q-Network for reinforcement learning.', formula: 'State → Q-Network → Action', points: ['Learns optimal actions', 'Uses experience replay'], use: 'game playing' },
  { n: 16, id: 'attention-all', name: 'Attention Is All You Need', cat: 'Transformers', motif: 'attention', tagline: 'The transformer architecture, for all tasks.', points: ['Self-attention at scale', 'Highly parallel'], use: 'NLP tasks' },
  { n: 17, id: 'dbn', name: 'Deep Belief Network', cat: 'Unsupervised', motif: 'layers', tagline: 'Unsupervised pre-training with RBMs.', points: ['Learns hierarchical features', 'Generative model'], use: 'feature learning' },
  { n: 18, id: 'unet', name: 'U-Net', cat: 'Vision', motif: 'unet', tagline: 'Encoder–decoder for image segmentation.', points: ['Preserves spatial details', 'Works with few labels'], use: 'medical imaging' },
  { n: 19, id: 'yolo', name: 'YOLO', cat: 'Vision', motif: 'detect', tagline: 'Real-time object detection, single-stage.', points: ['Fast and accurate', 'Single-pass detection'], use: 'self-driving cars' },
  { n: 20, id: 'diffusion', name: 'Diffusion Model', cat: 'Generative', motif: 'diffusion', tagline: 'Generates high-quality data by denoising.', points: ['Produces realistic results', 'Stable generation'], use: 'image synthesis' },
];

const norm = (s) => String(s || '').toLowerCase().trim();

/** Filter by category ('All' = no filter) and a free-text query over name/tagline/use/points. */
export function filterAlgos(category = 'All', query = '') {
  const q = norm(query);
  return ALGOS.filter((a) => {
    if (category && category !== 'All' && a.cat !== category) return false;
    if (!q) return true;
    return [a.name, a.tagline, a.use, a.cat, ...a.points].some((t) => norm(t).includes(q));
  });
}

/** How many algorithms sit in each category (All = total). */
export function categoryCounts() {
  const counts = { All: ALGOS.length };
  for (const c of CATEGORIES) if (c !== 'All') counts[c] = ALGOS.filter((a) => a.cat === c).length;
  return counts;
}

export function getAlgo(id) {
  return ALGOS.find((a) => a.id === id) || null;
}
