import { Button, Menu, MenuItem, MenuList, MenuPopover, MenuTrigger } from '@fluentui/react-components';
import { ArrowSyncRegular } from '@fluentui/react-icons';
import { setPreviewState } from '../api/previewState.js';
import type { PreviewDataState } from '../types/index.js';

export function PreviewStateSwitcher() {
  if (!import.meta.env.DEV) return null;
  const choose = (state: PreviewDataState) => { setPreviewState(state); window.location.reload(); };
  return <Menu><MenuTrigger><Button className="state-switcher" size="small" appearance="primary" icon={<ArrowSyncRegular />}>Preview state</Button></MenuTrigger><MenuPopover><MenuList>{(['data', 'loading', 'empty', 'error'] as const).map((state) => <MenuItem key={state} onClick={() => choose(state)}>{state[0].toUpperCase() + state.slice(1)}</MenuItem>)}</MenuList></MenuPopover></Menu>;
}