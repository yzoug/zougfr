+++
title = "Local LLMs on potato computers feat. the llm Python CLI and sllm.nvim"
date = 2025-12-21
description = "How to integrate small, local LLMs into your workflow using Ollama, the `llm` Python CLI, the Neovim `sllm.nvim` plugin and more, focusing on computers with low hardware specs, e.g. a GPU with **2 GB of VRAM**."
[extra]
hot = true
toc = true
toc_sidebar = true
banner = "banner.webp"
[extra.comments]
id = 115758826566981633
+++

# Foreword

**The year is 2022**. We are living in a world where someone, not a machine, probably wrote that article or tutorial you're reading. Sure, the [Dead Internet](https://en.wikipedia.org/wiki/Dead_Internet_theory) theory is already gaining traction, but mostly, content online is created by people.

**Transformers** changed everything. In a 2017 research paper named ["Attention Is All You Need"](https://en.wikipedia.org/wiki/Attention_Is_All_You_Need), currently cited **207 000 times** 🤯, eight scientists working for Google introduced this revolutionary new technique, and late-2022, **ChatGPT** (_GPT_ for _Generative_, _Pre-trained_ and _Transformer_) was launched. Today, NVIDIA is the most valued company on Earth, firms like OpenAI and Anthropic boast enormous valuations and make even bigger promises, and AI is being forced down our throats at every occasion.

I do not like generative AI the way it is used and pushed by our tech overlords, but I do think the underlying science, machine learning, can be **very useful** and **not wasteful of resources** if done right. Machine learning has been a thing for decades at this point: LLMs (for _Large Language Models_, i.e. AI chatbots) and the current transformers-induced AI boom is just one very specific way it's used.

Like many, I've **never used** ChatGPT, Claude, Copilot, any of them. The argument "you should or you'll get left behind" is utter nonsense: don't take it from me, take it from people that [actively use these tools everyday](https://youtu.be/0ZUkQF6boNg?t=650).

The only AI that is of remote interest to me is AI I can run locally, so I've been keeping an eye on places like the [LocalLLaMA](https://www.reddit.com/r/LocalLLaMA/) subreddit and trying out **small** and **local** LLMs. These are what we call **open weight** models (not to be confused with truly **open source** models like [Olmo](https://allenai.org/olmo)). I want these models running on my laptop, not on a server, even if I control the server: this way, their fingerprint is kept very small (running them is no different than playing a video game).

In this article, I'll show you how to setup the [`llm`](https://github.com/simonw/llm) Python CLI, what you can do with it, and how to use it with Neovim using the [`sllm.nvim`](https://github.com/mozanunal/sllm.nvim) plugin. I'll share how I've been using these LLMs, and while **it didn't change my life**, it can be pretty useful, and probably will be more and more useful if small LLMs continue improving the way they have.

**If you must use AI, I recommend you use it in a similar way**. Keep control over your data, do not participate in the AI madness by paying hefty subscriptions or buying/renting monster GPUs, just use small, local models. If your computer is better than mine, you can use heavier models that will yield better results, and the inverse is true: we'll talk a bit about how to select the model that's right for you.

This article is split into two parts. The one you're reading, and a second, non-technical one about the AI bubble, the environmental costs, and the financial consequences of these tools, that [you can read here](@/stop-using-big-bloated-ai/index.md).

Let's dive right in!

# The resources at my disposal

## My laptop config

Meet my laptop, the _ASUS PC Portable Gamer FX552VE-DM380T_, bought in February 2018:

{{ image(url="my-computer.webp", alt="A photo of my computer") }}

I wouldn't call it _old_, I'd say it is _middle-aged_. I am confident I can squeeze a few more years out of it, and fully intend to do so. I use Linux, so Microsoft cannot [force me to throw it out](https://www.windowscentral.com/microsoft/windows-10/hp-and-dell-say-half-of-todays-pcs-still-run-windows-10) when Windows 10 support ends in October 2026. I've doubled the amount of RAM a few years ago (from 6 GB to 12), and the graphics card it has is an NVIDIA 1050Ti with **only 2 GB of VRAM**.

That last figure is important. A defining characteristic of a graphics card is how much VRAM or [video RAM](https://en.wikipedia.org/wiki/Video_random-access_memory) it has. This is very fast memory, way faster than your "normal" RAM, directly integrated inside the GPU. If your model fits inside that amount of memory, it will run _pretty fast_ (of course, the raw computing power of your GPU is also important). And since your GPU is doing the heavy lifting, your main system resources are not too bothered by the additional workload: you have your RAM and CPU power at your disposal for web browsing, text editing etc.

## The LLMs I can run

When browsing LLMs in places like [the Ollama model list](https://ollama.com/search) or [HuggingFace](https://huggingface.co/models?num_parameters=min:0,max:3B&apps=ollama&sort=trending), their name include the number of parameters they have e.g. `7B` stands for _7 billion_ and `0.6B` for _600 million_ parameters. These parameters are nothing more than weights in matrices, coefficients if you will. When an LLM runs, these parameters are loaded in memory, you feed the LLM an input (a prompt, a picture, a video feed...), some math happens i.e. multiplying the parameters and the input together and through layers, and you get an output, what the LLM produces.

This is how all neural networks work, not just LLMs. If you want to learn more about the math behind transformers specifically, I recommend you [watch this video](https://www.youtube.com/watch?v=wjZofJX0v4M) (actually, the whole series is great!).

I said earlier that my graphics card only has 2 GB of VRAM. This means it can load 2 gigabytes of data, one byte being **8 bits**. "Raw" LLMs store their parameters as **16-bit** (or even **32-bit**) values, but we can reduce this to a lot less with a technique called _quantization_ and without losing too much precision.

In a nutshell, for most use cases, `Q4_K_M` quantization is what we want to go for, the default quantization applied for Ollama models. This reduces the parameters to 4-bit values, but LLMs also need a substantial amount of overhead or cache, to hold calculation steps while they take place. In my case, my graphics card can fully load around `2B` models quantized with `Q4_K_M`.

That may seem like very little. If you've been following the subject you probably think a `7B` model is already a small LLM: some models are `675B` parameters. But `2B` models and even lower can already do **a lot**, e.g. Microsoft released [this `0.5B` model](https://huggingface.co/microsoft/VibeVoice-Realtime-0.5B) which can generate _very convincing_ speech from text with very low latency.

If a model doesn't fully fit in my graphics card's VRAM, I can still try to run it by mixing RAM and VRAM. This comes at a **heavy performance cost**, but is still useful if you want bigger (i.e. more precise) models and don't mind waiting for the output.

## Ollama

I use [Ollama](https://ollama.com/) to download and run LLMs, you could also use [llama.cpp](https://github.com/ggml-org/llama.cpp). Both are straight-forward to install, but if you run Linux like me, it used to be pretty hard to get your (NVIDIA specifically) graphics card configured and working. Thankfully, now that NVIDIA has a vested interest in making their graphics cards work on Linux, their drivers and CUDA have gotten _a lot_ better.

Running `ollama list` shows me the models I've downloaded:

{% crt() %}

```
NAME                                                         ID              SIZE
ministral-3:3b                                               xxxxxxxxxxxx    3.0 GB
yi-coder:1.5b                                                xxxxxxxxxxxx    866 MB
qwen3:4b                                                     xxxxxxxxxxxx    2.5 GB
gemma3:4b-it-q4_K_M                                          xxxxxxxxxxxx    3.3 GB
hf.co/lmstudio-community/Olmo-3-7B-Instruct-GGUF:Q4_K_M      xxxxxxxxxxxx    4.5 GB
hf.co/hugging-quants/Llama-3.2-1B-Instruct-Q8_0-GGUF:Q8_0    xxxxxxxxxxxx    1.3 GB
qwen3:1.7b                                                   xxxxxxxxxxxx    1.4 GB
gemma3:1b                                                    xxxxxxxxxxxx    815 MB
[...]
```

{% end %}

Some of these are heavier than others, but I can't go much higher than a `4B` model without my computer no longer keeping up.

# Use LLMs the Unix way with the `llm` plugin

You can try out your LLMs with Ollama by doing `ollama run <model-name>`, you can also chat with your LLMs via a web interface like [Open WebUI](https://github.com/open-webui/open-webui). However, my favorite way of using them is with the [`llm`](https://github.com/simonw/llm) Python CLI.

If you have `uv` installed, you can run:

```cmd
uv tool install llm
llm install llm-ollama
```

You can then list the models `llm` can use:

```cmd
llm models list
llm models default qwen3:1.7b # set a default model
```

{% crt() %}

```
[...]
Ollama: qwen3:1.7b
Ollama: gemma3:1b
Default: qwen3:1.7b
```

{% end %}

The very nice thing about this CLI is that it behaves like any shell command. You can pipe context to it, and it will be inputted to an LLM. You'll get the response back, that you can then write to a file or pipe to another command. For example, you can do things like:

```cmd
tail -n 100 online/gameplay.rs \
    | llm prompt -s \
    "Explain the handle_current_game_state Rust function" >> project_notes.md
```

This will pass the last 100 lines of the `online/gameplay.rs` file, where a function `handle_current_game_state` is defined, then ask (via the system prompt with `-s`) the model to explain what it does. The LLM will then append the response to a file. In this example, the `project_nodes.md` file contains (snippets):

{% crt() %}

```
### **Key Functionality Overview**

#### **2. Handling a Previous Game State**
- If a game state is provided (`game_state.is_some()`), it:
  - Checks if the game has already ended (e.g., a winner has been declared).
  - [...]

### **Flow of the Game**

1. **Player Input**:
   - The player inputs a move (e.g., "e2e4").
   - The system checks if the move is valid.
   - If valid, it sends the move to the game engine (e.g., Lichess) using `api.board_make_move`.
   - [...]

### **Asynchronous Nature**

- The function uses `await` to handle asynchronous operations (e.g., `tx.send()`).
- It waits for the `tx` channel to respond (e.g., for the opponent's move) before prompting the player again.

### **Summary**

The `handle_current_game_state` function is responsible for:
- Managing the flow of game states and moves.
- Prompting the user for input when no previous move is available.
[...]
```

{% end %}

...which is pretty accurate (not a 100%, but not far) and has been generated pretty fast on my laptop (42 seconds for 64 lines of explanations). Again, this is with a very small local model, only `1.7B` parameters.

> [!NOTE]
> Check out [the project](https://github.com/yzoug/minac) this is from, and help me out if it interests you 😉.

## The world is your oyster

With `llm`, you can create your own scripts for your use-cases. This is a simple yet **very** powerful feature.

For example, let's say I use [commitlint](https://commitlint.js.org/) to keep a clean Git history. Here's a script that generates a commit message from whatever I `git add`ed, and asks the LLM to correct its input if it fails the `commitlint` checks:

```bash
#!/bin/bash
# zoug.fr

# temporary files for our commands' output
DIFF_TEMP_FILE=$(mktemp)
COMMIT_MSG_TEMP_FILE=$(mktemp)
COMMIT_ERRORS_TEMP_FILE=$(mktemp)

# the prompts I use
# you probably should try other ones
CREATE_COMMIT_PROMPT="""
You're a very experienced developer, you write short commits.
Write a commit message using this template:

TYPE: DESCRIPTION

DETAILS

Replace TYPE by 'feat', 'fix' or 'docs'
Replace DESCRIPTION by a short sentence describing the changes
Replace DETAILS by a longer description of the changes
"""
CORRECT_COMMIT_PROMPT="""
Correct the input to fix the errors.
Do not try to change the commitlint configuration.
Only output the corrected input.
"""

# how many times should we ask the LLM to correct its own message
NUMBER_OF_RETRIES=2

git diff --cached >$DIFF_TEMP_FILE
llm -s "${CREATE_COMMIT_PROMPT}" <${DIFF_TEMP_FILE} >${COMMIT_MSG_TEMP_FILE}

# if the LLM doesn't pass the commitlint check
if ! commitlint <${COMMIT_MSG_TEMP_FILE} >${COMMIT_ERRORS_TEMP_FILE}; then
    while [[ ${NUMBER_OF_RETRIES} -gt 0 ]]; do
        # commitlint outputs the inputted commit message and all errors/warnings
        # feed that to the LLM and ask it to correct the commit
        llm -s "${CORRECT_COMMIT_PROMPT}" <${COMMIT_ERRORS_TEMP_FILE} >${COMMIT_MSG_TEMP_FILE}

        # insert a new line after 72 characters. Small LLMs tend to struggle enforcing this rule
        sed -ie "s/.\{72\}/&\n/g" ${COMMIT_MSG_TEMP_FILE}

        commitlint <${COMMIT_MSG_TEMP_FILE} >${COMMIT_ERRORS_TEMP_FILE}
        [[ $? -ne 0 ]] && ((NUMBER_OF_RETRIES--)) || break
    done
fi

# open the commit message in your configured git text editor
# since LLMs are not perfect, edits are often necessary
git commit -F "${COMMIT_MSG_TEMP_FILE}" -e

# cleanup
rm $DIFF_TEMP_FILE $COMMIT_MSG_TEMP_FILE $COMMIT_ERRORS_TEMP_FILE
```

With some `bash` and "prompt engineering" (which is, really, trying random prompts until one sticks), you now have your own **git commit writer**. To have this, you didn't have to send your data to anyone. Using a `1.7B` model on my laptop, it's a little slow, it's sometimes not accurate, but it works and is actually pretty useful if you follow good Git etiquette, i.e. small changes. Who needs ChatGPT?

> [!TIP]
> Two very cool features of `llm` I didn't touch on are **tools** and **plugins**. I suggest you head over to the [`llm` documentation](https://llm.datasette.io/en/stable/tools.html) to learn more.
>
> **Tools** allow you to give an LLM the possibility to call any custom Python function. **Plugins** are a more complete way of adding functionality to the `llm` CLI (including custom tools).
>
> There's [quite a few](https://llm.datasette.io/en/stable/plugins/directory.html) plugins you can try, especially if [you're feeling adventurous](https://github.com/luebken/llm-plugin-directory). It's also possible to [write your own](https://llm.datasette.io/en/stable/plugins/tutorial-model-plugin.html).

# Bring it to my editor

I use Neovim as my IDE. There's a bunch of Neovim plugins you can use for AI integration now (last time I checked, probably like 2 years ago, the landscape was very different). Of course, most of them focus on support for ChatGPT, Claude and other online services, but some like [CodeCompanion](https://github.com/olimorris/codecompanion.nvim) also support Ollama.

I've tried some of them (only if they support Ollama), and they felt a little "too much": I'm a simple man with a simple GPU and simple needs. What I want is a way to ask LLMs questions, get their answers, share some context from the files I'm editing, and that's pretty much it: I don't want the LLM to replace stuff in my files, add changes to my current `git` commit or anything invasive like that.

I've chosen the `llm` plugin as my AI CLI, and there's a Neovim plugin for people like me: [sllm.nvim](https://github.com/mozanunal/sllm.nvim). This plugin does a great job in staying out of the way, and uses `llm` under the hood. With it installed, I continue using LSP, non-AI auto-complete etc., a [standard Neovim config](https://github.com/yzoug/kickstart.nvim), but now also have the option to ask an LLM something if I choose to do so.

With LLMs directly integrated in my editor, I now ask them instead of using my web browser when I have basic questions. If I don't remember the exact syntax to import an environment variable with Python, I can easily ask for a snippet:

{{ image(url="sllm-nvim-env-var-python.webp", alt="Asking LLM through sllm.nvim for the syntax to get an environment variable in Python") }}

Same for getting the last inserted row's ID in an `sqlite3` database:

{{ image(url="sllm-nvim-last-inserted-row.webp", alt="Asking LLM through sllm.nvim for how to get last inserted row ID") }}

This has been great to replace some cumbersome Stack Overflow copy and paste, and again, small models like `yi-coder:1.5b` handle this **perfectly fine** and **very fast**.

What I also found myself using a lot is the ability to select text and pass it to the LLM as context for a prompt. Let's say I stumbled across a bit of Ansible (a server configuration tool), and want an explanation of what it does. I can select the piece of code of interest, and input a prompt:

{{ image(url="sllm-nvim-visual-selection-prompt.webp", alt="Passing Neovim's visual selection to llm with the sllm.nvim plugin") }}

`sllm.nvim` sends everything to the `llm` CLI, and you get the response:

{{ image(url="sllm-nvim-response.webp", alt="LLM output with visual selection as context") }}

This is useful in many scenarios, for example to write unit tests, to implement a new function by passing context from another one, etc.

`sllm.nvim` has other ways of building a comprehensive context depending on your needs, for example by including the whole current file, the LSP diagnostics, the contents of a given URL, etc.

I won't go into more details here, but you should definitely check out the `sllm.nvim` [GitHub repo](https://github.com/mozanunal/sllm.nvim) for more usage examples. The maintainer is nice to work with, so if you want to help out by opening issues or improving the plugin, don't hesitate to do so!

# Stop using big bloated AI

I hope I shared some useful ways you can use LLMs even if your hardware isn't new. But what I _really_ hope is that I can convince some of you, that use online AI services today, to switch to a local setup.

My position of refusing to use ChatGPT and the like, especially as someone working with computers, is often met online by "this grumpy dude/dudette wants to stay forever stuck in a terminal and never change its ways". There are however **a lot** of (other) very valid reasons.

I go into more details on all this in this article's second part, that [you can read here](@/stop-using-big-bloated-ai/index.md).

Thank you for making it this far! I would love to hear your thoughts on the matter. You can leave a comment down below or use my [contact form](@/contact/_index.md).
