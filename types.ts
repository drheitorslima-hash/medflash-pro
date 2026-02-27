
export enum AppModule {
  FLASHCARDS = 'FLASHCARDS',
  ENUNCIADOS = 'ENUNCIADOS',
  REFAZER = 'REFAZER'
}

export enum ThemeMode {
  AUTO = 'AUTO',
  CLARO = 'CLARO',
  ESCURO = 'ESCURO'
}

export enum FlashcardMode {
  PADRAO_COMPLETO = 'PADRAO_COMPLETO',
  RESUMIDO = 'RESUMIDO'
}

export interface FlashcardConfig {
  keepExactWords: boolean;
  extraClean: boolean;
  includeKeyLine: boolean;
  includeSummaryTop: boolean;
}

export interface EnunciadoConfig {
  aggressiveCompression: boolean;
  allowSynonyms: boolean;
  keepLiteralKeywords: boolean;
}

export interface RefazerConfig {
  keepExactWords: boolean;
  extraClean: boolean;
  includeKeyLine: boolean;
  includeSummaryTop: boolean;
}

export interface GenerationInput {
  images: string[];
  extraText: string;
  question: string;
  answer: string;
  mode: FlashcardMode;
  config: FlashcardConfig;
}

export interface EnunciadoInput {
  rawText: string;
  quickCommands: string;
  config: EnunciadoConfig;
}

export interface RefazerInput {
  oldFlashcard: string;
  changeCommands: string;
  mode: FlashcardMode;
  config: RefazerConfig;
}

export interface GenerationOutput {
  html: string;
}
