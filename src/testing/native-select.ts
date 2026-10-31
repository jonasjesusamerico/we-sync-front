/**
 * Teste: lê e escolhe opções de um `<select>` nativo, com nomes parecidos com os do antigo `MatSelectHarness`.
 * Opções `hidden` (o "vazio" de um campo obrigatório) não contam.
 */
export interface NativeSelect {
  readonly element: HTMLSelectElement;
  /** Texto da opção escolhida, ou `''` sem escolha. */
  getValueText(): Promise<string>;
  getOptions(): Promise<{ getText(): Promise<string> }[]>;
  /** Escolhe pelo texto e avisa o formulário (`change`). */
  select(text: string): void;
}

export function nativeSelect(element: HTMLSelectElement): NativeSelect {
  const visible = () => Array.from(element.options).filter((o) => !o.hidden);
  return {
    element,
    getValueText: async () => {
      const option = element.options[element.selectedIndex];
      return option && !option.hidden ? option.text.trim() : '';
    },
    getOptions: async () => visible().map((o) => ({ getText: async () => o.text.trim() })),
    select: (text) => {
      const option = visible().find((o) => o.text.trim() === text);
      if (!option) {
        throw new Error(`Opção não encontrada: ${text}`);
      }
      element.value = option.value;
      element.dispatchEvent(new Event('change'));
    },
  };
}
