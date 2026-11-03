export type ShareContent = {
  title: string;
  message: string;
  url: string;
};

export type SharingResult = 'shared' | 'copied' | 'cancelled';

export interface Sharing {
  webAppUrl: () => string;
  share: (content: ShareContent) => Promise<SharingResult>;
  copy: (text: string) => Promise<void>;
}
