// jsdom (30) has no HTMLDialogElement.showModal()/close(): a minimal stand-in that only toggles `open`.
// The real behavior (top layer, inert page, Esc → cancel event) is covered by the e2e tests.
export function installDialogStub() {
  const proto = HTMLDialogElement.prototype as HTMLDialogElement & Record<string, unknown>;
  const original = { showModal: proto['showModal'], close: proto['close'] };
  const showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  });
  const close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open');
  });
  Object.defineProperty(proto, 'showModal', {
    value: showModal,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(proto, 'close', { value: close, configurable: true, writable: true });
  const restore = () => {
    Object.defineProperty(proto, 'showModal', {
      value: original.showModal,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(proto, 'close', {
      value: original.close,
      configurable: true,
      writable: true,
    });
  };
  return { showModal, close, restore };
}
