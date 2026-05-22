import { Modal, Typography, Tag, Divider } from 'antd';
import type { DesignerStats } from '../../stores/manager/managerData';

const { Title } = Typography;

export interface DetailSection {
  title: string;
  content: React.ReactNode;
}

interface DesignerDetailModalProps {
  open: boolean;
  designer: DesignerStats | null;
  sections: DetailSection[];
  onClose: () => void;
}

export default function DesignerDetailModal({
  open,
  designer,
  sections,
  onClose,
}: DesignerDetailModalProps) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={1200}
      title={
        designer ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: '#E2E8F0' }}>{designer.name}</span>
            <Tag color="#334155" style={{ color: '#94A3B8', borderRadius: 4 }}>
              {designer.materialCount} materials
            </Tag>
          </div>
        ) : null
      }
      styles={{
        header: { background: '#0F172A', borderBottom: '1px solid #334155' },
        body: { background: '#0F172A', maxHeight: '70vh', overflowY: 'auto' },
        content: { background: '#0F172A', border: '1px solid #334155', borderRadius: 12 },
      }}
    >
      {designer && sections.map((section, idx) => (
        <div key={idx} style={{ marginBottom: idx < sections.length - 1 ? 0 : undefined }}>
          <Title level={5} style={{ color: '#E2E8F0', marginBottom: 8 }}>
            {section.title}
          </Title>
          {section.content}
          {idx < sections.length - 1 && (
            <Divider style={{ borderColor: '#334155', margin: '16px 0' }} />
          )}
        </div>
      ))}
    </Modal>
  );
}
