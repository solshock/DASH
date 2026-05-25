import { ItemView, Plugin } from 'obsidian';
import { createRoot } from 'react-dom/client';
import React from 'react';
import { App } from './app.jsx';

const VIEW_TYPE = 'solshock-ledger';

class SolshockLedgerView extends ItemView {
  getViewType()    { return VIEW_TYPE; }
  getDisplayText() { return 'Solshock Ledger'; }
  getIcon()        { return 'dollar-sign'; }

  async onOpen() {
    this.contentEl.style.padding  = '0';
    this.contentEl.style.overflow = 'hidden';
    this._root = createRoot(this.contentEl);
    this._root.render(React.createElement(App));
  }

  async onClose() {
    this._root?.unmount();
    this._root = null;
  }
}

export default class SolshockLedgerPlugin extends Plugin {
  async onload() {
    this.registerView(VIEW_TYPE, (leaf) => new SolshockLedgerView(leaf));

    this.addRibbonIcon('dollar-sign', 'Open Solshock Ledger', () => {
      this.activateView();
    });

    this.addCommand({
      id:       'open-solshock-ledger',
      name:     'Open Solshock Ledger',
      callback: () => this.activateView(),
    });
  }

  async onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE);
  }

  async activateView() {
    const { workspace } = this.app;
    const existing = workspace.getLeavesOfType(VIEW_TYPE);
    if (existing.length > 0) {
      workspace.revealLeaf(existing[0]);
      return;
    }
    const leaf = workspace.getLeaf('tab');
    await leaf.setViewState({ type: VIEW_TYPE, active: true });
    workspace.revealLeaf(leaf);
  }
}
