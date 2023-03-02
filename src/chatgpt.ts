import type { ActivationFunction } from 'vscode-notebook-renderer';

export const activate: ActivationFunction = context => ({
    renderOutputItem(data, element) {
        console.log(context);
        element.innerText = JSON.stringify(data.json());
    }
});

