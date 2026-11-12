import { PageHeader } from '../ui.jsx';
import BrainGym from './BrainGym.jsx';

// The signed-in app's "Brain Gym" tab: brain-training games with your scores and streak saved,
// and a "Tip" button that asks the AI chat how to improve.
export default function GamesPanel({ onAsk }) {
  return (
    <div className="panel games-panel">
      <PageHeader
        icon="sparkles"
        hue={300}
        title="Brain Gym"
        subtitle="Six brain-training games, a daily workout and a streak. Sharpen memory, focus, mental maths and reflexes."
      />
      <BrainGym onAsk={onAsk} />
    </div>
  );
}
