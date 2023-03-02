import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { mkdirSync, writeFileSync } from "fs";
import { getTempPath } from "../config";
import { Cell } from "../kernel";

let tempDir = getTempPath();

export let processCellsPython = (cells: Cell[]): ChildProcessWithoutNullStreams => {
    let innerScope = "";

    for (const cell of cells) {
        innerScope += `\nprint("!!output-start-cell");\n`;
        let lines = cell.contents.split("\n");
        for (let line of lines) {
            innerScope += line;
            innerScope += "\n";
        }
    };

    let mainFile = `${tempDir}/python/main.py`;
    mkdirSync(`${tempDir}/python`, { recursive: true });
    writeFileSync(mainFile, innerScope);

    return spawn('python', [mainFile]);
};
