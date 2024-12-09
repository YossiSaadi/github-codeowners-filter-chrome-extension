interface CodeOwner {
  name: string;
  files: Set<HTMLElement>;
}

class GitHubCodeOwnersFilter {
  private codeowners: Map<string, CodeOwner> = new Map();
  private observer: MutationObserver;
  private isInitialized = false;

  constructor() {
    console.debug('[GitHub Code owners Filter]: Initializing');
    this.observer = new MutationObserver(this.handleMutations.bind(this));
    this.startObserving();
  }

  private startObserving(): void {
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  private handleMutations(mutations: MutationRecord[]): void {
    if (this.isInitialized) {
      return;
    }

    for (const mutation of mutations) {
      const filterMenu = (mutation.target as Element).querySelector('.SelectMenu.js-file-filter');
      if (filterMenu && !filterMenu.querySelector('.js-codeowner-section')) {
        console.debug('[GitHub Code owners Filter]: Found filter menu, initializing');
        this.initialize(filterMenu as HTMLElement).catch((error) => {
          console.error('[GitHub Code owners Filter]: Error during initialization:', error);
        });
        break;
      }
    }
  }
  private getFileElements(): NodeListOf<HTMLElement> {
    return document.querySelectorAll('#files copilot-diff-entry');
  }

  private getExpectedFileCount(): number | null {
    const counter = document.querySelector('#files_tab_counter');
    const title = counter?.getAttribute('title');
    return title ? parseInt(title.replace(",", ""), 10) : null;
  }

  private async waitForAllFiles(expectedCount: number): Promise<NodeListOf<HTMLElement>> {
    // this wait is necessary for very large PRs, as GitHub loads files in chunks
    const maxAttempts = 45; // Maximum number of attempts (30 seconds)
    let attempts = 0;

    while (attempts < maxAttempts) {
      const files = this.getFileElements();
      console.debug(`[GitHub Code owners Filter]: Found ${files.length}/${expectedCount} files`);

      if (files.length === expectedCount) {
        return files as NodeListOf<HTMLElement>;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
      attempts++;
    }

    console.warn(
      `[GitHub Code owners Filter]: Only found ${this.getFileElements().length}/${expectedCount} files after 30 seconds`,
    );
    return this.getFileElements();
  }

  private async initialize(filterMenu: HTMLElement): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    const expectedFileCount = this.getExpectedFileCount();
    if (!expectedFileCount) {
      console.debug('[GitHub Code owners Filter]: Could not determine expected file count');
      return;
    }

    this.createCodeOwnersFilterSection(filterMenu, expectedFileCount);

    const fileList = await this.waitForAllFiles(expectedFileCount);
    if (!fileList.length) {
      console.debug('[GitHub Code owners Filter]: No file list found');
      return;
    }

    this.scanCodeOwners(fileList);
    this.addCodeOwnerFilters(filterMenu);

    this.observer.disconnect();
    this.isInitialized = true;
    console.debug(
      '[GitHub Code owners Filter]: Extension fully initialized and observer disconnected',
    );
  }

  private scanCodeOwners(fileList: NodeListOf<HTMLElement>): void {
    console.debug(`[GitHub Code owners Filter]: Scanning ${fileList.length} files for ownership`);

    fileList.forEach((element) => {
      const ownershipIcon = element.querySelector('.file-info .octicon-shield-lock');
      if (!ownershipIcon) return;

      const tooltip = ownershipIcon.closest('[aria-label]');
      if (!tooltip) return;

      const ownershipText = tooltip.getAttribute('aria-label') || '';
      const owners = this.parseOwners(ownershipText);

      owners.forEach((owner) => {
        if (!this.codeowners.has(owner)) {
          this.codeowners.set(owner, {
            name: owner,
            files: new Set(),
          });
        }

        this.codeowners.get(owner)?.files.add(element as HTMLElement);
      });
    });

    console.debug(`[GitHub Code owners Filter]: Found ${this.codeowners.size} code owners`);
  }

  private parseOwners(text: string): string[] {
    const hasYou = text.includes('Owned by you');
    const mentions = text.match(/(@[\w/-]+)/g) || [];
    return hasYou ? ['You', ...mentions] : mentions;
  }

  private createCodeOwnersFilterSection(filterMenu: HTMLElement, expectedFileCount: number): void {
    const section = document.createElement('section');
    section.className = 'js-codeowner-section';

    const divider = document.createElement('hr');
    divider.className = 'SelectMenu-divider';

    const header = document.createElement('div');
    header.className = 'SelectMenu-header';
    header.innerHTML = '<h3 class="SelectMenu-title">Filter by code owner</h3>';

    const container = document.createElement('div');
    container.className = 'SelectMenu-list';

    const footerItem = document.createElement('div');
    footerItem.className = 'SelectMenu-item SelectMenu-footer-item color-fg-muted';
    footerItem.textContent = `Loading code owners for ${expectedFileCount} files...`;
    footerItem.style.pointerEvents = 'none';
    container.appendChild(footerItem);

    section.appendChild(divider);
    section.appendChild(header);
    section.appendChild(container);

    const menuList = filterMenu.querySelector('.SelectMenu-list');
    if (menuList) {
      console.debug(
        '[GitHub Code owners Filter]: Adding initial code owner section to filter menu',
      );
      menuList.appendChild(section);
    }
  }

  private addCodeOwnerFilters(filterMenu: HTMLElement): void {
    const container = filterMenu.querySelector('.js-codeowner-section .SelectMenu-list');
    if (!container) return;

    const footerItem = container.querySelector('.SelectMenu-footer-item');

    if (this.codeowners.size === 0 && footerItem) {
      footerItem.textContent = 'No code owners found';
      console.debug('[GitHub Code owners Filter]: No code owners found, skipping filter creation');
      return;
    }

    const owners = Array.from(this.codeowners.values()).sort((a, b) =>
      b.name.localeCompare(a.name),
    );
    const youIndex = owners.findIndex((owner) => owner.name === 'You');

    if (youIndex !== -1) {
      const youOwner = owners.splice(youIndex, 1)[0];
      owners.push({
        name: 'You',
        files: youOwner.files,
      });
    }

    console.debug('[GitHub Code owners Filter]: Adding code owners to menu');
    owners.forEach((owner) => {
      const label = this.createLabel(owner);
      container.prepend(label);
    });

    if (!footerItem) return;

    const filesWithOwnership = new Set(
      Array.from(this.codeowners.values()).flatMap((owner) => Array.from(owner.files)),
    );

    const filesWithoutOwnership = this.getFileElements().length - filesWithOwnership.size;

    if (filesWithoutOwnership === 0) {
      footerItem.textContent = 'All files have ownership!';
      return;
    }

    footerItem.textContent = `${filesWithoutOwnership} files do not have ownership`;
  }

  private createLabel({ name, files }: CodeOwner): HTMLElement {
    const label = document.createElement('label');
    label.className = 'SelectMenu-item';
    label.setAttribute('role', 'menuitem');

    const input = document.createElement('input');
    input.className = 'js-codeowner-option mr-2';
    input.type = 'checkbox';
    input.value = name;
    input.addEventListener('change', (e) => {
      e.stopPropagation();
      this.handleCodeOwnerFilter();
    });

    const text = document.createTextNode(`${name} `);
    const count = document.createElement('span');
    count.className = 'text-normal js-file-type-count';
    count.style.marginLeft = 'auto';
    count.textContent = `(${files.size})`;

    label.appendChild(input);
    label.appendChild(text);
    label.appendChild(count);

    return label;
  }

  private handleCodeOwnerFilter(): void {
    const selectedOwners = Array.from(
      document.querySelectorAll('.js-codeowner-option:checked'),
    ).map((input) => (input as HTMLInputElement).value);

    this.getFileElements().forEach((file) => {
      const ownershipIcon = file.querySelector('.file-info .octicon-shield-lock');
      if (!ownershipIcon) {
        file.style.display = selectedOwners.length === 0 ? '' : 'none';
        return;
      }

      const tooltip = ownershipIcon.closest('[aria-label]');
      if (!tooltip) {
        file.style.display = selectedOwners.length === 0 ? '' : 'none';
        return;
      }

      const ownershipText = tooltip.getAttribute('aria-label') || '';
      const fileOwners = this.parseOwners(ownershipText);

      const shouldShow =
        selectedOwners.length === 0 || selectedOwners.some((owner) => fileOwners.includes(owner));

      file.style.display = shouldShow ? '' : 'none';
    });
  }
}

function isPRFilesPage(): boolean {
  return /^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+\/files/.test(window.location.href);
}

if (isPRFilesPage()) {
  new GitHubCodeOwnersFilter();
}
