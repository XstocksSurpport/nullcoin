export type DocSection = {
  id: string
  titleKey: string
}

export type DocPageMeta = {
  id: string
  titleKey: string
  sections: DocSection[]
}

export type DocNavGroup = {
  groupId: string
  labelKey: string
  pages: DocPageMeta[]
}

export const DOCS_NAV: DocNavGroup[] = [
  {
    groupId: 'introduction',
    labelKey: 'docs.groups.introduction',
    pages: [
      {
        id: 'about',
        titleKey: 'docs.pages.about.title',
        sections: [
          { id: 'what-is', titleKey: 'docs.pages.about.whatIs' },
          { id: 'flow', titleKey: 'docs.pages.about.flow' },
        ],
      },
      {
        id: 'tokens',
        titleKey: 'docs.pages.tokens.title',
        sections: [
          { id: 'compare', titleKey: 'docs.pages.tokens.compare' },
          { id: 'rules', titleKey: 'docs.pages.tokens.rules' },
        ],
      },
    ],
  },
  {
    groupId: 'mechanics',
    labelKey: 'docs.groups.mechanics',
    pages: [
      {
        id: 'mint',
        titleKey: 'docs.pages.mint.title',
        sections: [
          { id: 'presale', titleKey: 'docs.pages.mint.presale' },
          { id: 'liquidity', titleKey: 'docs.pages.mint.liquidity' },
        ],
      },
      {
        id: 'linked-burn',
        titleKey: 'docs.pages.linked-burn.title',
        sections: [
          { id: 'trigger', titleKey: 'docs.pages.linked-burn.trigger' },
          { id: 'example', titleKey: 'docs.pages.linked-burn.example' },
          { id: 'exemptions', titleKey: 'docs.pages.linked-burn.exemptions' },
        ],
      },
      {
        id: 'protection',
        titleKey: 'docs.pages.protection.title',
        sections: [{ id: 'cards', titleKey: 'docs.pages.protection.cards' }],
      },
    ],
  },
  {
    groupId: 'technical',
    labelKey: 'docs.groups.technical',
    pages: [
      {
        id: 'architecture',
        titleKey: 'docs.pages.architecture.title',
        sections: [
          { id: 'contracts', titleKey: 'docs.pages.architecture.contracts' },
          { id: 'hook', titleKey: 'docs.pages.architecture.hook' },
        ],
      },
      {
        id: 'addresses',
        titleKey: 'docs.pages.addresses.title',
        sections: [{ id: 'mainnet', titleKey: 'docs.pages.addresses.mainnet' }],
      },
    ],
  },
  {
    groupId: 'resources',
    labelKey: 'docs.groups.resources',
    pages: [
      {
        id: 'faq',
        titleKey: 'docs.pages.faq.title',
        sections: [
          { id: 'trading', titleKey: 'docs.pages.faq.trading' },
          { id: 'safety', titleKey: 'docs.pages.faq.safety' },
        ],
      },
      {
        id: 'reference',
        titleKey: 'docs.pages.reference.title',
        sections: [{ id: 'params', titleKey: 'docs.pages.reference.params' }],
      },
    ],
  },
]

export const DEFAULT_DOC_PAGE = 'about'

export function findDocPage(id: string): DocPageMeta | undefined {
  for (const group of DOCS_NAV) {
    const page = group.pages.find((p) => p.id === id)
    if (page) return page
  }
  return undefined
}

export function allDocPages(): DocPageMeta[] {
  return DOCS_NAV.flatMap((g) => g.pages)
}
