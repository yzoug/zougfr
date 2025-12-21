+++
title = "Stop using big, bloated AI tools"
date = 2025-12-21
description = "Why you really should stop using online AI tools: a look at **the true benefits** they bring, the **environmental costs**, and the **financial state** of the industry."
[extra]
hot = true
toc = true
toc_sidebar = true
banner = "banner.webp"
#[extra.comments]
#id = 
+++

# Foreword

**The year is 2022**. We are living in a world where someone, not a machine, probably wrote that article or tutorial you're reading. Sure, the [Dead Internet](https://en.wikipedia.org/wiki/Dead_Internet_theory) theory is already gaining traction, but mostly, content online is created by people.

**Transformers** changed everything. In a 2017 research paper named ["Attention Is All You Need"](https://en.wikipedia.org/wiki/Attention_Is_All_You_Need), currently cited **207 000 times** 🤯, eight scientists working for Google introduced this revolutionary new technique, and late-2022, **ChatGPT** (_GPT_ for _Generative_, _Pre-trained_ and _Transformer_) was launched. Today, NVIDIA is the most valued company on Earth, firms like OpenAI and Anthropic boast enormous valuations and make even bigger promises, and AI is being forced down our throats at every occasion.

I do not like generative AI the way it is used and pushed by our tech overlords, but I do think the underlying science, machine learning, can be **very useful** and **not wasteful of resources** if done right. Machine learning has been a thing for decades at this point: LLMs (for _Large Language Models_, i.e. AI chatbots) and the current transformers-induced AI boom is just one very specific way it can be used.

Like many, I've **never used** ChatGPT, Claude, Copilot, any of them. The argument "you should or you'll get left behind" is utter nonsense: don't take it from me, take it from people that [actively use these tools everyday](https://youtu.be/0ZUkQF6boNg?t=650).

The only AI that is of remote interest to me is AI I can run locally, so I've been keeping an eye on places like the [LocalLLaMA](https://www.reddit.com/r/LocalLLaMA/) subreddit and trying out **small** and **local** LLMs. These are what we call **open weight** models (not to be confused with truly **open source** models like [Olmo](https://allenai.org/olmo)). I want these models running on my laptop, not on a server, even if I control the server: this way, their fingerprint is kept very small (running them is no different than playing a video game).

In this article's first part, we talked about ways to make use of small local LLMs, no matter how beefy your computer is, focusing on the [`llm`](https://github.com/simonw/llm) Python CLI and the Neovim [`sllm.nvim`](https://github.com/mozanunal/sllm.nvim) plugin: you can [read it here](@/local-llms-potato-computers/index.md).

We'll now talk more about the true benefits these tools bring, the environmental costs of using online AI, and the AI bubble and its financial consequences.

# There's no proof you're better off using it

You probably _feel like_ you're coding faster by letting AI handle most of it. The truth is, especially if you're working on complicated or legacy code bases, [this study says you may be _loosing_ time](https://arstechnica.com/ai/2025/07/study-finds-ai-tools-made-open-source-software-developers-19-percent-slower/) because of it:

> \[The\] developers believed that the AI tools had made them 20 percent faster, on average. In reality, though, the AI-aided tasks ended up being completed 19 percent _slower_ than those completed without AI tools.

After reviewing screen footage, the study's authors ([METR](https://metr.org/about)) conclude that the time spent "reviewing AI outputs, prompting AI systems, and waiting for AI generations" completely offset the gains (and then some). They however feel "optimistic" about this, saying that improvements in AI tools could lead to future efficiency gains. You could also argue that their sample size is a little small (16 developers followed). For now though, no matter what the AI start-ups say, this is _at least some_ proof of a **net loss** in efficiency, in **real-life scenarios**, in a recent and serious study.

You will however find other research with vastly different findings. Like this one (by Microsoft) that says developers complete tasks [56% faster](https://arxiv.org/pdf/2302.06590) with AI (specifically their own product, GitHub Copilot). It was conducted in 2023, and in the trial they use as the study's basis, "programmers were tasked and incentivized to implement an HTTP server in JavaScript **as quickly as possible**". In my view, and unlike the study above, this is not really representative of real-life coding tasks.

Another study is the [2025 DORA report](https://cloud.google.com/blog/products/ai-machine-learning/announcing-the-2025-dora-report?hl=en): this one is from Google and (which is weird to see in research, to say the least) platinum, gold and silver [sponsors](https://dora.dev/research/2025/sponsors/). The report calls AI "the great amplifier":

> AI accelerates software development, but that acceleration can expose weaknesses downstream. Without robust control systems, like strong automated testing, mature version control practices, and fast feedback loops, an increase in change volume leads to instability. Teams working in loosely coupled architectures with fast feedback loops see gains, while those constrained by tightly coupled systems and slow processes see little or no benefit.

I'm not saying AI never helps. What I am saying is that the benefits are **unclear**, even three years after ChatGPT came out, and billions upon billions invested. A couple weeks ago, [it was reported](https://futurism.com/artificial-intelligence/microsoft-sell-ai-agents-disaster) that Microsoft’s Azure salespeople "are seriously struggling to meet some extremely ambitious sales growth targets, cutting quotas by up to 50 percent earlier this year"; so it seems customers are also questioning these benefits.

# It's one more way we destroy our planet

If you don't care about CO₂ emissions and the state of the planet, you're either a very cynical individual and do not care what _your_ life and that of others will look like in ~30 years, or you don't understand the problem and its consequences well enough. Sorry, that's just the truth.

If you do care about ecology, it's impossible to ignore the very tangible effects of "the cloud". According to [the IEA](https://www.iea.org/energy-system/buildings/data-centres-and-data-transmission-networks), in 2022 (so "before AI"):

> Estimated global data centre electricity consumption in 2022 was 240-340 TWh, or around **1-1.3% of global final electricity demand**. This excludes energy used for cryptocurrency mining, which was estimated to be around 110 TWh in 2022, accounting for **0.4% of annual global electricity demand**.

AI is taking this to a whole other level: data centers today are of a completely different scale. Just [watch this promotional video](https://www.youtube.com/watch?v=Jf8EPSBZU7Y) of Musk's data center for Grok to get a sense of the sheer amount of computing power and resources poured into AI.

That data center contains around **100 000 GPUs**, and probably looks like a pocket calculator when compared to the **Stargate** project. Just look at it:

{{ image(url="stargate-datacenter-aerial.webp", alt="Aerial view of the Stargate datacenter") }}

Stargate is projected to have a total capacity of [5 GW of electricity](https://arstechnica.com/ai/2025/07/openai-and-partners-are-building-a-massive-ai-data-center-in-texas/): that's enough to power "4.4 million American homes". This is not even mentioning the amount of fresh water needed for cooling (in Texas, of all places).

Before the current AI boom, **Bitcoin** was probably the most useless, most wasteful way we were using computers and GPUs specifically (and is still up there **and growing**, very unfortunately). We have millions of high-end, very powerful computers around the globe, "mining Bitcoin", which is really trying random hashes until they find one that [start with a given number of 0's](https://learnmeabitcoin.com/technical/mining/target/). It's just useless brute-force, and we as a species are dedicating **[114 million tons](https://digiconomist.net/bitcoin-energy-consumption) of our global CO₂ emissions** to this. I really can't put into words how ridiculously wasteful it is.

Today, we have a new player in town, and [recent research suggest](https://www.researchgate.net/publication/391986497_Artificial_intelligence_Supply_chain_constraints_and_energy_implications) it may already consume more than Bitcoin by the end of 2025. People are generating AI messages, images and videos at an unprecedented rate: we're really only at the beginning of this.

# It's going to have devastating consequences

I won't talk here about the effects AI is having and will have in the future on society. Won't talk about how it has thrown us into a world where we just can't trust anything we see online anymore. Nor will I mention that it's created [based on large-scale theft](https://torrentfreak.com/meta-torrented-over-81-tb-of-data-through-annas-archive-despite-few-seeders-250206/): "that genie is out of the bottle", as [Linus Torvalds puts it](https://youtu.be/mfv0V1SxbNA?si=_zs07og5xYes3IBa&t=2015).

I want to focus here on the AI bubble and what will happen when it'll burst. Before getting into the bad stuff, some good will probably come out of it. My thoughts on the matter are largely summarized by this quote from a Cory Doctorow recent speech, and I highly recommend [you read the whole thing](https://pluralistic.net/2025/12/05/pop-that-bubble/#u-washington):

> AI is a bubble and it will burst. Most of the companies will fail. Most of the data-centers will be shuttered or sold for parts. So what will be left behind?
>
> We'll have a bunch of coders who are really good at applied statistics. We'll have a lot of cheap GPUs, which'll be good news for, say, effects artists and climate scientists, who'll be able to buy that critical hardware at pennies on the dollar.
>
> And we'll have the open source models that run on commodity hardware, AI tools that can do a lot of useful stuff, like transcribing audio and video, describing images, summarizing documents, automating a lot of labor-intensive graphic editing, like removing backgrounds, or airbrushing passersby out of photos. These will run on our laptops and phones, and open source hackers will find ways to push them to do things their makers never dreamt of.

As we've seen in this article's first part, "open \[weight\] models that run on commodity hardware" can already be very useful. But what about the financial consequences?

We're already seeing some troubling signs. Le Monde, a French newspaper, just published [an article](https://www.lemonde.fr/economie/article/2025/12/18/oracle-symbole-du-degonflement-de-la-bulle-de-l-ia_6658498_3234.html) about the Oracle valuation, and calls it "a symbol of the AI bubble's bursting". You may remember that, for a short while, Larry Ellison was the richest man on Earth after the price of Oracle stock skyrocketed back in September: that was after the announcement of a **300 billion** (I mean, numbers no longer make any sense at this point) deal with OpenAI.

The share reached $345 at most. Today, that same stock is worth $191: **that's a 45% plunge**.

Oracle [doesn't have customers, it has prisoners](https://youtu.be/KW80Yjib7RA?si=BQZtB9MyGpTp4XyR&t=403). They're a very profitable business, but at this point, their fate is entangled with that of NVIDIA, OpenAI, all of the big AI players: those _circular deals_ people are worried about.

Two months ago, the Financial Times [published this piece](https://www.ft.com/content/59baba74-c039-4fa7-9d63-b14f8b2bb9e2) about 10 different AI start-ups that, all together, make up a **one trillion dollars** valuation. That's 1 000 billion, or 1 000 000 million dollars:

> Tech has endured boom and bust cycles. The dotcom crash in 2000 decimated a generation of internet companies, and VCs are still picking through the debris left after a software investment frenzy stoked by low interest rates came to a juddering halt in 2022.
>
> But the current scale of investment is of a different magnitude. VCs invested $10.5bn into internet companies in 2000, roughly $20bn adjusted for inflation. In all of 2021, they put $135bn into software-as-a-service start-ups, according to PitchBook. VCs are on course to spend well over $200bn on AI companies this year.
>
> \[...\]
>
> The deals with chipmakers, like VC investment, are a bet that AI demand will continue its stratospheric growth, helped along by research breakthroughs and new products.

I'm not an economist, I am not well-versed in these subjects, but I fear it won't be pretty. The AI bubble is estimated by some to be [**17 times** bigger than the dot-com bust and **4 times the subprime bubble**](https://www.marketwatch.com/story/the-ai-bubble-is-17-times-the-size-of-the-dot-com-frenzy-this-analyst-argues-046e7c5c). We're probably in for another financial crisis: AI companies will go under, people will get fired, markets around the world will be affected, buckets upon buckets of money will disappear... and [Michael Burry will get richer](https://www.ft.com/content/7fe1362b-d696-4334-86ef-607b80f1739f). It sucks all around, and we probably can't do much to prevent it. But what _can_ we do?

At an individual scale, really only one thing: **stop using online generative AI**. Use local models if you must, and brace for impact. The faster the bubble bursts, the sooner the madness stops, and, _I dare hope_, the sooner we can focus on keeping a habitable planet and improving lives around the globe instead of continuing to waste resources we can't spare.

Thank you for making it this far! I would love to hear your thoughts on the matter. You can leave a comment down below or use my [contact form](@/contact/_index.md).
