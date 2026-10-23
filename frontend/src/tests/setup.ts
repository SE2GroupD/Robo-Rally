import '@testing-library/jest-dom/vitest';

// jsdom does not implement the native dialog lifecycle. Browser checks cover
// focus trapping and the top-layer backdrop; unit tests exercise open/close state.
HTMLDialogElement.prototype.showModal = function () {
  this.open = true;
};
HTMLDialogElement.prototype.close = function () {
  this.open = false;
};
