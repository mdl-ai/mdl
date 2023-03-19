import type { ActivationFunction } from 'vscode-notebook-renderer';

export const activate: ActivationFunction = context => ({
    renderOutputItem(data, element) {
        element.innerHTML = `
            <h1>openai response<h1>
            <button>Add Code Block</button>
            <p>
            ${data.text()}
            </p>
        `;
    }
});
