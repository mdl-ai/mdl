var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  rawToNotebookCellData: () => rawToNotebookCellData
});
module.exports = __toCommonJS(extension_exports);

// src/markdownParser.ts
var import_util = require("util");
var import_vscode = require("vscode");
var LANG_IDS = /* @__PURE__ */ new Map([
  ["js", "javascript"],
  ["ts", "typescript"],
  ["rust", "rust"],
  ["go", "go"],
  ["nu", "nushell"],
  ["sh", "bash"],
  ["fish", "fish"],
  ["chatgpt", "chatgpt"]
]);
var LANG_ABBREVS = new Map(
  Array.from(LANG_IDS.keys()).map((k) => [LANG_IDS.get(k), k])
);
function parseCodeBlockStart(line) {
  const match = line.match(/(    |\t)?```(\S*)/);
  if (match) {
    return match[2];
  }
  return null;
}
function isCodeBlockStart(line) {
  return !!parseCodeBlockStart(line);
}
function isCodeBlockEndLine(line) {
  return !!line.match(/^\s*```/);
}
function parseMarkdown(content) {
  const lines = content.split(/\r?\n/g);
  let cells = [];
  if (lines.length < 2) {
    return cells;
  }
  let i = 0;
  while (i < lines.length) {
    const leadingWhitespace = i === 0 ? parseWhitespaceLines(true) : "";
    const lang = parseCodeBlockStart(lines[i]);
    if (lang) {
      parseCodeBlock(leadingWhitespace, lang);
    } else {
      parseMarkdownParagraph(leadingWhitespace);
    }
  }
  function parseWhitespaceLines(isFirst) {
    let start = i;
    const nextNonWhitespaceLineOffset = lines.slice(start).findIndex((l) => l !== "");
    let end;
    let isLast = false;
    if (nextNonWhitespaceLineOffset < 0) {
      end = lines.length;
      isLast = true;
    } else {
      end = start + nextNonWhitespaceLineOffset;
    }
    i = end;
    const numWhitespaceLines = end - start + (isFirst || isLast ? 0 : 1);
    return "\n".repeat(numWhitespaceLines);
  }
  function parseCodeBlock(leadingWhitespace, lang) {
    const language = LANG_IDS.get(lang) || lang;
    const startSourceIdx = ++i;
    while (true) {
      const currLine = lines[i];
      if (i >= lines.length) {
        break;
      } else if (isCodeBlockEndLine(currLine)) {
        i++;
        break;
      }
      i++;
    }
    const textEncoder = new import_util.TextEncoder();
    const content2 = lines.slice(startSourceIdx, i - 1).join("\n");
    const trailingWhitespace = parseWhitespaceLines(false);
    if (lang === "output") {
      cells[cells.length - 1].outputs = [{ items: [{ data: textEncoder.encode(content2), mime: "jackos.mdl/chatgpt" }] }];
    } else {
      cells.push({
        language,
        content: content2,
        kind: import_vscode.NotebookCellKind.Code,
        leadingWhitespace,
        trailingWhitespace
      });
    }
  }
  function parseMarkdownParagraph(leadingWhitespace) {
    const startSourceIdx = i;
    while (true) {
      if (i >= lines.length) {
        break;
      }
      const currLine = lines[i];
      if (isCodeBlockStart(currLine)) {
        break;
      }
      i++;
    }
    const content2 = lines.slice(startSourceIdx, i).join("\n");
    const trailingWhitespace = parseWhitespaceLines(false);
    cells.push({
      language: "markdown",
      content: content2,
      kind: import_vscode.NotebookCellKind.Markup,
      leadingWhitespace,
      trailingWhitespace
    });
  }
  return cells;
}
var stringDecoder = new import_util.TextDecoder();
function writeCellsToMarkdown(cells) {
  let result = "";
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    if (cell.kind === import_vscode.NotebookCellKind.Code) {
      let outputParsed = "";
      if (cell.outputs) {
        for (const x of cell.outputs) {
          if (x.items[0].mime.includes("text") && x.items[0].data.length) {
            outputParsed += stringDecoder.decode(x.items[0].data);
          }
        }
      }
      const languageAbbrev = LANG_ABBREVS.get(cell.languageId) ?? cell.languageId;
      const codePrefix = "```" + languageAbbrev + "\n";
      const contents = cell.value.split(/\r?\n/g).join("\n");
      const codeSuffix = "\n```";
      result += codePrefix + contents + codeSuffix;
      if (outputParsed !== "" && outputParsed !== "\n" && outputParsed.length > 0) {
        result += "\n```output\n" + outputParsed;
        if (outputParsed.slice(-1) !== "\n") {
          result += "\n";
        }
        result += "```";
      }
    } else {
      result += "\n" + cell.value;
    }
    result += "\n";
  }
  return result;
}

// src/commands/search.ts
var import_fs = require("fs");
var import_path2 = require("path");
var import_vscode3 = require("vscode");
var import_vscode4 = require("vscode");

// src/config.ts
var import_vscode2 = require("vscode");
var import_os = require("os");
var import_path = require("path");
var configuration = () => import_vscode2.workspace.getConfiguration("mdl");
var getBaseFile = () => configuration().get("baseFile") || "index.md";
var getBasePath = () => configuration().get("basePath") || (0, import_path.join)((0, import_os.homedir)(), "mdl");
var getTempPath = () => configuration().get("tempPath") || (0, import_path.join)((0, import_os.tmpdir)(), "mdl");

// src/commands/search.ts
var searchNotes = async () => {
  const basePath = getBasePath();
  const baseFile = (0, import_path2.join)(basePath, getBaseFile());
  (0, import_fs.stat)(baseFile, (err, _) => {
    if (err === null) {
    } else if (err.code === "ENOENT") {
      console.log("Creating welcome file");
      (0, import_fs.mkdirSync)(basePath, { recursive: true });
      (0, import_fs.writeFile)(baseFile, welcomeMessage, { flag: "wx" }, (err2) => {
        if (err2) {
          throw err2;
        }
        ;
      });
    } else {
      console.log("Error opening file: ", err.code);
    }
  });
  import_vscode4.workspace.updateWorkspaceFolders(import_vscode4.workspace.workspaceFolders ? import_vscode4.workspace.workspaceFolders.length : 0, null, { uri: import_vscode3.Uri.parse(basePath) });
  import_vscode4.workspace.openTextDocument(baseFile).then((doc) => {
    import_vscode4.window.showTextDocument(doc);
  });
  await import_vscode3.commands.executeCommand("workbench.action.findInFiles");
};
var welcomeMessage = `
# mdl
## Introduction
Welcome to mdl, run your Markdown code blocks interactively and save to a standard Markdown format that renders on Github!

## Searching notes
Pressing \`alt+f\` will add the default base path \`~/mdl\` to your workspace so you can search through your markdown notes, and open this index.md file. Any edits you do this file, or extra \`.md\` files you add to \`~/mdl\` will be searchable from any project via \`alt+f\`.

## Supported Lanugages
Try running the below cells, only Typescript and Javascript currently support language servers
\`\`\`rust
let x = "Rust is working!";
println!("{x}");
\`\`\`

\`\`\`go
x := "Go is working!"
fmt.Println(x)
\`\`\`

\`\`\`js
let x = "Javascript is working!";
console.log(x);
\`\`\`

\`\`\`ts
let y: string = "Typescript is working!";
console.log(y)
\`\`\`

## Previous Cells
This notebook implementation holds no state in a runtime, it simply runs all previous cells that match the language on every cell execution, try editing the previous Go cell without running it, then run this cell:
\`\`\`go
fmt.Println("Using previous cell:", x)
\`\`\`

## Generated Code
This is a simplification of conventional Notebooks that having long running kernels, \`mdl\` simply generates code in your \`temp\` directory and runs it using the language's toolchain. Try pressing \`alt+o\` to see what the generated code looks like.

The \`!!output-start-cell\` lines are what's used to split the outputs for each cell, so on every run if a previous cell has changed, it's updated as well.

This generated code will also allow you to check the generated code with your language server, native language servers for Notebook cells are still a work in progress.

## Imports
Importing external crates and packages are supported, Go will create a \`go.mod\` and run a \`go mod tidy\` if anything is missing, Rust will add it to \`Cargo.toml\`. Give it a try:
\`\`\`rust
use rand::prelude::*;

let i: i32 = rand::random();
println!("The random i32 is {}", i);
\`\`\`
\`\`\`go
import "github.com/google/uuid"

u := uuid.New()
fmt.Println(u)
\`\`\`
`;

// src/kernel.ts
var import_vscode6 = require("vscode");

// src/languages/rust.ts
var import_child_process = require("child_process");
var import_fs2 = require("fs");

// src/languages/rust_macros.ts
var prelude = `#[macro_export]
macro_rules! dbg_mdl {
    ($val:expr $(,)?) => {
        match $val {
            tmp => {
                ::std::println!("{:?}", &tmp);
                tmp
            }
        }
    };
    ($($val:expr),+ $(,)?) => {
        ($(dbg!($val)),+,)
    };
}

#[macro_export]
macro_rules! dbg {
    ($val:expr $(,)?) => {
        match $val {
            tmp => {
                ::std::println!("{} = {:#?}", ::std::stringify!($val), &tmp);
				tmp
            }
        }
    };
    ($($val:expr),+ $(,)?) => {
        ($(dbg_named!($val)),+,)
    };
}

#[macro_export]
macro_rules! dbg_mdl_pretty {
    ($val:expr $(,)?) => {
        match $val {
            tmp => {
                ::std::println!("{:#?}", &tmp);
				tmp
            }
        }
    };
    ($($val:expr),+ $(,)?) => {
        ($(dbg_pretty!($val)),+,)
    };
}

`;

// src/languages/rust.ts
var vscode = __toESM(require("vscode"));
var import_path3 = require("path");
var tempDir = getTempPath();
var processCellsRust = (cells) => {
  let crates = "";
  let outerScope = "";
  let innerScope = "";
  let cellCount = 0;
  let ignoredCell = 0;
  let tokio = false;
  let mainFunc = "";
  let cargo = "";
  for (let cell of cells) {
    cell.contents = cell.contents.trim();
    cellCount++;
    innerScope += `
    println!("!!output-start-cell");
`;
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
        innerScope = `
    println!("!!output-start-cell");
`.repeat(cellCount);
        mainFunc = "";
        continue;
      }
      if (line.startsWith("#[tokio::main")) {
        mainFunc += line;
        tokio = true;
        continue;
      }
      if (line.startsWith("async fn main()")) {
        mainFunc += "\n" + line;
        continue;
      }
      if (line.startsWith("fn main()")) {
        mainFunc = line;
        continue;
      }
      if (cargo === "") {
        if (line.startsWith("use")) {
          outerScope += line;
          outerScope += "\n";
          if (!line.startsWith("use std")) {
            let match = line.match(/use (\w+)/);
            if (match) {
              let crate = match[1];
              let alreadyFound = crates.split("\n");
              let latestVersion = '="*"';
              if (crate === "tokio") {
                tokio = true;
              } else {
                if (alreadyFound.indexOf(crate + latestVersion) < 0) {
                  crates += crate + latestVersion + "\n";
                }
              }
            }
          }
        } else {
          if (i === len) {
            if (line.length > 0 && line[line.length - 1] !== ";" && line[line.length - 1] !== "}") {
              if (line[0] === "#") {
                line = "dbg_mdl_pretty!(&" + line.substring(1) + ");";
              } else {
                line = "dbg_mdl!(&" + line + ");";
              }
            }
          }
          innerScope += "    " + line + "\n";
        }
      }
    }
    if (mainFunc.length > 0) {
      innerScope = innerScope.trimEnd();
      innerScope = innerScope.slice(0, -1);
    }
    mainFunc = "";
  }
  if (cellCount === ignoredCell) {
    mainFunc = "";
    innerScope = `
    println!("!!output-start-cell");
`.repeat(cellCount);
  }
  let workingDir;
  const activeEditor = vscode.window.activeTextEditor;
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(activeEditor.document.uri);
  if (typeof workspaceFolder !== "undefined") {
    workingDir = workspaceFolder.uri.path;
  } else {
    workingDir = (0, import_path3.dirname)(vscode.window.activeTextEditor?.document.uri.path);
  }
  if (mainFunc.length === 0) {
    mainFunc = ` fn main() -> Result<(), Box<dyn std::error::Error>> {`;
  }
  if (tokio) {
    crates += `tokio = { version = "*", features = ["full"] }
`;
  }
  outerScope = "#![allow(clippy::all, unused)]\nmod macros;" + outerScope;
  innerScope = `
    std::env::set_current_dir("${workingDir}").ok();` + innerScope;
  let main = outerScope + mainFunc + innerScope + "    Ok(())\n}";
  let mainFormatted = outerScope + mainFunc + innerScope + "    Ok(())\n}";
  mainFormatted = mainFormatted.replace(/\nprintln!\("!!output-start-cell"\);\n/g, "\n");
  if (cargo === "") {
    cargo = '[package]\nname = "output"\nversion = "0.0.1"\nedition="2021"\n[dependencies]\n' + crates;
  }
  console.log(`main file: ${tempDir}/rust/src/main.rs`);
  (0, import_fs2.mkdirSync)(`${tempDir}/rust/src`, { recursive: true });
  (0, import_fs2.writeFileSync)(`${tempDir}/rust/src/macros.rs`, prelude);
  (0, import_fs2.writeFileSync)(`${tempDir}/rust/src/main.rs`, main);
  (0, import_fs2.writeFileSync)(`${tempDir}/rust/src/main-formatted.rs`, mainFormatted);
  (0, import_fs2.writeFileSync)(`${tempDir}/rust/Cargo.toml`, cargo);
  return (0, import_child_process.spawn)("cargo", ["run", "--all-features", "--manifest-path", `${tempDir}/rust/Cargo.toml`]);
};

// src/languages/go.ts
var import_child_process2 = require("child_process");
var import_fs3 = require("fs");
var path = __toESM(require("path"));
var import_vscode5 = require("vscode");
var processCellsGo = (cells) => {
  let imports = "";
  let importNumber = 0;
  let outerScope = "";
  let innerScope = "";
  let containsMain = false;
  let parsingImports = false;
  let parsingFunc = false;
  let parsingIter = 0;
  let funcRegex = /func\s+(\w+)\s*\(/;
  let funcRecRegex = /func\s+\((\w+)\)\s*\w/;
  for (const cell of cells) {
    innerScope += `
fmt.Println("!!output-start-cell");
`;
    let lines = cell.contents.split("\n");
    for (let line of lines) {
      line = line.trim();
      let funcResult = line.match(funcRegex);
      let funcRecResult = line.match(funcRecRegex);
      if (funcResult) {
        if (funcResult[1] === "main") {
          containsMain = true;
          continue;
        } else {
          parsingFunc = true;
        }
      }
      if (funcRecResult) {
        parsingFunc = true;
      }
      if (line.startsWith("type")) {
        parsingFunc = true;
      }
      if (line.startsWith("import (")) {
        parsingImports = true;
      } else if (parsingImports) {
        if (line === ")") {
          parsingImports = false;
        } else {
          importNumber++;
          imports += "import " + line + "\n";
        }
      } else if (line.startsWith("import")) {
        importNumber++;
        imports += line;
        imports += "\n";
      } else if (parsingFunc) {
        outerScope += line;
        outerScope += "\n";
      } else {
        innerScope += line;
        innerScope += "\n";
      }
      if (parsingFunc) {
        if (line[0] === "}") {
          if (parsingIter === 1) {
            parsingIter = 0;
            parsingFunc = false;
          } else {
            parsingIter--;
          }
        }
        if (line[line.length - 1] === "{") {
          parsingIter++;
        }
      }
    }
    if (containsMain) {
      innerScope = innerScope.trim().slice(0, -1);
      containsMain = false;
    }
  }
  ;
  let main = "package main\n" + imports + outerScope + "func main() {\nlog.SetOutput(os.Stdout)\n" + innerScope + "}";
  let dir = path.join(getTempPath(), "go");
  let mainFile = path.join(dir, "main.go");
  (0, import_fs3.mkdirSync)(dir, { recursive: true });
  (0, import_fs3.writeFileSync)(mainFile, main);
  (0, import_child_process2.spawnSync)("gopls", ["imports", "-w", mainFile]);
  return (0, import_child_process2.spawn)("go", ["run", mainFile], { cwd: dir });
};
var fixImportsGo = (exec, cell) => {
  return new Promise((resolve, reject) => {
    let encoder = new TextEncoder();
    console.log("tidying");
    let tempDir6 = getTempPath();
    let goMod = "module github.com/mdl/temp\ngo 1.17\n";
    let goModFile = path.join(tempDir6, "go", "go.mod");
    (0, import_fs3.writeFileSync)(goModFile, goMod);
    let tidy = (0, import_child_process2.spawn)("go", ["mod", "tidy"], { cwd: path.join(tempDir6, "go") });
    tidy.stderr.on("data", (tidyData) => {
      console.log("data", tidyData);
      const x = new import_vscode5.NotebookCellOutputItem(tidyData, "jackos.mdl/chatgpt");
      exec.appendOutput([new import_vscode5.NotebookCellOutput([x])], cell);
    });
    tidy.stdout.on("data", (tidyData) => {
      console.log("data", tidyData);
      const x = new import_vscode5.NotebookCellOutputItem(tidyData, "jackos.mdl/chatgpt");
      exec.appendOutput([new import_vscode5.NotebookCellOutput([x])], cell);
    });
    tidy.on("close", async (_) => {
      exec.clearOutput(cell);
      let finished = encoder.encode("Go has finished tidying modules, rerun cells now...");
      const x = new import_vscode5.NotebookCellOutputItem(finished, "jackos.mdl/chatgpt");
      exec.appendOutput([new import_vscode5.NotebookCellOutput([x])], cell);
      exec.end(false, (/* @__PURE__ */ new Date()).getTime());
      resolve(0);
    });
  });
};

// src/languages/javascript.ts
var import_child_process3 = require("child_process");
var import_fs4 = require("fs");
var tempDir2 = getTempPath();
var processCellsJavascript = (cells) => {
  let innerScope = "";
  for (const cell of cells) {
    innerScope += `
console.log("!!output-start-cell");
`;
    let lines = cell.contents.split("\n");
    for (let line of lines) {
      line = line.trim();
      innerScope += line;
      innerScope += "\n";
    }
  }
  ;
  let mainFile = `${tempDir2}/javascript/main.js`;
  (0, import_fs4.mkdirSync)(`${tempDir2}/javascript/src`, { recursive: true });
  (0, import_fs4.writeFileSync)(`${tempDir2}/javascript/main.js`, innerScope);
  return (0, import_child_process3.spawn)("node", [mainFile]);
};

// src/languages/typescript.ts
var import_child_process4 = require("child_process");
var import_fs5 = require("fs");
var tempDir3 = getTempPath();
var processCellsTypescript = (cells) => {
  let innerScope = "";
  for (const cell of cells) {
    innerScope += `
console.log("!!output-start-cell");
`;
    let lines = cell.contents.split("\n");
    for (let line of lines) {
      line = line.trim();
      innerScope += line;
      innerScope += "\n";
    }
  }
  ;
  let mainFile = `${tempDir3}/typescript/main`;
  (0, import_fs5.mkdirSync)(`${tempDir3}/typescript`, { recursive: true });
  (0, import_fs5.writeFileSync)(mainFile + ".ts", innerScope);
  return (0, import_child_process4.spawn)("esr", [mainFile + ".ts"]);
};

// src/kernel.ts
var import_child_process7 = require("child_process");

// src/languages/shell.ts
var import_child_process5 = require("child_process");
var import_fs6 = require("fs");
var vscode2 = __toESM(require("vscode"));
var tempDir4 = getTempPath();
var processShell = (cells, language) => {
  let fileName = vscode2.window.activeTextEditor?.document.fileName;
  let dir = fileName.substring(0, fileName.lastIndexOf("/"));
  if (dir === "") {
    dir = fileName.substring(0, fileName.lastIndexOf("\\"));
  }
  let main = "";
  for (const cell of cells) {
    main += `#!/bin/${language}
echo '!!output-start-cell'
`;
    main += `cd ${dir}
`;
    main += cell.contents;
  }
  let extension = "sh";
  let runCommand = "bash";
  switch (language) {
    case "nushell":
      extension = "nu";
      break;
    case "fish":
      ;
      extension = "fish";
  }
  const filename = `${dir}/mdl.${extension}`;
  (0, import_fs6.writeFileSync)(filename, main);
  (0, import_fs6.chmodSync)(filename, 493);
  return (0, import_child_process5.spawn)(extension, [`${filename}`]);
};

// src/languages/python.ts
var import_child_process6 = require("child_process");
var import_fs7 = require("fs");
var tempDir5 = getTempPath();
var processCellsPython = (cells) => {
  let innerScope = "";
  for (const cell of cells) {
    innerScope += `
print("!!output-start-cell");
`;
    let lines = cell.contents.split("\n");
    for (let line of lines) {
      innerScope += line;
      innerScope += "\n";
    }
  }
  ;
  let mainFile = `${tempDir5}/python/main.py`;
  (0, import_fs7.mkdirSync)(`${tempDir5}/python`, { recursive: true });
  (0, import_fs7.writeFileSync)(mainFile, innerScope);
  return (0, import_child_process6.spawn)("python", [mainFile]);
};

// src/kernel.ts
var { promisify } = require("util");
var sleep = promisify(setTimeout);
var lastRunLanguage = "";
var Kernel = class {
  // Use the same code for Run All, just takes the last cell
  async executeCells(doc, cells, ctrl) {
    for (const cell of cells) {
      this.executeCell(doc, [cell], ctrl);
    }
  }
  async executeCell(doc, cells, ctrl) {
    let decoder = new TextDecoder();
    let encoder = new TextEncoder();
    let exec = ctrl.createNotebookCellExecution(cells[0]);
    exec.start((/* @__PURE__ */ new Date()).getTime());
    exec.clearOutput(cells[0]);
    let range = new import_vscode6.NotebookRange(0, cells[0].index + 1);
    let cellsAll = doc.getCells(range);
    let cellsStripped = [];
    let matchingCells = 0;
    for (const cell of cellsAll) {
      if (cell.document.languageId === cells[0].document.languageId) {
        matchingCells++;
        cellsStripped.push({
          index: matchingCells,
          contents: cell.document.getText(),
          cell
        });
      }
    }
    const lang = cells[0].document.languageId;
    if (lang === "chatgpt") {
      lastRunLanguage = "chatgpt";
      const url = "https://api.openai.com/v1/chat/completions";
      const headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer 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",
        "OpenAI-Organization": "org-w6zOoRsL3BhbJOc8Yi3GLozs"
      };
      const messages = [{ role: "system", content: "You are ChatGPT, an assistant helping to write code" }];
      for (const message of cellsStripped) {
        messages.push({ role: "user", content: message.contents });
      }
      const data = {
        model: "gpt-3.5-turbo",
        messages
      };
      let body = JSON.stringify(data);
      let result = await fetch(url, { headers, body, method: "POST" }).then((response) => response.json()).then((data2) => data2).catch((error) => console.error(error));
      for (const choice of result.choices) {
        const x = new import_vscode6.NotebookCellOutputItem(encoder.encode(choice.message.content), "jackos.mdl/chatgpt");
        exec.appendOutput([new import_vscode6.NotebookCellOutput([x])], cells[0]);
        exec.end(false, (/* @__PURE__ */ new Date()).getTime());
      }
      exec.end(true, (/* @__PURE__ */ new Date()).getTime());
    } else {
      const runProgram = new Promise((resolve, _) => {
        let output;
        const mimeType = `jackos.mdl/chatgpt`;
        switch (lang) {
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
            let esr = (0, import_child_process7.spawnSync)("esr");
            if (esr.stdout === null) {
              let response2 = encoder.encode("To make TypeScript run fast install esr globally:\nnpm install -g esbuild-runner");
              const x2 = new import_vscode6.NotebookCellOutputItem(response2, "jackos.mdl/chatgpt");
              exec.appendOutput([new import_vscode6.NotebookCellOutput([x2])], cells[0]);
              exec.end(false, (/* @__PURE__ */ new Date()).getTime());
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
            const x = new import_vscode6.NotebookCellOutputItem(response, "jackos.mdl/chatgpt");
            exec.appendOutput([new import_vscode6.NotebookCellOutput([x])], cells[0]);
            exec.end(false, (/* @__PURE__ */ new Date()).getTime());
            return;
        }
        let token = exec.token;
        token.onCancellationRequested(() => {
          output.kill();
          exec.end(false, (/* @__PURE__ */ new Date()).getTime());
        });
        let fixingImports = false;
        let currentCell = cellsStripped.pop();
        let errorText = "";
        output.stderr.on("data", async (data) => {
          if (data.toString().match(/no required module provides/) || data.toString().match(/go: updates to go.mod needed/)) {
            fixingImports = true;
            await fixImportsGo(exec, currentCell.cell);
          }
          errorText = data.toString();
          exec.appendOutput([new import_vscode6.NotebookCellOutput([import_vscode6.NotebookCellOutputItem.text(errorText, mimeType)])]);
        });
        let buf = Buffer.from([]);
        output.stdout.on("data", (data) => {
          let arr = [buf, data];
          buf = Buffer.concat(arr);
          let outputs = decoder.decode(buf).split("!!output-start-cell\n");
          let currentCellOutput = outputs[currentCell.index];
          exec.replaceOutput([new import_vscode6.NotebookCellOutput([import_vscode6.NotebookCellOutputItem.text(currentCellOutput)])]);
        });
        output.on("close", (_2) => {
          if (!fixingImports) {
            if (buf.length === 0) {
              exec.end(false, (/* @__PURE__ */ new Date()).getTime());
            } else {
              exec.end(true, (/* @__PURE__ */ new Date()).getTime());
            }
            resolve(0);
          }
        });
      });
      await runProgram;
    }
  }
};

// src/extension.ts
var import_vscode8 = require("vscode");

// src/commands/openMain.ts
var import_vscode7 = require("vscode");
var path2 = __toESM(require("path"));
var import_child_process8 = require("child_process");
var import_fs8 = require("fs");
var openMain = async () => {
  let tempDir6 = getTempPath();
  let main;
  let dir = path2.join(tempDir6, lastRunLanguage);
  switch (lastRunLanguage) {
    case "":
      import_vscode7.window.showWarningMessage("No cell has run yet, run a cell before trying to open temp file");
      return;
    case "rust":
      main = path2.join(dir, "src", "main.rs");
      let main_formatted = path2.join(dir, "src", "main-formatted.rs");
      (0, import_fs8.rename)(main_formatted, main, () => {
        console.log("moved file");
      });
      (0, import_child_process8.spawnSync)("cargo", ["fmt", "--manifest-path", `${tempDir6}/rust/Cargo.toml`]);
      break;
    case "go":
      dir = path2.join(tempDir6, "go");
      main = path2.join(dir, "main.go");
      break;
    case "nushell":
      dir = path2.join(tempDir6, "nu");
      main = path2.join(dir, "main.nu");
      break;
    default:
      import_vscode7.window.showErrorMessage("Language not implemented in `src/commands/openMain` please open Github issue");
      return;
  }
  import_vscode7.workspace.updateWorkspaceFolders(import_vscode7.workspace.workspaceFolders ? import_vscode7.workspace.workspaceFolders.length : 0, null, { uri: import_vscode7.Uri.parse(dir) });
  import_vscode7.workspace.openTextDocument(main).then((doc) => {
    import_vscode7.window.showTextDocument(doc, import_vscode7.ViewColumn.Beside, true);
  });
  if (lastRunLanguage === "rust") {
    import_vscode7.commands.executeCommand("rust-analyzer.reload");
  }
};

// src/extension.ts
var kernel = new Kernel();
async function activate(context) {
  const controller = import_vscode8.notebooks.createNotebookController("mdl", "mdl", "mdl");
  controller.supportedLanguages = ["rust", "go", "javascript", "typescript", "shellscript", "fish", "bash", "nushell", "json", "plaintext", "chatgpt", "python"];
  controller.executeHandler = (cells, doc, ctrl) => {
    if (cells.length > 1) {
      kernel.executeCells(doc, cells, ctrl);
    } else {
      kernel.executeCell(doc, cells, ctrl);
    }
  };
  context.subscriptions.push(import_vscode8.commands.registerCommand("mdl.kernel.restart", () => {
    import_vscode8.window.showInformationMessage("Restarting kernel");
  }));
  context.subscriptions.push(import_vscode8.commands.registerCommand("mdl.search", searchNotes));
  context.subscriptions.push(import_vscode8.commands.registerCommand("mdl.openMain", openMain));
  const notebookSettings = {
    transientOutputs: false,
    transientCellMetadata: {
      inputCollapsed: true,
      outputCollapsed: true
    }
  };
  context.subscriptions.push(import_vscode8.workspace.registerNotebookSerializer("mdl", new MarkdownProvider(), notebookSettings));
}
var MarkdownProvider = class {
  deserializeNotebook(data, _token) {
    const content = Buffer.from(data).toString("utf8");
    const cellRawData = parseMarkdown(content);
    const cells = cellRawData.map(rawToNotebookCellData);
    return {
      cells
    };
  }
  serializeNotebook(data, _token) {
    const stringOutput = writeCellsToMarkdown(data.cells);
    return Buffer.from(stringOutput);
  }
};
function rawToNotebookCellData(data) {
  return {
    kind: data.kind,
    languageId: data.language,
    metadata: { leadingWhitespace: data.leadingWhitespace, trailingWhitespace: data.trailingWhitespace, indentation: data.indentation },
    outputs: data.outputs || [],
    value: data.content
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  rawToNotebookCellData
});
//# sourceMappingURL=extension.js.map
