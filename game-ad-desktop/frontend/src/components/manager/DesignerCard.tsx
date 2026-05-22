import { Card, Typography } from 'antd';
import type { DesignerStats } from '../../stores/manager/managerData';

const { Text } = Typography;

export interface CardSection {
  title: string;
  content: React.ReactNode;
}

interface DesignerCardProps {
  designer: DesignerStats;
  sections: CardSection[];
  onClick: () => void;
}

export default function DesignerCard({ designer, sections, onClick }: DesignerCardProps) {
  return (
    <Card
      hoverable
      onClick={onClick}
      style={{
        background: '#1E293B',
        borderColor: '#334155',
        borderRadius: 8,
        cursor: 'pointer',
        maxHeight: 520,
        display: 'flex',
        flexDirection: 'column',
      }}
      styles={{
        body: { padding: 0, display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' },
      }}
    >
      {/* Header - fixed */}
      <div style={{
        padding: '8px 10px',
        borderBottom: '1px solid #334155',
        flexShrink: 0,
      }}>
        <Text strong style={{ color: '#E2E8F0', fontSize: 13 }}>
          {designer.name}
        </Text>
      </div>

      {/* Content - scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
        {sections.map((section, i) => (
          <div key={i} style={{ marginBottom: i < sections.length - 1 ? 6 : 0 }}>
            <div style={{
              fontSize: 10, color: '#64748b', fontWeight: 500,
              marginBottom: 3, lineHeight: '14px',
            }}>
              {section.title}
            </div>
            {section.content}
          </div>
        ))}
      </div>
    </Card>
  );
}
