import { WebContainer } from '@webcontainer/api';
import { WORK_DIR_NAME } from '@/components/bolt/utils/constants';

interface WebContainerContext {
  loaded: boolean;
}

export const webcontainerContext: WebContainerContext = {
  loaded: false,
};

export const webcontainer = typeof window !== 'undefined' ? (async () => {
  const webcontainer = await WebContainer.boot({ workdirName: WORK_DIR_NAME });
  webcontainerContext.loaded = true;
  return webcontainer;
})() : null;