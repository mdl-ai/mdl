/* eslint-disable @typescript-eslint/naming-convention */
import { NotebookDocument, NotebookCell, NotebookController, NotebookCellOutput, NotebookCellOutputItem, NotebookRange, NotebookEdit, WorkspaceEdit, workspace, NotebookCellData, NotebookCellKind } from 'vscode';
import { processCellsRust } from "./languages/rust";
import { fixImportsGo, processCellsGo } from "./languages/go";
import { processCellsJavascript } from "./languages/javascript";
import { processCellsTypescript } from "./languages/typescript";
import { ChildProcessWithoutNullStreams, spawnSync } from 'child_process';
import { processShell as processShell } from './languages/shell';
import fetch from 'node-fetch';
import { processCellsPython } from './languages/python';
import { getOpenAIAPIKey, getOpenAIOrganizationID } from './config';
import { processCellsZig } from './languages/zig';


export interface Cell {
    index: number;
    contents: string;
    cell: NotebookCell;
}

interface ChatResponse {
    id: string,
    object: string,
    created: number,
    choices: [{
        index: 0,
        message: {
            role: string,
            content: string,
        },
        finish_reason: string
    }],
    usage: {
        prompt_tokens: number,
        completion_tokens: number,
        total_tokens: number
    }
}

interface ChatRequest {
    model: string,
    messages: ChatMessage[]
}

interface ChatMessage {
    role: string,
    content: string,
}

export let lastRunLanguage = '';

export class Kernel {
    // Use the same code for Run All, just takes the last cell
    async executeCells(doc: NotebookDocument, cells: NotebookCell[], ctrl: NotebookController): Promise<void> {
        for (const cell of cells) {
            this.executeCell(doc, [cell], ctrl);
        }
    }

    async executeCell(doc: NotebookDocument, cells: NotebookCell[], ctrl: NotebookController): Promise<void> {
        let decoder = new TextDecoder;
        let encoder = new TextEncoder;
        let exec = ctrl.createNotebookCellExecution(cells[0]);

        // Used for the cell timer counter
        exec.start((new Date).getTime());
        exec.clearOutput(cells[0]);

        // Get all cells up to this one
        let range = new NotebookRange(0, cells[0].index + 1);
        let cellsAll = doc.getCells(range);

        // Build a object containing languages and their cells
        let cellsStripped: Cell[] = [];
        let matchingCells = 0;
        for (const cell of cellsAll) {
            if (cell.document.languageId === cells[0].document.languageId) {
                matchingCells++;
                cellsStripped.push({
                    index: matchingCells,
                    contents: cell.document.getText(),
                    cell: cell,
                });
            }
        }

        const lang = cells[0].document.languageId;

        if (lang === "chatgpt") {
            lastRunLanguage = "chatgpt";
            const url = 'https://api.openai.com/v1/chat/completions';
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getOpenAIAPIKey()}`,
                'OpenAI-Organization': `${getOpenAIOrganizationID()}`,
            };
            const messages: ChatMessage[] = [{ role: "system", content: "You are ChatGPT, an assistant helping to write code" }];
            for (const message of cellsStripped) {
                messages.push({ role: "user", content: message.contents });
            }
            const data: ChatRequest = {
                model: 'gpt-3.5-turbo',
                messages
            };

            let body = JSON.stringify(data);

            const response = await fetch(url, { headers, body, method: 'POST' });
            if (response.status !== 200) {
                let error = await response.text();
                let t = encoder.encode("Make sure OpenAI API key and organization is set\nOpen settings and search for `openai`\nReceived an error from OpenAI: " + error);
                const x = new NotebookCellOutputItem(t, "text/plain");
                exec.appendOutput([new NotebookCellOutput([x])], cells[0]);
                exec.end(false, (new Date).getTime());
                return;
            }
            const result: ChatResponse = await response.json() as ChatResponse;

            let text = result.choices[0].message.content;
            let code_blocks = text.split("```");
            let language = "";
            let edits: NotebookCellData[] = [];
            for (let block of code_blocks) {
                if (block.startsWith("python")) {
                    language = "python";
                    block = block.substring(6);
                    let blockTrimmed = block.trim().replace("\n\n", "");
                    edits.push(new NotebookCellData(NotebookCellKind.Code, blockTrimmed, "python"));
                }
                else {
                    let blockTrimmed = block.trim().replace("\n\n", "");
                    edits.push(new NotebookCellData(NotebookCellKind.Markup, blockTrimmed, "markdown"));
                }

            }
            const edit = new WorkspaceEdit();
            let notebook_edit = NotebookEdit.insertCells(cells[0].index + 1, edits);
            edit.set(cells[0].notebook.uri, [notebook_edit]);
            workspace.applyEdit(edit);
            exec.end(true, (new Date).getTime());
        } else {
            let output: ChildProcessWithoutNullStreams;
            const mimeType = `text/plain`;
            switch (lang) {
                case "zig":
                    lastRunLanguage = "zig";
                    output = processCellsZig(cellsStripped);
                    break;
                case "rust":
                    lastRunLanguage = "rust";
                    output = processCellsRust(cellsStripped);
                    break;
                case "go":
                    lastRunLanguage = "go";
                    output = processCellsGo(cellsStripped);
                    break;
                case "python":
                    lastRunLanguage = "go";
                    output = processCellsPython(cellsStripped);
                    break;
                case "javascript":
                    lastRunLanguage = "javascript";
                    output = processCellsJavascript(cellsStripped);
                    break;
                case "typescript":
                    let esr = spawnSync("esr");
                    if (esr.stdout === null) {
                        let response = encoder.encode("To make TypeScript run fast install esr globally:\nnpm install -g esbuild-runner");
                        const x = new NotebookCellOutputItem(response, "text/plain");
                        exec.appendOutput([new NotebookCellOutput([x])], cells[0]);
                        exec.end(false, (new Date).getTime());
                        return;
                    }
                    lastRunLanguage = "typescript";
                    output = processCellsTypescript(cellsStripped);
                    break;
                case "bash":
                    lastRunLanguage = "bash";
                    output = processShell(cellsStripped, lastRunLanguage);
                    break;
                case "fish":
                    lastRunLanguage = "fish";
                    output = processShell(cellsStripped, lastRunLanguage);
                    break;
                case "nushell":
                    lastRunLanguage = "nushell";
                    output = processShell(cellsStripped, lastRunLanguage);
                    break;
                case "shellscript":
                    lastRunLanguage = "bash";
                    output = processShell(cellsStripped, lastRunLanguage);
                    break;
                default:
                    let response = encoder.encode("Language hasn't been implemented yet");
                    const x = new NotebookCellOutputItem(response, "text/plain");
                    exec.appendOutput([new NotebookCellOutput([x])], cells[0]);
                    exec.end(false, (new Date).getTime());
                    return;
            }
            // Allow for the ability to cancel execution
            let token = exec.token;
            token.onCancellationRequested(() => {
                output.kill();
                exec.end(false, (new Date).getTime());
            });

            let fixingImports = false;
            let currentCell = cellsStripped.pop() as Cell;
            let errorText = "";

            output.stderr.on("data", async (data: Uint8Array) => {
                if (data.toString().match(/no required module provides/) || data.toString().match(/go: updates to go.mod needed/)) {
                    fixingImports = true;
                    await fixImportsGo(exec, currentCell.cell);
                }
                errorText = data.toString();
                exec.appendOutput([new NotebookCellOutput([NotebookCellOutputItem.text(errorText, mimeType)])]);
            });

            let buf = Buffer.from([]);
            output.stdout.on('data', (data: Uint8Array) => {
                let arr = [buf, data];
                buf = Buffer.concat(arr);
                let outputs = decoder.decode(buf).split("!!output-start-cell\n");
                let currentCellOutput = outputs[currentCell.index];
                exec.replaceOutput([new NotebookCellOutput([NotebookCellOutputItem.text(currentCellOutput)])]);
            });

            output.on('close', (_) => {
                if (!fixingImports) {
                    // If stdout returned anything consider it a success
                    if (buf.length === 0) {
                        exec.end(false, (new Date).getTime());
                    } else {
                        exec.end(true, (new Date).getTime());
                    }
                }
            });
        }
    }
}
