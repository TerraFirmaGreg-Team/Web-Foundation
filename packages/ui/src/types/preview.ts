export type PreviewIcon =
  | { type: 'icon'; name: string }
  | {
      type: 'entry';
      kind: string;
      id: string;
      dataset?: { id: string; version?: string };
    };

export type PagePreviewData = {
  title: string;
  description?: string;
  icon?: PreviewIcon;
};

