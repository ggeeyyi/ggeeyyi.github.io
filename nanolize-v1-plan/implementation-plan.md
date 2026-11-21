# nanolize 分层版本实施方案：v0 → v1 → v2 → v3

- **分支**：`layered-controller`，建在 PR #45 的合并点 `21d8a28e` 上。
- **状态**（2026-11-21）：方案，还没动代码。v0 到 v2 做过设计评审并已修订；v1 封存之前的一半之后按决定重写，未再评审；v3 是之后新增的，未评审。
- **配套页面**：[前端页面](https://ggeeyyi.github.io/nanolize-v1-plan/)（https://ggeeyyi.github.io/nanolize-v1-plan/）上只放核心设计：现在和 v0 到 v3 的流程图、每一步谁来定、分层表。其余的设计细节都记在这份文件里。
- **读法**：文中说到“图”，指那一页的流程图面板；带“流程图”字样的链接会直接打开对应的版本和开关组合。“你定的”指用户已经做出的决定，“我”指写这份方案的 Claude。

## 目录

1. [概要：四个版本](#overview)
2. [范围和设定](#scope)
3. [两个开关](#switches)
4. [每一步谁来定](#ladder)
5. [分层](#layers)
6. [逐项清单：每个决定现在谁定，改成什么，从哪个版本起](#inventory)
7. [现在的行为：四种组合](#now-details)
8. [v0 到 v3 各种组合的流程说明](#flow-notes)
9. [v0 的改动：controller 排 author](#work-v0)
10. [v1 的改动](#work-v1)
11. [v2 的改动](#work-v2)
12. [v3：程序管的那张关系表](#relation)
13. [v3 的改动](#work-v3)
14. [工作包和顺序](#packages)
15. [怎么验证](#verify)
16. [风险和对策](#risks)
17. [需要你定的](#decide)
18. [这几个版本都不做的，留给后面](#later)
19. [评审之后改了什么](#review)
20. [依据](#basis)

<a id="overview"></a>

## 1. 概要：四个版本

新版本要做成 host agent → controller → author / test designer / verifier 三层，一版一版把流程交给 controller。v0 到 v2 跑的是同一条流程，功能保持一致，区别只在哪些步骤先问 controller：**v0** 由它排 author；**v1** 再加封存之后的每一步（保存、第一次全量对比、导入），以及封存之前设计 leaf 测试怎么排；**v2** 再加封存之前要不要补一次设计。baseline 的抓取和封存，这三个版本都由 mainline 执行。**v3** 换一个做法：不再分 main job 和 draft job，程序只管工具之间的依赖和互斥，流程由一个 controller 调度。

每一版都建在上一版上面，做完就是一个能单独使用的版本。这三级台阶不一样大：v0 是一大步，但只在 parallel 关着时；v1 也是一大步，封存之后每一步先问它，封存之前的设计整个交给它；v2 是一个二选一。原因见[评审之后改了什么](#review)。**v3 换了做法**：流程不再写死，程序只规定工具之间的依赖和互斥，怎么排交给 controller。

### v0

**controller 排 author**。封存后由它排首版，parallel 开或关、两个作业都是。parallel 关着时所有会话一个接一个，程序不划分 scope。

test designer 仍由程序排，controller 在封存之前不被问。保存和第一次全量对比之前不单独问它；导入时一律等。parallel 开着时，谁来定和今天相同。

### v1

**封存之后每一步都先问 controller；封存之前，设计 leaf 测试怎么排由它定**。在 v0 上加：到保存、第一次全量对比这几步先问它一轮，它能看了上一步的结果再定；parallel 开着时，导入等不等 draft job 由 main job 的 controller 定；设计 leaf 测试的安排全部归它：分几次调用、每次设计哪些 leaf、一个 leaf 几个会话、先后、同时几个。

baseline 和封存仍是 mainline 的。给哪些 leaf 设计仍由程序算，它没排到的由程序补齐；门、试跑、评审不变。

### v2

**封存之前要不要再补一次设计，由 controller 定**。在 v1 上加：每个目标 leaf 都设计过一遍之后问它一轮，照常封存，还是先给还缺有效测试的 leaf 补一次设计。

baseline 的抓取和封存本身仍由 mainline 执行，这是你定的。每个目标 leaf 至少设计一遍、门、试跑、评审和封存的检查仍归程序。

### v3

**一个 controller 按关系表调度整个作业**。在 v2 上改：不再分 main job 和 draft job，pair 开着时作业里多一个隔离的预写区；程序只管工具之间的依赖和互斥，两个开关各解除表里的一组互斥；同时开什么、各开几个、先验哪部分，都是 controller 的调用。

合同区照 v2 不变：抓 baseline、封存没有取舍，程序直接做；设计怎么排、补不补设计，都在看不到预写区的轮里定。证据规则、上限和隔离仍归程序。v3 还没有做过设计评审。

<a id="scope"></a>

## 2. 范围和设定

### 你定的

- **分层**：host agent → controller → author / test designer / verifier，逐版把自由度交给 controller。
- **两个开关**：pair 管 draft job 和 main job 是否重叠；parallel 管其余所有并行。关着时所有会话一个接一个，程序不划分 scope，由 controller 决定一次写完还是按 capability 分几次写。
- **v0**：只做 author 的编排，controller 不参与 test designer 的编排。
- **v0 里的 test designer**：parallel 关着时，程序按固定顺序一次开一个 designer，reviewer 也是，不经过 controller。排队的会话不因等待而作废，测试不会变少。
- **v1**：封存之前只排 test designer；封存之后每一步都先问 controller。从 v0 到 v1，新给 controller 的权限包含设计 leaf 测试的所有内容，不是只能加会话。
- **v2**：冻结里何时抓 baseline、何时封存也由 controller 调。评审之后你定：只放开“封存，还是先补一次设计”，baseline 的抓取和封存本身仍由 mainline 执行。补设计只补没有有效测试的 leaf；pair 开着时，这一轮不看 draft job 的状态。
- **parallel 关着时没有并发数可给**：owner 不能再设同时几个会话，这个选项移除。
- **v3**：不区分 main job 和 draft job，所有的流程编排都交给 controller。程序只控制 controller 的工具之间的依赖和互斥，在不同的阶段做对应的调整；其余的设计和分配都交给 controller。你举的两个例子：pair 开着时，设计测试和写首版的冲突解除，controller 自己设计并行、分配 agent 的数量；一部分验证工具和写作不再冲突时，controller 主动去验，不靠 mainline 写死。
- **功能一致**：现有流程的功能在三个版本里尽量保持一致，只是自由度变多。
- **测试**：三个版本都先在 tqdm full 上测试。
- **基础**：新分支保持现状，带着 PR #45。

### v0 到 v2 都不改的

- **证据规则**：给哪些 leaf 至少设计一次、门、试跑、knockout、评审裁决、封存的检查、对比怎么判、交付上限，全部照旧，仍由程序执行。baseline 的抓取和封存都由 mainline 调用。
- **mainline 还剩什么**：没有取舍的步骤；controller 没有可用回答时兜底；补上它漏写的 capability；执行各项限制。
- **owner 的上限**：parallel 开着时，同时几个 author、同时几个 designer，上限仍是 owner 的。关着时固定是 1，owner 改不了。
- **两个作业的结构**：main job 加 draft job，各有自己的 controller，互相看不到内容。

v3 改掉最后一条：两个作业合成一个，一个 controller。前三条在 v3 里照旧。

### 我自己补的设定，不对请纠正

- **“verify 提前引入 draft job，先跑一部分固定好的测试”**：我理解为今天 ④ 里 draft job 的做法，写完首版后用原版自带的 check 先对比、先修。这部分测试从一开始就是固定的；main job 设计的测试那时还没封存，不在其中。结果不算证据，main job 导入后重新全量对比。它只在 parallel 开着时有；关着时 draft job 写完就交。
- **机器一级的并发不算在内**：同时跑几个 check、几个 knockout 是程序执行检查的方式，不是会话。关着时仍按 owner 的设置和今天的默认值，开着时放宽。
- **v0 里 draft job 总有 controller**：它只排首版。这是从“controller 控制所有 author 的拆分”推出来的；今天 parallel 关着时 draft job 没有 controller。
- **导入时等不等 draft job 放在 v1，只在 parallel 开着时**：它是流程上的一步，不属于 author 或 test designer 的编排，所以 v0 里仍由 mainline 一律等。parallel 关着时 v0 到 v2 都一律等：能不等的前提是拿走 draft job 写了一半的首版，到 v3 才做。
- **“设计 leaf 测试的所有内容”我落实成五样**：分几次调用和每次设计哪些 leaf、一个 leaf 开几个会话、先后、同时几个、几个小 leaf 合用一个会话。最后一样要重写设计引擎的主循环，排在 v1 实测之后（第 23 项）。
- **我没有算进“所有内容”的**：给 designer 写文字指示（第 2 项）；reviewer 的分批（第 6 项）；给哪些 leaf 设计、门、试跑、knockout、评审裁决，这些是证据规则；同一个 leaf 设计第二遍，这仍是 v2 的补设计（第 22 项）。
- **程序在设计上只留规则，不留流程**：没排到的目标由程序补齐；分开的每一份都会被再问；排队不算超时；时间不够时程序接手。细节见 [v1 的改动](#work-v1)。
- **v2 补设计的细节**：两个时机，一共只能补一次。
- **“移除并发数这个选项”怎么落地**（第 15 项）：`max_parallel_agents` 整个删掉，它今天只在 parallel 关着时起作用；`runner_workers` 只在 parallel 开着时接受。关着时给了这两个数，入口当场拒绝并说明原因，不悄悄忽略。
- **按 capability 记账并进 W10**，在 v0 实测之前做完；W4 只剩并行组里的约束，算 v0 的第二步（第 4 项）。
- **v1 分两半做**：先封存之后的一半，再封存之前的一半。两半要不要分开实测，到时问你。

### v3 里我自己补的设定，不对请纠正

- **合同区照 v2 不变**。抓 baseline 和封存没有取舍，条件一齐程序直接做（第 20 项）。设计怎么排、补不补设计，仍在看不到预写区的轮里定（第 18 项）。这样第 11、17 项在 v3 里继续成立。
- **对外一个作业，内部仍是两份互相隔离的状态**。预写区在第二个克隆上，有自己的写进程和锁，隔离用的是今天 pair 的那一套。它不再有自己的流程和 controller，只执行同一个 controller 发来的调用。
- **预写区的准备由程序在作业开始时做**：工作区，和原版自带 check 的一次基线。pair 不写时有没有预写区，仍按今天的规则由程序定。
- **封存之前的验证，pair 开着就可用，不看 parallel**（第 19 项）。这和第 1 项里“提前验证归 parallel 管”不同。
- **写了一部分的首版也可以带入**，剩下的在作业里接着写。靠的是 v0 的按 capability 记账。
- **预算**。token 两个区合并算，author 次数两个区各算各的，这两条今天就是这样；轮数只有一份。
- **分两步做**。第一步是跨区：一个 controller、关系表、有取舍就问。第二步是区内按资源互斥，只在 parallel 开着时（第 21 项）。
- **v3 也先在 tqdm full 上测试**，和前三个版本一样。

<a id="switches"></a>

## 3. 两个开关

### pair

**管 draft job 和 main job 是否重叠**。v0 到 v2 都不改它的含义。

- **关**：一个作业。首版排在封存后面。
- **开**：两个作业同时跑。main job 冻结合同并验收；draft job 在仓库的第二个克隆上同时写首版。
- 不写：程序自己定。选中的代码不少于 20,000 token，并且有计算节点可用，就是两个。
- **v3 起**：不再是两个作业。开着时同一个作业里多一个隔离的预写区，封存之前首版写在那里，由同一个 controller 调度；关着时写作要等封存。

### parallel

**管其余所有和并行有关的事**。这是 v0 起的含义，之后的版本相同。默认是关。

- **关**：author、repair、test designer、reviewer 的会话一个接一个。排队等待不算超时。这时 owner 没有并发数可给：这个选项移除，给了入口会拒绝。
- **开**：下面这些并行流程才可用：多个 author 同时写；同时给多个 leaf 写测试；同时修几处；draft job 提前验证，用已经固定的那部分测试先对比、先修。author 和修复的并行由 controller 在 owner 的上限内安排，v1 起 designer 的并行也是。
- **现在**不是这样：谁来规划也挂在这个开关上；关着时仍有并行（test designer 全部同时开，同一层最多 4 个 author）。
- **v3 起**：含义不变，写法变成关系表里的互斥。关着时一个区里一次一个，开着时解除。

两个开关都由 owner 在入口命令里给，或由 host 代填。controller 看得到它们，改不了。v3 里它们各对应关系表里的一组互斥，见 [v3 的关系表](#relation)。

<a id="ladder"></a>

## 4. 每一步谁来定

同一张表也在[前端页面](https://ggeeyyi.github.io/nanolize-v1-plan/#ladder)上，带颜色。加粗并标“新”的格子，是这一步第一次交给 controller 的版本。

**冻结（唯一的作业，或 pair 的 main job；v3 里叫合同区）**

| 步骤 | 现在<br>parallel 关 | 现在<br>parallel 开 | v0 | v1 | v2 | v3 |
| --- | --- | --- | --- | --- | --- | --- |
| 准备：建工作区、跑准备配方 | mainline | mainline | mainline | mainline | mainline | 程序直接做 ‡ |
| 抓 baseline：第一次，和设计之后欠着的那一次 | mainline | mainline | mainline | mainline | mainline | 程序直接做 ‡ |
| 设计 leaf 测试怎么排：分几次调用、每个 leaf 几个会话、先后、同时几个 | mainline | mainline | mainline | **controller**（新） | controller | controller |
| 封存之前要不要再补一次设计 | 没有这一步 | 没有这一步 | 没有这一步 | 没有这一步 | **controller**（新） | controller |
| 封存 | mainline | mainline | mainline | mainline | mainline | 程序直接做 ‡ |

**封存之后**

| 步骤 | 现在<br>parallel 关 | 现在<br>parallel 开 | v0 | v1 | v2 | v3 |
| --- | --- | --- | --- | --- | --- | --- |
| 首版怎么写：分几次、同时几个、给什么指示 | mainline | controller | **controller**（关着时新） | controller | controller | controller |
| 首版写完后的保存 | mainline | mainline † | mainline † | **controller**（新） | controller | controller |
| 第一次全量对比 | mainline | mainline † | mainline † | **controller**（新） | controller | controller |
| 修什么、怎么修、何时再对比 | controller | controller | controller | controller | controller | controller |
| 选定候选、交付 | controller | controller | controller | controller | controller | controller |

**pair 开着时（v3 里 draft job 变成作业里的预写区）**

| 步骤 | 现在<br>parallel 关 | 现在<br>parallel 开 | v0 | v1 | v2 | v3 |
| --- | --- | --- | --- | --- | --- | --- |
| draft job 的首版怎么写 | mainline | controller | **controller**（关着时新） | controller | controller | controller |
| 封存之前的提前验证（v0 到 v2 只在 parallel 开着时有） | 没有这一步 | mainline † | mainline † | **controller**（新） | controller | **controller**（关着时新） |
| 封存之前修不修、修几轮（v0 到 v2 只在 parallel 开着时有） | 没有这一步 | controller | controller | controller | controller | **controller**（关着时新） |
| 封存时写好的首版交不交出 | mainline | mainline | mainline | mainline | mainline | **controller**（新） |
| 导入时等不等还在跑的修复（v0 到 v2 parallel 关着时一律等） | mainline | mainline | mainline | **controller**（开着时新） | controller | **controller**（关着时新） |
| 导入哪个保存好的候选 | mainline | mainline | mainline | mainline | mainline | **controller**（新） |
| 两条线之间怎么配合：同时开什么、谁等谁 | 没人统筹 | 没人统筹 | 没人统筹 | 没人统筹 | 没人统筹 | **controller**（新） |

**同一个区里的并行（parallel 开着时）**

| 步骤 | 现在<br>parallel 关 | 现在<br>parallel 开 | v0 | v1 | v2 | v3 |
| --- | --- | --- | --- | --- | --- | --- |
| 验证和写作同时、几项验证同时 | 没有这一步 | 没有这一步 | 没有这一步 | 没有这一步 | 没有这一步 | **controller**（第二步新） |

**证据规则**

| 步骤 | 现在<br>parallel 关 | 现在<br>parallel 开 | v0 | v1 | v2 | v3 |
| --- | --- | --- | --- | --- | --- | --- |
| 给哪些 leaf 至少设计一次、门、试跑、knockout、评审裁决、封存的检查、对比怎么判、交付上限 | 程序 | 程序 | 程序 | 程序 | 程序 | 程序 |

标“新”的格子，是这一步第一次交给 controller 的版本。“现在”两列的差别来自 PR #45：parallel 开着时首版已经由 controller 切，所以 v0 在这两行只对 parallel 关着的情况是新的。

† 这一步之前不单独问 controller，mainline 照固定顺序做。但 controller 在排首版的那一轮回答里可以把保存和对比一起排进去，今天 parallel 开着时就可以。所以 v1 在这两行新增的是：到了这一步先问它一轮，它能看了上一步的结果再定。

‡ v3 里没有固定流程了。这一步没有取舍，条件一齐程序就做，不问 controller。“关着时新”指 parallel 关着时这一格是新的；“第二步”指 v3 实测之后再做的那一步。

### v0 到 v2 都不变的

你要求现有流程的功能在 v0 到 v2 里尽量保持一致，只是自由度变多。我按下面五条来守。

- **步骤和工具不变**。三个版本跑的都是今天这串步骤：准备、baseline、设计测试、封存、首版、对比、修复、交付。没有删掉的阶段，也没有换掉的工具；新增的只有工具上的几个参数。
- **默认就是上一版的做法**。每个新放开的决定点上，mainline 会走的那一步作为默认给 controller 看。它没有可用的回答、预算用完、或者放行 mainline，走的就是上一版的步骤。例外只有一处，是你定的：parallel 关着时，v0 的默认做法本身和今天不同。
- **证据规则归程序**。给哪些 leaf 至少设计一次、门、试跑、knockout、评审裁决、封存的检查、对比怎么判、交付上限，三个版本都不交给 controller。baseline 的抓取和封存也都由 mainline 执行。
- **封存之前它能排，不能删**。controller 在封存之前能做的是两件：v1 起定设计 leaf 测试怎么排，v2 起补一次设计。给哪些 leaf 设计它改不了，没排到的由程序补齐；分开的每一份都有会话负责。测试写什么仍是 test designer 的事，算不算有效仍由程序判。
- **两个开关的含义相同**。pair 管两个作业是否重叠，parallel 管其余所有并行。parallel 关着时和今天不同的地方都来自同一条规则，是你定的：所有会话一个接一个。具体是三处：首版不划分 scope；designer 和 reviewer 一次一个；workspace 那组工具一次一个。

v3 保留第三、四条。另外三条换了说法：步骤和工具仍是这一串，但 pair 的两个作业合成一个；默认路线和 v2 逐步相同，只在 controller 没有可用回答或放行时才走；两个开关的含义不变，写成关系表里的两组互斥。

<a id="layers"></a>

## 5. 分层

三层：host agent → 作业控制层（mainline 和 controller）→ 执行层（author、test designer 和 test reviewer、verifier）。分层图和带颜色的表在[前端页面](https://ggeeyyi.github.io/nanolize-v1-plan/#layers)上。

三层在四个版本里都不变，变的是第 2 层里 mainline 和 controller 各定多少。v0 到 v2，pair 开着时 main job 和 draft job 各有一套控制层；v3 起只有一套。

和现状（见 [流程全图的分层图](https://ggeeyyi.github.io/nanolize-pipeline-map/#roles)）相比：v0 里 author 那条线从“开了 parallel 才有”变成常态；test designer 那条线是 v1 新建的，设计怎么排都由它定，v2 起还能在封存前补一次设计；verifier 那条线在 v1 里从“第一次全量对比之后”提前到“封存之后”。mainline 对 author 退到只兜底和补漏；对 test designer 它仍然决定给哪些 leaf 设计，并补齐 controller 没排到的；baseline、封存和证据规则都留在它手里。v3 之后层次不变：pair 开着时 controller 从两个变成一个，mainline 只剩没有取舍的步骤和默认路线。

**第 1 层 host**

| 角色 | 做什么 | 现在 | v0 | v1 | v2 | v3 |
| --- | --- | --- | --- | --- | --- | --- |
| host agent | 写合同和上限、提交作业；运行中只观察 | 四个版本都不变 | 同左 | 同左 | 同左 | 同左 |

**第 2 层 作业控制层：每个版本里它定什么**

| 角色 | 做什么 | 现在 | v0 | v1 | v2 | v3 |
| --- | --- | --- | --- | --- | --- | --- |
| controller | 模型。有取舍的步骤由它定 | 修复、交付；parallel 开着时还有首版怎么写 | 首版怎么写总是归它：parallel 开或关、两个作业都是（新） | 再加：封存之后每一步（保存、第一次全量对比、导入等不等）；设计 leaf 测试怎么排（新） | 再加：封存之前要不要补一次设计（新） | 一个 controller 按关系表调度整个作业，包括预写区（新） |
| mainline | 程序的固定规则。没有取舍的步骤、兜底、补漏 | 整个冻结；parallel 关着时的首版；保存、第一次全量对比 †；导入 | 整个冻结；保存、第一次全量对比 †；导入。首版只兜底、补漏 | 准备、baseline、封存；补齐 controller 没排到的设计；parallel 关着时的导入 | 同 v1 | 没有固定流程：没有取舍的步骤直接做；controller 不答时走默认路线 |

**第 3 层 执行层：每个版本里由谁排**

| 角色 | 做什么 | 现在 | v0 | v1 | v2 | v3 |
| --- | --- | --- | --- | --- | --- | --- |
| author | 写首版、修复 | controller：修复；parallel 开着时的首版<br>mainline：parallel 关着时的首版，按层写 | controller：首版和修复，开或关都是<br>mainline：只兜底、补漏<br>（新） | controller：同 v0 | controller：同 v0 | controller：同 v0；pair 开着时，封存之前写在预写区 |
| test designer | 给缺测试的 leaf 写测试 | mainline：全部由程序排，全部同时开 | mainline：全部由程序排；parallel 关着时一次一个 | controller：怎么排：分几次调用、每个 leaf 几个会话、先后、同时几个<br>mainline：给哪些 leaf 设计；补齐没排到的<br>（新） | controller：同 v1，另加封存之前补一次设计<br>mainline：同 v1<br>（新） | controller：同 v2<br>mainline：同 v2 |
| test reviewer | 评审设计出的测试 | 由程序分批，四个版本都不交给 controller；v0 起 parallel 关着时一次一个 | 同左 | 同左 | 同左 | 同左 |
| verifier | 程序。跑 baseline、封存的检查、对比 | mainline：baseline、封存、第一次全量对比 †<br>controller：之后的每一次对比 | mainline：同现在<br>controller：同现在 | controller：封存之后每一次对比，含第一次<br>mainline：baseline、封存<br>（新） | controller：同 v1<br>mainline：同 v1 | controller：同 v1；封存之前的提前验证不再只在 parallel 开着时有<br>mainline：baseline、封存：没有取舍，程序直接做<br>（新） |

标“新”的格子，是这一格第一次有东西交给 controller 的版本。证据规则（给哪些 leaf 至少设计一次、门、试跑、knockout、评审裁决、封存的检查、对比怎么判、交付上限）每个版本都归程序。

† 这一步之前不单独问 controller，mainline 照固定顺序做；controller 可以在排首版的那一轮里把它一起排进去，今天 parallel 开着时就可以。

<a id="inventory"></a>

## 6. 逐项清单：每个决定现在谁定，改成什么，从哪个版本起

“改成”一列加粗的行是要改的，第四列是它从哪个版本起生效，最后一列是对应的工作包。标“不改”的行几个版本都不动。最后一组是 v3。

**流程编排**

| 决定 | 现在（新分支 @ 21d8a28e） | 改成 | 版本 | 工作包 |
| --- | --- | --- | --- | --- |
| 准备、抓 baseline、封存 | mainline | v0 到 v2 由 mainline 执行；v3 里是没有取舍的步骤，程序直接做。都不经过 controller 的选择 | 不改 |   |
| 封存之前 controller 何时被问 | 从不 | **v0 仍然不问。v1：设计开始前问一轮，每次设计调用结束、还有没设计的目标时再问。v2：设计完一遍之后再问一轮，封存还是补一次** | v1 · v2 | W7 W12 |
| 封存之后、写首版之前问不问 controller | 只在 parallel 开着时问 | **总是问，开或关、两个作业都是** | v0 | W0 |
| draft job 里有没有 controller | 只在 parallel 开着时 | **总是有** | v0 | W0 W10 |
| controller 答不好时 | mainline 兜底；连续 3 轮答不好就整次不再问，修复也没人管 | **同一步只问一次，答不好就走默认；第一次全量对比之前的失败不连累修复** | v0 | W2 |
| 首版的保存、第一次全量对比 | 这两步之前不问 controller；parallel 开着时它可以在排首版的那一轮里一起排 | **到这两步先问它一轮，它能看了上一步的结果再定。没有全量对比的证据不能交付，这条不变** | v1 | W1 |
| draft job 提前验证的那次对比 | 同上；只在 parallel 开着时有 | **到这一步先问 draft job 的 controller；仍只在 parallel 开着时有** | v1 | W1 |
| main job 导入时等不等 draft job | mainline：一律等，最多等剩余时间的一半 | **parallel 开着：main job 的 controller 定。关着：仍然一律等** | v1 | W11 |
| 封存之前要不要再补一次设计 | 不补：重抓之后立刻封存，还缺测试的 leaf 留作 gap | **controller 定：照常封存，或给还缺有效测试的 leaf 补一次。整个作业最多补一次** | v2 | W12 W13 |
| 封存的检查（baseline 是当前的、安全的） | 程序 | 不变 | 不改 |   |

**author**

| 决定 | 现在（新分支 @ 21d8a28e） | 改成 | 版本 | 工作包 |
| --- | --- | --- | --- | --- |
| 首版由谁来排 | parallel 开着：controller。关着：mainline 按层写 | **controller，开或关、两个作业都是；mainline 只兜底** | v0 | W0 |
| parallel 关着时首版怎么写 | 程序切好 scope 分层写，同一层最多 4 个 author 同时 | **一次一个 author。程序不划分 scope；一次写完还是按 capability 分几次串行写，由 controller 定** | v0 | W10 |
| 程序怎么记“写了什么” | 按 scope。请求一按 capability 写，记账就停，漏写的没人补 | **按 capability，开或关都是；任何分法之后 mainline 都知道还缺什么并能补写** | v0 | W10 |
| parallel 开着时并行组怎么分 | controller 开并行组，可以按 scope 或按 capability 分 | **不变；把共用文件的 capability 拆到两个并行请求里会被拒** | v0 第二步 | W4 |
| 修复时几个 author 同时 | 开着：controller 可以开修复组。关着：一次一个，另有一组 workspace 工具最多 2 个同时 | **开着不变。关着：严格一次一个** | v0 | W10 |
| 共享文件（包的 \_\_init\_\_.py 等）谁写 | 程序给并行组里每个 author 同一句“不许碰共享文件”；controller 只能在指示里反着说 | **开着：controller 在请求里指定谁负责。关着：串行写，没有这个问题** | v0 | W3 |
| 同时几个 author | 开着：owner 的 max\_agents（2–8）。关着：分层写时最多 4 | **开着不变。关着：1，owner 不能改；max\_parallel\_agents 这个选项移除** | v0 | W10 |
| 两个 author 改了同一文件听谁的 | 程序：靠前的请求保留 | **负责共享文件的请求优先，其余仍是靠前的保留（只在并行组里会发生）** | v0 | W3 |

**test designer**

| 决定 | 现在（新分支 @ 21d8a28e） | 改成 | 版本 | 工作包 |
| --- | --- | --- | --- | --- |
| 给哪些 leaf 设计测试 | 程序，按 baseline 的结果算 | 不变：程序算，一个不能少。v1 起 controller 没排到的由程序补齐 | 不改 |   |
| 设计分几次调用、每次设计哪些 leaf | mainline：一次调用，覆盖全部目标 | **controller 定，可以看了上一次的结果再排下一次。每个 leaf 设计一遍** | v1 | W6 W7 |
| 会话的先后顺序 | 程序：按 leaf 的名字排 | **controller 定：调用里 leaf 的顺序就是排队顺序** | v1 | W5 W6 |
| 一个 leaf 开几个 designer 会话 | 程序：1 个（要迁移的原版测试每多 40 个再加 1 个） | **controller 定：1 到 4 个。功能点由程序分给各会话，没交出通过文件的那一份会被再问** | v1 | W5 W6 |
| 几个 leaf 合用一个会话 | 不能：一个会话一个 leaf | **controller 定：2 到 4 个只缺测试的 leaf 可以合用** | v1 第二步 | W22 |
| 同时几个 designer 会话 | 全部同时开，最多 32；owner 给了 runner\_workers 就按它。不看 parallel 开关 | **parallel 关着：1，由程序定，owner 不能给 runner\_workers（v0）。开着：controller 定，上限是 owner 的（v1）** | v0 · v1 | W10 W5 |
| 同时几个 reviewer 会话 | 全部同时开。不看 parallel 开关 | **parallel 关着：1。开着：不变** | v0 | W10 |
| 设计步骤的时间窗口 | 按全部同时开来定：到作业剩余时间的三分之一为止可以开新一轮，到一半为止结束；等过时限的会话不开 | **排队等待的时间不计入窗口，会话不因等待而作废：v0 起 parallel 关着时如此，v1 起任何排队都如此。v1 起几次调用共用一个窗口** | v0 · v1 | W15 W5 W6 |
| 一个 leaf 设计几遍 | 一遍（内部最多两轮加一轮修订），之后不再设计 | **v1 仍是一遍；v2 起 controller 可以在封存前给还缺有效测试的 leaf 补一次** | v2 | W12 W13 |
| 给 designer 的文字指示 | 没有，提示词由程序拼 | 仍然没有：controller 只给结构，不给文字 | 不改 |   |
| 测试写什么 | test designer | 不变 | 不改 |   |
| 门、试跑、knockout、评审裁决、提交 | 程序和 test reviewer | 不变 | 不改 |   |
| reviewer 怎么分批 | 程序：每 8 个文件一个 | 不变（见需要你定的第 6 项） | 不改 |   |

**v3：一个 controller 按关系表调度**

| 决定 | 现在（新分支 @ 21d8a28e） | 改成 | 版本 | 工作包 |
| --- | --- | --- | --- | --- |
| pair 开着时几个作业、几个 controller | 两个作业，各有自己的 controller，互相看不到 | **一个作业、一个 controller；作业里多一个隔离的预写区** | v3 | W17 |
| 程序靠什么管流程 | mainline 的固定流程；什么时候问 controller 的清单；每个工具的前提条件；整个作业一把操作锁 | **一张关系表：依赖、互斥、阶段、开关。没有取舍的步骤程序直接做** | v3 | W16 W19 W20 |
| 什么时候问 controller | 写成清单：第一次全量对比之后；parallel 开着时再加首版之前 | **一条规则：有操作结束或有工具变成可调用，并且有取舍** | v3 | W19 |
| 封存之前首版写完后做什么 | parallel 关：交出后空等。开：draft job 的 controller 验证、修复，main job 一封存就强制交出 | **controller 定：验不验、先验什么、修不修、修到什么时候** | v3 | W17 |
| 封存之后何时带入首版、带哪个候选 | mainline：一律等，最多等剩余时间的一半；带的是 draft job 交出的那一个 | **controller 定：等，还是取消后带入；可以点名带入哪个保存好的候选** | v3 | W17 |
| 封存之前 controller 看不看得到另一边 | main job 封存之前没有 controller；手工调用被拒 | **合同区的选择（设计怎么排、补不补）在看不到预写区的轮里定；别的轮看得到两个区，但合同区没有可选的东西** | v3 | W18 |
| 同一个区里验证和写作能不能同时 | 不能：一个作业同一时刻只有一个改状态的操作 | **parallel 开着时可以；不同种类的验证也可以同时** | v3 第二步 | W21 |

<a id="now-details"></a>

## 7. 现在的行为：四种组合

### 先说一件事：main 回滚了 PR #45，新分支仍然含它

新分支建在 PR #45 的合并点（21d8a28e）上。之后 main 在 2026-11-20 合了 PR #47，把 PR #45 整个回滚了。所以这份方案说的“现在”是**新分支的代码**，和今天的 main 不一样。PR #45 里和流程有关的有三件事：

- **parallel 开着时，controller 切首版，draft job 写完接着对比和修复**。流程图 ② ④ 两张图里用蓝色虚线标出的部分。今天的 main 上没有。
- **worker 多于一个时，baseline 的 check 和 knockout 的对照同时跑**。冻结里 verifier 的块变短，图的形状不变。今天的 main 上没有。
- run 页面画出两个作业和并行组；main job 的 token 计数算上 draft job 的 controller。

你已经定了：新分支保持现状，带着 PR #45 做 v1（[第 7 项](#decide)）。合回 main 之前要先撤销那次回滚。

### 逐项对比

|   | ① pair 关 · parallel 关 | ② pair 关 · parallel 开 | ③ pair 开 · parallel 关 | ④ pair 开 · parallel 开 |
| --- | --- | --- | --- | --- |
| 作业数 | 1 | 1 | 2：main + draft | 2：main + draft |
| 冻结（准备到封存） | mainline，固定顺序 | 同 ① | main job 做完整的；draft job 做轻量的（不设计测试、不做 knockout） | 同 ③ |
| test designer 开几个、同时几个 | 程序：每个缺测试的 leaf 一个，全部同时开 | 同 ① | 同 ①，只在 main job 里 | 同 ③ |
| 首版在哪写、何时开始 | 同一个作业，封存之后 | 同 ① | draft job，和 main job 的冻结同时 | 同 ③ |
| 首版怎么切 | mainline 按层 | controller。它不答就 mainline 按层；它漏掉的 scope 由 mainline 补写 | draft job 的 mainline 按层 | draft job 的 controller，兜底同 ② |
| 写首版时同时几个 author | 最多 4，固定值 | owner 的 max\_agents：默认 4，可设 2 到 8 | 最多 4，固定值 | owner 的 max\_agents |
| controller 第一次被问 | 第一次全量对比之后 | 封存之后、第一个 author 调用之前 | main job：导入并对比之后。draft job：从不 | draft job：封存后、第一个 author 调用之前。main job：导入并对比之后 |
| 首版写完后 draft job 做什么 | — | — | 立刻交出，空等 main job 封存 | 自己对比、修复，直到 main job 封存时被强制交出 |
| 修复时几个 author 同时 | 并行组被拒绝，一次一个。想同时修只能用 workspace 那组工具，最多 2 个 | 并行修复组；并排试 2 个版本 | 同 ① | 同 ② |
| controller 不答时怎么修 | 一个 repair author 修全部 | 每个出问题的 scope 一个 repair author，同时修 | 同 ① | main job 同 ②；draft job 一个 repair author |
| 机器并发（owner 没设时） | knockout 4 个，check 一个接一个 | knockout 8 个，check 最多 8 个 | 同 ①；main job 的 check 在计算节点上 | 同 ②；main job 的 check 在计算节点上 |
| 今天的 main 上（回滚 PR #45 后） | 和本列相同 | 首版和 ① 一样由 mainline 按层写；第一次对比之后和本列相同 | 和本列相同 | draft job 和 ③ 一样；main job 第一次对比之后和本列相同 |
| 实测 | 没有 | 没有 | tqdm 三次：105、103、194 分钟 | detectron2 核心：127.6 分钟 |

### 读图要点

- **pair 管的是首版在哪写**。关着时首版排在封存后面，和冻结是串行的。开着时 draft job 和 main job 的冻结同时进行，冻结做完时首版通常已经写好。
- **parallel 管的是首版和修复由谁切**。关着时首版由 mainline 按层写，修复一次一个 author。开着时两处都归 controller，draft job 也因此有了自己的 controller。
- **两个开关都碰不到冻结**。四张图里完整冻结的那 8 格一模一样，全是灰色：test designer 开几个、同时几个，在任何组合下都是程序定的。
- **② ④ 里紫色的首版部分来自 PR #45**。今天的 main 上，parallel 开着也只影响第一次全量对比之后的修复，以及机器并发。

### 四种组合各自的流程

#### 现在 ① pair 关 · parallel 关：一个作业，首版由 mainline 按层写

[流程图](https://ggeeyyi.github.io/nanolize-v1-plan/#mode-a)　谁来定：冻结：mainline ｜ 首版：mainline 按层 ｜ 修复：controller，一次一个 author

一直到第一次全量对比出结果，controller 都没有被问过。首版按程序切好的 scope 一层一层写，一层里的 scope 同时写，最多 4 个。

灰色一直铺到第一次全量对比；紫色从“轮 1”才开始。没有这个组合的实测。

#### 现在 ② pair 关 · parallel 开：一个作业，首版由 controller 切

[流程图](https://ggeeyyi.github.io/nanolize-v1-plan/#mode-b)　谁来定：冻结：mainline ｜ 首版：controller ｜ 修复：controller，可开并行组

冻结和 ① 完全一样。封存之后、第一个 author 调用之前，先问 controller 怎么切首版。第一次对比之后它可以让几个 author 同时修。

和 ① 比，变的是封存之后的部分：首版的规划和写法从灰变紫（第一次全量对比仍是灰色），修复从一个 author 变成一组。没有这个组合的实测。

#### 现在 ③ pair 开 · parallel 关：两个作业，draft job 只写首版

[流程图](https://ggeeyyi.github.io/nanolize-v1-plan/#mode-c)　谁来定：冻结：mainline ｜ 首版：draft job 的 mainline 按层 ｜ 修复：main job 的 controller，一次一个 author

draft job 里没有 controller：轻量冻结后按层写首版，写完立刻交出，然后空等 main job 封存。main job 导入首版、做完第一次全量对比之后才有 controller。

draft job 整行是灰色。首版和 main job 的冻结同时进行，所以通常比冻结先做完。实测：tqdm 三次，全程 105、103、194 分钟，草稿空等 44、25、66 分钟（见 [tqdm 第 3 次为什么慢](https://ggeeyyi.github.io/nanolize-tqdm-run3-slowdown/)）。

#### 现在 ④ pair 开 · parallel 开：两个作业，draft job 有自己的 controller

[流程图](https://ggeeyyi.github.io/nanolize-v1-plan/#mode-d)　谁来定：冻结：mainline ｜ 首版：draft job 的 controller ｜ 修复：两个作业各自的 controller

draft job 轻量冻结后，由它自己的 controller 切首版，然后用原版自带的 check 自己对比、修复。main job 一封存，draft job 就被强制交出手上的候选。main job 导入后重新做全量对比，draft job 观察到的不算证据。

两个作业各有一个 controller，互相看不到。实测：detectron2 核心，127.6 分钟，main job 等 draft job 等了 24.7 分钟（完整时间线见 [流程全图](https://ggeeyyi.github.io/nanolize-pipeline-map/#timeline)）。

<a id="flow-notes"></a>

## 8. v0 到 v3 各种组合的流程说明

这一节是前端页面流程图面板里每张图的文字说明，一共 16 张（四个版本，各四种开关组合）；现在的四张见上一节。每个小标题下的“流程图”链接会直接打开对应的图。

图的画法：同一个假想项目，3 个 leaf 要设计测试，首版分成 5 个 scope、两层。每个作业第一行是控制层发出的工具调用，下面几行是这些调用让谁干活；一列是一步，上下对齐的块同时进行。灰色是程序定的，紫色是 controller 定的，描边的紫色块是这个版本新交给 controller 的。图是示意图，不是实测。

### v0：controller 排 author

**和现在比，变了什么**

- **首版总是由 controller 排**。今天只有 parallel 开着才是；v0 里开或关、两个作业都是，draft job 因此总有自己的 controller。程序按 capability 记账：写完一次还有没写的，就再问它；它漏掉的由 mainline 补。
- **controller 不参与 test designer 的编排**。冻结仍然全由 mainline 做，controller 在封存之前不被问，和今天一样。
- **parallel 关着，就是真的一个接一个**。author、repair 一次一个，程序不划分 scope；test designer 和 reviewer 也由程序一个接一个地开。今天关着时 designer 全部同时开，同一层最多 4 个 author。
- **排队不算超时，代价是慢**。你定的：排队的会话不因等待而作废，测试不会变少。tqdm full 上，设计这一步估计从 1 到 1.5 小时变成 5 到 6.5 小时。parallel 的默认值仍是关，所以不写开关的运行会变慢；要快就打开 parallel。
- **仍是灰色的**。整个冻结；每次写完的保存、第一次全量对比（这两步之前不单独问 controller，它可以在排首版的那一轮里一起排）；main job 封存时 draft job 的交出；导入。

pair 管两个作业是否重叠，parallel 管作业内部的会话一个接一个还是可以并行。parallel 开着的两种组合，谁来定和今天相同。

#### v0 ① pair 关 · parallel 关：一个作业，所有会话一个接一个

[流程图](https://ggeeyyi.github.io/nanolize-v1-plan/#v0-a)　谁来定：designer：程序排，一次一个 ｜ 首版：controller，一次一个 author ｜ 保存、第一次全量对比：不单独问 ｜ 修复：controller，一次一个

冻结和今天一样由 mainline 做，controller 在封存之前不被问；parallel 关着，designer 由程序一个接一个地开，排队等待不算超时。封存后 controller 排首版；程序按 capability 记账，还没写完就再问它。保存和第一次全量对比之前不单独问它；之后的修复和交付归 controller，和今天一样。程序不划分 scope。

和今天的 ① 比：描边的紫色块是 v0 新交给 controller 的，只有一处，排首版。冻结仍然全是灰色，区别是 designer 从同时开变成一个接一个。这一步会慢很多：tqdm full 上估计从 1 到 1.5 小时变成 5 到 6.5 小时。图是示意，宽度不代表时间。首版分两次写是 controller 的选择，小项目可以一次写完。

#### v0 ② pair 关 · parallel 开：一个作业，会话可以并行

[流程图](https://ggeeyyi.github.io/nanolize-v1-plan/#v0-b)　谁来定：designer：程序排，全部同时开 ｜ 首版：controller，并行组 ｜ 第一次全量对比：不单独问 ｜ 修复：controller，并行修复组

谁来定和今天的 ② 相同：冻结由 mainline 做，首版由 controller 用并行组写，之后 controller 可以开并行修复组。

这张图没有描边的块：parallel 开着时，v0 没有新交给 controller 的步骤。v0 在这一格的改动在并行组内部：controller 可以指定谁负责共享文件；程序改成按 capability 记账，它不按 scope 分时，漏写的也有 mainline 补。

#### v0 ③ pair 开 · parallel 关：两个作业重叠，各自内部一个接一个

[流程图](https://ggeeyyi.github.io/nanolize-v1-plan/#v0-c)　谁来定：designer：程序排，一次一个 ｜ 首版：draft job 的 controller，一次一个 author ｜ draft job：写完就交，不提前验证 ｜ 导入、第一次全量对比：不单独问

draft job 有自己的 controller，只排首版：author 一个接一个写，写完就交；对比和修复在这种 draft job 里不可用。main job 的冻结、导入、第一次全量对比照固定顺序做，之后由 controller 逐轮决定。

和今天的 ③ 比：draft job 不再整行灰色，首版由它自己的 controller 排。main job 的冻结仍是灰色，designer 一个接一个，所以冻结比今天长很多，draft job 等封存的时间也跟着变长（今天 tqdm 上是 25 到 66 分钟）。两个作业之间仍然重叠，这是 pair 管的；每个作业内部没有并行，这是 parallel 管的。

#### v0 ④ pair 开 · parallel 开：两个作业重叠，内部也并行，draft job 提前验证

[流程图](https://ggeeyyi.github.io/nanolize-v1-plan/#v0-d)　谁来定：designer：程序排，全部同时开 ｜ 首版：draft job 的 controller，并行组 ｜ draft job：提前验证后并行修复 ｜ 导入：mainline，一律等

谁来定和今天的 ④ 相同：draft job 的 controller 用并行组写首版，提前验证之后并行修复，直到 main job 封存。导入时 main job 一律等 draft job。

这张图也没有描边的块。提前验证用的是原版自带的 check；那次对比之前不单独问 draft job 的 controller，之后修什么由它定。结果不算证据，main job 导入后重新全量对比。

### v1：封存之后每一步都先问 controller；封存之前设计 leaf 测试怎么排由它定

和 v0 比，变化有两类：**封存之后原来不单独问的步骤，现在先问 controller；冻结里，设计 leaf 测试怎么排全部由它定**。图里画的是它把大 leaf L1 分成两个会话的走法。

**和 v0 比，变了什么**

- **到保存和第一次全量对比这几步先问 controller**。封存之后每一步都先问它，它能看了上一步的结果再定：写完一批先比一部分 check，再决定下一批怎么写。它没有可用的回答时 mainline 照旧做。不问的步骤有四个：导入（下一条的情况除外）、任务基准的准备、候选环境的重新准备、draft job 的交出。
- **导入时等不等由 controller 定**。只在 pair 和 parallel 都开着时有得选：draft job 的首版已经写完、还有 author 在修时，等它修完，还是停掉它、取它最后保存的候选。draft job 的提前验证也先问它自己的 controller。
- **设计 leaf 测试怎么排，全部由 controller 定**。你定的：不是只能加会话。它定五样：分几次调用、每次设计哪些 leaf；一个 leaf 开几个会话；先后；parallel 开着时同时几个；几个小 leaf 合用一个会话（这一样排在 v1 实测之后做）。设计开始前问它一轮，每次调用结束、还有没设计的 leaf 时再问。
- **程序在设计上只留规则**。给哪些 leaf 设计由程序算，它没排到的由程序用默认方式补齐；一个 leaf 分成几份时功能点由程序分，没交出通过文件的那一份会被再问；排队等位置不算超时；时间不够用默认方式设计完剩下的时，程序接手。它不能写文字，看不到源码和测试；门、试跑、knockout、评审不动。
- **仍是灰色的**。准备、baseline、试跑、评审、提交、封存；draft job 的交出；parallel 关着时的导入。

四种组合和 v0 的一一对应。每种都多了“设计怎么排由 controller 定”和“第一次全量对比先问 controller”；pair 和 parallel 都开着时还多了导入时等不等。

#### v1 ① pair 关 · parallel 关：一个作业，所有会话一个接一个

[流程图](https://ggeeyyi.github.io/nanolize-v1-plan/#v1-a)　谁来定：designer：怎么排由 controller 定，一次一个 ｜ 首版：controller，一次一个 author ｜ 保存、第一次全量对比：先问 controller ｜ 修复：controller，一次一个

和 v0 ① 比多两处：设计 leaf 测试怎么排由 controller 定，包括分几次调用、每个 leaf 几个会话、先后；到保存和第一次全量对比这两步也先问它。封存之后每一步都先问 controller。

描边的是 v1 新交给 controller 的：设计轮、设计调用和它排的会话，以及保存和第一次全量对比。图里它把大 leaf L1 分成两个会话（L1a、L1b），一次调用设计全部 leaf；试跑、评审、提交仍是灰色。parallel 关着时会话一个接一个，所以先后是实打实的选择，每多一个会话也多排一次队。保存和对比先问它，带来的自由是能看了上一步的结果再定下一步。它没有可用的回答时，设计照默认做，mainline 照旧在写完后做全量对比。

#### v1 ② pair 关 · parallel 开：一个作业，会话可以并行

[流程图](https://ggeeyyi.github.io/nanolize-v1-plan/#v1-b)　谁来定：designer：怎么排由 controller 定，可以同时开 ｜ 首版：controller，并行组 ｜ 第一次全量对比：先问 controller ｜ 修复：controller，并行修复组

和 v0 ② 比多两处：设计 leaf 测试怎么排由 controller 定，包括同时开几个会话；到第一次全量对比这一步先问它。

描边的是 v1 新交给 controller 的。图里它把大 leaf L1 分成两个会话（L1a、L1b），功能点由程序分给两份；四个会话同时开。同时几个它可以调，不超过 owner 的上限。封存之后每一步都先问它，所以它可以在并行组合并之后先做局部对比，再决定要不要全量。

#### v1 ③ pair 开 · parallel 关：两个作业重叠，各自内部一个接一个

[流程图](https://ggeeyyi.github.io/nanolize-v1-plan/#v1-c)　谁来定：designer：怎么排由 main job 的 controller 定 ｜ 首版：draft job 的 controller，一次一个 author ｜ draft job：写完就交，不提前验证 ｜ 导入后的第一次全量对比：先问 controller

和 v0 ③ 比多两处：main job 里设计 leaf 测试怎么排由它的 controller 定；导入之后的第一次全量对比先问它。draft job 里每次写完的保存也先问它的 controller。导入仍是 mainline 的一步：draft job 没交出来就等。

parallel 关着时导入不交给 controller：能不等的前提是拿走 draft job 写了一半的首版，v0 到 v2 都不做。main job 排设计的那几轮，准入、上下文和预算只算 main job 自己的，draft job 花了多少不影响它。

#### v1 ④ pair 开 · parallel 开：两个作业重叠，内部也并行，draft job 提前验证

[流程图](https://ggeeyyi.github.io/nanolize-v1-plan/#v1-d)　谁来定：designer：怎么排由 main job 的 controller 定 ｜ 首版：draft job 的 controller，并行组 ｜ draft job：提前验证先问它的 controller ｜ 导入：main job 的 controller 定等不等

和 v0 ④ 比多四处：main job 里设计 leaf 测试怎么排由它的 controller 定；导入时等不等 draft job 由它定；导入后的第一次全量对比先问它；draft job 提前验证的那次对比也先问它自己的 controller。

描边的是 v1 新交给 controller 的。designer 和 draft job 的 author 用的是同一台机器，同时开几个 designer 会话是这里才有意义的旋钮。导入时，draft job 的首版已经写完、还有 author 在修的话，main job 的 controller 可以等它修完，也可以停掉它、直接取它最后保存的候选；不回答就等，和今天一样。detectron2 那次这段等待是 24.7 分钟。

### v2：封存之前要不要再补一次设计，由 controller 定

和 v1 比，封存之后完全相同，变的是冻结：**每个 leaf 都设计过一遍之后多问 controller 一轮，照常封存，还是先补一次设计**。baseline 的抓取和封存本身仍由 mainline 执行。图里画的是它用了新自由度的走法：有一个 leaf 一个文件都没被接受，它补了一次。

**和 v1 比，变了什么**

- **封存，还是先补一次设计**。每个目标 leaf 都设计过一遍之后，它看到每个 leaf 的结局：接受了几个文件、被拒的原因代码、会话有没有跑完。还有 leaf 缺有效测试、时间也够，它可以给这些 leaf 再设计一次；否则照常往下走。今天是固定设计一次就封存，缺口留到交付时算作 gap。
- **两个时机，一共只能补一次**。一个文件都没被接受的 leaf，设计一结束就知道，这时补，和第一遍设计共用一次重抓，图里画的是这种。交了文件但仍然无效的 leaf 要等重抓之后才知道，那时补要再重抓一次。
- **只能多，不能少**。第一遍设计覆盖全部目标，这是 v1 的规则；补的文件只追加，已有的测试不会被替换；整个作业只能补一次；controller 在封存之前的工具表里没有抓 baseline 和封存。
- **“何时抓 baseline”没有放开**。封存要求 baseline 是当前的，所以重抓只有一个合法位置，就是最后一次设计之后。评审的结论是这里没有可以交出去的余地；你定了抓取和封存本身仍由 mainline 执行。
- **仍是灰色的**。准备、两次 baseline、试跑、评审、提交、封存；draft job 的轻量冻结和交出。

四种组合的封存之后都和 v1 相同。没有可补的 leaf 时不多问这一轮，四种组合都和 v1 逐步相同。pair 开着时，main job 补一次设计会让封存晚一些：parallel 关着是 draft job 多等，开着是 draft job 多验证一会儿。

#### v2 ① pair 关 · parallel 关：一个作业，所有会话一个接一个

[流程图](https://ggeeyyi.github.io/nanolize-v1-plan/#v2-a)　谁来定：封存前：controller 定封存还是补一次设计 ｜ 抓 baseline、封存：mainline ｜ 封存之后：和 v1 相同

封存之后和 v1 ① 相同。区别在冻结：每个 leaf 都设计过一遍之后问 controller 一轮，照常往下走，还是先给还缺有效测试的 leaf 补一次设计。图里 L3 一个文件都没被接受，它补了一次，然后 mainline 重抓 baseline、封存。

描边的是 v2 新交给 controller 的：设计完一遍之后的那一轮，和它选的补设计。重抓 baseline 和封存仍是灰色，由 mainline 执行。没有可补的 leaf 时不问这一轮，步骤和 v1 ① 完全相同；已有的 9 次实测里，重抓之后还缺有效测试的 leaf 都是 0。

#### v2 ② pair 关 · parallel 开：一个作业，会话可以并行

[流程图](https://ggeeyyi.github.io/nanolize-v1-plan/#v2-b)　谁来定：封存前：controller 定封存还是补一次设计 ｜ designer：怎么排由 controller 定 ｜ 抓 baseline、封存：mainline ｜ 封存之后：和 v1 相同

封存之后和 v1 ② 相同。冻结里 controller 多了一个决定：设计完一遍之后、封存之前，要不要再补一次设计。

和 v1 ② 比，冻结从 9 格变成 11 格：多出来的是 controller 的那一轮和它选的补设计。补不补是它在时间和缺口之间的取舍。程序的限制：整个作业只能补一次，只能补程序列出的 leaf，冻结用时超过份额后不接受。

#### v2 ③ pair 开 · parallel 关：两个作业重叠，各自内部一个接一个

[流程图](https://ggeeyyi.github.io/nanolize-v1-plan/#v2-c)　谁来定：封存前：main job 的 controller 定封存还是补一次设计 ｜ 首版：draft job 的 controller，一次一个 author ｜ draft job：写完就交，不提前验证

和 v1 ③ 比，main job 的 controller 在设计完一遍之后多一轮：照常封存，还是补一次设计。draft job 的轻量冻结只有一种走法，不问。main job 补了的话封存会晚一些，draft job 等得更久。

main job 的 controller 在这一轮里看不到 draft job 的任何信息，只按自己的数来定：还缺几个 leaf、冻结已用多久、作业还剩多久、上一次设计和抓取各用了多久。parallel 关着时 draft job 写完就在等，补一次的代价是两个作业一起多等。

#### v2 ④ pair 开 · parallel 开：两个作业重叠，内部也并行，draft job 提前验证

[流程图](https://ggeeyyi.github.io/nanolize-v1-plan/#v2-d)　谁来定：封存前：main job 的 controller 定封存还是补一次设计 ｜ draft job：提前验证，并行修复 ｜ 导入：main job 的 controller 定等不等

和 v1 ④ 比，main job 的 controller 在设计完一遍之后多一轮。图里它补了一次设计，draft job 利用多出来的时间继续验证，直到 main job 封存。

这是 v2 里两个开关都打开时的样子，也是自由度最大的一格。main job 冻结得越久，draft job 提前验证和修复的时间越多；提前验证用的仍是原版自带的 check，结果不算证据。

### v3：一个 controller 按关系表调度整个作业

v0 到 v2 是在一条固定流程上，一处一处增加“先问 controller”的地方。v3 换一个做法：**不再分 main job 和 draft job；程序只规定工具之间的依赖和互斥，并按阶段调整；流程怎么排、会话怎么分配，全部交给 controller**。关系表和你举的两个例子在[v3 的关系表](#relation)一节。v3 是 2026-11-21 新加的，还没有做过设计评审。

**和 v2 比，变了什么**

- **一个作业，一个 controller**。pair 开着时不再是两个作业、两个互相看不到的 controller。作业里多一个隔离的预写区，就是今天 draft job 用的第二个克隆；封存之前首版写在那里，由同一个 controller 调度。designer 看不到预写区，author 看不到测试，这层隔离不变。
- **程序只管三样：关系表、证据规则、上限**。表里每个工具写明依赖什么、和谁互斥、哪个开关解除哪条互斥。“下一步该做什么”不再是写死的流程：controller 看表的当前状态，自己决定同时开什么、各开几个、先验哪部分。
- **两个开关变成表里的两组互斥**。pair 解除“合同区和写首版不能同时”；parallel 解除同一个区内部的互斥。
- **去掉的写死规则**。parallel 关着时 draft job 写完就交、空等到封存；main job 一封存就强制交出；parallel 关着时导入一律等；封存之前的验证只在 parallel 开着时才有。这些在 v3 里都是 controller 的调用。
- **合同区照 v2 不变**。抓 baseline 和封存没有取舍，条件一齐程序直接做；设计怎么排、补不补设计，仍在看不到预写区的轮里定。所以你在第 11、17 项定的两条在 v3 里继续成立。
- **它没有可用的回答时**，每个区按默认顺序走下一步，结果和 v2 逐步相同。

pair 决定作业里有没有预写区，parallel 决定一个区内部能不能并行。pair 关着的两种组合步骤和 v2 相同，区别在机制；pair 开着的两种是 v3 变化最大的地方。

#### v3 ① pair 关 · parallel 关：一个作业，所有会话一个接一个

[流程图](https://ggeeyyi.github.io/nanolize-v1-plan/#v3-a)　谁来定：没有取舍的步骤：程序直接做 ｜ 合同区的选择：和 v2 相同 ｜ 封存之后：和 v2 相同

步骤和 v2 ① 相同。变的是机制：什么时候问 controller 不再是一份清单，而是“有取舍就问”；灰色的步骤不再是固定流程里的一步，而是关系表里没有取舍的步骤。

这张图没有描边的块。pair 和 parallel 都关着时，表里没有可以解除的互斥，controller 能定的和 v2 一样多。

#### v3 ② pair 关 · parallel 开：一个作业，会话可以并行，验证可以同时

[流程图](https://ggeeyyi.github.io/nanolize-v1-plan/#v3-b)　谁来定：封存之后：和 v2 相同 ｜ 新：几项验证同时 ｜ 没有取舍的步骤：程序直接做

和 v2 ② 比多一处，属于 v3 的第二步：同一个区里，验证和写作、不同种类的验证可以同时进行。

描边的是 v3 第二步新放开的：图里最后一次全量对比和安装检查同时跑。今天一个作业同一时刻只有一个改状态的操作，它们只能排队。

#### v3 ③ pair 开 · parallel 关：一个作业两个区，各自内部一个接一个

[流程图](https://ggeeyyi.github.io/nanolize-v1-plan/#v3-c)　谁来定：一个 controller 调度两个区 ｜ 新：封存之前提前验证、修复 ｜ 新：何时带入由它定 ｜ 合同区：和 v2 相同

一个作业：上半是作业本身，封存之前是合同区；下半是预写区。parallel 关着，每个区里一次一个会话。首版写完后，controller 可以用原版自带的 check 提前验证、修复，直到它决定带入。v2 里这段时间是空等。

和 v2 ③ 比：draft job 那一行的“等 main job 封存”没有了，换成 controller 排的提前验证和修复。parallel 关着时 designer 一个接一个，合同区要走几个小时，这段时间现在用得上。两个区同时各有一个会话，这是 pair 给的；每个区里一次一个，这是 parallel 管的。预写区里看到的结果不算证据，带入后重新全量对比。提前验证在 parallel 关着时可不可用，见[需要你定的第 19 项](#decide)。

#### v3 ④ pair 开 · parallel 开：一个作业两个区，内部也并行

[流程图](https://ggeeyyi.github.io/nanolize-v1-plan/#v3-d)　谁来定：一个 controller 调度两个区 ｜ 新：封存不再强制交出 ｜ 新：写作和验证同时 ｜ 合同区：和 v2 相同

一个作业，两个区内部都可以并行。controller 在同一轮里看到两个区正在跑什么。封存之后由它决定：等预写区手上的修复做完再带入，还是取消后带入最后保存的候选。

和 v2 ④ 比：两个 controller 变成一个；main job 一封存就强制交出的规则没有了；预写区里做什么不再受 draft job 的固定流程限制。图里封存时预写区还有一组修复在跑，controller 选了等它做完再带入。排设计和补设计的那几轮（图里叫合同轮）看不到预写区，和 v2 相同。描边的“全量对比”“安装检查”属于 v3 的第二步。

<a id="work-v0"></a>

## 9. v0 的改动：controller 排 author

v0 只动 author 这条线。这条线现在已经通了一半：开了 parallel 的运行里，首版怎么切、修复怎么拆已经是 controller 定的（detectron2 那次就是）。v0 把它变成常态，去掉剩下的写死规则。**controller 不参与 test designer 的编排**：冻结仍然全由 mainline 做，封存之前不问 controller，和今天一样。导入、baseline、封存也都不动。

### v0 做完之后，不写 parallel 的运行会变慢

parallel 的默认值是关。今天关着时 designer 全部同时开；v0 起关着就是一个接一个。你定了保持一个接一个、排队不算超时、默认值不改（第 14 项）。tqdm full 上，设计这一步估计从 1 到 1.5 小时变成 5 到 6.5 小时，整次运行估计 6 到 8 小时。要快就打开 parallel：那时 v0 在谁来定上和今天相同。

### 什么时候问 controller

#### W0 · 写首版之前问 controller，不看 parallel 开关（规模：中）

- **现在**：`controller.admission` 规定：第一次全量对比出结果之前不问 controller；draft job 里从不问。parallel 开着时有两个例外（PR #45）：封存后、下一步是首版的 author 调用时问一轮；draft job 也按同样的规则问。于是“谁来排首版”挂在 parallel 开关上。做这个判断的 `advice.planned` 现在同时管三件事：问不问 controller、draft job 写完后要不要接着对比和修复、上下文里给不给首版那两节。
- **v0 怎么改**：封存之后，mainline 的下一步是首版的 author 调用时问 controller 一轮，开或关、两个作业都是。别的步骤之前不单独问：封存之前不问；保存、第一次全量对比、导入之前也不问。这一轮的回答和今天一样不限工具：controller 可以把保存和对比一起排进去，今天 parallel 开着时就可以，v0 不收回。`advice.planned` 拆成两个判断：“首版先问 controller”总是成立；“draft job 写完后接着对比和修复”只在 parallel 开着时成立。parallel 开关只决定并行流程能不能用。
- **改哪里**：`controller.admission`、`advice.planned` 和它的三个读者、`advice._draft`、`controller._context`、`_plan` 和 `_parallel`、`controller.hidden_tools`；提示词 `controller.guide` 和 `controller.parallel`（拆成“排首版”和“并行流程”两部分，前者总是给）；三处写着旧规则的说明文字。
- **测试**：`test_first_implementation_plan`、`test_parallel_switch`、`test_parallel_guide`、`test_mainline_faults`、`test_first_comparison` 的准入用例要改。新增：parallel 关着时也问这一轮；保存和第一次全量对比之前不单独问。

#### W2 · 同一步只问一次，答不好就走默认（规模：中）

- **现在**：controller 连续 3 轮答不好，这次启动剩下的部分就全走 mainline，修复也没人管了。“答不好”有三种：没有可用的回答；回答可用但第一个改动作业的调用被拒；只读不动。只有第一种会当场落到 mainline 的默认步骤，后两种会再问一轮，今天靠这个计数来结束。v0 起问得更早更多，更容易碰到。
- **v0 怎么改**：两条规则，三个版本通用。**一**、第一次全量对比出结果之前，mainline 的同一步最多问一次：这一轮答不好（三种都算），下一步直接走 mainline 的默认做法，不再问。**二**、这些轮不计入那 3 次，所以首版规划答不好不连累后面的修复；但连续两轮答不好，就到第一次全量对比出结果之前都不再问，之后照常问。这样一个一直答不好的 controller 最多白等两轮。
- **改哪里**：`controller.admission` 里数失败次数的那一段，加一个新的准入结果，它要进事件和 run 页面。和 W0 放在同一批提交里：只做 W0 的话，关着的作业首版规划答不好三次就整次停用，比今天差。
- **测试**：`test_job_tools` 的 admission 用例，`test_parallel_paths.RepairPathTests`。新增：三种答不好之后下一步都是默认做法、同一步不再问；连续两轮之后不问到第一次全量对比；之后的修复照常问。

### author 这条线，和 parallel 关着时的会话

#### W10 · parallel 关着：会话一个接一个，不划分 scope；按 capability 记账（规模：大）

- **现在**：关着时首版仍按程序切好的 scope 分层写，同一层最多 4 个 author 同时；test designer 和 reviewer 全部同时开；workspace 那组工具最多 2 个同时。所以今天的 parallel 关着并不是串行。程序只按 scope 记“写了什么”：请求一按 capability 写，记账就停，mainline 不再补漏；pair 开着时 draft job 交稿前的完整性检查也按 scope 算，缺了就整份作废。
- **v0 怎么改**：
  - **写首版**。关着时没有 scope，也没有层。controller 决定一次写完，还是按 capability 分几次、一个接一个写；每次写完先保存，下一个 author 接着已有的文件写。它不回答时 mainline 发一次写全部的调用。
  - **记账**。记账单位改成 capability，开或关都是。保存之后还有没写的 capability，mainline 的下一步就是写剩下的，于是 controller 会再被问到，它漏掉的也有 mainline 补。不拥有文件的 capability 不算没写；旧记录里按 scope 写的，算作它包含的 capability。
  - **draft job**。关着时走一条新路径：每次 author 调用之前问它的 controller；没有还没写的、又有保存好的候选，就交出；对比和修复在这种 draft job 里被拒，所以不会提前验证。author 失败或留下缺口时不再整份作废：交出已保存的部分和“写了哪些 capability”的记录，main job 导入后补写剩下的。
  - **会话**。任何时刻只有一个：author、repair、test designer、reviewer 都是，workspace 那组工具也是。fixed 策略的作业不受影响。
  - **owner 的并发数**。你定的（第 15 项）：关着时 owner 没有并发数可给，这个选项移除。`max_parallel_agents`（同时几个 author）整个删掉：它今天只在关着时起作用，开着时用的是 `parallel.max_agents`。`runner_workers`（同时几个 designer、reviewer 会话）只在 parallel 开着时接受。关着时给了这两个数，入口当场拒绝，报错里写明改法：去掉这个数，或打开 parallel。已保存的旧作业里带着的值，续跑时不读，不报错。
  - **给 controller 看的**。按共用文件的分组给每组 capability 的原版 token 数（共用的文件不重复计）、还没写的 capability、单次 author 调用的时间上限和借阅上限、还剩几次 author 次数。
- **改哪里**：`advice._authored`、`_implements`、`_layer`、`_draft`（新路径和完整性检查）；`job_tools/pair.py` 里 `finish_draft` 记录的内容；`job_tools.layering` 和 `LAYERS`；`authoring.scopes_context` 和请求里的 `scope` 字段（关着时不提供，要让工具参数能按作业配置隐藏）；`workspaces.authors_at_once` 和关着时的那条豁免；`controller.DEFAULTS` 和校验 `controller_policy` 的地方（删掉 `max_parallel_agents`）；配置作业时放宽并发设置的那一段（关着时拒绝 `runner_workers`）；命令行和 MCP 入口的参数说明；`controller._plan`；`scopes.size_share`；设计引擎里 designer、reviewer、排除评审三个线程池（共用一个数，关着时为 1，由程序定）；提示词 `controller.guide` 讲 scope 的一段和讲 draft job 的一段。
- **测试**：默认配置就是关，所以波及面大：评审数出七十来个测试文件提到 scope、workspace 批量调用或并发数。`test_parallel_mainline`、`test_parallel_paths.OffPathTests`、`test_scopes`、`test_mainline_faults`、`test_pair_jobs`、`test_leaf_test_design` 里数线程池大小的用例要改。新增：关着时上下文里没有 scope、并行组和带 scope 的请求被拒；不回答时一次写全部；按 capability 分几次写完后“还没写的”为空，draft job 正常交出；漏写的由 mainline 补；关着的 draft job 里对比被拒；designer 会话不重叠；关着时给 `max_parallel_agents` 或 `runner_workers` 被入口拒绝，开着时 `runner_workers` 照常生效，旧作业续跑不报错。`test_parallel_switch` 里读这两个数的用例要改。

#### W15 · parallel 关着：排队不算超时（规模：中）

- **现在**：设计步骤的时间窗口是按全部同时开来定的：到作业剩余时间的三分之一为止可以开新一轮，到一半为止整步结束。等过时限的会话不开始，晚开始的会话被截短，到点没开始的评审，它的文件按没评审丢掉。tqdm full 三次实测里第一轮都是 28 个 designer 会话，合计 209 到 227 分钟；全部同时开时整步约 1 到 1.5 小时。一个接一个而不改窗口的话，后面的轮次开不了，没有有效测试的 leaf 会变多。
- **v0 怎么改**：
  - 你定的：排队的会话不因等待而作废，测试不会变少。关着时：**一**、会话和评审在队里等的时间不计入窗口，开新一轮的时限和整步的结束时间都往后顺延这么多。**二**、每个会话从它开始时起拿到完整的会话时限，不因为排在后面而被截短。**三**、硬上限只剩作业的总时限。设计开始前程序估一下一个接一个要多久，发一条事件；估出来超过作业时限能给的，事件里写明，owner 可以放大时限或打开 parallel。开着时窗口和今天完全相同。
  - **代价是慢**。tqdm full 上设计这一步估计 5 到 6.5 小时，整次运行估计 6 到 8 小时（今天是 1.7 到 3.2 小时）；pair 开着时 draft job 等封存的时间从几十分钟变成几小时。
- **改哪里**：`execution._design_window`；`leaf_test_design` 里会话的开始时限和截短、开新一轮的时限、试跑和评审的截止；knockout 的截止；`freeze_estimate`（按一个接一个估）；事件文字。
- **测试**：用脚本化的 runner，让会话加起来超过窗口：每个会话都开始并拿到完整时限；第二轮和否决后的修订轮照常开；没有文件因为等评审而被丢。开着时和今天逐字节相同。

#### W3 · parallel 开着：共享文件由 controller 指定负责人（规模：中）

- **现在**：并行组里每个按 scope 写的 author 都会自动收到一句“别人也在写，不许建或改共享的包级文件”。detectron2 那次 controller 只能在自己的指示里反着说，给每个 `__init__.py` 指定负责的 scope；author 同时拿到两句互相矛盾的话，没有文字说哪句优先。合并时两个请求改了同一路径，靠前的保留，靠后的整个请求由 mainline 重写。
- **v0 怎么改**：请求里加一个字段，说明这个请求是否负责共享文件。程序按它生成给 author 的那句话：负责人被告知“你的指示里点名的共享文件归你写”，其他人仍被告知不要碰；按 capability 写的请求也附这句话。合并时负责人的请求排在最前，这样别人误改了共享文件，被重写的是别人而不是负责人。修复组默认不再附这句话。
- **改哪里**：并行组和 workspace 请求的 schema（`workspaces.GROUP_REQUEST`；不加到 `run_agent` 上）、合并的先后、`authoring.request_feedback`、`scopes.brief`、提示词 `author.scope.concurrent`，以及另外三处写着旧规则的文字（`controller.parallel`、`controller.guide`、两个工具的说明）。
- **测试**：`test_parallel_agents`、`test_parallel_scopes` 里关于这句话的两个用例；提示词快照。新增：负责人不在最前时，冲突中保留的是负责人的文件。

#### W4 · parallel 开着：按 capability 分组的并行约束（v0 的第二步）（规模：中）

- **现在**：记账在 W10 里已经改成按 capability。剩下的问题在并行组里：controller 把共用同一个文件的 capability 拆到两个并行的请求里，合并时必然冲突；一个大组被程序按文件切成几段，这几段它看不到。
- **v0 怎么改**：把共用文件的一组 capability 拆到两个并行的请求里会被拒绝，并说明原因。被切成几段的大组在并行组里仍按段写、按段记账。run 页面按 capability 显示首版的进度。
- **改哪里**：`workspaces` 的并行组校验、`scopes.size_share` 和 `brief`、run 页面读“层”的两处。
- **测试**：`test_parallel_mainline` 的 PartTests、`test_scopes`、run 页面的测试。新增：拆开共用文件的组被拒。

### v0 不改的 author 规则

- 一个组 2 到 20 个请求、同一种角色、整组算一次 author 尝试；这些是计费和合并的机械规则。串行分几次写，每次调用各算一次。
- 合并时靠前的请求保留同一路径，负责共享文件的请求排在最前（W3）；丢了文件的请求由 mainline 重写，除非 controller 自己接手。
- 程序的 scope 切法（45,000 token 上限、共用文件的 capability 不拆开）只在 parallel 开着时保留，作为默认建议和兜底。

### v0 里的 test designer

给哪些 leaf 设计、一个 leaf 开几个会话、先后顺序，都和今天一样由程序定。变化都来自 parallel 开关：关着时 designer 和 reviewer 一次只开一个（W10），排队不算超时（W15），由程序执行，不经过 controller。开着时和今天完全相同。

<a id="work-v1"></a>

## 10. v1 的改动

v1 在 v0 上面做两件事。**先做封存之后的一半**：它不碰“agent 影响不了测试”这条保证。**再做封存之前的一半**。两半各自能单独测。

### 封存之后

v0 里 controller 已经能在排首版的那一轮里把保存和对比一起排进去，但那是一次排完，看不到中间的结果。v1 新增的是到这几步先问它一轮。

#### W1 · 封存之后，到保存和对比这几步也先问 controller（规模：中）

- **现在**：v0 做完之后，封存后只在“下一步是首版的 author 调用”时问 controller。保存、第一次全量对比之前不单独问；它想自己安排这两步，只能在排首版的那一轮里一次排完，看不到中间的结果。第一次全量对比出结果之后，才每一步都先问它。代码用“第一次全量对比出了结果”同时表示四件事：可以问 controller 了、首版阶段结束了、baseline 不可用的停止可以出现了、任务基准不再重新准备了。
- **v1 怎么改**：
  - 把“第一次全量对比之后每一步都问”提前到“封存之后每一步都问”，draft job 也是。mainline 的那一步作为默认给它看，它可以照做、改掉，或放行 mainline 连做若干步。新增的自由是看了上一步的结果再定：写完一批 capability 先比一部分 check，再决定下一批怎么写。
  - **不问的步骤**。导入（W11 的情况除外）、任务基准的准备、候选环境的重新准备、draft job 的交出，以及 main job 封存之后 draft job 的保存。这些步骤没有取舍，或者一问就可能把流程带偏：pair 开着时 controller 在导入之前先发一个 author 调用，导入就永远不会发生。
  - **四件事分开**。只有“可以问 controller 了”提前到封存之后。baseline 不可用的停止和任务基准的重新准备，仍按第一次全量对比判断。“首版阶段结束”改按记账判断，也就是所有 capability 都写了：首版没写完时，mainline 的默认步骤一直是写剩下的，即使中间有一次对比没过。
  - 没有全量对比的证据不能交付，这条规则不变，由交付工具守着。
- **改哪里**：`controller.admission` 和它的原因码；`advice.compared` 的四处用法（一处提前，一处改按“首版写完”，两处不动）；`advice` 里首版没写完时的默认步骤；`controller._context`；提示词 `controller.guide` 的四段。测试夹具现在靠给 `advice.compared` 打补丁来关掉旧规则，要换成一个单独的开关。
- **测试**：`test_first_comparison` 的六个用例、`test_mainline_faults` 要改；六个从作业第一步就脚本化 agent 的测试文件要跟着夹具改。新增：controller 没有可用回答时，保存和第一次全量对比照旧由 mainline 做；不问的那几步确实不问；局部对比没过之后 mainline 的默认仍是写剩下的；pair 开着时导入不会被跳过。

#### W11 · parallel 开着：导入时等不等由 main job 的 controller 定（规模：中）

- **现在**：main job 封存后一律等 draft job，最多等剩余时间的一半。detectron2 那次等了 24.7 分钟，等的是 draft job 手上的一次修复。fix-parallel-main 上有一个提交做了这件事，但它建在今天的准入规则上，触发条件是“draft job 做过一次全量对比”。
- **v1 怎么改**：封存时，draft job 的首版已经写完、还有 author 在跑，就先问 main job 的 controller 一轮：等它修完，还是停掉它、取它最后保存的候选。不回答就照旧等。触发条件从“做过全量对比”改成“首版写完”，和 W1 用同一个定义：v1 里 draft job 的那次对比归它自己的 controller，可能只做局部对比就开始修。parallel 关着时不问，一律等。
- **改哪里**：在 W0、W1 之上重新实现那个提交的内容，不是直接合并：它改的正是 W0 重写的几处（`admission`、`_plan`、`hidden_tools`、`controller.parallel` 的提示词）。涉及 `advice.py`、`controller.py`、`job_tools/pair.py`。
- **测试**：把那个提交带的 `test_draft_handover` 移过来改。新增：draft job 只做过局部对比就在修时，main job 也会被问；parallel 关着时不问。

### 封存之前：test designer 这条线

这是几个版本里第一次让 agent 在封存之前做决定。现在的代码特意不让 controller 在封存前参与，为的是它影响不了测试。你定了：从 v0 到 v1，新给 controller 的权限包含设计 leaf 测试的所有内容，不是只能加会话。我落实成：**怎么排全部归它，程序只留规则**。它定分几次调用、每次设计哪些 leaf、一个 leaf 几个会话、先后、同时几个、几个小 leaf 合用一个会话。程序守四条：给哪些 leaf 设计由程序算，没排到的补齐；分开的每一份都有会话负责；排队不算超时；时间不够时接手。测试写什么仍是 test designer 的事，算不算有效仍由程序判。

#### W5 · 设计引擎：分份、先后、同时几个由调用方给（规模：大）

- **现在**：一个 leaf 一个 designer 会话，拿到这个 leaf 的全部功能点和知识条目；只有要迁移的原版测试超过 40 个时才多开会话。会话按 leaf 的名字排队。同时几个是一个数，它同时决定 designer、reviewer、排除评审三个池子的大小。下一轮问不问一个 leaf，看这个 leaf 有没有通过的测试。等位置等过了时限的会话不开始，开始得晚的被截短。一个 leaf 有几个会话时，被拒的反馈几乎都回到第一个会话；文件名前缀只是告诉会话，没有门检查。
- **v1 怎么改**：
  - 引擎多接受三样安排：分份、先后、同时几个，都由调用方给；一样都不给时和今天逐字节相同。另立两条规则：排队不算超时、文件数。
  - **分份**。一个 leaf 可以开 2 到 4 个会话。功能点和知识条目由程序按固定规则分给各份，合起来是全部，全局的知识条目每份都有。每份写的文件有自己的前缀，由门检查；被拒的反馈回到写它的那个会话。**下一轮问不问按份判断**：这一份没有通过的文件，就再问这一份。要迁移的原版测试照今天的方式分批，不受影响。
  - **先后**。会话按调用方给的 leaf 顺序排队。
  - **同时几个**。只管 designer 的池子；reviewer 和排除评审的池子不跟着变。
  - **排队不算超时**。W15 的规则从“parallel 关着时”推广到任何排队：等位置的时间不计入窗口，每个会话从开始时起拿到完整的时限。默认是全部同时开，没有排队，所以默认情况不变。
  - **文件数**。一个 leaf 分成几份时，各份一轮合计最多交 16 个文件（今天一个会话 8 个）；试跑和评审按 leaf 轮流取文件，一个 leaf 多出来的文件排在别的 leaf 之后。
- **改哪里**：`leaf_test_design.design_tests`：会话单元和 `batches`、payload 里的功能点和知识条目、`told`（反馈路由）、`due` 和 `lacks_tests`（改按份）、文件名前缀的门、designer 的线程池和排队顺序、会话的开始时限和截短（接 W15）、每轮的文件数上限、试跑和评审取文件的顺序；新提示词 `test_designer.part`；`freeze_estimate`。
- **测试**：照 `test_migration_design` 的写法（脚本化的 runner）新增：一个 leaf 分 3 份、只有 1 份成功时，下一轮只问另外 2 份；各份的功能点互不重叠、合起来是全部；同时 2 个、共 6 个会话时全部开始，各拿到完整时限；排队顺序和给的顺序一致；一样都不给时 payload 和今天逐字节相同；前缀的门；文件数封顶；reviewer 的池子不随同时几个变。

#### W6 · design\_leaf\_tests 的参数，和设计阶段的规则（规模：中）

- **现在**：工具只有一个参数 `leaves`（只设计点名的 leaf）。封存前可以调用多次，每次调用各取一个新的时间窗口，是当时剩余时间的三分之一到一半。点过名的 leaf 之后不再建议设计，不管那次有没有真的开会话；被点名但当时不是目标的 leaf 没人补。性能文件只在第一次调用里写，覆盖全部可测的 leaf，不看点了谁的名。
- **v1 怎么改**：
  - **参数**。`leaves`：这次设计哪些 leaf，顺序就是排队顺序。`sessions`：`[{leaf, sessions}]`，2 到 4。`at_once`：同时几个，只在 parallel 开着时有，不超过 owner 的上限；关着时工具上没有这个参数。三样都不给，就是今天的调用。
  - **设计阶段的规则**，写在程序里，对 owner 手工调用也生效。**一**、名单由程序算：调用里不是目标的 leaf 被忽略，并在结果里报告原因。**二**、每个目标 leaf 设计一遍：认账的单位是“这个 leaf 的会话开始过”，不是“被点过名”；已经设计过的 leaf 再点名被拒，v2 的补设计是唯一的例外（第 22 项）。**三**、几次调用共用一个时间窗口，从第一次调用算起。**四**、性能文件跟着 leaf 走：哪次调用设计这个 leaf，就在那次写。**五**、结果按 leaf 报告：接受了几个文件、被拒的原因代码、会话有没有跑完、实际开了几个会话。
- **改哪里**：`job_tools/freeze.py` 的工具注册、`_designed`、`design_again`、`_designable`；`execution._freeze_designed_tests`、`design_targets`（认账）、`_design_window`（共用窗口）、算性能目标的那一段；设计记录。
- **测试**：照 `test_flexible_freeze` 和 `test_design_calls_job` 的写法：分两次调用后每个目标都设计过；同一个 leaf 点第二次被拒；不是目标的项被忽略并有报告；第二次调用用的是第一次剩下的窗口；性能文件在设计那个 leaf 的调用里；不带新参数的调用和今天逐字节相同；parallel 关着时工具上没有 `at_once`。

#### W7 · 设计阶段：每次设计之前问 controller（规模：中）

- **现在**：`controller.admission` 规定第一次全量对比之前不问 controller，代码注释写明理由：封存前不被问的 agent 没法通过选择影响测试。封存前那一轮的机制其实还在（上下文里有 `design_left`，阶段叫 freeze），只是被这条规则挡住了。工具本身允许点名 leaf，也允许封存前调用多次。
- **v1 怎么改**：
  - **什么时候问**。还有没设计的目标 leaf、mainline 的下一步是 `design_leaf_tests` 时问一轮，parallel 开或关都问。所以设计开始前问一次，之后每次设计调用结束、还有没设计的目标时再问。
  - **回答的形状**。一个或几个 `design_leaf_tests` 调用，按顺序执行。这个阶段它的工具表里改状态的工具只有这一个；带了别的调用，整份回答无效，走默认。
  - **默认，和补齐**。mainline 的默认步骤是用默认方式设计全部还没设计的目标：一次调用，每个 leaf 一个会话。它不回答或答不好时走这一步，之后这个阶段不再问（W2）。它只排了一部分时，剩下的下一轮再问；所有目标都设计过，mainline 才抓 baseline、封存。
  - **接手**。每轮之前程序估算用默认方式设计完剩下的目标要多久；窗口里剩下的时间不够这个估算时不再问，程序接手设计完。
  - **它看到的**。还没设计的每个目标 leaf：类别（缺测试、要迁移、性能文件）和计数（功能点数、知识条目数、源码 token、要迁移的测试数）。已经设计过的每个 leaf 的结局，同 W6 的结果。owner 的并发上限。窗口还剩多少，每次调用的固定开销（试跑、评审、建树）估计多少。这份名单从设计步骤算目标的地方取，不用 `design_left`：后者不含只写性能文件的 leaf，tqdm 上三十来个会话它只列得出不到十个。
  - **预算**。只算本作业自己的，三处都是：准入、上下文、答不好后能不能再问。这几轮的等待上限设短。
- **改哪里**：`controller.admission`；`visible_tools`、`hidden_tools`、`answer_schema`、`parse` 和判回答有效的地方，这五处都要知道作业在哪个阶段；`controller._context` 和 `_spare`；`advice._freeze`（默认步骤）；从 `execution._freeze_designed_tests` 抽出算目标的那一段；提示词 `controller.guide` 的四段和新段落。
- **测试**：照 `test_first_implementation_plan` 的写法：封存前只在设计这一步问；分两次调用时问两轮；带别的工具的回答无效；不回答时走默认，之后不再问；它只排了一部分时剩下的下一轮再问，再不排就由程序补齐；时间不够时不问；没有目标时不问；pair 的 main job 里 draft job 的 token 用量不影响这几轮；整份上下文里没有测试名、路径和源码。原来断言“封存前从不问”的用例要改。

#### W22 · 几个小 leaf 合用一个会话（v1 的第二步）（规模：大）

- **现在**：一个会话只对一个 leaf：payload、提示词、静态检查的设置、读文件、路径的门都按单个 leaf 写。回答里没有“这个文件属于哪个 leaf”的字段，文件属于谁就是会话属于谁。一个回答最多 8 个文件；会话的时限按一个 leaf 定。
- **v1 怎么改**：
  - 工具再加一个参数 `together`：`[[leaf, leaf, …]]`，每组 2 到 4 个 leaf 合用一个会话。只有只缺测试的 leaf 可以合用；要迁移原版测试、要写性能文件的 leaf 不行。payload 变成几个 leaf 各一份；文件属于哪个 leaf 按它所在的目录定，这个目录本来就由门检查；每个 leaf 仍然最多 8 个文件；会话的时限按 leaf 数放大，有上限。合用的会话没交出某个 leaf 的通过文件时，下一轮这个 leaf 单独再问。
  - **为什么排在后面**。设计引擎是按“一个会话一个 leaf”写的，这一样要重写主循环的大半。它的收益主要在 parallel 关着时：tqdm full 上 28 个会话一个接一个要 209 到 227 分钟，合用能直接减少会话数。开着时会话本来就同时开，合用省的是模型调用，不是时间。
- **改哪里**：`leaf_test_design` 里 `ask()` 的大半：payload、会话单元和记账、`_written` 和 `_drafts`、回答 schema 的上限；`design_static` 的设置；第二份提示词；W6 的参数校验和 W7 的上下文。
- **测试**：脚本化的 runner：三个 leaf 合用一个会话，文件各归各的 leaf；合用的会话超时后，三个 leaf 下一轮各自单独被问；要迁移的 leaf 放进 `together` 被拒；每个 leaf 8 个文件的上限。

### 设计阶段里，controller 能做和不能做的

“agent 影响不了测试”这条保证，v0 里靠的是封存之前不问它。v1 里换成下面这些规则。

| 它想做的事 | 能否 | 靠什么守住 |
| --- | --- | --- |
| 分几次调用、每次设计哪些 leaf | **能** | v1 放开的。它可以看了上一次调用的结局再排下一次 |
| 定一个 leaf 开几个会话、先后、同时几个 | **能** | v1 放开的。功能点由程序分；同时几个不超过 owner 的上限，parallel 关着时固定是 1 |
| 少设计几个 leaf | **不能** | 名单由程序按 baseline 算。它排完还有没设计的目标，程序用默认方式补齐，之后 mainline 才抓 baseline、封存 |
| 拆开一个 leaf，只让其中一份有测试 | **不能** | 功能点由程序分，合起来是全部；下一轮问不问按份判断，没交出通过文件的那一份会被再问 |
| 把某些会话排到来不及 | **不能** | 排队等位置的时间不计入窗口，每个会话拿到完整的时限。剩下的时间不够用默认方式设计完时，程序接手 |
| 同一个 leaf 设计第二遍 | **不能** | v1 里每个 leaf 设计一遍，已经设计过的 leaf 再点名被拒。再设计一次是 v2 的补设计 |
| 给 designer 写文字 | **不能** | 参数只有结构：哪些 leaf、几个会话、先后、同时几个。提示词仍由程序拼 |
| 看源码或测试 | **不能** | 它看到的是每个 leaf 的类别和计数，以及上一次调用的结局（文件数、原因代码）。测试断言整份上下文里没有测试名、路径和源码 |
| 调别的工具 | **不能** | 这个阶段它的工具表里只有 design\_leaf\_tests；封存、抓 baseline 仍由 mainline 调 |
| 改门、试跑、knockout、评审 | **不能** | 这些代码不动；一个测试算不算有效和谁排的会话无关 |
| 看到 draft job 的情况 | **不能** | 准入、上下文、答不好后能不能再问，三处都只算 main job 自己的 token |

### 评审指出的三条途径，现在各靠什么守

评审的建议是只做加法：每个 leaf 默认的会话原样保留，controller 只能另加。按你的决定不再这样做。评审指出的三条让测试变少的途径还在，各用一条规则守：

- **拆开一个 leaf，只有一份成功，别的没人补**。下一轮问不问改按份判断；功能点由程序分，合起来是全部。
- **排在后面的会话时间更短，或者根本不开始**。排队不算超时推广到任何排队，每个会话拿到完整的时限。调低同时几个、把某个 leaf 排到后面，都不会让它少时间。
- **一个 leaf 多出来的文件挤掉别的 leaf 的试跑和评审**。一个 leaf 分出来的各份一轮合计最多 16 个文件，试跑和评审按 leaf 轮流。

新带来的一条：**分成很多次调用，每次都付一次试跑、评审和建树的开销**。几次调用共用一个窗口；剩下的时间不够用默认方式设计完时，程序接手。

和只做加法相比，少了一条靠结构成立的保证。它选了和默认不同的排法时，某个 leaf 封存的测试可能比默认多，也可能比默认少。仍然保证的是：每个目标 leaf 都设计过；每一份都有会话负责；没有会话因为排队而作废；它不回答时和 v0 逐字节相同。v1 实测时按 leaf 对比 v0 的有效测试数。

### 这五样各有什么用

- **分几次调用**。能看了上一次的结局再排下一次：比如先设计最大的几个 leaf，看会话有没有超时，再决定剩下的要不要分份。代价是每次调用各付一次试跑、评审和建树。
- **一个 leaf 开几个会话**。大 leaf 的功能点分给几个会话，每个会话看得更细，测试更多；试跑和评审也更久。
- **先后**。parallel 关着时会话一个接一个，先后决定哪些 leaf 的结果先出来。开着、全部同时开时没有差别。
- **同时几个**。默认是全部同时开，调低不会更快。有用的场合是 pair 开着时：designer 和 draft job 的 author 用同一台机器，这个数决定两边怎么分。
- **几个小 leaf 合用一个会话**。parallel 关着时最有用，能直接减少会话数。排在 v1 实测之后做（W22）。

这一阶段 controller 手里只有计数和上一次调用的结局，看不到源码和测试。按测试有没有效来判断哪里要补，要等 v2 的补设计。

<a id="work-v2"></a>

## 11. v2 的改动

v2 只加一个决定：**每个 leaf 都设计过一遍之后、封存之前，要不要再补一次设计**。你定的：baseline 的抓取和封存本身仍由 mainline 执行。封存之后和 v1 完全相同。顺序是先立规则和工具表（W13），再做上下文（W14），最后才接通那一轮（W12）：今天的工具本身不拦少设计、反复设计和强制重抓，规则要先立起来。

### 工作包

#### W13 · 补设计的规则，和封存之前的工具表（规模：中）

- **现在**：代码本身允许封存前再设计一次（今天是 owner 手工调用）。工具不拦这几件事：点名一个 leaf 设计然后直接封存，其余目标没人设计；设计调用没有次数上限；强制重抓对任何调用方都有效。今天拦着 controller 的只有“封存前不问它”这一条。第一件 v1 的 W6 已经补上。以前 controller 能在封存前做第二次设计，后来拿掉了，连同限制它的时间设置。
- **v2 怎么改**：**第一遍设计**沿用 v1 的规则：怎么排由 controller 定，程序保证每个目标 leaf 都设计过一遍。**补设计**：整个作业只接受一次调用，必须点名 leaf，并且只能从程序列出的名单里选。名单是还缺有效测试的 leaf，去掉换一个会话也改变不了的那些；没迁移成功的原版测试不在补的范围里（第 16 项，你定的）。**时间**：冻结用掉的时间超过作业时限的一个固定份额后，不接受补设计，照常往下走。这条只管补，写在程序里，不恢复成设置。**工具表**：封存之前 controller 的工具表里只有 `design_leaf_tests`，没有 `capture_baseline` 和 `seal_contract`；回答里的放行最多放到冻结结束。重抓只在欠着时由 mainline 做，所以比 v1 最多多一次。每次抓取记下哪些原版 check 不算标准，前后两份不同就发一条事件。
- **改哪里**：`execution` 里算设计目标的地方（按 leaf 的上限和新的原因代码放在这里，对 owner 手工调用也生效）；`freeze._designable`；按阶段收窄工具表的那五处（v1 的 W7 已经让它们知道阶段）；回答里 `follow` 的范围；抓取结果的记录。
- **测试**：这些规则可以在接通那一轮之前单独测，夹具本来就能在封存前脚本化一个 agent。新增：第二次补设计被拒；补名单以外的 leaf 被拒；超过时间份额后补设计被拒，mainline 照常重抓、封存；封存之前调 `capture_baseline`、`seal_contract` 无效；补的文件只追加，第一遍设计通过的测试都还在合同里。

#### W14 · 补设计那一轮的上下文（规模：中）

- **现在**：要做决定的那一刻，上下文里的 `design_left` 恰好是空的：它只列从没给过 designer 的目标。缺测试的原因代码在 baseline 的记录里有，但没带出来。每个 leaf 上一次设计的结局，v1 的 W6 起已经按 leaf 报告，但只给排设计的那几轮。
- **v2 怎么改**：加两样，明确不加一样。**每个可补的 leaf 上一次设计的结局**：接受了几个文件、被拒的原因代码、会话有没有跑完、缺测试的原因代码、现在就能补还是要等重抓之后。前三样沿用 v1 的 W6，后两样是新加的。**时间**：冻结已用、作业剩余、上一次设计和上一次抓取各用了多久。**不给 draft job 的任何信息**（第 17 项，你定的）：pair 开着时这一轮只按 main job 自己的数来定，token 用量也只算本作业。
- **改哪里**：`controller._context`（冻结阶段）和 `_spare`；设计结果里按 leaf 的记录；抓取结果里带出原因代码。
- **测试**：新增：整份上下文里没有测试名、路径、源码和对比输出；没有 draft job 的阶段和用量；可补的名单和程序接受的名单一致。

#### W12 · 设计完一遍之后问一轮：封存，还是补一次（规模：中）

- **现在**：v1 做完之后，冻结里只有排设计的那几轮。每个目标 leaf 都设计过一遍之后，按 mainline 的固定顺序：重抓 baseline、封存。还缺有效测试的 leaf 就这样留着，交付时算作 gap。
- **v2 怎么改**：有可补的 leaf 时，问 controller 一轮，mainline 的默认是照常往下走。**两个时机**。设计刚结束：这时知道哪些 leaf 一个文件都没被接受，补了和第一遍设计共用一次重抓。重抓之后：这时才知道哪些 leaf 交了文件但仍然无效，补了要再重抓一次。前一个时机没补，后一个时机才会再问；一共只能补一次。**不问的情况**。没有可补的 leaf（已有的实测都是这样，这时步骤和 v1 完全相同）；draft job 的轻量冻结；设计被策略关掉的作业；baseline 不安全的那条分支。它不回答就照常往下走，和 v1 逐步相同。
- **改哪里**：`controller.admission`；`advice._freeze`（它的下一步作为默认）；提示词里讲冻结的段落（替换 v1 的那一段，不能两段并存）；三个冻结工具的说明文字。
- **测试**：照 `test_flexible_flows` 里封存前补设计的那条用例写：不回答时和 v1 逐步相同；没有可补的 leaf 时不多问一轮；补在重抓之前只抓一次；补在重抓之后多抓一次；补的测试进了封存的合同。

### 封存之前，controller 能做和不能做的

| 它想做的事 | 能否 | 靠什么守住 |
| --- | --- | --- |
| 让测试更多 | **能** | 这是 v2 放开的：补一次设计。文件只追加，已有的测试不会被替换 |
| 第一遍设计怎么排 | **能** | v1 已经放开：分几次调用、每个 leaf 几个会话、先后、同时几个 |
| 少设计几个 leaf 就封存 | **不能** | v1 的规则不变：它排完还有没设计的目标，程序用默认方式补齐；封存由 mainline 调 |
| 反复补设计，把时间耗在冻结里 | **不能** | 整个作业只接受一次补设计；冻结用掉的时间超过份额后不接受 |
| 多抓几次 baseline，换一个更有利的结果 | **不能** | 封存之前它的工具表里没有抓 baseline。重抓只在欠着时由 mainline 做，比 v1 最多多一次；两次抓取里不算标准的 check 不一样时发事件 |
| 自己封存，或跳过重抓 | **不能** | 工具表里没有封存。封存的检查不变：baseline 不是当前的、或者不安全，封存被拒 |
| 补名单以外的 leaf | **不能** | 补的对象只能从程序列出的名单里选：还缺有效测试、换一个会话有可能补上的 leaf |
| 改试跑、knockout、评审的结果 | **不能** | 这些代码不动 |
| 给 designer 写文字、看测试内容 | **不能** | 参数只有 leaf 的 id；上下文是计数和原因代码 |
| 根据 draft job 的情况做决定 | **不能** | 这一轮看不到 draft job 的任何信息，token 用量也只算 main job 自己的 |

相对 v1 放松的只有一条：controller 可以点名给哪些 leaf 再设计一次，名单由程序给。给哪些 leaf 至少设计一次，仍是程序定的。

### 补一次设计值不值，以及为什么只放开这一个

- **收益**。今天还缺有效测试的 leaf 会一直缺到交付：对应的 capability 没有检查能证明它保持了行为，交付状态最多是“有缺口的完成”。补一次让这些 leaf 有机会补上。
- **代价**。按 tqdm 的会话时长估，给一两个 leaf 补一次，会话、试跑、评审合计 20 到 25 分钟；补在重抓之后还要多一次 5 到 8 分钟的抓取。pair 开着、draft job 已经在等的时候，这些时间直接加在总时间上。
- **出现得有多频繁**。已有的 9 次实测里，重抓之后还缺有效测试的 leaf 都是 0。所以多数运行里 v2 不会多问这一轮，步骤和 v1 相同。
- **“何时抓 baseline”为什么没有放开**。封存要求 baseline 是当前的，重抓只有一个合法位置，就是最后一次设计之后；多抓只是多花一次全量重跑。让 controller 自己调抓取还有一个问题：每次抓取都重新判定哪些原版 check 算标准，它可以在“现在封存”和“再来一次”之间挑停点。你定了抓取和封存本身仍由 mainline 执行。
- **“何时封存”只能往晚调**。补一次就是晚一点封存。往早调要分批封存，这几个版本都不做，见[最后一节](#later)。

<a id="relation"></a>

## 12. v3：程序管的那张关系表

v3 里程序不再规定流程，只规定工具之间的依赖和互斥。这一节依次是这张表、两个开关各解除什么、你举的两个例子，以及 controller 一轮里看到什么。v3 的流程图在[前端页面的面板](https://ggeeyyi.github.io/nanolize-v1-plan/#v3)里选 v3 看。

### 关系表：程序在 v3 里管的就是这张表

每个工具一行：先要有什么（依赖），和谁不能同时跑（互斥），两个开关各解除什么。最后一列是谁来调：没有取舍的步骤，条件一齐程序直接做；其余都是 controller 的调用。这张表是按现有 46 个工具的前提条件整理的，动手时会按代码逐条核对。

| 工具 | 依赖：先要有什么 | 互斥：和谁不能同时 | pair 开着时 | parallel 开着时 | 谁来调 |
| --- | --- | --- | --- | --- | --- |
| 建工作区、准备环境<br>`create_workspace` `prepare_environment` | 作业开始 | 合同区一次一个操作 | — | — | 程序直接做 |
| 抓 baseline<br>`capture_baseline` | 工作区已建好；并且还没抓过，或者设计提交了文件之后欠着 | 合同区一次一个操作；正在跑的对比 | — | — | 程序直接做 |
| 设计测试<br>`design_leaf_tests` | 当前的 baseline。每个目标 leaf 设计一遍，怎么排由 controller 定；之后只能补程序列出的 leaf，整个作业一次 | 合同区一次一个操作 | 不再和写首版互斥 | 内部的 designer、reviewer 会话同时开 | controller：合同轮（设计怎么排、补不补） |
| 封存<br>`seal_contract` | baseline 是当前的、安全的；全部目标都设计过；没有待定的补设计 | 合同区一次一个操作 | — | — | 程序直接做 |
| 任务基准<br>`prepare_tasks` | 封存 | 无；作业里的写作依赖它 | — | — | 程序直接做 |
| 写作<br>`run_agent` `run_parallel_agents` `run_workspace_agents` | pair 关：封存、任务基准。pair 开：预写区就绪 | 同一份草稿上的另一个写作调用；保存、恢复候选 | 封存之前就能调，写在预写区；和合同区不互斥 | 并行组、修复组可用；和验证不互斥（第二步） | controller |
| 保存、恢复候选<br>`save_candidate` `restore_candidate` `merge_candidate_parts` | 有未保存的草稿，或有保存好的候选 | 写作；正在跑的验证 | 封存之前在预写区里可用 | — | controller |
| 带入<br>`import_draft` | 封存、任务基准；作业自己还没写过。预写区里没有保存好的候选时，结果是“没有可带入的”，首版改在作业里写 | 预写区里正在跑的操作 | 只在 pair 开着时有 | — | controller：等，还是取消后带入；带哪个候选 |
| 验证<br>`compare_behavior` `run_checks` `check_installation` | 封存之后：封存和当前的 baseline。封存之前：预写区就绪，只能用原版自带的 check | 保存、恢复候选；重抓 baseline；同一种验证 | 封存之前就能调，结果只算筛查 | 和写作不互斥；不同种类的验证不互斥（第二步） | controller |
| 交付<br>`select_candidate` `deliver` | 当前候选有全量对比的证据 | 所有改状态的操作 | 预写区里没有 | — | controller |
| 查询、记录、取消<br>`get_knowledge` `record_unknown` `cancel_operation` | 无 | 无 | — | — | controller |

今天这些规则散在四处：每个工具自己的前提条件（只有一句拒绝的话）；“什么时候问 controller”的清单；mainline 的固定流程；整个作业一把操作锁，也就是任何两个改状态的操作都互斥。v3 把它们收成这一张表，controller 每一轮都看得到表的当前状态。

### 两个开关，就是表里解除的两组互斥

行和列各是一组工具，格子里写的是这两组能不能同时跑：“一次一个”和“不能同时”是始终不能；“pair 解除”是 pair 开着时可以；“parallel 解除”是 parallel 开着时可以。

|   | 合同区的操作 | 写作 | 保存、恢复候选 | 验证 |
| --- | --- | --- | --- | --- |
| 合同区的操作<br>抓 baseline、设计、封存 | 一次一个 | pair 解除 | pair 解除 | pair 解除① |
| 写作 | pair 解除 | parallel 解除② | 不能同时 | parallel 解除③ |
| 保存、恢复候选 | pair 解除 | 不能同时 | 不能同时 | 不能同时 |
| 验证 | pair 解除① | parallel 解除③ | 不能同时 | parallel 解除③ |

- **pair 关**：写作依赖封存，所以设计测试和写首版只能一前一后。**pair 开**：作业里多一个隔离的预写区，封存之前写作、保存、验证都作用在那里，和合同区没有共用的东西，可以同时。
- **parallel 关**：一个区里一次一个会话、一个操作。**parallel 开**：区内的互斥按“占用的东西”解除。
- ① 封存之前。封存之后合同区只剩重抓 baseline 和改合同，它们和验证不能同时。
- ② 一个并行组里几个 author 同时写；designer、reviewer 会话同时开。这一条今天就有。
- ③ v3 的第二步。写作改的是草稿，验证读的是保存好的候选；不同种类的验证各用各的环境。同一种验证仍然一次一个。
- 交付和所有改状态的操作都不能同时。查询、记录、取消和谁都不冲突。

### 你的例 1：设计测试和写首版

- **pair 关**。写作工具依赖封存。controller 在表里看到：写作工具不可调用，原因是“要先封存”。设计和写首版只能一前一后。
- **pair 开**。写作工具的依赖换成“预写区就绪”。controller 看到：设计测试正在合同区里跑；写作工具可调用，和它不冲突。
- **它来定**。现在就写；parallel 开着时分几组、同时几个 author、谁负责共享文件；关着时一次写完还是分几次。合同区那边设计怎么排，在合同轮里定。
- **程序不再有**“pair 开着就启动 draft job 写首版”这条流程。它不回答时走默认路线：预写区一就绪就写，和 v2 相同。

### 你的例 2：封存之前的验证

- **v0 到 v2**。封存之前的验证只在 parallel 开着时有，由 draft job 自己的 controller 排，main job 一封存就强制交出；关着时写完就交，空等到封存。
- **v3**。预写区里有保存好的候选、没有写作在跑，验证工具就变成可调用。controller 看到这一条，就可以调：先比哪些 check、比完修不修、修几轮，都是它的调用。
- **封存之后**带入变成可调用。预写区里还有修复在跑的话，它决定等，还是取消后带入最后保存的候选。
- **守住的**。提前验证只能用原版自带的 check，合同区设计的测试封存之前不出合同区；预写区里看到的结果不算证据，带入后重新全量对比。

### controller 的一轮里看到什么

例子：pair 开、parallel 关，合同区正在一个接一个地设计测试，预写区里首版已经保存。这是示意，不是实测。

| 工具 | 现在 | 原因，或它占着什么 |
| --- | --- | --- |
| `design_leaf_tests` | 正在运行 | 合同区；28 个会话里第 3 个 |
| `capture_baseline、seal_contract` | 程序的步骤 | 设计结束后欠着的抓取、条件齐了的封存，程序直接做 |
| `run_agent` | 可调用 | 预写区；和正在运行的操作不冲突 |
| `save_candidate` | 不可调用 | 没有未保存的草稿 |
| `compare_behavior` | 可调用 | 预写区；只能用原版自带的 check，结果只算筛查 |
| `import_draft` | 不可调用 | 要先封存 |
| `check_installation、deliver` | 不可调用 | 要先封存；交付还要全量对比的证据 |

- **什么时候问它**。有操作结束，或有工具从不可调用变成可调用，并且这时有取舍。两个区都在跑、都没结束时不问。v0 到 v2 那几份“问”和“不问”的清单，由这一条规则代替。
- **它的回答**。一批调用：不冲突的同时开始，冲突的排在后面。它思考的时候别的操作继续跑；回答到了之后按当时的状态再检查一遍，已经过时的调用被拒，并写明原因。
- **没有取舍的步骤**不问：建工作区、准备环境、欠着的 baseline、条件齐了的封存、任务基准、预写区的准备。
- **它没有可用的回答时**，每个区按默认顺序走下一步，结果和 v2 逐步相同。

<a id="work-v3"></a>

## 13. v3 的改动

v3 改的是机制，不是某一个决定点。分两步：**第一步是跨区**，把 pair 的两个作业合成一个，流程由关系表和 controller 决定（W16 到 W20）；**第二步是区内**，把整个作业的一把锁拆成按占用的东西加锁（W21）。顺序上先做不改行为的关系表（W16），再把守法立起来（W18），然后才合并（W17）。

### 工作包

#### W16 · 关系表：依赖和互斥写成一张表（规模：中）

- **现在**：46 个工具各带一个前提条件的函数，返回一句拒绝的话，没有原因代码。互斥只有一条：整个作业一把操作锁，任何两个改状态的调用都排队。“什么时候问 controller”写在 `controller.admission` 里，“下一步做什么”写在 `advice` 里，“哪些工具给 controller 看”写在 `hidden_tools` 里。同一条规则分散在这几处。
- **v3 怎么改**：一张表，每个工具一行：依赖（条件和原因代码）、占用什么（合同、草稿、当前候选、检查运行、预写区）、哪个开关解除哪条互斥、有没有取舍。前提条件的函数留着，是依赖这一栏的实现，返回值加上原因代码。controller 的上下文里每个工具带三样：现在能不能调、原因代码、和哪个正在运行的操作冲突。**这一步不改任何行为**：四种开关组合、每个状态下可调用的工具集合都和 v2 相同。
- **改哪里**：`job_tools/__init__.py` 的注册表（每个工具加“占用什么”和原因代码）；各模块的前提条件函数；`controller._context` 里列工具的那一节；`docs/job-tools.md` 的工具表改成从注册表生成。
- **测试**：对现有的十几个作业状态逐个断言：可调用的工具集合和 v2 相同。每条拒绝都有原因代码。文档里的表和注册表一致。

#### W18 · 封存之前的守法（规模：中）

- **现在**：pair 的规则是：main job 封存之前，只有它自己的流程能改它；手工调用被拒，因为调用的人看得到 draft job。代码里列了四样要防的：给挑出来的 leaf 设计或不设计、标记某个 check、只跑挑出来的准备配方、多抓一次直到某个 check 掉出去。v2 里 main job 的 controller 看不到 draft job（第 17 项）。
- **v3 怎么改**：v3 只有一个 controller，所以改成两层。**第一层**：合同区的选择（设计怎么排、补不补设计）仍在单独的轮里定，这些轮的上下文只从合同区取，v1、v2 的这几轮原样保留。**第二层**：别的轮看得到两个区，但合同区没有可选的东西：抓 baseline 只在没抓过或欠着时由程序做；封存条件齐了由程序做；封存之前它的工具表里没有标记 check、准备环境、改合同和强制重抓。四样要防的各对一条。
- **改哪里**：`job_tools/pair.py` 里拒绝调用的规则；`controller.hidden_tools`（按阶段）；两种轮各自的上下文，包括“之前几轮”和操作历史那两节；程序直接做的步骤清单。
- **测试**：合同轮的整份上下文里没有预写区的操作、候选、结果和 token 用量。别的轮里调合同区的工具无效。四样要防的各一个用例。v2 里第 17 项的用例原样通过。

#### W17 · 一个 controller 驱动两个区（规模：大）

- **现在**：pair 是两个作业：各有目录、状态、写进程、操作锁、controller 和轮数预算。draft job 的流程写死在 `advice` 里：写完按规则交出，main job 一封存就强制交出。main job 的导入最多等剩余时间的一半。两个 controller 互相看不到，所以两条线之间谁等谁、各开多少，没有人统筹。
- **v3 怎么改**：对 owner 和 controller 都是一个作业：一个 id、一个状态、一个 controller、一份轮数预算、一个 run 页面。**内部**保留两份互相隔离的状态：预写区仍在第二个克隆上，有自己的写进程和锁，所以两个区可以各有一个操作同时在跑；隔离用的是现成的机制。预写区没有自己的流程，它的写进程只执行 controller 发来的调用，走今天 owner 用的请求通道。**工具落在哪**：带入之前，写作、候选、验证工具作用在预写区；带入之后作用在作业自己的工作区。**带入**：`finish_draft` 取消，`import_draft` 给 controller 看，可以点名带入哪个保存好的候选；预写区里还有操作在跑时，带入要等它，或者 controller 先取消它。写了一部分的首版也可以带入，剩下的在作业里接着写；预写区里没有保存好的候选时，带入的结果是“没有可带入的”，预写区关闭，首版改在作业里写，和今天导入不到草稿时一样。**预写区的准备**（工作区、原版自带 check 的一次基线）由程序在作业开始时做。
- **改哪里**：`execution` 里提交两个作业的地方；`pair.py`；`job_tools/pair.py`（交出、导入、等待的那一段）；`advice` 里 draft job 的几条分支和强制交出；`controller` 的调用路由和上下文；`job_runner` 的请求通道；token 的合并计数；状态、事件和 run 页面的合并显示。
- **测试**：`test_pair_jobs`、`test_first_implementation_plan`、`test_draft_handover` 要改。新增：两个区各有一个操作同时在跑；封存之前写作调用落在预写区，带入之后落在作业里；带入等操作结束；取消后带入拿到最后保存的候选；带入写了一部分的首版后，剩下的由默认路线补写；现有的隔离测试原样通过；owner 只看到一个作业。

#### W19 · 有取舍就问（规模：中）

- **现在**：v2 做完之后，什么时候问 controller 是几份清单：首版的 author 调用之前、封存之后每一步、每次设计调用之前、设计完一遍之后；不问的步骤另有一份。一个作业同一时刻只有一个操作，所以“每一步之后问一轮”就够了；有后台操作在跑时，作业干脆等它结束。
- **v3 怎么改**：一条规则代替这些清单：**有操作结束，或者有工具从不可调用变成可调用，并且这时有取舍，就问一轮**。没有取舍，指表里标着“程序直接做”的步骤条件齐了。两个区都在跑、都没结束时不问。合同区的取舍点仍是 v1、v2 定的那两处，问的是合同轮；合同区在等合同轮的回答时，预写区的操作照常跑。**回答怎么执行**：不冲突的调用同时开始，冲突的排在它后面；它思考的时候别的操作继续跑，回答到了之后按当时的状态再检查一遍，已经过时的调用被拒并写明原因。**答不好**：W2 的规则照用，同一个决定点答不好一次就走默认路线。
- **改哪里**：`controller.admission`；`job_runner` 里“有后台操作就等”的那一段；`controller` 执行一批调用的地方（现在是一个接一个）；每一轮的记录里加“为什么问”。
- **测试**：用脚本化的 controller：一个区的操作结束时被问，另一个区的操作不受影响；没有取舍的步骤不问；过时的调用被拒；连续答不好走默认路线；v1、v2 里“不问”的那几步仍然不问。

#### W20 · 默认路线（规模：中）

- **现在**：`advice.step` 是一条手写的流程，按 pair 的角色和 parallel 分了好几条分支。controller 不回答时走它，放行时也走它。
- **v3 怎么改**：流程顺序的部分改成：每个区一份顺序清单，默认路线就是每个区取清单里下一个表里允许的工具。结果和 v2 逐步相同：pair 开着时预写区一就绪就写首版；parallel 开着时提前验证和修复；封存之后带入。修复策略那部分（修什么、何时停、性能修复）不动。默认的下一步每一轮都给 controller 看。
- **改哪里**：`advice.step` 和它按角色分的几条分支；回答里放行的范围。
- **测试**：controller 从不回答时，四种开关组合的步骤序列和 v2 逐步比对，完全相同。

#### W21 · 区内按资源互斥：验证和写作同时、几项验证同时（v3 的第二步）（规模：大）

- **现在**：一个作业一把操作锁：任何改状态的调用都要等正在跑的那个结束。后台操作靠“进程里只有一个后台操作”来认领它启动的进程，取消时按这个认领来停。
- **v3 怎么改**：只在 parallel 开着时。锁按占用的东西分：草稿（写作）、当前候选（保存、恢复、合并、选定）、检查运行（每种验证各一把）、合同（抓 baseline、改合同）。**可以同时**：author 在写新草稿，同时对已保存的候选做对比；行为对比、安装检查、任务评估同时跑。**不可以**：保存候选时有验证在跑；重抓 baseline 时有对比在跑；交付时有任何操作在跑。证据仍然绑定到代码，不绑定到候选的编号，这条今天就是。
- **改哪里**：`job_tools/background.py`（锁，和进程的认领）；`job_tools.invoke`；进度和日志的写入，要保证两个操作各写各的；`ledger`。
- **测试**：并发的专项测试；取消一个操作不影响另一个；进程崩溃后回到最后一个封存点；两个操作同时结束时记录不丢。parallel 关着时行为和第一步完全相同。

### v2 之后还写死、v3 交给 controller 的

| 写死的规则 | v3 里 |
| --- | --- |
| pair 开着，就在第二个克隆上写首版 | controller 调写作工具才写。它不回答时，默认路线仍是预写区一就绪就写 |
| parallel 关着：draft job 写完就交，空等到封存 | 首版写完后验证工具变成可调用；验不验、修不修由它定 |
| 封存之前的验证和修复只在 parallel 开着时有 | pair 开着就可用，由同一个 controller 排（第 19 项） |
| main job 一封存，draft job 被强制交出，它那一批剩下的调用作废 | 封存不打断预写区。带入变成可调用，由它定何时带入 |
| parallel 关着时导入一律等，最多等剩余时间的一半 | 等，还是取消后带入最后保存的候选，由它定，开或关都是 |
| 导入的是 draft job 交出的那一个候选 | 它可以点名带入哪个保存好的候选；写了一部分的也可以 |
| 两个 controller 各管各的，互相看不到 | 一个 controller，一轮里看到两个区正在跑什么 |
| 什么时候问 controller 写成清单，不问的也写成清单 | 一条规则：有操作结束或有工具变成可调用，并且有取舍，就问 |
| 一个作业同一时刻只有一个改状态的操作 | pair 开着时两个区各有一个；parallel 开着时区内按占用的东西互斥（第二步） |

### 封存之前，controller 能做和不能做的（v3）

| 它想做的事 | 能否 | 靠什么守住 |
| --- | --- | --- |
| 封存之前验证和修复首版 | **能** | v3 放开的：在预写区里，用原版自带的 check。结果只算筛查 |
| 排设计、让测试更多 | **能** | 和 v2 相同：设计怎么排、补不补一次设计，都在合同轮里定 |
| 看着预写区的结果来定设计怎么排、补不补设计 | **不能** | 这些选择都在合同轮里定，合同轮的上下文只从合同区取：没有预写区的操作、候选和结果，也没有它的 token 用量 |
| 多抓一次 baseline，换一个更有利的结果 | **不能** | 抓取没有取舍：没抓过或欠着时程序直接做。它的工具表里没有强制重抓 |
| 挑时机封存 | **不能** | 封存没有取舍：条件齐了程序直接做 |
| 封存之前标记某个 check、只跑挑出来的准备配方、改合同 | **不能** | 封存之前这几个工具不在它的工具表里。今天 pair 的规则防的就是这几样，原来靠“封存之前只有 main job 自己的流程能改它” |
| 让预写区的 author 看到设计出来的测试 | **不能** | 预写区在第二个克隆上，会话的沙箱看不到合同区。和今天 draft job 的隔离是同一套 |
| 让 designer 看到预写区里写的代码 | **不能** | 同上，反方向 |
| 把预写区里看到的结果当证据 | **不能** | 带入之后用封存的合同重新全量对比；交付只认这一份 |
| 在预写区里选定、交付 | **不能** | 交付依赖封存和全量对比的证据，预写区里没有 |
| 改门、试跑、knockout、评审、对比怎么判 | **不能** | 这些代码不动 |

相对 v2 放开的只有第一行，而且在预写区里，碰不到测试和 baseline。

### 程序还管什么

- **关系表**。依赖、互斥、阶段、开关。controller 改不了表，也改不了开关。
- **证据规则**。给哪些 leaf 至少设计一次、门、试跑、knockout、评审裁决、封存的检查、对比怎么判、交付上限。和前三个版本相同。
- **上限**。owner 给的并发数（parallel 开着时）、author 次数、时间、token、轮数。
- **隔离**。谁看得到什么：controller 看不到源码和测试；author 看不到测试；designer 看不到写出来的代码。
- **没有取舍的步骤，和默认路线**。前者程序直接做；后者在 controller 没有可用回答或放行时走。

<a id="packages"></a>

## 14. 工作包和顺序

每个工作包是一组独立的提交，带自己的测试，做完一个就能跑全量测试确认没有新增失败。四个版本按顺序做，每一版都建在上一版上面，做完就是一个能单独使用的版本：停在 v0、v1 或 v2 也是完整的。前三个里 v0 最大，因为它改的是默认配置下的行为；v1 次之，它封存之前的一半要改设计引擎；v2 最小，但动的地方最敏感。v3 改的是机制，规模接近 v0，分两步做。

**v0：controller 排 author**

|   | 工作包 | 规模 | 依赖 | 做完之后 |
| --- | --- | --- | --- | --- |
| 准备 | 并入 fix-parallel-main 上和自由度无关的两个提交 | 小 | — | 换候选后自动重新准备环境；baseline 不可用时当场提示。首版分几次写时，重新准备推迟到要对比的时候再做 |
| W0 | 写首版之前问 controller，不看 parallel 开关 | 中 | 准备 | 开或关、两个作业，首版都由 controller 排 |
| W2 | 同一步只问一次，答不好就走默认 | 中 | 和 W0 同一批 | 首版的规划答不好，不影响后面的修复，也不会被一直问 |
| W10 | parallel 关着：会话一个接一个，不划分 scope；按 capability 记账 | 大 | W0 W2 | 关着时任何时刻只有一个会话；首版怎么分由 controller 定，漏写的有 mainline 补；draft job 有自己的路径 |
| W15 | parallel 关着：排队不算超时 | 中 | W10 | designer 一个接一个时，后面的轮次照常开，测试不变少 |
| W3 | parallel 开着：共享文件由 controller 指定负责人 | 中 | W0 | 并行写首版时不再有互相矛盾的两句话；冲突时保留负责人的文件 |
| W8 | 提示词、文档、入口文字 | 中 | W0 W10 | controller 的提示词讲清新规则；docs/job-tools.md 和 skill 里两个开关的说明同步，写明关着会慢、关着时没有并发数可给 |
| W9 | run 页面 | 小 | W0 W10 | 页面显示一个接一个的会话、不带 scope 的首版、draft job 里 controller 的轮 |
| M0 | 里程碑：v0 在 tqdm full 上测试 |   | 以上全部 | 确认没有退步、新路径接通。parallel 关着的那次要先确认作业时限够用 |
| W4 | parallel 开着：按 capability 分组的并行约束 | 中 | W10 | v0 的第二步。拆开共用文件的组会被拒；run 页面按 capability 显示 |

**v1：封存之后每一步都先问 controller；封存之前设计 leaf 测试怎么排由它定**

|   | 工作包 | 规模 | 依赖 | 做完之后 |
| --- | --- | --- | --- | --- |
| W1 | 封存之后，到保存和对比这几步也先问 controller | 中 | 准备 W0 W2 W10 | controller 能看了上一步的结果再定；导入等几步不问 |
| W11 | parallel 开着：导入时等不等由 controller 定 | 中 | 准备 W0 W1 W10 | 在 W0、W1 之上重新实现 fix-parallel-main 上的那个提交 |
| W5 | 设计引擎：分份、先后、同时几个由调用方给 | 大 | W10 W15 | 可以单独测：一样都不给时和今天逐字节相同；分开的每一份都会被再问；排队不算超时 |
| W6 | design\_leaf\_tests 的参数，和设计阶段的规则 | 中 | W5 | 单个作业里 owner 手工调用就能用：分几次调用后每个目标都设计过，同一个 leaf 不设计第二遍 |
| W7 | 设计阶段：每次设计之前问 controller | 中 | W0 W2 W6 | controller → test designer 这条线接通；它没排到的由程序补齐 |
| W8 W9 | v1 的提示词、文档、run 页面跟进 | 小 | W1 W7 | 页面画出封存前的设计轮、几次设计调用和一个 leaf 的多个会话 |
| M1 | 里程碑：v1 在 tqdm full 上测试 |   | 以上全部 | 确认 controller 每轮都照默认时步骤和 v0 相同；按 leaf 对比封存的有效测试数；量出多问的开销 |
| W22 | 几个小 leaf 合用一个会话 | 大 | M1 | v1 的第二步。parallel 关着时能直接减少 designer 会话数 |

**v2：封存之前要不要再补一次设计，由 controller 定**

|   | 工作包 | 规模 | 依赖 | 做完之后 |
| --- | --- | --- | --- | --- |
| W13 | 补设计的规则，和封存之前的工具表 | 中 | 准备 W6 W7 | 规则先立起来，可以单独测 |
| W14 | 补设计那一轮的上下文 | 中 | W13 | 它看得到每个可补的 leaf 上一次设计的结局和时间；看不到 draft job |
| W12 | 设计完一遍之后问一轮：封存，还是补一次 | 中 | W2 W13 W14 | 有可补的 leaf 时由 controller 定补不补；没有时步骤和 v1 相同 |
| W8 W9 | v2 的提示词、文档、run 页面跟进 | 小 | W12 | 讲冻结的那段提示词换成新的；页面画出补设计 |
| M2 | 里程碑：v2 在 tqdm full 上测试 |   | 以上全部 | tqdm 上多半没有可补的 leaf：确认这时和 v1 相同。补的路径靠测试覆盖 |

**v3：一个 controller 按关系表调度整个作业**

|   | 工作包 | 规模 | 依赖 | 做完之后 |
| --- | --- | --- | --- | --- |
| W16 | 关系表：依赖和互斥写成一张表 | 中 | v2 全部 | 不改行为：所有组合下可调用的工具和 v2 相同；每条拒绝都有原因代码 |
| W18 | 封存之前的守法 | 中 | W16 | 和 W17 同一批提交。合同轮看不到预写区；别的轮里合同区没有可选的东西 |
| W17 | 一个 controller 驱动两个区 | 大 | W16 | pair 开着时对外是一个作业；预写区只执行 controller 发来的调用；带入是它的调用 |
| W19 | 有取舍就问 | 中 | W16 W17 | 操作一结束就问；没有取舍的步骤程序直接做；两个区的操作同时跑 |
| W20 | 默认路线 | 中 | W19 | controller 不回答时，四种组合的步骤和 v2 逐步相同 |
| W8 W9 | v3 的提示词、文档、run 页面跟进 | 中 | W19 | 提示词围绕关系表重写；run 页面把两个区画在一个作业里 |
| M3 | 里程碑：v3 在 tqdm full 上测试 |   | 以上全部 | pair 开、parallel 关时，看 controller 有没有用上封存之前的那段时间 |
| W21 | 区内按资源互斥：验证和写作同时、几项验证同时 | 大 | M3 | v3 的第二步，只在 parallel 开着时。先做并发、取消和崩溃恢复的专项测试 |

规模是相对的：小 = 几处判断加改测试；中 = 一个模块里的新逻辑加一组新测试；大 = 跨五六个模块，要动几十个现有用例。

<a id="verify"></a>

## 15. 怎么验证

### 单元测试

- 每个工作包新增回归测试，写法照搬现有的三种：脚本化的假 runner、打补丁的 `design_tests`、脚本化的假 controller。
- 新自由度的每条路径各用脚本化的 controller 强制走一次：按 capability 分几次写、设计分两次调用、把一个 leaf 分成几份、改先后和同时几个、局部对比通过后接着写、局部对比没过、导入时不等、补一次设计。真实模型在小项目上不一定会选到这些路径。
- 全量测试在计算节点上跑，和基础版本的失败清单逐条比对，要求没有新增失败。
- 改了 agent 会读到的文字后重新生成提示词文档和快照。

### 要专门盯住的不变量

- **每一版**：controller 没有可用回答时，走的步骤和上一版逐步相同。v0 的 parallel 关着是例外：默认做法是你改的，另立基线。
- v0：封存之前 controller 一次都不被问。parallel 开着时 designer 这一步和今天逐字节相同；关着时 designer 会话不重叠，没有会话因为等待而作废。
- 不带新参数的 `design_leaf_tests` 和今天逐字节相同。controller 不回答时，设计这一步和 v0 逐字节相同。
- v1：不管 controller 怎么排，封存时每个目标 leaf 的会话都开始过；分开的各份功能点互不重叠、合起来是全部；没有会话因为等位置而作废或被截短；设计阶段它调不到别的工具；同一个 leaf 不设计第二遍。
- v2：每个目标 leaf 都设计过一遍；补设计整个作业最多一次；封存之前调不到抓 baseline 和封存；没有可补的 leaf 时不多问一轮。
- v3：controller 从不回答时，四种开关组合的步骤和 v2 逐步相同。合同轮的整份上下文里没有预写区的操作、候选和结果。预写区的会话看不到合同区，反过来也是。预写区里的对比不出现在交付的证据里。owner 只看到一个作业。

### 实测

- 你定的：v0、v1、v2 都先在 tqdm full 上测试。每个版本做完、单元测试通过之后跑。v3 我也按这个做。
- 参照：tqdm 在今天的代码上跑过三次（pair 开、parallel 关），全程 105、103、194 分钟。三次差别很大，所以对比时看每一段的时间和 controller 做了什么，不只看总时间。
- parallel 关着的一次 tqdm full 估计要 6 到 8 小时，开跑前先确认作业时限。
- 每次实测都要占用计算节点和模型费用，跑哪几种开关组合，开跑前我先和你确认。

### tqdm full 能验证什么

- **能**：没有退步；新的提问点接通了；多问几轮花多少时间和 token；parallel 关着时 designer 确实一个接一个、测试没有变少。
- **多半不能**：新自由度有没有用。tqdm full 只有 4.6 万 token，controller 多半选一次写完，和默认相同；三次实测里设计一次之后缺有效测试的 leaf 都是 0；draft job 比封存早 25 分钟以上交出，导入时没有等不等可选。
- 为了分得清“它决定照默认”和“它没回答”，每一轮都记下默认步骤、它实际发的调用、是否和默认不同。
- 要看到新自由度被用上，需要一个更大的项目，或者人为制造条件。等 tqdm 的结果出来再和你定。
- **v3 不一样**：tqdm full 够大，pair 不写时程序会开；parallel 关着时合同区要走几个小时，预写区写完首版只要几十分钟。这段时间 controller 用没用上、用了之后封存之后的修复少了多少，在 tqdm full 上就看得到。

### 对效果的预期，先说在前面

- **v0，parallel 开着**：你现在的跑法就是这个。谁来定和今天相同，今天首版就是 controller 切的；收益来自共享文件有了负责人（W3，少一类合并后的返工）和按 capability 记账（漏写的有人补）。
- **v0，parallel 关着**：会比今天慢很多，这是“一个接一个”的代价。慢的主要是 designer 和 reviewer：tqdm full 上 28 个 designer 会话合计 209 到 227 分钟，今天它们同时开。author 这边变化不大：今天关着时几个 scope 多半本来就是一条链、一个接一个写的。换来的是流程简单：没有 scope、没有合并、没有共享文件的冲突。
- **v1**：轮数会比 v0 多，因为排设计要一轮到几轮，保存和对比也先问它；它可以放行 mainline 连做若干步来省轮数。收益有两处：导入时不再白等 draft job 的一次修复（detectron2 那次是 24.7 分钟）；写完一批就能先对比，问题暴露得更早。设计怎么排对时间的影响两头都有：parallel 关着时把大 leaf 排在前面、以后合用会话能省时间；分份和分几次调用会让测试更多，试跑和评审也更久。
- **v2**：多数运行里没有可补的 leaf，时间和 v1 相同。有的时候，controller 选了补，冻结多 20 到 40 分钟，换来交付时更少的“没有有效测试”的缺口。
- **v3**：pair 关着时和 v2 相同。pair 开、parallel 关时，封存之前那段空等变成提前验证和修复，带入的候选更接近通过，封存之后的修复应该变少；合同区那几个小时不变。pair 开、parallel 开时，少的是封存时强制交出或白等一次修复的损失。轮数会变多，因为每个操作结束都可能问一轮。
- controller 每多问一轮约 1 到 3 分钟、1 到 2 美元。

<a id="risks"></a>

## 16. 风险和对策

| 风险 | 对策 |
| --- | --- |
| 封存前让 agent 参与，削弱“影响不了测试”的保证（v1 起） | v0 里封存之前不问 controller，这条保证原样保留。v1 里设计怎么排归 controller，这是你定的。保证从“默认会话逐字节不变”换成一组规则：名单由程序算并补齐；分开的每一份都会被再问；排队不算超时；时间不够时程序接手；它不写文字、看不到源码和测试；门、试跑、knockout、评审不动。每条配测试。已知的代价：它选了和默认不同的排法时，某个 leaf 的测试可能比默认少；v1 实测时按 leaf 对比 v0 |
| v1 里设计分成很多次调用，时间耗在冻结里 | 每次调用各付一次试跑、评审和建树的开销。几次调用共用一个时间窗口；每轮之前程序估算用默认方式设计完剩下的要多久，不够时不再问、程序接手；上下文里给它每次调用的固定开销 |
| v1 封存之前的一半重写之后没有再评审 | 这一半动的是设计引擎里按 leaf 记账的地方（下一轮问不问、反馈路由、时间窗口）。动手之前先对着代码把 W5 到 W7 再核一遍；W5 可以脱离 controller 单独测 |
| v2 里 agent 在封存前多一个决定 | 只放开“补不补一次设计”。第一遍设计覆盖全部目标；补的文件只追加；整个作业只能补一次；封存之前它调不到抓 baseline 和封存。每条配测试 |
| v2 里冻结变长，挤占首版和修复的时间 | 补设计有时间份额的上限；controller 看得到冻结已用、作业剩余、上一次设计和抓取的用时；没有可补的 leaf 时不多问 |
| parallel 关着时运行慢很多，而默认值是关 | 这是你定的（第 14 项）：一个接一个，排队不算超时，测试不变少。tqdm full 上设计一步估计 5 到 6.5 小时。设计开始前程序发一条事件说明预计用时；要快就打开 parallel。文档和入口文字里写明 |
| 原来带着并发数的入口命令，升级后被拒 | 这是你定的（第 15 项）：关着时没有并发数这个选项。报错里写明改法：去掉这个数，或打开 parallel。入口默认不带这两个数，所以不写它们的命令不受影响；已保存的作业续跑不报错 |
| parallel 关着时作业时限不够用 | 排队不算超时之后，硬上限只剩作业的总时限。估出来不够时事件里写明，owner 可以放大时限或打开 parallel；实测前先确认时限 |
| 几个版本叠在一起，出了问题分不清是哪一版带来的 | 每个版本单独一组提交；每一版都保证 controller 没有可用回答时和上一版逐步相同，并有测试钉住；每个版本做完都先在 tqdm full 上测试；v1 的两半分开做 |
| draft job 的花费影响 main job 的设计 | 现在 main job 的 token 计数包含 draft job 的用量。封存前的轮改成只算本作业，三处都改（准入、上下文、答不好后能不能再问），并加测试 |
| 一个 leaf 分成几份后写出重复的测试，或占掉试跑和评审的时间 | 程序把功能点分开给各份；重复的测试不影响正确性。各份一轮合计最多 16 个文件，试跑和评审按 leaf 轮流 |
| parallel 关着时一个 author 会话太大 | scope 最初就是为了让会话短才引入的。关着时由 controller 按 capability 分几次串行写来控制大小，程序给它每组 capability 的 token 数和单次调用的上限。已知的弱点：大库上 controller 不回答时，mainline 的兜底是一次写全部，回到 scope 当初要解决的问题；借给 author 的原版文件上限（400 个、32MB）是截断，不是保护。这个兜底是你选定的（第 8 项） |
| 改默认行为波及大量现有测试 | W10 改的是默认配置下的行为；W0、W1 还要改准入的用例和测试夹具。先改测试的默认前提，再改代码，逐个文件确认 |
| controller 问得更早更多，轮数和花费上升，答不好的机会也变多 | 它可以放行 mainline 连做若干步；同一步只问一次，答不好就走默认；连续两轮答不好，就到第一次全量对比之前不再问（W2） |
| 封存之后每一步都问，controller 把流程带偏 | 列出不问的步骤：导入、任务基准的准备、候选环境的重新准备、draft job 的交出。没有全量对比的证据不能交付，由交付工具守；时间用完时 mainline 接手保存和对比 |
| 和别的会话的改动冲突 | fix-parallel-main 上有 3 个不在 main 里的提交，动的是同一批文件（advice.py、controller.py、pair.py、freeze.py）。见需要你定的第 5 项。导入等不等的那一个到 v1 要重新实现 |
| main 回滚了 PR #45，新分支以后合不回去 | 从回滚之前分出去的分支合回 main 时，PR #45 的改动不会自动回来：没被新版本动过的部分会被删掉，留下依赖它的代码。合回之前必须先撤销那次回滚。你已选定带着 PR #45 做（第 7 项），到合回那一步我会提醒 |
| 旧作业用新代码续跑 | v0 之前按 scope 写了一部分首版的作业，续跑时旧记录按它包含的 capability 算，剩下的照常补写 |
| v3 里一个 controller 同时看得到合同区和预写区 | 合同区的选择（设计怎么排、补不补设计）仍在看不到预写区的轮里定。别的轮里合同区没有可选的东西：抓 baseline 和封存由程序直接做；封存之前标记 check、挑准备配方、改合同、强制重抓都不在它的工具表里。每条配测试（W18） |
| v3 把两个作业合成一个，隔离出漏洞 | 内部仍是两份隔离的状态，用的是今天 pair 的同一套：第二个克隆、各自的沙箱和私有路径。现有的隔离测试要原样通过；预写区只接受 controller 发来的调用 |
| v3 里 controller 排得不好，比写死的流程差 | 默认路线一直在：它没有可用回答、连续答不好、或者放行时，按 v2 的步骤走。每一轮都把默认的下一步给它看 |
| v3 的轮数变多 | 操作一结束就可能问一轮。没有取舍的步骤不问；它可以一次发一批调用并放行默认路线；轮数预算只有一份，用完就走默认路线 |
| v3 里 controller 在预写区修个没完，耽误带入 | 封存之后带入变成可调用时一定问它一轮；预写区的 author 次数、时间和 token 都有上限；默认路线是封存后就带入 |
| v3 第二步：两个改状态的操作同时跑，状态写坏或取消错对象 | 只在 parallel 开着时放开，排在 v3 实测之后。今天后台操作靠“进程里只有一个后台操作”来认领它启动的进程，这一条要先改；并发、取消和崩溃恢复各做专项测试 |
| tqdm full 上看不出新自由度有没有用 | tqdm full 验证的是没有退步和多问的开销；新路径靠脚本化 controller 的测试覆盖；要看到自由度被用上，需要另一个项目，等 tqdm 的结果出来再定 |

<a id="decide"></a>

## 17. 需要你定的

编号沿用之前的，方便你对照。第 1、9、10、8、7、13、12、14、11、15、16、17、3 项你已经定了，排在前面；其中 14 到 17 是评审之后新增的，第 3 项是你在 2026-11-21 定的。第 22、23 项是第 3 项带出来的。第 4 项的推荐因为评审有调整。第 18 到 21 项是 v3 的。没定的每项我都给了推荐，你不说的话我按推荐做。**代码还没有开始写**，等你说开始。

### 已定的

#### 第 1 项（已定）：parallel 开关是什么意思

你定的：pair 管 draft job 和 main job 是否重叠；parallel 管其余所有并行，包括多个 author 同时写、同时给多个 leaf 写测试、同时修几处、draft job 提前验证。关着时所有会话一个接一个，程序不划分 scope。谁来编排不看开关，都是 controller。三个版本相同。

#### 第 9 项（已定）：parallel 关着时 test designer 要不要也一个接一个

你定的：要。“同时给多个 leaf 写测试”归 parallel 管，关着时 designer 一次一个。我把 reviewer 也按一次一个处理。

#### 第 10 项（已定）：“更多流程交给 controller”做到哪一步

你定的：排成三个版本。v0 只做 author 的编排，controller 不参与 test designer 的编排；v1 封存之前排 test designer，封存之后每一步都先问 controller；v2 冻结里何时抓 baseline、何时封存也由它调。三个版本的功能尽量保持一致，只是自由度变多。v2 的范围后来在第 11 项里定了。

#### 第 8 项（已定）：parallel 关着时，“不划分 scope”具体怎么做

你定的：程序不划分。controller 决定一次写完，还是按 capability 分几次、一个接一个写；程序给它每组 capability 的大小。小项目就是一次写完。它不回答时 mainline 发一次写全部的调用。

#### 第 7 项（已定）：main 回滚了 PR #45，新分支怎么办

你定的：新分支保持现状，带着 PR #45 做。三个版本直接用 PR #45 的机制：封存后先问 controller、draft job 有自己的 controller、draft job 提前验证。从回滚之前分出去的分支合回 main 时，PR #45 的改动不会自动回来，所以合回之前要先撤销那次回滚；到那一步我会提醒你。

#### 第 13 项（已定）：v0 里 parallel 关着时，test designer 要不要一个接一个

你定的：要。程序按固定顺序一次开一个 designer，reviewer 也是，不经过 controller。两个开关的含义从 v0 起就完整。

#### 第 12 项（已定）：三个版本怎么实测

你定的：v0、v1、v2 都先在 tqdm full 上测试。每个版本做完、单元测试通过之后跑；跑哪几种开关组合，开跑前我和你确认。已有的参照是 tqdm 在今天的代码上跑过的三次（pair 开、parallel 关）：全程 105、103、194 分钟。别的项目上要不要再测，等 tqdm 的结果出来再定。

#### 第 14 项（已定）：v0 里 parallel 关着时 designer 一个接一个，时间怎么处理（评审后新增）

你定的：保持一个接一个，排队的会话不因等待而作废，测试不会变少。parallel 的默认值仍是关。代价是慢：tqdm full 上设计这一步估计从 1 到 1.5 小时变成 5 到 6.5 小时。做法见 v0 的改动里的 W15。

#### 第 11 项（已定）：v2 放开到哪一步

你定的：只放开“封存，还是先补一次设计”；baseline 的抓取和封存本身仍由 mainline 执行。评审的结论是“何时重抓”只有一个合法位置，让 controller 自己调抓取会破坏“测试只多不少”。设计分几次调用后来归到了 v1（第 3 项）。

#### 第 15 项（已定）：parallel 关着时，owner 另外给的并发数怎么办（评审后新增）

你定的：关着时 owner 没有办法给并发数，移除这个可以控制的选项。落地成：`max_parallel_agents` 整个删掉（它今天只在关着时起作用）；`runner_workers` 只在 parallel 开着时接受；关着时给了，入口当场拒绝并说明改法。开着时 owner 的上限不变。做法见 v0 的改动里的 W10。

#### 第 16 项（已定）：v2 补设计补什么（评审后新增）

你定的：补没有有效测试的 leaf。没迁移成功的原版测试不在补设计的范围里；已有记录里唯一一次那样的补设计花了 49.5 分钟，8 条一条没补上。

#### 第 17 项（已定）：pair 开着时，v2 那一轮看不看 draft job 的状态（评审后新增）

你定的：不看。这一轮只按 main job 自己的数来定，上下文里没有 draft job 的任何信息，token 用量也只算 main job 自己的。代码里“封存之前 draft job 的情况不进 main job 的决定”那条规则原样保留。

#### 第 3 项（已定）：controller 排 test designer 做到哪一步

你定的（2026-11-21）：从 v0 到 v1，新给 controller 的权限包含设计 leaf 测试的所有内容，不是只能加会话。我落实成五样：分几次调用和每次设计哪些 leaf、一个 leaf 开几个会话、先后、同时几个、几个小 leaf 合用一个会话。评审建议的只做加法不再采用；它指出的问题改用规则守。给哪些 leaf 设计、门、试跑、knockout、评审裁决仍归程序。做法见 v1 的改动里的 W5 到 W7 和 W22。

### 待定的

不回复就按标了“推荐”的选项做。

#### 第 22 项：v1 里同一个 leaf 能不能设计第二遍（第 3 项带出来的）

设计归 controller 之后，它可以分几次调用，也看得到上一次的结局。问题是没交出通过文件的 leaf，它能不能在 v1 里就再点一次名。

1. 不能：v1 里每个 leaf 设计一遍，再设计一次仍是 v2 的补设计。第 11、16 项原样成立，v1 和 v2 的界线不动。（**推荐**）
2. 能：设计刚结束、还没重抓时的再设计归到 v1，每个 leaf 最多两遍；v2 只剩重抓之后的那个时机。

#### 第 23 项：几个小 leaf 合用一个会话放在哪（第 3 项带出来的）

它在“所有内容”里，但设计引擎是按“一个会话一个 leaf”写的，这一样要重写主循环的大半。

1. v1 的第二步，排在 v1 实测之后（W22）。v1 实测时其余四样都已经可用。（**推荐**）
2. 排在 v1 实测之前，五样一起测。v1 多一个大工作包。
3. 不做。parallel 关着时 designer 的会话数减不下来。

#### 第 5 项：fix-parallel-main 上 3 个没进 main 的提交怎么并

这 3 个提交已经推到 fix-parallel-main，不在 main 里，也不在新分支里：换候选后按规则重新准备环境；main job 的 controller 决定导入时要不要等 draft 的修复（就是 W11）；baseline 不可用的提示。评审确认前后两个可以不带中间那个单独并入。中间那个改的正是 v0 要重写的地方，到 v1 要在新规则上重新实现，不是直接合并。

1. 和自由度无关的两个在 v0 开工前并入；导入等不等的那一个留到 v1 重新实现。（**推荐**）
2. 三个都在 v0 开工前并入。那样 v0 里 parallel 开着时，导入等不等就已经由 controller 定了，比你说的 v0 多一处自由度；v0 改准入规则时还要带着它一起改。
3. 都不并；那样 W11 不做，导入时一律等。

#### 第 4 项：按 capability 记账和并行约束（W4）放在哪（评审后有调整）

评审发现记账那一半必须在 v0 实测之前：没有它，parallel 关着时按 capability 分几次写就做不出来。所以我把它并进了 W10。W4 只剩并行组里的约束。

1. 记账并进 W10；并行约束（W4）算 v0 的第二步，排在 v0 实测之后。（**推荐**）
2. 并行约束放到 v2 之后再做，三个版本先走完。
3. 并行约束三个版本都不做，留到以后。记账仍然要做。

#### 第 18 项：v3 里 controller 定合同区的事时，看不看预写区（v3 新增）

v3 只有一个 controller，它调度预写区时必然看得到那边的结果。问题是设计怎么排、补不补设计这些合同区的选择。

1. 不看：这些选择仍在单独的轮里定，这些轮的上下文只从合同区取。第 17 项在 v3 里继续成立。（**推荐**）
2. 看：一轮里同时定两边。它能按预写区的进度决定补不补，比如首版已经在等了就不补。但 author 的结果就可能影响测试的多少，守着的只剩 v1、v2 的那几条规则。

#### 第 19 项：v3 里 parallel 关着时，封存之前能不能验证和修复（v3 新增）

第 1 项里你把 draft job 的提前验证归给 parallel。按 v3 的关系表，它需要解除的是合同区和预写区之间的互斥，那是 pair 管的；预写区内部仍然一次一个。

1. 能：pair 开着就可用。parallel 关着时合同区要走几个小时，预写区写完后这段时间用得上。（**推荐**）
2. 不能：沿用第 1 项，只在 parallel 开着时可用。那样 parallel 关着时 v3 和 v2 的差别只剩带入的时机。

#### 第 20 项：v3 里没有取舍的步骤由谁触发（v3 新增）

建工作区、准备环境、欠着的 baseline、条件齐了的封存、任务基准，这些步骤依赖一满足就只有一种走法。

1. 程序直接做，不问 controller。抓 baseline 和封存因此仍不经过它的选择，第 11 项在 v3 里继续成立。（**推荐**）
2. 也由 controller 调，关系表只负责拦。每一步多一轮（1 到 3 分钟），没有可定的东西；它不调时还要靠默认路线接手。

#### 第 21 项：v3 的第二步（区内按资源互斥）做不做（v3 新增）

让同一个区里验证和写作同时、几项验证同时，要把“一个作业同一时刻只有一个改状态的操作”拆成按占用的东西加锁。这是 v3 里风险最大的一块。

1. 做，排在 v3 实测之后，只在 parallel 开着时放开。（**推荐**）
2. 不做：v3 只到跨区调度为止。你的例 2 里封存之前的验证不受影响，那是跨区的。

#### 第 2 项：controller 能不能给 test designer 写文字指示

author 那边 controller 可以写指示。designer 这边如果也放开，它就能影响测试写成什么样。你说的“设计 leaf 测试的所有内容”，我理解为怎么排，不包括这一样；不对请纠正。

1. 不能，四个版本都只给结构（哪些 leaf、几个会话、先后、同时几个、补哪个 leaf）。（**推荐**）
2. 能，但限定在“侧重哪些功能点”一类，由程序校验。这会动到保证，建议留到后面的版本单独讨论。

#### 第 6 项：reviewer 的分批要不要也交给 controller

reviewer 现在每 8 个文件一个，由程序分。我理解它不在“设计 leaf 测试的所有内容”里：分批属于评审这一侧；不对请纠正。

1. 四个版本都不动。（**推荐**）
2. 也交给 controller（每批几个文件，上限 8）。

<a id="later"></a>

## 18. 这几个版本都不做的，留给后面

- **分批封存，把已经固定的测试提前交给 draft job**：让 main job 先封存一部分测试，draft job 提前验证时也用上它们。这是“何时封存”能往早调的唯一办法。它要先想清楚“封存只有一次”和“封存前的测试不外传”这两条规则怎么改。v3 的关系表里以后多一行就能表达，但规则要先定。
- **controller 自己调抓 baseline 和封存**：评审之后不做，理由见 v2 的改动。强制重抓 baseline 也不放开。
- **补没迁移成功的原版测试**：v2 的补设计只补没有有效测试的 leaf（第 16 项）。
- **两份状态真正合成一份**：v3 对外是一个作业、一个 controller，内部仍是两份隔离的状态。合成一份要重写状态和日志“只有一个写进程”的模型，换来的只是实现更简单。
- **一轮里同时定合同区和预写区的事**：见第 18 项。
- **controller 自己决定有没有预写区**：pair 不写时仍由程序按规模定。交给 controller 要在作业一开始、还没有任何信息时问它一轮。
- **parallel 开着时 scope 的切法本身**：45,000 token 的上限、一个大组按文件切成几段。交给 controller 需要让它知道文件一级的信息，和“controller 看不到源码路径”有冲突。
- **controller 影响测试内容**：给 designer 写指示、决定给哪些 leaf 至少设计一次。v1 交给它的是设计怎么排，不是测试写什么。
- **reviewer 和任务评估里的会话**：这几个版本只管 author 和 test designer 的会话，以及流程上的时机。任务评估里的会话不受 parallel 开关管。

<a id="review"></a>

## 19. 评审之后改了什么

2026-11-20 对三个版本各做了一份独立评审，逐条对着新分支的代码核实。结论是：**版本的先后顺序是对的，每一版都包含上一版；但原方案有几处做不出来，有几处“新自由度”是名义上的**。下面是这一版相对评审前改掉的地方。

### 每一版实际多给了 controller 什么

| 版本 | 真的多给了 | 评审前写了、现在去掉或改掉的 |
| --- | --- | --- |
| v0 | parallel 关着时：首版怎么写由它定；draft job 有自己的 controller。 | parallel 开着时和今天几乎相同，原来没说清。 |
| v1 | 到保存、对比这几步先问它，于是能看了上一步的结果再定；parallel 开着时导入可以不等；设计 leaf 测试怎么排（评审之后你定的：全部归它）。 | 评审建议封存之前只做加法：先后和同时几个选了没差别，把一个 leaf 拆开会让测试变少。你定了全部交给 controller；评审指出的问题改用规则守，见 [v1 的改动](#work-v1)。 |
| v2 | 封存之前要不要再补一次设计。 | 何时重抓 baseline：只有一个合法位置。controller 自己调抓取和封存：守不住“测试只多不少”。设计分几次调用后来归到了 v1。 |

三级台阶不一样大。v0 是一大步，但只在 parallel 关着时；v1 也是一大步：封存之后每一步先问它，封存之前的设计整个交给它；v2 是一个二选一。

### v0 改了什么

- **按 capability 记账提前到 v0 实测之前**，并进 W10。原来排在实测之后；不提前的话，pair 开、parallel 关时 controller 一按 capability 分着写，draft job 的草稿就整份作废。
- **designer 一个接一个要配时间规则**，新增 W15。tqdm full 上第一轮有 28 个 designer 会话，合计 209 到 227 分钟；窗口不改的话后面的轮次开不了。你定了排队不算超时（第 14 项）。
- **答不好时的规则重写**（W2）：同一步只问一次，答不好就走默认。只改计数的话，一个反复给出被拒调用的 controller 会被一直问下去。
- **“保存、第一次全量对比是 mainline 的固定步骤”说得不准**：controller 今天就能在排首版的那一轮里把它们一起排进去。准确的说法是这两步之前不单独问它。
- **draft job 在 parallel 关着时的路径**写进了 W10；关着时 owner 不能再给并发数，这个选项移除（第 15 项，你定的）。

### v1 改了什么

- **封存之前的设计**：评审建议只做加法。2026-11-21 你定了设计 leaf 测试的所有内容都归 controller，这一半按它重写：怎么排全部归它，程序只留规则。重写之后还没有再评审。
- **“封存之后每一步都问”列出了不问的步骤**：导入、任务基准的准备、候选环境的重新准备、draft job 的交出。不列的话，pair 开着时 controller 一个调用就能把导入跳过去。
- **“首版写完”单独定义**，不再借用“第一次全量对比出了结果”。
- **导入等不等（W11）要重新实现**，不是并入一个现成的提交；触发条件改成“draft job 的首版已经写完、还有 author 在跑”。
- **顺序**：先做封存之后的一半，再做封存之前的一半。

### v2 改了什么

- **收窄成一个决定**：每个 leaf 都设计过一遍之后，照常封存，还是先补一次设计。你定了 baseline 的抓取和封存本身仍由 mainline 执行（第 11 项）。
- **封存之前 controller 调不到抓 baseline 和封存**，补设计整个作业只能一次。
- **不给 draft job 的阶段**：代码里有明文规则，封存之前 draft job 的情况不进 main job 的决定。你定了不看（第 17 项）。
- **只补没有有效测试的 leaf**，不补没迁移成功的原版测试（第 16 项，你定的）。
- **顺序**：先立规则和工具表，再做上下文，最后接通那一轮。

### 实测上的结论

- 在 tqdm full 上，三个版本新增的自由度大多用不上：项目小，controller 多半选一次写完；设计一次之后缺有效测试的 leaf 是 0；draft job 比封存早交出。
- 所以 tqdm full 验证的是**没有退步**和**多问几轮的开销**。新路径靠脚本化 controller 的测试覆盖。
- 要看到新自由度被用上，需要另一个项目，等 tqdm 的结果出来再定。

<a id="basis"></a>

## 20. 依据

**依据**。方案基于对新分支代码（21d8a28e，PR #45 的合并点）的阅读：author 的拆分规则在 `scopes.py`、`strategies/advice.py`、`job_tools/workspaces.py`；test designer 的会话在 `leaf_test_design.py`、`execution.py`、`job_tools/freeze.py`；controller 何时被问在 `strategies/controller.py`；冻结的顺序在 `advice._freeze` 和 `job_tools/freeze.py`。还没有写任何代码，文中的“改哪里”是读代码后的判断，动手时可能要调整。流程图都是示意图，不是实测。

**评审**。2026-11-20 对 v0、v1、v2 各做了一份独立的设计评审，逐条对代码核实方案的说法、每个新自由度是否真的选得了、相对上一版是否只增不减。这一版是评审之后的修订。v1 封存之前的一半在 2026-11-21 按你的决定重写（设计怎么排全部归 controller），重写之后还没有再评审。文中的用时估计来自 tqdm 三次实测的会话时长，是估算，不是实测。

**v3**。2026-11-21 按你的要求新增，建在 v2 之上。关系表是按代码里 46 个工具现有的前提条件整理的；“一个作业同一时刻只有一个改状态的操作”、pair 的两个作业怎么隔离、owner 的请求通道，这几处对着代码核实过。v3 还没有做过独立评审，工作包的规模是估计。

**分支**。`layered-controller` 建在 21d8a28e 上，建的时候它是 main 的最新提交。之后 main 合了 PR #47，把 PR #45 回滚了；新分支没有跟着动，仍含 PR #45。分支目前只在本地，没有推送。
