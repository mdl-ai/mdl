import type { ActivationFunction } from 'vscode-notebook-renderer';

export const activate: ActivationFunction = context => ({
    renderOutputItem(data, element) {
        element.innerText = data.text();
    }
});
