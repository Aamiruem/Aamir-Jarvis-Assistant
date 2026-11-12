import { PageHeader } from '../ui.jsx';
import DeviceCard from './DeviceCard.jsx';

// The signed-in app's "Device" tab: live battery, charger, network, CPU, memory and disk.
export default function DevicePanel() {
  return (
    <div className="panel">
      <PageHeader
        icon="cpu"
        hue={205}
        title="Your device"
        subtitle="Live details about this computer or phone, with AI insights: battery forecast, connection quality and slowdowns."
      />
      <DeviceCard />
    </div>
  );
}
