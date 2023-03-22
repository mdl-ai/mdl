import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { mkdirSync, writeFileSync } from "fs";
import { getTempPath } from "../config";
import { Cell } from "../kernel";
import * as vscode from "vscode";
import { dirname } from "path";


let tempDir = getTempPath();

export const processCellsZig = (cells: Cell[]): ChildProcessWithoutNullStreams => {
    let crates = "";
    let outerScope = `const std = @import("std");
var stdout_mutex = std.Thread.Mutex{};
pub fn println(comptime fmt: []const u8, args: anytype) void {
    stdout_mutex.lock();
    defer stdout_mutex.unlock();
    const stdout = std.io.getStdOut().writer();
    nosuspend stdout.print(fmt, args) catch return;
    nosuspend stdout.print("\\n", .{}) catch return;
}\n`;
    let innerScope = "";
    let cellCount = 0;
    let ignoredCell = 0;
    let tokio = false;
    let mainFunc = "";
    let cargo = "";

    for (let cell of cells) {
        // Remove newlines to avoid logic conflicts
        cell.contents = cell.contents.trim();
        cellCount++;
        innerScope += `\n    try stdout.print("!!output-start-cell\\n", .{});\n`;
        let lines = cell.contents.split("\n");
        const len = lines.length;
        let i = 0;
        for (let line of lines) {
            line = line.trim();
            if (line.startsWith("#[ignore]")) {
                ignoredCell = cellCount;
                break;
            }

            if (line === "[package]") {
                cargo = cell.contents;
                break;
            }

            i++;
            if (line.startsWith("#[restart]")) {
                innerScope = `\n    try stdout.print("!!output-start-cell\\n", .{});\n`.repeat(cellCount);
                mainFunc = "";
                continue;
            }

            if (line.startsWith("pub fn main() !void {")) {
                mainFunc = line;
                continue;
            }

            if (line.includes("@import")) {
                outerScope += line + "\n";
                continue;
            }

            if (i === len) {
                // If last item is an expression, debug it
                if (line.length > 0 && line[line.length - 1] !== ";" && line[line.length - 1] !== "}") {
                    // if first char is `#` pretty print
                    line = `try stdout.print("{s}\\n", .{${line}});`;
                }

            }
            innerScope += "    " + line + "\n";
        }

        if (mainFunc.length > 0) {
            innerScope = innerScope.trimEnd();
            innerScope = innerScope.slice(0, -1);
        }
        mainFunc = "";
    }
    if (cellCount === ignoredCell) {
        mainFunc = "";
        innerScope = `\n    try stdout.print("!!output-start-cell\\n", .{});\n`.repeat(cellCount);
    }
    let workingDir;
    const activeEditor = vscode.window.activeTextEditor as vscode.TextEditor;
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(activeEditor.document.uri);
    if (typeof workspaceFolder !== "undefined") {
        workingDir = workspaceFolder.uri.path;
    } else {
        workingDir = dirname(vscode.window.activeTextEditor?.document.uri.path as string);
    }
    if (mainFunc.length === 0) {
        mainFunc = `pub fn main() !void {
    const stdout = std.io.getStdOut().writer();`;
    }
    let main = outerScope + mainFunc + innerScope + "\n}";

    console.log(`main file: ${tempDir}/zig/src/main.zig`);
    mkdirSync(`${tempDir}/zig/src`, { recursive: true });
    writeFileSync(`${tempDir}/zig/src/main.zig`, main);
    return spawn('zig', ['run', `${tempDir}/zig/src/main.zig`]);
};
