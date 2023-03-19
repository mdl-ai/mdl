import type { ActivationFunction } from 'vscode-notebook-renderer';

export const activate: ActivationFunction = context => ({
    renderOutputItem(data, element) {
        element.innerHTML = `<a href="https://google.com" class="button">${data.text()}</a>`;
    }
});
