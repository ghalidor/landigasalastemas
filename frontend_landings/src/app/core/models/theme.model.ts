export interface SectionItem {
  sectionKey: string;
  displayName: string;
  icon: string;
  sortOrder: number;
  editorType: 'cards' | 'single' | 'richtext' | 'file' | 'custom';
  schemaExample: string | null;
}

export interface VenueSections {
  themeKey: string;
  themeName: string;
  themeSections: SectionItem[];
  commonSections: SectionItem[];
}
