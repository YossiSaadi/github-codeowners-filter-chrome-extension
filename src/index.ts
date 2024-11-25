interface CodeOwner {
  name: string;
  files: Set<HTMLElement>;
}

class GitHubCodeOwnersFilter {
  private codeowners: Map<string, CodeOwner> = new Map();
  private observer: MutationObserver;

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
    for (const mutation of mutations) {
      const filterMenu = (mutation.target as Element).querySelector('.SelectMenu.js-file-filter');
      if (filterMenu && !filterMenu.querySelector('.js-codeowner-section')) {
        console.debug('[GitHub Code owners Filter]: Found filter menu, initializing');
        this.initialize(filterMenu as HTMLElement);
        break;
      }
    }
  }

  private initialize(filterMenu: HTMLElement): void {
    const fileList = document.querySelector('.js-diff-progressive-container');
    if (!fileList) {
      console.debug('[GitHub Code owners Filter]: No file list found');
      return;
    }

    this.scanCodeOwners(fileList);
    this.addCodeOwnerFilters(filterMenu);
  }

  private scanCodeOwners(fileList: Element): void {
    const fileElements = fileList.querySelectorAll('.file');
    console.debug(
      `[GitHub Code owners Filter]: Scanning ${fileElements.length} files for ownership`,
    );

    fileElements.forEach((element) => {
      const ownershipIcon = element.querySelector('.octicon-shield-lock');
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
    const match = text.match(/Owned by ([@\w/-]+)/);
    return match ? [match[1]] : [];
  }

private addCodeOwnerFilters(filterMenu: HTMLElement): void {
  if (this.codeowners.size === 0) {
    console.debug('[GitHub Code owners Filter]: No code owners found, skipping filter creation');
    return;
  }

  const section = document.createElement('section');
  section.className = 'js-codeowner-section';

  const divider = document.createElement('hr');
  divider.className = 'SelectMenu-divider';

  const header = document.createElement('div');
  header.className = 'SelectMenu-header';
  header.innerHTML = '<h3 class="SelectMenu-title">Filter by code owner</h3>';

  const container = document.createElement('div');
  container.className = 'SelectMenu-list';

  // Convert to array and find "you" if it exists
  const owners = Array.from(this.codeowners.values());
  const youIndex = owners.findIndex(owner => owner.name === 'you');

  // If "you" exists, move it to the front
  if (youIndex !== -1) {
    const youOwner = owners.splice(youIndex, 1)[0];
    owners.unshift({
      name: 'You',
      files: youOwner.files
    });
  }

  owners.forEach((owner) => {
    const label = this.createLabel(owner);
    container.appendChild(label);
  });

  section.appendChild(divider);
  section.appendChild(header);
  section.appendChild(container);

  const menuList = filterMenu.querySelector('.SelectMenu-list');
  if (menuList) {
    console.debug('[GitHub Code owners Filter]: Adding code owner section to filter menu');
    menuList.appendChild(section);
  }
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

    const allFiles = document.querySelectorAll('.file') as NodeListOf<HTMLElement>;

    allFiles.forEach((file) => {
      const ownershipIcon = file.querySelector('.octicon-shield-lock');
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
