# MDL 
## Quick Start
- Open or create a `.md` document
- Right-click the filename and select `Open With` or `Reopen Editor With...` and select `mdl`
- Add a cell Chose your language in the bottom right
- Run the code and save the document
- The output is now saved to standard Markdown which renders on Github

## Use ChatGPT to generate code
- Go to vscode settings and search for `openai` to set your API key and organization
 - [api key link](https://platform.openai.com/account/api-keys)
 - [org id link](https://platform.openai.com/account/org-settings)
- Change the language in the bottom right to ChatGPT
- Type in your question and end execute

## Set MDL as default markdown editor
Right-click on a markdown file and select `Reopen Editor With...` you can `configure default editor` and change to `mdl` 

## Notes Repository
You can change keybindings in File > Preferences > Keybindings > search for "mdl". Or you can run them via command palette typing in "mdl"

### Search Notes
This feature is inspired by `vimwiki` so you don't need another note keeping app.

Press `alt+f` to open search in the `base path` (defaults to `~/mdl`) which can be changed in settings: Code > Settings > Settings > search for "mdl". Any notes you keep in here will be searchable by pressing `alt+f`.

### Open Generated Code
Press `alt+o` to open up the source code being used to generate outputs, which will allow you to check your code with a language server if it's not supported in the cells yet.

## Language Support
It's very simple to add your own language, look inside [src/languages/rust.ts](https://github.com/jackos/mdl/blob/main/src/languages/rust.ts) for an example, then add your language to the switch statement in [`src/kernel.ts`](https://github.com/jackos/mdl/blob/main/src/kernel.ts). Please open a pull request if you add a language.

### Rust       
- [x] Use external code:
```rust
use rand::Rng;
```

- [x] Debug final expression:
```rust
let x = vec![1, 2, 3];
x
```
```output
[1, 2, 3]
```

Or you can pretty debug by putting a `#` on the front:
```rust
let x = vec![1, 2, 3];
#x
```
```output
[
    1,
    2,
    3,
]
```

- [ ] Language Server Support

I did get `Rust-analyzer` working in a very hacky way by messing with VS Code but it's not reliable enough to release, working on a proxy language server instead.

### Go         
- [x] Import External Code
- [ ] Language Server Support

### Javascript 
- [ ] Import External Code
- [x] Language Server Support

### Typescript 
- [ ] Import External Code
- [x] Language Server Support

## Inspiration
Jupyter Notebooks are a great learning and documentation tool for Python that hasn't caught on for compiled languages, `mdl` simplifies the concept by removing all state and the need for kernels by using your local toolchain, along with `markdown` as the source code for nice rendering on github and static site generators.
