# detectron2 压缩实验的轨迹（开性能验收，进行中）：最新的 main（a003430d），parallel on、pair on、performance on

这份文件按时间顺序记录这次实验到 **2026-11-22 22:18（PST）** 为止发生的每一步：主持会话（host）的每一步、四个作业的每条事件和每个操作、每个模型会话、controller 的每一轮、每个候选和它的对比、性能契约和性能测量、检查节点接下的每个请求。**运行还没有结束**，导出时主作业的状态是 `running`（阶段 `workspace_agents`）；结束后的部分不在这份文件里。

内容全部取自这次运行自己的记录（主持会话保存的会话、作业的事件和操作记录、各次模型调用的记录、启动记录、运行期间对节点请求的抽样），外加调度器的记账（只用于第 10 节的批次表），由脚本生成；事件、工具返回和 controller 写的理由与指示是英文原文，照原样保留。时间都是 PST（UTC−8），“第几分钟”从批处理作业启动算起。本机的路径、账户名、队列名、节点名、调度器作业编号、页面密钥和仓库所有者的姓名已经换成占位符。

和上一次（r1，不开性能验收）不同的地方：这次有两对作业（主持会话取消了第一对、重新提交了第二对，记作 ①、②），第二个主作业的测试设计做了两遍（冻结阶段暂停过一次），批处理作业到了时限、之后在新的批处理作业里恢复，以及性能验收本身（第 8 节）。

## 1. 配置和目前的状态

| 项目 | 内容 |
| --- | --- |
| 实验 | 用 nanolize 压缩 detectron2（`main` @ `247691a`），从零开始：主持会话自己做完整的阶段 01，得到的功能图有 111 项能力、52 条检查；选核心能力：选中 64 项，排除 47 项，留下 45 条检查 |
| nanolize 代码 | 最新的 main（a003430d），parallel on、pair on、performance on，版本 0.8.0 |
| 选项 | `agent=claude model=claude-fable-5-2 effort=high unattended=on parallel=on pair=on account=<账户> partition=<队列> qos=normal scope=core performance=on --cn`；并行模式的设置（原样）`{"enabled": true, "max_agents": 4, "speculation": 2, "widen": true}`；性能验收的设置（原样）`{"max_repairs": 2, "repetitions": 5, "tolerance_percent": 20}`；检查经 nanolize 自己的执行器上计算节点 |
| 独立性 | 不用任何早先运行的产物：detectron2 从公开仓库重新克隆到同一个提交；主持会话是全新的会话，功能图、清单、恢复的测试、runner 设置都由它重新做；整次运行在一个看不到早先运行文件（归档、包、运行记录、分析目录、Claude Code 的历史会话和记忆、节点上别人留下的临时文件）的挂载命名空间里。测试环境和预编译的 C++ 扩展是实验前用脚本建好的机器环境，不是任何一次运行的产物 |
| 主持会话 | Claude Code 2.1.327，Fable 5.2，effort high；04:57:34 启动；第一段到 18:29:35 自己结束（230 轮，$33.66）；批处理作业到时后，19:11:11 在新的批处理作业里用同一个会话继续，导出时还在值守 |
| 作业 | 主①作业 `15926218`（cancelled）；草稿①作业 `c49d4cee`（cancelled）；主②作业 `c52b52e8`（running）；草稿②作业 `757d930c`（draft_ready） |
| 导出时的状态 | 主作业② `running`（阶段 `workspace_agents`）；最后一条事件 21:54:18：A parallel group (split) of 5 author sessions in implementation workspaces, 4 at a time. |
| 花费（到导出时） | 作业里的模型调用 $950.06（开始 274 次，已结束 270 次），试调 $0.46（9 次），主持会话第一段 $33.66（续跑的一段还没有结算）；其中第一对作业 $287.39，第二对作业 $662.67 |
| 行为验收（到导出时） | 最后一次完整对比 `verification-21`（candidate-5，20:19:05）：`checks_passed`，失败的检查 0 条；体积 633,182 → 169,921 token，保留 26.84% |
| 安装检查 | 最近一次（candidate-5，20:20:41）：`passed`，2 / 2 步 |
| 性能验收（到导出时） | 做了 1 次性能测量；最近一次 `performance-23`（candidate-5，21:50:04 结束，89.4 分钟）：`failed`，582 条标准里通过 577 条，慢于允许值的 5 条 |
| 原测试的迁移 | 给了 13 条，迁移成 12 条；没能验证的 1 条 |

## 2. 时间账

按先后排的每一段。标了“作废”的是后来重做、没有用上的时间；“空档”是没有任何作业在工作的时间。

| 阶段 | 开始 | 结束 | 分钟 | 备注 |
| --- | --- | --- | --- | --- |
| 主持会话的阶段 01 和提交（批处理作业启动到第一条作业事件） | 04:57:34 | 05:35:15 | 37.7 |  |
| 第 ① 对作业（主持会话取消） | 05:35:15 | 08:20:00 | 164.8 | 作废 |
| 主持会话改清单、重新转换和规划、提交下一对 | 08:20:00 | 08:22:32 | 2.5 |  |
| 主②：试调 runner、建工作树、第一次基线 | 08:22:32 | 08:32:08 | 9.6 |  |
| 主②：测试设计第 1 遍（_NotStarted：the batch could not be submitted: Scheduler command timed out: sbatch） | 08:32:08 | 13:00:15 | 268.1 | 作废 |
| 主②：暂停，主持会话恢复它 | 13:00:15 | 13:00:50 | 0.6 | 空档 |
| 主②：测试设计第 2 遍（完成） | 13:00:50 | 18:06:03 | 305.2 |  |
| 主②：带着设计出的测试重新抓基线 | 18:06:03 | 18:40:12 | 34.1 |  |
| 主②：封存契约 | 18:40:12 | 18:40:55 | 0.7 |  |
| 主②：等草稿并导入 | 18:40:55 | 18:41:22 | 0.5 |  |
| 主②：对比和修复（到批处理作业到时） | 18:41:22 | 18:57:51 | 16.5 |  |
| 批处理作业到时，到主作业在新的批处理作业里恢复 | 18:57:51 | 19:11:41 | 13.8 | 空档 |
| 主②：恢复后的对比和修复（到全部行为检查通过） | 19:11:41 | 20:19:05 | 67.4 |  |
| 主②：安装检查（candidate-5） | 20:19:06 | 20:20:41 | 1.6 |  |
| 主②：性能测量 `performance-23`（candidate-5，failed） | 20:20:42 | 21:50:04 | 89.4 |  |
| 主②：之后到导出时（进行中） | 21:50:04 | 22:18:48 | 28.7 |  |
| （同时）草稿①作业，从它的第一条事件到最后一条 | 05:35:15 | 08:20:00 | 164.7 | cancelled |
| （同时）草稿②作业，从它的第一条事件到最后一条 | 08:22:32 | 10:12:32 | 110.0 | draft_ready |

到导出时，批处理作业启动以来共 1041 分钟，其中标为作废或空档的 447 分钟。

## 3. 三次重来和中断

**第 1 次：主持会话取消第 ① 对作业（08:19:49）。** 主作业① `15926218` 和草稿作业 `c49d4cee` 运行了 164.8 分钟后被主持会话取消（事件原文：`Owner requested cancellation; confirming resource shutdown.`），花掉 $287.39 的模型调用。原因和它改了什么，见主持会话在 issues.md 里的记录（第 4 节末尾）；之后它重新转换清单、重新规划，提交了下一对作业。

**第 2 次：主作业②在冻结阶段暂停，测试设计重做（13:00:31）。** 测试设计这一步开始 268.1 分钟后，作业提交一个检查批次时调度器命令超时，作业暂停（事件原文：`The compute node this job's checks run on could not be used within the owner's queue limit (the batch could not be submitted: Scheduler command timed out: sbatch); no check ran, and the freeze steps that ended are kept. Resume the job once the scheduler runs batches again. This is the main job of a pair: its checks stay on a compute node, and its draft job goes on writing meanwhile.`）。主持会话 13:00:49 恢复了它（事件原文：`Resuming the job in its freeze: it has no checkpoint yet, and goes on after the freeze steps that ended.`）。这一步没有做完，恢复后从头重做：操作记录里第一遍是 `error`（`_NotStarted`，268.1 分钟），第二遍 305.2 分钟。

**第 3 次：批处理作业到了时限（18:57:51）。** 整次运行所在的批处理作业有 14 小时的时限，到时后节点上的所有进程被结束（主持会话已在 18:29:35 自己结束）。19:11:09 在一个新的批处理作业里继续：先用 nanolize 自己的状态查询确认主作业可以恢复（返回 `{"status": "failed", "phase": "failed", "actions": ["resume"], "resume_available": true, "error": "Execution worker is no longer running.", "waits_for": null}`），再让同一个主持会话接着跑，由它调用恢复。作业事件原文：`The execution worker stopped before final evidence was saved.`；`Validated checkpoint accepted; resuming only unfinished stages.`。没有重新克隆、重做阶段 01 或提交新作业。

## 4. 主持会话的轨迹

主持会话是一个无人值守的 Claude Code 会话（`claude -p`，带 nanolize 插件），在计算节点上按 nanolize 的 skill 做完阶段 01、启动评审、提交选择，然后定时查看作业。下面依次是给它的提示、启动记录、它每次传给 `start_execution_review` 的参数、续跑时给它的提示、它的每一步（调用了什么，说了什么；工具返回的内容不列）。

<details><summary>给主持会话的提示（原文）</summary>

```
You are the host agent of an unattended nanolize run. Do exactly what the nanolize plugin's skill "nanolize" (nanolize:nanolize) says for this invocation, as if the user had typed it in this conversation:

$nanolize detectron2 agent=claude model=claude-fable-5-2 effort=high unattended=on parallel=on pair=on account=<账户> partition=<队列> qos=normal scope=core performance=on --cn

Facts about this machine that the skill cannot know. Follow them exactly:
- Your working directory is <共享盘路径><存储目录>/live and the folder is <原仓库>. Use the skill's default working root, <工作根>.
- This is a fresh, independent run: do everything of stage 01 yourself, from this checkout alone. Use no result of any earlier run of nanolize on this or any project (no code graph, manifest, notes, plan, report, recovered tests, runner settings), and do not look for one.
- You are already on a compute node inside a scheduler allocation of 32 CPUs and 96 GB. Run everything you do yourself here, directly: start no scheduler job of your own (no sbatch, no srun, no salloc), whatever other instructions say about a login node; this is not the login node. nanolize's own checks are different: they go to the scheduler through the check executor, and the scheduler's commands work from this node. Start the review with the check executor the skill builds from account=, partition= and qos= (account <账户>, partition <队列>, qos normal: given, do not search for others), with "queue_timeout": 1800 and "python": "<nanolize 解释器>/a003430d/bin/python" (nanolize's interpreter, on storage every node sees). Every compute node has the same system libraries as this one, and <共享盘> and /home are the same on all of them.
- The run is two jobs (pair=on) with the parallel mode on (parallel=on), as the skill says for these options; add no limit of your own to either.
- A test environment for this project exists on this machine; use it as the run's test environment instead of building one in test-env/ (a build of it needs a CPU-only PyTorch from another package index and a compiler run of minutes): <测试环境>/bin/python is Python 3.11 with CPU torch 2.5.1, torchvision 0.20.1 and the project's test dependencies (pytest included); the project itself is not installed in it. It is shared and must stay as it is: install nothing into it and change nothing in it. The project's C++ extension was built once from this commit with this node's compiler: <预编译扩展> holds the built file (detectron2/_C.*.so). Copying that file into a tree's detectron2/ directory is all that tree needs to import detectron2._C; make that the preparation recipe of the original and of the candidate (a copy takes a second; a build takes minutes). Checks must run one thread each: set OMP_NUM_THREADS=1 and MKL_NUM_THREADS=1 in every check's environment. PIP_CONFIG_FILE=/dev/null is set: the machine's own pip index does not resolve here; pypi.org is reachable for what nanolize itself installs (Graphify).
- Tests that cannot pass on the original in this environment (no GPU, no dataset files, no network model zoo, an optional package that is not installed) are left out as the skill says for such tests; do not spend the run on making them pass.
- The account's home directory is limited to 10 GB and nearly full: create nothing large under $HOME. The working root is on a large filesystem; keep everything the run writes there.
- The nanolize MCP server can take a minute to connect; load its tools before deciding they are missing.
- In claude-runners.json: nanolize's interpreter is <nanolize 解释器>/a003430d/bin/python; it reads nanolize from <nanolize 代码>/src and its dependencies from <检出目录>/nanolize/.venv, so none of these three places may be hidden from a session, and the test environment <测试环境> is exposed as the skill says for test-env. Beside what the skill names, the hide list must contain: <预编译扩展> <共享盘路径><存储目录>/d2/uv-cache <共享盘路径> 
- Nobody attends this run and nobody will answer a question: never wait for a person, and decide what the skill leaves to you. Do not stop to ask.
- Once the job is submitted, follow the skill's section for an unattended run. If you cannot keep observing until the job ends, stop: the jobs go on by themselves and another process records how they end.
- In your last message, state the run_id, the review_id, the job ids, the working root, and the commit that holds the recovered tests (or that there is none).
```

</details>

<details><summary>启动记录（含续跑的几行）</summary>

```
run=r2 host=<节点> slurm_job=<调度作业> started=2026-11-22T04:57:34-08:00 runtime=<nanolize 代码> nanolize_commit=a003430d dirty=0
python=<nanolize 解释器>/a003430d/bin/python nanolize=0.8.0 <nanolize 代码>/src/nanolize/__init__.py
folder=<原仓库> commit=247691a1c292654867deb35cabb27f18d75a1363 branch=main
claude=2.1.327 (Claude Code) host_model=claude-fable-5-2 host_effort=high pip_config=/dev/null sbatch=<调度器命令>
args=agent=claude model=claude-fable-5-2 effort=high unattended=on parallel=on pair=on account=<账户> partition=<队列> qos=normal scope=core performance=on --cn
test_env_fingerprint=604659d50561e108 (before the first run of this batch: 604659d50561e108)
host start 2026-11-22T04:57:34-08:00
host exit=0 at 2026-11-22T18:29:35-08:00
test_env_fingerprint_end=604659d50561e108 (computed by a separate small job at 2026-11-22T19:01:01-08:00 after the batch job was stopped at its time limit; the run's own script did not reach this line)
resume: run=r2 host=<节点> slurm_job=<调度作业> started=2026-11-22T19:11:09-08:00 limit_hours=24 runtime=<nanolize 代码> nanolize_commit=a003430d
resume: review=3e9636ff8b60422b880261ce0b92860c main_job=c52b52e8068a41f9962c8fd761d3f11f host_session=ade5d803-ff40-44fa-a5be-8a152ab0b6fb folder_head=d9e4e20 claude=2.1.327 (Claude Code)
resume: test_env_fingerprint=604659d50561e108
resume: preflight exit=0 {"status": "failed", "phase": "failed", "actions": ["resume"], "resume_available": true, "error": "Execution worker is no longer running.", "waits_for": null}
resume: host start 2026-11-22T19:11:11-08:00 session=ade5d803-ff40-44fa-a5be-8a152ab0b6fb
```

</details>

<details><summary>第 1 次传给 start_execution_review 的参数（05:32:16）</summary>

```json
{
 "path": "<原仓库>",
 "manifest_path": "<工作根>/notes/graph-manifest-3.json",
 "state_root": "<工作根>/state",
 "allow_execution": true,
 "public": false,
 "scope_preset": "core",
 "unattended": true,
 "pair": "on",
 "performance": {
  "enabled": true
 },
 "runner_argv": [
  "<nanolize 解释器>/a003430d/bin/python3",
  "-P",
  "-m",
  "nanolize.runners.claude_author",
  "--settings",
  "<工作根>/claude-runners.json"
 ],
 "controller_policy": {
  "runner_argv": [
   "<nanolize 解释器>/a003430d/bin/python3",
   "-P",
   "-m",
   "nanolize.runners.claude_controller",
   "--settings",
   "<工作根>/claude-runners.json",
   "{result_path}",
   "{schema_path}"
  ],
  "parallel": {
   "enabled": true
  }
 },
 "check_validation": {
  "runner_argv": [
   "<nanolize 解释器>/a003430d/bin/python3",
   "-P",
   "-m",
   "nanolize.runners.claude_role",
   "--settings",
   "<工作根>/claude-runners.json",
   "{result_path}",
   "{schema_path}"
  ]
 },
 "check_executor": {
  "kind": "auto",
  "account": "<账户>",
  "partition": "<队列>",
  "qos": "normal",
  "queue_timeout": 1800,
  "python": "<nanolize 解释器>/a003430d/bin/python"
 },
 "prepare_checks": [
  {
   "name": "prepare-native-extension",
   "argv": [
    "cp",
    "<预编译扩展>/_C.cpython-311-x86_64-linux-gnu.so",
    "detectron2/"
   ],
   "timeout": 300,
   "env": {
    "OMP_NUM_THREADS": "1",
    "MKL_NUM_THREADS": "1"
   }
  },
  {
   "name": "prepare-model-zoo-configs",
   "argv": [
    "sh",
    "-c",
    "mkdir -p detectron2/model_zoo && ln -sfn ../../configs detectron2/model_zoo/configs"
   ],
   "timeout": 300,
   "env": {
    "OMP_NUM_THREADS": "1",
    "MKL_NUM_THREADS": "1"
   }
  }
 ],
 "installation_checks": [
  {
   "name": "install-build",
   "argv": [
    "{python}",
    "-m",
    "pip",
    "install",
    "--no-deps",
    "--no-build-isolation",
    "--no-index",
    "{repo}"
   ],
   "timeout": 3000,
   "env": {
    "PYTHONPATH": "<测试环境>/lib/python3.11/site-packages",
    "OMP_NUM_THREADS": "1",
    "MKL_NUM_THREADS": "1"
   }
  },
  {
   "name": "install-smoke",
   "argv": [
    "{python}",
    "-c",
    "import detectron2, detectron2._C\nfrom detectron2 import model_zoo\nfrom detectron2.modeling import build_model\nassert 'site-packages' in detectron2.__file__, detectron2.__file__\ncfg = model_zoo.get_config('COCO-Detection/faster_rcnn_R_50_FPN_1x.yaml')\ncfg.MODEL.DEVICE = 'cpu'\nmodel = build_model(cfg)\nprint(detectron2.__version__, type(model).__name__, len(model.state_dict()))\n"
   ],
   "timeout": 600,
   "env": {
    "PYTHONPATH": "<测试环境>/lib/python3.11/site-packages",
    "OMP_NUM_THREADS": "1",
    "MKL_NUM_THREADS": "1"
   }
  }
 ],
 "installation_python": "<测试环境>/bin/python"
}
```

</details>

<details><summary>第 2 次传给 start_execution_review 的参数（05:33:57）</summary>

```json
{
 "path": "<原仓库>",
 "manifest_path": "<工作根>/notes/graph-manifest-3.json",
 "state_root": "<工作根>/state",
 "allow_execution": true,
 "public": false,
 "scope_preset": "core",
 "unattended": true,
 "pair": "on",
 "performance": {
  "enabled": true
 },
 "runner_argv": [
  "<nanolize 解释器>/a003430d/bin/python3",
  "-P",
  "-m",
  "nanolize.runners.claude_author",
  "--settings",
  "<工作根>/claude-runners.json"
 ],
 "controller_policy": {
  "runner_argv": [
   "<nanolize 解释器>/a003430d/bin/python3",
   "-P",
   "-m",
   "nanolize.runners.claude_controller",
   "--settings",
   "<工作根>/claude-runners.json",
   "{result_path}",
   "{schema_path}"
  ],
  "parallel": {
   "enabled": true
  }
 },
 "check_validation": {
  "runner_argv": [
   "<nanolize 解释器>/a003430d/bin/python3",
   "-P",
   "-m",
   "nanolize.runners.claude_role",
   "--settings",
   "<工作根>/claude-runners.json",
   "{result_path}",
   "{schema_path}"
  ]
 },
 "check_executor": {
  "kind": "auto",
  "account": "<账户>",
  "partition": "<队列>",
  "qos": "normal",
  "queue_timeout": 1800,
  "python": "<nanolize 解释器>/a003430d/bin/python"
 },
 "prepare_checks": [
  {
   "name": "prepare-native-extension",
   "argv": [
    "cp",
    "<预编译扩展>/_C.cpython-311-x86_64-linux-gnu.so",
    "detectron2/"
   ],
   "timeout": 300,
   "env": {
    "OMP_NUM_THREADS": "1",
    "MKL_NUM_THREADS": "1"
   }
  },
  {
   "name": "prepare-model-zoo-configs",
   "argv": [
    "sh",
    "-c",
    "mkdir -p detectron2/model_zoo && ln -sfn ../../configs detectron2/model_zoo/configs"
   ],
   "timeout": 300,
   "env": {
    "OMP_NUM_THREADS": "1",
    "MKL_NUM_THREADS": "1"
   }
  }
 ],
 "installation_checks": [
  {
   "name": "install-build",
   "argv": [
    "{python}",
    "-m",
    "pip",
    "install",
    "--no-deps",
    "--no-build-isolation",
    "--no-index",
    "{repo}"
   ],
   "timeout": 3000,
   "env": {
    "PYTHONPATH": "<测试环境>/lib/python3.11/site-packages",
    "OMP_NUM_THREADS": "1",
    "MKL_NUM_THREADS": "1"
   }
  },
  {
   "name": "install-smoke",
   "argv": [
    "{python}",
    "-c",
    "import detectron2, detectron2._C\nfrom detectron2 import model_zoo\nfrom detectron2.modeling import build_model\nassert 'site-packages' in detectron2.__file__, detectron2.__file__\ncfg = model_zoo.get_config('COCO-Detection/faster_rcnn_R_50_FPN_1x.yaml')\ncfg.MODEL.DEVICE = 'cpu'\nmodel = build_model(cfg)\nprint(detectron2.__version__, type(model).__name__, len(model.state_dict()))\n"
   ],
   "timeout": 600,
   "env": {
    "PYTHONPATH": "<测试环境>/lib/python3.11/site-packages",
    "OMP_NUM_THREADS": "1",
    "MKL_NUM_THREADS": "1"
   }
  }
 ],
 "installation_python": "<测试环境>/bin/python"
}
```

</details>

<details><summary>第 3 次传给 start_execution_review 的参数（08:21:42）</summary>

```json
{
 "path": "<原仓库>",
 "manifest_path": "<工作根>/notes/graph-manifest-4.json",
 "state_root": "<工作根>/state",
 "allow_execution": true,
 "public": false,
 "scope_preset": "core",
 "unattended": true,
 "pair": "on",
 "performance": {
  "enabled": true
 },
 "runner_argv": [
  "<nanolize 解释器>/a003430d/bin/python3",
  "-P",
  "-m",
  "nanolize.runners.claude_author",
  "--settings",
  "<工作根>/claude-runners.json"
 ],
 "controller_policy": {
  "runner_argv": [
   "<nanolize 解释器>/a003430d/bin/python3",
   "-P",
   "-m",
   "nanolize.runners.claude_controller",
   "--settings",
   "<工作根>/claude-runners.json",
   "{result_path}",
   "{schema_path}"
  ],
  "parallel": {
   "enabled": true
  }
 },
 "check_validation": {
  "runner_argv": [
   "<nanolize 解释器>/a003430d/bin/python3",
   "-P",
   "-m",
   "nanolize.runners.claude_role",
   "--settings",
   "<工作根>/claude-runners.json",
   "{result_path}",
   "{schema_path}"
  ]
 },
 "check_executor": {
  "kind": "auto",
  "account": "<账户>",
  "partition": "<队列>",
  "qos": "normal",
  "queue_timeout": 1800,
  "python": "<nanolize 解释器>/a003430d/bin/python"
 },
 "prepare_checks": [
  {
   "name": "prepare-native-extension",
   "argv": [
    "cp",
    "<预编译扩展>/_C.cpython-311-x86_64-linux-gnu.so",
    "detectron2/"
   ],
   "timeout": 300,
   "env": {
    "OMP_NUM_THREADS": "1",
    "MKL_NUM_THREADS": "1"
   }
  },
  {
   "name": "prepare-model-zoo-configs",
   "argv": [
    "sh",
    "-c",
    "mkdir -p detectron2/model_zoo && ln -sfn ../../configs detectron2/model_zoo/configs"
   ],
   "timeout": 300,
   "env": {
    "OMP_NUM_THREADS": "1",
    "MKL_NUM_THREADS": "1"
   }
  }
 ],
 "installation_checks": [
  {
   "name": "install-build",
   "argv": [
    "{python}",
    "-m",
    "pip",
    "install",
    "--no-deps",
    "--no-build-isolation",
    "--no-index",
    "{repo}"
   ],
   "timeout": 3000,
   "env": {
    "PYTHONPATH": "<测试环境>/lib/python3.11/site-packages",
    "OMP_NUM_THREADS": "1",
    "MKL_NUM_THREADS": "1"
   }
  },
  {
   "name": "install-smoke",
   "argv": [
    "{python}",
    "-c",
    "import detectron2, detectron2._C\nfrom detectron2 import model_zoo\nfrom detectron2.modeling import build_model\nassert 'site-packages' in detectron2.__file__, detectron2.__file__\ncfg = model_zoo.get_config('COCO-Detection/faster_rcnn_R_50_FPN_1x.yaml')\ncfg.MODEL.DEVICE = 'cpu'\nmodel = build_model(cfg)\nprint(detectron2.__version__, type(model).__name__, len(model.state_dict()))\n"
   ],
   "timeout": 600,
   "env": {
    "PYTHONPATH": "<测试环境>/lib/python3.11/site-packages",
    "OMP_NUM_THREADS": "1",
    "MKL_NUM_THREADS": "1"
   }
  }
 ],
 "installation_python": "<测试环境>/bin/python"
}
```

</details>

<details><summary>续跑时给主持会话的提示（原文）</summary>

```
This message is from the launcher of this unattended run, like the first one. The run is not over; it continues now, in this same conversation. What happened after your last message, and what the owner orders:

- The scheduler allocation you were in ended at its time limit on 11-22 at 18:57 PST. Every process of the run on that node was killed with it: the nanolize MCP server, the review service and its run page, the main job's worker. Nothing was cancelled or held through nanolize. The idle check batch that was left in the queue was cancelled by hand afterwards.
- Before that, the main job c52b52e8068a41f9962c8fd761d3f11f had sealed its contract (18:40 PST), imported the draft job's candidate, compared it in full twice (27 failed checks, then 10 after the controller's first round), passed its installation check, and its controller was choosing the calls of round 2. The draft job is draft_ready. No performance measurement of a candidate has run yet.
- A status query made just now with nanolize's own execution_job_status answered for the main job: {"status": "failed", "phase": "failed", "actions": ["resume"], "resume_available": true, "error": "Execution worker is no longer running.", "waits_for": null}
- You are now on another compute node, in a new allocation of 32 CPUs and 96 GB whose time limit is 24 hours: it ends about 2026-11-23 19:11 PST. The working directory, the folder, the working root, the state root, the test environment and nanolize are at the same paths as before. This node's /tmp is new and empty, and nothing that a process of the old node kept in memory or in its /tmp exists any more (ports, keys, scratch directories).
- The owner's order: continue this run to its delivery by resuming the main job from its checkpoint, as the skill says for a job whose worker stopped (resume_execution_job). Performance acceptance stays on. Change nothing of the manifest, the contract or the run's options.
- Do not start the run again, and submit no new job and no new review. If the main job cannot be resumed from its checkpoint, write why in issues.md and end with that: starting again costs many hours and is the owner's decision alone.
- The review service of the old node is gone. The job does not need it. Bring the run page back only if the skill gives a way that serves the existing review and creates nothing new.
- Every fact of the first message still holds: you are already on a compute node and start no scheduler job of your own; the check executor's account, partition and qos are the ones given; the test environment is used as it is; nobody attends this run and nobody will answer a question, so never wait for a person; record what goes wrong in issues.md.
- Once the job runs again, follow the skill's section for an unattended run until the job ends and the run is delivered. You have until the allocation's end. If you cannot keep observing until then, stop: the job goes on by itself and another process records how it ends.
- In your last message, state the run_id, the review_id, the job ids, the working root, the commit that holds the recovered tests, and how the main job ended.
```

</details>

| 时间 | 第几分钟 | 类型 | 内容 |
| --- | --- | --- | --- |
| 04:57:41 | 0.1 | 调用 | `Skill` nanolize:nanolize detectron2 agent=claude model=claude-fable-5-2 effort=high unattended=on parallel=on pair=on account=<账户> partition=<队列> qos=normal scope=core performance=on --cn |
| 04:57:41 | 0.1 | 调用 | `ToolSearch` nanolize |
| 04:57:45 | 0.2 | 调用 | `Bash` List nanolize skill files：`cd <nanolize 代码>/skills && ls -la . nanolize-run && wc -c nanolize-run/*` |
| 04:57:47 | 0.2 | 调用 | `ToolSearch` select:propose_test_environment,record_run_progress,run_dashboard_status,start_run_dashboard,submit_execution_review,mcp__plugin_nanolize_nanoliz … |
| 04:57:50 | 0.3 | 调用 | `Read` `<nanolize 代码>/skills/nanolize-run/SKILL.md` |
| 04:57:51 | 0.3 | 调用 | `Bash` Check folder git status and layout：`ls; cd detectron2 && git status --short \| head; git log --oneline \| head -3; git branch --show-current; ls; ls <nanolize 代码>/skills/nanolize-run/agents` |
| 04:57:57 | 0.4 | 调用 | `Bash` Check working root and reference docs：`cd <共享盘路径><存储目录>/live && ls -la nanolize-runs; ls -R <nanolize 代码>/skills/simplify-code \| head -40; wc -c <nanolize 代码>/skills/simplify-code/SKILL.md <nanolize 代码>/skills/simplify-code/references/*` |
| 04:58:02 | 0.5 | 调用 | `nanolize:start_run_dashboard` {"path": "<原仓库>", "language": "zh-CN"} |
| 04:58:03 | 0.5 | 调用 | `Read` `<nanolize 代码>/skills/simplify-code/references/capabilities.md` |
| 04:58:04 | 0.5 | 调用 | `Read` `<nanolize 代码>/skills/simplify-code/references/graphify.md` |
| 04:58:10 | 0.6 | 调用 | `nanolize:record_run_progress` {"stage": "discover", "status": "active", "summary": "开始发现阶段：使用本机已有的共享测试环境（Python 3.11、CPU torch 2.5.1），先在原始代码上跑一遍测试。", "steps": [{"id": "env", "status": "active"}]} |
| 04:58:11 | 0.6 | 调用 | `Read` `<nanolize 代码>/skills/simplify-code/SKILL.md` |
| 04:58:12 | 0.6 | 调用 | `nanolize:propose_test_environment` {"path": "<原仓库>"} |
| 04:58:17 | 0.7 | 调用 | `Bash` Inspect repo layout, tests and test environment：`cd <原仓库> && git status --porcelain \| wc -l && git rev-parse HEAD && git remote -v && git ls-files \| wc -l && git ls-files \| awk -F/ '{print $1"/"$2}' \| sort \| uniq -c \| sort -rn \| head -60; ls tests tests/*; D=<共享盘路径><存储目录>/d2; ls $D $D/built $D/built/detectron2; $D/env/bin/python -V; nproc; which bwrap graphify sinfo sbatch; cat .gitignore` |
| 04:58:25 | 0.9 | 调用 | `Bash` Find nanolize docs on prepare_checks：`S=<nanolize 代码>; ls $S $S/src $S/docs 2>/dev/null \| head -80; grep -rn "prepare_checks" $S/docs $S/README.md 2>/dev/null \| head -40` |
| 04:58:26 | 0.9 | 调用 | `Bash` List test environment packages：`D=<共享盘路径><存储目录>/d2; $D/env/bin/python -m pip list 2>/dev/null \| head -100; ls $D/env/bin \| head -50; $D/env/bin/python -c "import sys,sysconfig;print(sys.prefix, sys.base_prefix, sysconfig.get_paths()['purelib'])"` |
| 04:58:33 | 1.0 | 调用 | `Bash` Search docs for preparation recipes：`S=<nanolize 代码>; grep -rn "prepare_checks\\|preparation recipe\\|\"prepare\"" $S/docs/*.md $S/README.md $S/skills \| cut -c1-400 \| head -40; echo ----; grep -rln "prepare_checks" $S/src \| head -20` |
| 04:58:37 | 1.1 | 调用 | `Bash` Read preparation recipe documentation：`S=<nanolize 代码>; sed -n 555,600p $S/docs/job-tools.md \| cut -c1-1500; echo -----; grep -n "prepare_checks" $S/src/nanolize/mcp_server.py $S/src/nanolize/execution.py $S/src/nanolize/cli.py \| cut -c1-300 \| head -40` |
| 04:58:41 | 1.1 | 调用 | `Bash` Read owner checks validation code：`S=<nanolize 代码>; sed -n 1300,1372p $S/src/nanolize/execution.py; grep -n "prepare-checks\\|candidate-checks" $S/src/nanolize/cli*.py \| cut -c1-600 \| head; grep -n "prepare_checks\\|prepare-checks\\|candidate_checks" $S/docs/reliable-workflows.md $S/docs/graph-rewrite.md $S/README.md \| cut -c1-500 \| head -20` |
| 04:59:15 | 1.7 | 调用 | `Bash` Read check sandbox module header：`S=<nanolize 代码>/src/nanolize; wc -l $S/check_sandbox.py; sed -n 1,140p $S/check_sandbox.py` |
| 04:59:21 | 1.8 | 说 | 正在准备原始代码的副本并跑一遍原始测试，同时阅读 nanolize 的检查沙箱规则；接下来做证据发现和 Graphify。 |
| 04:59:29 | 1.9 | 调用 | `Bash` Export original tree and prepare trial test runner：`W=<工作根> D=<共享盘路径><存储目录>/d2 R=<原仓库> mkdir -p $W/notes/trial/export $W/notes/trial/junit $W/notes/trial/logs $W/notes/trial/home cd $R && git archive HEAD \| tar -x -C $W/notes/trial/export cp $D/built/_C.cpython-311-x86_64-linux-gnu.so $W/notes/trial/export/detectron2/ cat > $W/notes/trial/run_one.sh <<'EOF' #!/bin/bash # usage: run_one.sh <test file relative to export> W=<工作根> PY=<测试环境>/bin/python E=$W/notes/trial/exp …` |
| 04:59:36 | 2.0 | 调用 | `Bash` Run original tests per file, 16 at a time, sandboxed：`W=<工作根>; cd $W/notes/trial && rm -f summary.txt && xargs -a files.txt -P 16 -n 1 ./run_one.sh; echo ALLDONE >> summary.txt` |
| 04:59:37 | 2.1 | 调用 | `nanolize:discover_evidence` {"path": "<原仓库>", "store_dir": "<工作根>/notes/evidence"} |
| 04:59:56 | 2.4 | 调用 | `nanolize:record_run_progress` {"stage": "discover", "status": "active", "steps": [{"id": "env", "status": "active", "label": "共享测试环境已就绪；原始测试 53 个文件正在沙箱内试跑"}, {"id": "evidence", "status": "active"}]} |
| 04:59:56 | 2.4 | 调用 | `nanolize:discover_capabilities` {"path": "<原仓库>"} |
| 05:00:06 | 2.5 | 调用 | `Bash` Summarize discovered source inventory：`W=<工作根>; F=~/.claude/projects/<会话目录名>/ade5d803-ff40-44fa-a5be-8a152ab0b6fb/tool-results/mcp-plugin_nanolize_nanolize-discover_capabilities-1795352399143-627hqn.txt; cp $F $W/notes/discover_capabilities.json; python3 - <<'EOF' import json,collections d=json.load(open('<工作根>/notes/discover_capabilities.json')) print([ (k, type(v).__name__, (len(v) if hasattr(v,'__len__') else v)) for k,v in d.items()]) inv=d['inventory …` |
| 05:00:14 | 2.7 | 调用 | `nanolize:record_run_progress` {"stage": "discover", "status": "active", "steps": [{"id": "evidence", "status": "done", "label": "静态证据：450 个源文件、71975 行、81 个测试文件"}, {"id": "graph", "status": "active"}]} |
| 05:00:14 | 2.7 | 调用 | `nanolize:prepare_graphify` {"allow_execution": true} |
| 05:00:17 | 2.7 | 调用 | `Bash` List inventory by extension and non-package files：`W=<工作根>; python3 - <<'EOF' import json,collections,os d=json.load(open('<工作根>/notes/discover_capabilities.json')) inv=d['inventory'] print(collections.Counter(os.path.splitext(p)[1] for p in inv)) print([p for p in inv if not p.endswith('.py')]) print([p for p in inv if p.split('/')[0] in ('dev','docs','datasets','demo','configs','tools') or '/' not in p]) print(d['test_files']) EOF cat $W/notes/trial/summary.txt 2>/ …` |
| 05:00:25 | 2.9 | 调用 | `Bash` Run Graphify code-only extraction on the checkout：`W=<工作根>; G=<共享盘路径>; mkdir -p $W/notes/graphify; cd $W/notes && GRAPHIFY_NO_AUTO_REFRESH=1 GRAPHIFY_BACKEND=none $G extract <原仓库> --code-only --max-workers 1 --out $W/notes/graphify > $W/notes/graphify.log 2>&1; echo exit=$?; tail -5 $W/notes/graphify.log; ls -la $W/notes/graphify/graphify-out \| head; cd <原仓库> && git status --porcelain \| head` |
| 05:00:26 | 2.9 | 调用 | `Bash` Show trial test results per file：`W=<工作根>; cd $W/notes/trial; sort summary.txt; for f in logs/*.log; do echo "$(basename $f): $(tail -1 $f)"; done` |
| 05:00:33 | 3.0 | 调用 | `Bash` List failing tests with reasons：`cd <工作根>/notes/trial; python3 - <<'EOF' import glob, xml.etree.ElementTree as ET tot=dict(passed=0,failed=0,skipped=0,error=0) for f in sorted(glob.glob('junit/*.xml')): for tc in ET.parse(f).getroot().iter('testcase'): st='passed'; msg='' for ch in tc: if ch.tag in('failure','error','skipped'): st={'failure':'failed'}.get(ch.tag,ch.tag); msg=(ch.get('message') or '').replace('\n',' ')[:230] tot[st]+=1 if st in('fail …` |
| 05:00:45 | 3.2 | 说 | 正在分析原始测试结果（262 通过、38 失败，多数因缺少 model zoo 配置链接），并查 nanolize 如何对待 yaml 配置文件；Graphify 在后台运行。 |
| 05:00:47 | 3.2 | 调用 | `Bash` Check file classification and setup.py model zoo link：`S=<nanolize 代码>/src/nanolize; grep -n "yaml\\|\.cfg\\|SUFFIX\\|CONFIG" $S/repository.py \| head -50; cd <原仓库>; sed -n 150,219p setup.py; git ls-files \| grep -c "\.yaml$"; ls -la detectron2/model_zoo/` |
| 05:00:52 | 3.3 | 调用 | `Bash` Read source/configuration classification rules：`S=<nanolize 代码>/src/nanolize; sed -n 40,100p $S/repository.py; sed -n 405,420p $S/repository.py; sed -n 855,880p $S/repository.py; grep -n "def .*config\\|configuration_tokens\\|CONFIGURATION" $S/repository.py $S/budget*.py $S/capabilities.py 2>/dev/null \| head -30; ls $S \| head -150` |
| 05:00:57 | 3.4 | 调用 | `Bash` Check Graphify result and how non-source files reach candidates：`S=<nanolize 代码>; cat <临时目录> \| tail -12; grep -n -i "resource files\\|non-source\\|\"other\"\\|kind other\\|data files\\|\.yaml\\|configuration files" $S/docs/graph-rewrite.md \| cut -c1-420 \| head -40` |
| 05:01:01 | 3.5 | 调用 | `Bash` Read docs on resource files, configuration and carry：`S=<nanolize 代码>; sed -n 100,130p $S/docs/graph-rewrite.md; sed -n 225,262p $S/docs/graph-rewrite.md; sed -n 3850,3870p $S/docs/graph-rewrite.md; grep -n -i "carry" $S/docs/graph-rewrite.md \| cut -c1-300 \| head -40` |
| 05:01:29 | 3.9 | 调用 | `nanolize:import_understanding` {"path": "<原仓库>", "graph_path": "<工作根>/notes/graphify/graphify-out/graph.json", "manifest_output": "<工作根>/notes/understanding-manifest.json", "plan_output": "<工作根>/notes/understanding-plan.json"} |
| 05:01:32 | 4.0 | 调用 | `Bash` List non-project source files with line counts：`cd <原仓库>; git status --porcelain \| head -3; python3 - <<'EOF' import json d=json.load(open('<工作根>/notes/discover_capabilities.json')) inv=d['inventory'] cur=None for p in sorted(inv): if p.startswith('projects/') or p.startswith('configs/'): continue dd=p.rsplit('/',1)[0] if '/' in p else '.' if dd!=cur: print('\n['+dd+']',end=' '); cur=dd print(p.rsplit('/',1)[-1]+':'+str(inv[p].get('lines')),end=' ') EOF` |
| 05:01:54 | 4.3 | 说 | Graphify 图已导入（草稿），正在统计节点数并开始编写能力清单。 |
| 05:01:57 | 4.4 | 调用 | `Bash` Count graph nodes and inspect token inventory：`cd <工作根>/notes; python3 - <<'EOF' import json g=json.load(open('graphify/graphify-out/graph.json')) print(g.keys() if isinstance(g,dict) else type(g)) n=g.get('nodes',[]); e=g.get('links',g.get('edges',[])) print(len(n),len(e)); print(n[0]) print(len(set(x.get('community') for x in n))) p=json.load(open('understanding-plan.json')) sm=p['size_measurement'] print(sm.keys()) inv=sm['inventory'] print(type(inv), (list(in …` |
| 05:02:05 | 4.5 | 调用 | `nanolize:record_run_progress` {"stage": "discover", "status": "active", "summary": "原始测试已在沙箱内试跑：262 通过、38 失败、30 跳过、1 个文件收集出错（缺 onnx）。失败多因 model zoo 配置链接缺失、无数据集、无网络。Graphify 0.9.111 图已导入为草稿。", "steps": [{"id": "env", "status": "done", "label": "共享环境 Python 3.11 + CPU torch 2.5.1；原始测试 262 过 / 38 败 / 30 跳过"}, {"id": "graph", "status": "done", "label": "Graphify 0.9.111：10257 节点、19999 条边、594 个社区"}, {"id": "manifest", "status": "active"}]} |
| 05:02:09 | 4.6 | 调用 | `Bash` Token totals by category and area：`cd <工作根>/notes; python3 - <<'EOF' import json,collections p=json.load(open('understanding-plan.json')) inv=p['size_measurement']['inventory'] cat=collections.Counter(); tok=collections.Counter(); grp=collections.Counter() for f,v in inv.items(): cat[v['category']]+=1; tok[v['category']]+=v.get('tokens',0) parts=f.split('/') key='/'.join(parts[:2]) if parts[0] in('detectron2','projects') and len(parts)>2 else parts[0] …` |
| 05:03:34 | 6.0 | 调用 | `Bash` Rerun trial tests with model zoo config link：`W=<工作根>; cd $W/notes/trial && ln -s ../../configs export/detectron2/model_zoo/configs && ls export/detectron2/model_zoo/configs \| head -3 && rm -rf junit logs home summary.txt && mkdir junit logs home && xargs -a files.txt -P 16 -n 1 ./run_one.sh; echo ALLDONE >> summary.txt; python3 - <<'EOF' import glob, xml.etree.ElementTree as ET tot=dict(passed=0,failed=0,skipped=0,error=0) for f in sorted(glob.glob('junit/*.xml …` |
| 05:04:13 | 6.7 | 说 | 正在根据试跑结果（加上配置链接后 284 通过、16 失败需剔除）梳理每个测试文件依赖的模块，以便编写能力清单。 |
| 05:04:15 | 6.7 | 调用 | `Bash` List detectron2 imports per test file：`cd <原仓库>; for f in $(git ls-files tests \| grep 'test_.*\.py$'); do echo "== $f: $(grep -hoE "^\s*(from\|import) (detectron2\|tools\|demo)[A-Za-z0-9_.]*" $f \| sed -E 's/^\s*(from\|import) //' \| sort -u \| tr '\n' ' ')"; done; cat tests/test_packaging.py \| head -40` |
| 05:04:33 | 7.0 | 调用 | `Bash` Inspect PointRend and export usage in tests and core：`cd <原仓库>; grep -n "point_rend\\|point_sample\\|def test\\|^class" tests/layers/test_roi_align.py; grep -n "point_rend\\|def test\\|^class" tests/modeling/test_roi_heads.py; cat detectron2/projects/__init__.py; grep -n "import" detectron2/export/__init__.py detectron2/utils/testing.py \| head -40; grep -rn "detectron2.export\\|from \.\.export\\|projects" detectron2 --include=*.py -l \| grep -v "^detectron2/export"` |
| 05:06:19 | 8.8 | 调用 | `Bash` Read example manifest and check schema validation：`S=<nanolize 代码>; cat $S/examples/capability_project/capabilities.json \| head -80; grep -n "def _checks" -A 90 $S/src/nanolize/operations.py \| head -190` |
| 05:06:24 | 8.8 | 调用 | `Bash` Locate check schema validator：`S=<nanolize 代码>; grep -rn "def _checks" $S/src/nanolize/*.py \| head; grep -n "\"runtime\"\\|allowed_roots\\|\"env\"\\|\"network\"\\|\"sandbox\"\\|\"gpus\"\\|test_nodes\\|\"adapts\"\\|\"inputs\"" $S/src/nanolize/analysis.py \| head -40` |
| 05:06:27 | 8.9 | 调用 | `Bash` Read check validator code：`S=<nanolize 代码>; sed -n 60,260p $S/src/nanolize/verification.py` |
| 05:06:45 | 9.2 | 调用 | `Bash` Read runtime audit schema：`S=<nanolize 代码>; grep -n "def validate_runtime" -B3 -A60 $S/src/nanolize/runtime_guard.py \| head -120; grep -n "runtime" $S/docs/reliable-workflows.md \| cut -c1-400 \| head -20` |
| 05:08:20 | 10.8 | 调用 | `nanolize:check_installation` {"path": "<原仓库>", "checks": [{"name": "install-build", "argv": ["{python}", "-m", "pip", "install", "--no-deps", "--no-build-isolation", "--no-index", "{repo}"], "timeout": 3000, "env": {"PYTHONPATH": "<测试环境>/lib/python3.11/site-packages", "OMP_NUM_THREADS": "1", "MKL_NUM_THREADS": "1"}}, {"name": "install-smoke", "argv": ["{python}", "-c", "import detectron2, detectron2._C\nfrom detectron2 import model_zoo\nfrom detectron2.modeling import build_model\nassert 'site-packages' in detectron2.__file__, detectron2.__fil … |
| 05:08:23 | 10.8 | 调用 | `Bash` Check a few imports, config files and compiler：`cd <原仓库>; grep -n "^from\\|^import\\|^ from\\|^ from" tools/deploy/export_model.py detectron2/utils/analysis.py detectron2/utils/collect_env.py detectron2/tracking/*.py detectron2/data/transforms/augmentation_impl.py detectron2/layers/batch_norm.py detectron2/checkpoint/detection_checkpoint.py detectron2/evaluation/evaluator.py detectron2/engine/hooks.py \| grep detectron2 \| cut -c1-170; git ls-files configs \| grep '\.py …` |
| 05:09:49 | 12.3 | 说 | 安装检查已在原始代码上试跑完，正在读取结果；随后生成能力清单。 |
| 05:09:53 | 12.3 | 调用 | `Bash` Read installation check result on the original：`cd <工作根>/notes; python3 - <<'EOF' import json d=json.load(open('installation-original.json')) print({k:(v if not isinstance(v,(dict,list)) else type(v).__name__) for k,v in d.items()}) ec=d['environment_creation']; print(ec['status'], ec['duration_seconds'], ec['stderr'][-300:]) for c in d.get('checks',d.get('results',[])): print(c.get('name'), c.get('status'), c.get('exit_code'), c.get('duration_seconds')) print('ST …` |
| 05:09:58 | 12.4 | 调用 | `Bash` Show installation check durations：`cd <工作根>/notes; python3 - <<'EOF' import json d=json.load(open('installation-original.json')) for c in d['results']: print(c.get('name'), c.get('status'), c.get('exit_code'), c.get('duration_seconds')) print('STDOUT:', c.get('stdout','')[-300:]); print('STDERR:', c.get('stderr','')[-300:]) print(d['isolation']) EOF` |
| 05:10:40 | 13.1 | 调用 | `Bash` Check output limits, carry handling and config dirs：`S=<nanolize 代码>/src/nanolize; grep -n "^MAX_[A-Z_]* = \\|OUTPUT_LIMIT\\|MAX_OUTPUT" $S/verification.py \| head -20; grep -n "carry" $S/capabilities.py \| head -20; cd <原仓库>; git ls-files 'configs/**/*.yaml' 'configs/*.yaml' \| sed 's\|/[^/]*$\|\|' \| sort \| uniq -c; git ls-files projects \| grep -v "\.py$\\|\.yaml$\\|\.md$" \| head -30` |
| 05:14:03 | 16.5 | 调用 | `Write` `<工作根>/notes/make_manifest.py` |
| 05:14:05 | 16.5 | 调用 | `Bash` Generate the capability manifest：`cd <工作根>/notes && python3 make_manifest.py capabilities.json` |
| 05:14:09 | 16.6 | 说 | 能力清单已生成（111 个能力、54 个检查、无未映射文件）。现在先在原始副本上验证 4 个新增的输出对比检查是否稳定，然后做契约转换。 |
| 05:14:16 | 16.7 | 调用 | `Bash` Run the contract output checks twice on the original copy：`cd <工作根>/notes; cat > trial/run_contracts.py <<'EOF' import json, subprocess, sys, hashlib, time, os m = json.load(open(sys.argv[1])) E = "<工作根>/notes/trial/export" for c in m["checks"]: if c["compare"] != "output": continue outs = [] for i in range(2): t = time.time() r = subprocess.run(["bwrap", "--ro-bind", "/", "/", "--dev", "/dev", "--proc", "/proc", "--unshare-net", "--tmpfs", "/tmp", "--bind", E, E, "--chdir", …` |
| 05:14:54 | 17.3 | 调用 | `nanolize:propose_contract` {"path": "<原仓库>", "manifest_path": "<工作根>/notes/capabilities.json", "output_path": "<工作根>/notes/graph-manifest.json"} |
| 05:15:52 | 18.3 | 调用 | `Bash` Inspect converted manifest structure：`cd <工作根>/notes; python3 - <<'EOF' import json m=json.load(open('graph-manifest.json')) print(m.keys()) print(len(m['carry']), [c for c in m['carry'] if not c.startswith('configs/') and '/csrc/' not in c]) for c in m['capabilities']: if c['id'] in ('struct-boxes','utils-foundation','packaging','datasets-coco','export-torchscript','model-mask-head'): print(json.dumps({k:v for k,v in c.items() if k not in('description', …` |
| 05:16:05 | 18.5 | 说 | 正在逐条核对契约转换报告（哪些原始测试被留出、原因是什么），准备补充接口条目后重新转换，以保留更多原始测试。 |
| 05:16:07 | 18.6 | 调用 | `Bash` List left-out tests with dispositions and reasons：`cd <工作根>/notes; python3 - <<'EOF' import json m=json.load(open('graph-manifest.json')) for oc in m['original_checks']: print('==', oc['name'], oc['left_out'], oc['names']) for t in oc['tests']: print(' ', t['id'].split('::',1)[1], '\|', t.get('disposition'), '\|', (t.get('reason') or '')[:230], '\|', t.get('capabilities')) EOF` |
| 05:16:39 | 19.1 | 调用 | `Bash` Collect registered names and test ids：`cd <工作根>/notes; python3 - <<'EOF' import json,collections d=json.load(open('discover_capabilities.json')) se=d['static_evidence']; print(se.keys()) regs=se.get('registrations') or se.get('registration') print(len(regs), regs[0]) by=collections.defaultdict(list) for r in regs: if r['path'].startswith('detectron2/'): by[(r.get('registry') or r.get('decorator') or str(r))].append((r['path'].replace('detectron2/',''), r. …` |
| 05:17:44 | 20.2 | 调用 | `Bash` Regenerate manifest with reviewed interfaces and node-id selection：`cd <工作根>/notes; python3 - <<'EOF' import re s = open('make_manifest.py').read() # positional node ids instead of --deselect s = s.replace('''def pytest_check(target, capabilities, deselect=(), name=None): argv = [PY, "-m", "pytest", target, "-q", "-p", "no:cacheprovider"] for node in deselect: argv += ["--deselect", target.split("::")[0] + "::" + node] file = target.split("::")[0]''', '''def pytest_check(target, capa …` |
| 05:17:49 | 20.3 | 说 | 正在核对我补充的接口签名，然后用带接口的清单重新做契约转换。 |
| 05:17:53 | 20.3 | 调用 | `Bash` Verify added interface signatures against source：`cd <原仓库>; grep -n "^def convert_to_coco_dict\\|^def set_default_dataset_from_list_serialize_method\\|^def worker_init_reset_seed\\|^def gen_crop_transform_with_instance\\|^def pad_masks\\|^def scale_boxes\\|^def paste_mask_in_image_old\\|^def create_dummy_class\\|^def create_dummy_func\\|^def setup_environment\\|^def find_unused_parameters\\|^class PicklableWrapper\\|^TORCH_VERSION\\|D2_VERSION_SUFFIX\\|BUILD_NIGHTLY\\|FORCE_CUDA" …` |
| 05:17:57 | 20.4 | 调用 | `nanolize:propose_contract` {"path": "<原仓库>", "manifest_path": "<工作根>/notes/capabilities-2.json", "output_path": "<工作根>/notes/graph-manifest-2.json"} |
| 05:18:40 | 21.1 | 调用 | `Bash` See how private names are stated in the interface：`cd <工作根>/notes; python3 - <<'EOF' import json for f in ('graph-manifest.json','graph-manifest-2.json'): m=json.load(open(f)) for c in m['capabilities']: for e in c.get('interface',[]): if '_rand_range' in e or '._trainer' in e or '._writer' in e or '_buckets' in e: print(f, c['id'], '\|', e) print(f, len(m['checks']), len(m['carry']), 'builtin_meta' in ' '.join(m['carry']), [k for k in m]) m=json.load(open('graph-mani …` |
| 05:18:50 | 21.3 | 调用 | `Bash` Regenerate manifest and discard first conversion's uncommitted files with its own command：`cd <工作根>/notes; python3 - <<'EOF' s=open('make_manifest.py').read() old=''' "Public callable detectron2.data.build.worker_init_reset_seed(worker_id)"],''' new=''' "Public callable detectron2.data.build.worker_init_reset_seed(worker_id)", "Public name detectron2.data.common.AspectRatioGroupedDataset._buckets (an attribute of its instances: a kept check of the original reads or replaces it)"],''' assert old in s; open( …` |
| 05:18:55 | 21.4 | 调用 | `nanolize:propose_contract` {"path": "<原仓库>", "manifest_path": "<工作根>/notes/capabilities-3.json", "output_path": "<工作根>/notes/graph-manifest-3.json"} |
| 05:19:13 | 21.7 | 说 | 第三次契约转换干净了（保留 52 个检查，恢复 6 个测试文件共 19 个测试）。现在按工具给出的命令提交这 6 个恢复的测试文件。 |
| 05:19:16 | 21.7 | 调用 | `Bash` Commit the recovered test files with the reported command：`git add -- tests/data/test_nanolize_recovered_test_sampler.py tests/modeling/test_nanolize_recovered_test_roi_heads_1.py tests/modeling/test_nanolize_recovered_test_roi_heads_2.py tests/test_nanolize_recovered_test_checkpoint.py tests/test_nanolize_recovered_test_packaging.py tests/test_nanolize_recovered_test_solver.py && git commit -m 'Add the test files nanolize recovered' -- tests/data/test_nanolize_recovered_tes …` |
| 05:19:40 | 22.1 | 调用 | `Write` `<工作根>/issues.md` |
| 05:19:44 | 22.2 | 调用 | `nanolize:record_run_progress` {"stage": "discover", "status": "active", "summary": "能力清单已转换为外部契约：87 个外部能力、24 个内部能力、1845 条接口；保留 52 个检查，恢复 6 个测试文件（19 个测试）并已提交到 main（d9e4e20）。", "steps": [{"id": "manifest", "status": "done", "label": "111 个能力：87 外部 / 24 内部；58 个检查；携带 113 个文件"}, {"id": "knowledge", "status": "skipped"}, {"id": "plan", "status": "active"}]} |
| 05:19:46 | 22.2 | 调用 | `nanolize:plan_capabilities` {"path": "<原仓库>", "manifest_path": "<工作根>/notes/graph-manifest-3.json", "plan_output": "<工作根>/notes/plan.json"} |
| 05:19:57 | 22.4 | 调用 | `nanolize:audit_check_scope` {"path": "<原仓库>", "plan_path": "<工作根>/notes/plan.json"} |
| 05:20:08 | 22.6 | 调用 | `Bash` Find audit API to list imports of retired source：`cd <工作根>/notes; S=<nanolize 代码>/src; grep -n "^def \\|retired" $S/nanolize/check_scope.py \| head -40` |
| 05:20:14 | 22.7 | 调用 | `Bash` List retained checks that import retired source：`cd <工作根>/notes; PYTHONPATH=<nanolize 代码>/src <nanolize 解释器>/a003430d/bin/python - <<'EOF' import json from nanolize.check_scope import inspect_check_scope plan=json.load(open('plan.json')) r=inspect_check_scope('<原仓库>', plan) print(r['status'], r['summary']) for c in r['checks']: for row in c.get('imports',[]): if row.get('retired_capabilities'): print(c['name'], '\|', row.get('node'), '\|', row.get('module'), row.get( …` |
| 05:20:21 | 22.8 | 调用 | `Bash` List retained checks that import retired source (retry)：`cd <工作根>/notes; PYTHONPATH=<nanolize 代码>/src <nanolize 解释器>/a003430d/bin/python - <<'EOF' import json from nanolize.check_scope import inspect_check_scope plan=json.load(open('plan.json')) r=inspect_check_scope('<原仓库>', plan) print(r['status'], list(r.keys())) for c in r['checks']: for node in c.get('test_nodes', []): for row in (node.get('imports', []) if isinstance(node, dict) else []): if row.get('retired_capabili …` |
| 05:20:30 | 22.9 | 说 | 审计通过（无问题）。现在在一个准备好的原始克隆上预跑全部保留的检查，确认它们在沙箱里都能通过，再去启动评审。 |
| 05:20:33 | 23.0 | 调用 | `Bash` Make a prepared clone and read baseline CLI options：`W=<工作根>; P=<nanolize 解释器>/a003430d/bin/python; cd $W/notes/trial && rm -rf clone && git clone -q <原仓库> clone && cp <预编译扩展>/_C.cpython-311-x86_64-linux-gnu.so clone/detectron2/ && ln -s ../../configs clone/detectron2/model_zoo/configs && (cd clone && git status --porcelain \| wc -l && git rev-parse HEAD); $P -P -m nanolize scope-baseline --help 2>&1 \| head -40` |
| 05:20:43 | 23.2 | 调用 | `Bash` Capture a trial baseline of all retained checks on the prepared clone：`W=<工作根>; P=<nanolize 解释器>/a003430d/bin/python; cd $W/notes/trial && $P -P -m nanolize plan clone --capabilities $W/notes/graph-manifest-3.json --retain 50 --output $W/notes/trial/plan-trial.json --json > plan-trial.log 2>&1; echo plan-exit=$?; tail -c 300 plan-trial.log; $P -P -m nanolize scope-baseline clone --plan $W/notes/trial/plan-trial.json --output $W/notes/trial/baseline-trial.json --check-validation off --al …` |
| 05:20:48 | 23.2 | 调用 | `nanolize:record_run_progress` {"stage": "discover", "status": "active", "steps": [{"id": "plan", "status": "done", "label": "核心范围：保留 64 个能力、161 个文件、296888 tokens；移除 47 个"}, {"id": "audit", "status": "active", "label": "审计无问题；正在原始克隆上预跑 45 个保留检查"}]} |
| 05:20:50 | 23.3 | 调用 | `nanolize:task_doctor` {"path": "<原仓库>", "manifest_path": "<工作根>/notes/graph-manifest-3.json", "runner_argv": ["<nanolize 解释器>/a003430d/bin/python", "-P", "-m", "nanolize.runners.claude_author", "--settings", "<工作根>/claude-runners.json"]} |
| 05:21:04 | 23.5 | 调用 | `Bash` Read trial baseline outcome：`cd <工作根>/notes/trial; cat <临时目录> \| cut -c1-1500; ls -la baseline-trial.json 2>/dev/null; head -c 1500 baseline-trial.log` |
| 05:21:10 | 23.6 | 调用 | `Bash` Find where missing leaf checks block readiness：`S=<nanolize 代码>/src/nanolize; grep -rn "selected_leaf_checks_missing" $S/*.py $S/job_tools/*.py \| cut -c1-260 \| head -20` |
| 05:21:13 | 23.7 | 调用 | `Bash` Read readiness rule for leaves without checks：`S=<nanolize 代码>/src/nanolize; sed -n 225,300p $S/execution_readiness.py; grep -n "def \\|design" $S/execution_readiness.py \| head -60` |
| 05:21:23 | 23.8 | 调用 | `Bash` Capture trial baseline with a minimal validity policy：`W=<工作根>; P=<nanolize 解释器>/a003430d/bin/python; cd $W/notes/trial && echo '{"design": true, "budget_seconds": 5, "repetitions": 1}' > policy-trial.json && (time $P -P -m nanolize scope-baseline clone --plan $W/notes/trial/plan-trial.json --output $W/notes/trial/baseline-trial.json --check-validation policy-trial.json --allow-execution --json > baseline-trial.log 2>&1; echo baseline-exit=$?) 2>&1 \| tail -5; head -c 400 …` |
| 05:21:52 | 24.3 | 调用 | `Bash` Check recipe change detection and cache location：`S=<nanolize 代码>/src/nanolize; grep -n "def prepare_environment" -A70 $S/job_tools/freeze.py \| grep -n "ignored\\|changed\\|tracked\\|raise\\|digest\\|seal\\|def " \| head -40; ls -la ~/.cache 2>/dev/null \| head -5; readlink -f ~/.cache/nanolize; ls <共享盘路径><存储目录>/` |
| 05:21:57 | 24.4 | 调用 | `Bash` Read the failed trial baseline output：`cd <工作根>/notes/trial; cat <临时目录> \| cut -c1-2500` |
| 05:22:00 | 24.4 | 说 | 预跑基线时策略参数取值不合法（repetitions 最小为 2），改正后重跑；同时在写 runner 设置文件。 |
| 05:22:03 | 24.5 | 调用 | `Bash` Capture trial baseline with corrected policy：`W=<工作根>; P=<nanolize 解释器>/a003430d/bin/python; cd $W/notes/trial && echo '{"design": true, "budget_seconds": 5, "repetitions": 2}' > policy-trial.json && (time $P -P -m nanolize scope-baseline clone --plan $W/notes/trial/plan-trial.json --output $W/notes/trial/baseline-trial.json --check-validation policy-trial.json --allow-execution --json > baseline-trial.log 2>&1; echo baseline-exit=$?) 2>&1 \| tail -5; head -c 400 …` |
| 05:22:05 | 24.5 | 调用 | `Bash` Locate recipe change detection and runner settings docs：`S=<nanolize 代码>/src/nanolize; grep -n "prepare_environment" $S/job_tools/*.py \| head -8; grep -n "def _prepare\\|non-ignored\\|changes its worktree\\|changed its" $S/job_tools/*.py $S/execution.py \| head -12; ls $S/runners; sed -n 1,80p $S/runners/claude_settings.py 2>/dev/null \| head -120` |
| 05:22:12 | 24.6 | 调用 | `Bash` Read candidate tree digest and prepare_environment tool：`S=<nanolize 代码>/src/nanolize; grep -n "def _candidate_tree" -A40 $S/execution.py \| head -80; sed -n 724,790p $S/job_tools/freeze.py` |
| 05:22:17 | 24.7 | 调用 | `Bash` Check which untracked files the tree digest ignores：`S=<nanolize 代码>/src/nanolize; grep -n "def _private_or_cache" -B12 -A22 $S/execution.py \| head -90; grep -n "\.gitignore" $S/execution.py $S/rewrite.py $S/job_tools/workspaces.py \| cut -c1-220 \| head -20` |
| 05:22:31 | 25.0 | 调用 | `Bash` Read Claude runner settings keys：`S=<nanolize 代码>/src/nanolize; grep -n "settings\[\\|settings.get(\\|\.get(\"[a-z_]*\"" $S/runners/_claude_session.py \| cut -c1-200 \| head -50; sed -n 1,60p $S/runners/_claude_session.py` |
| 05:22:44 | 25.2 | 调用 | `Bash` Write the Claude runner settings file：`W=<工作根>; python3 - <<'EOF' import json W="<工作根>" U="<共享盘路径>" E=U+"/<存储目录>/d2/env" s={"model":"claude-fable-5-2","effort":"high", "hide":[U+"/<存储目录>/live/detectron2", W, "~/.cache/nanolize", U+"/<存储目录>/d2/built", U+"/<存储目录>/d2/uv-cache", U+"/miniconda3/envs/eval/lib/python3.10/site-packages/detectron2"], "expose":[E], "record_dir":W+"/model-calls", "author":{"base_python":E+"/bin/python","dependencies":E+"/lib/python3 …` |
| 05:22:52 | 25.3 | 调用 | `nanolize:try_runners` {"allow_execution": true, "runner_argv": ["<nanolize 解释器>/a003430d/bin/python3", "-P", "-m", "nanolize.runners.claude_author", "--settings", "<工作根>/claude-runners.json"], "controller_policy": {"runner_argv": ["<nanolize 解释器>/a003430d/bin/python3", "-P", "-m", "nanolize.runners.claude_controller", "--settings", "<工作根>/claude-runners.json", "{result_path}", "{schema_path}"], "parallel": {"enabled": true}}, "check_validation": {"runner_argv": ["<nanolize 解释器>/a003430d/bin/python3", "-P", "-m", "nanolize.runners.claude … |
| 05:23:22 | 25.8 | 说 | 三个 runner（作者、控制器、测试设计）试调用全部通过。现在等原始克隆上的基线预跑结果，然后启动评审并提交。 |
| 05:23:24 | 25.8 | 调用 | `Bash` Check trial baseline progress：`cd <工作根>/notes/trial; cat <临时目录> \| cut -c1-800; ls -la baseline-trial.json baseline-trial.log 2>&1; ps -u <用户> -o pid,etime,args \| grep -c "pytest"` |
| 05:23:31 | 26.0 | 调用 | `nanolize:record_run_progress` {"stage": "discover", "status": "active", "steps": [{"id": "doctor", "status": "active", "label": "调度器可达；3 个 Claude runner 试调用通过；检查发往 <队列>"}]} |
| 05:23:33 | 26.0 | 调用 | `Bash` Wait for the trial baseline to finish：`cd <工作根>/notes/trial; for i in $(seq 1 55); do [ -s baseline-trial.log ] && break; sleep 10; done; ls -la baseline-trial.json baseline-trial.log 2>&1; head -c 600 baseline-trial.log` |
| 05:31:07 | 33.6 | 说 | 基线预跑完成，正在核对每个检查在原始代码上的结果。 |
| 05:31:12 | 33.6 | 调用 | `Bash` Summarize trial baseline results per check：`cd <工作根>/notes/trial; python3 - <<'EOF' import json b=json.load(open('baseline-trial.json')) print(b.keys()) def walk(o, depth=0): if isinstance(o, dict): for k,v in o.items(): if k in ('checks','results') and isinstance(v, list) and v and isinstance(v[0], dict) and 'name' in v[0]: return v r = walk(v, depth+1) if r: return r return None orig=json.load(open(b.get('original_baseline_path') or json.load(open('baseline- …` |
| 05:31:21 | 33.8 | 调用 | `Bash` Read trial baseline result rows and validity：`cd <工作根>/notes/trial; python3 - <<'EOF' import json,collections log=json.load(open('baseline-trial.log')) ob=json.load(open(log['original_baseline_path'])) res=ob['results'] print(type(res), len(res)) rows=res if isinstance(res,list) else list(res.values()) print(rows[0].keys() if isinstance(rows[0],dict) else rows[0]) c=collections.Counter() for r in rows: c[(r.get('status'), r.get('exit_code'))]+=1 if r.get('status …` |
| 05:31:34 | 34.0 | 调用 | `Bash` See how the designed-test template is derived：`S=<nanolize 代码>/src/nanolize; grep -n "test_template" $S/leaf_test_design.py \| head -30; grep -n "def template\\|def _template\\|def derive" -A30 $S/leaf_test_design.py \| head -90` |
| 05:31:54 | 34.3 | 调用 | `nanolize:record_run_progress` {"stage": "discover", "status": "done", "summary": "发现阶段完成。核心范围保留 64 个能力（161 个文件、约 29.7 万 tokens），45 个保留检查在准备好的原始克隆上全部通过；5 个核心叶子尚无检查，由冻结阶段的测试设计补齐。检查通过 Slurm（account <账户>、partition <队列>、qos normal，均为用户给定）在计算节点上运行。", "steps": [{"id": "audit", "status": "done", "label": "审计无问题；45 个保留检查在原始克隆上全部通过且稳定"}, {"id": "doctor", "status": "done", "label": "调度器可达；3 个 Claude runner 试调用通过；安装检查在原始代码上通过"}], "metrics": [{"label": "能力（全部 / 核心保留）", "value": "111 / 64"}, {"label": "外部 / 内部能力", "value": "87 / 24"}, {"label": "接口条目", "valu … |
| 05:32:03 | 34.5 | 调用 | `nanolize:record_run_progress` {"stage": "discover", "status": "done", "steps": [{"id": "env", "status": "done", "label": "共享环境 Python 3.11 + CPU torch 2.5.1；原始测试 284 过 / 16 败 / 30 跳过（含配置链接）"}, {"id": "manifest", "status": "done", "label": "111 个能力：87 外部 / 24 内部；52 个检查；携带 113 个文件"}]} |
| 05:32:16 | 34.7 | 调用 | `nanolize:start_execution_review` {"path": "<原仓库>", "manifest_path": "<工作根>/notes/graph-manifest-3.json", "allow_execution": true, "public": false, "scope_preset": "core", "unattended": true, "pair": "on", "performance": {"enabled": true}, "runner_argv": ["<nanolize 解释器>/a003430d/bin/python3", "-P", "-m", "nanolize.runners.claude_author", "--settings", "<工作根>/claude-runners.json"], "controller_policy": {"runner_argv": ["<nanolize 解释器>/a003430d/bin/python3", "-P", "-m", "nanolize.runners.claude_controller", "--settings", "<工作根>/claude-runners.json", … |
| 05:33:05 | 35.5 | 说 | 评审服务启动超时，正在查看它是否其实已经起来或卡在哪里。 |
| 05:33:06 | 35.5 | 调用 | `Bash` Inspect state root and nanolize processes：`W=<工作根>; ls -la $W/state; find $W/state -maxdepth 3 -newer $W/claude-runners.json \| head -40; ps -u <用户> -o pid,etime,args \| grep -i "nanolize" \| grep -v grep \| cut -c1-260` |
| 05:33:12 | 35.6 | 调用 | `Bash` Read review service log and startup timeout code：`R=<工作根>/state/reviews/089c7e7c135b461bbd15f7b88439e7da; ls -la $R; tail -c 3000 $R/service.log; echo; python3 -c " import json for f in ('process.json','owner.json'): d=json.load(open('$R/'+f)); print(f, {k:(v if not isinstance(v,(dict,list)) else type(v).__name__) for k,v in d.items()}) "; grep -n "startup timed out" -B25 <nanolize 代码>/src/nanolize/*.py \| grep -n "timeout\\|deadline\\|sleep\\|STARTUP" \| head` |
| 05:33:16 | 35.7 | 调用 | `Bash` Read review service startup code：`S=<nanolize 代码>/src/nanolize; sed -n 770,840p $S/execution_server.py; grep -n "STARTUP_SECONDS\\|NANOLIZE_.*STARTUP\\|environ.get(\"NANOLIZE" $S/execution_server.py \| head -20` |
| 05:33:26 | 35.9 | 调用 | `Bash` Time a plan computation and check machine load：`W=<工作根>; P=<nanolize 解释器>/a003430d/bin/python; cd $W/notes && (time $P -P -m nanolize plan <原仓库> --capabilities $W/notes/graph-manifest-3.json --retain 50 --output $W/notes/plan-timing.json --json > /dev/null) 2>&1 \| tail -4; uptime; nproc; ps -u <用户> -L --no-headers \| wc -l` |
| 05:33:39 | 36.1 | 调用 | `Bash` Check what is loading the node：`top -b -n 1 \| head -25; ps -u <用户> -o pid,etime,pcpu,args --sort=-pcpu \| head -12 \| cut -c1-200` |
| 05:33:57 | 36.4 | 调用 | `nanolize:start_execution_review` {"path": "<原仓库>", "manifest_path": "<工作根>/notes/graph-manifest-3.json", "allow_execution": true, "public": false, "scope_preset": "core", "unattended": true, "pair": "on", "performance": {"enabled": true}, "runner_argv": ["<nanolize 解释器>/a003430d/bin/python3", "-P", "-m", "nanolize.runners.claude_author", "--settings", "<工作根>/claude-runners.json"], "controller_policy": {"runner_argv": ["<nanolize 解释器>/a003430d/bin/python3", "-P", "-m", "nanolize.runners.claude_controller", "--settings", "<工作根>/claude-runners.json", … |
| 05:34:40 | 37.1 | 说 | 评审服务第二次启动成功（review b8c7b847…）。现在关联到运行页面并提交核心范围。 |
| 05:34:43 | 37.2 | 调用 | `nanolize:record_run_progress` {"stage": "scope", "status": "active", "review_id": "b8c7b847afd9469db4d21ba891daa9ab", "summary": "评审已就绪（无人值守）：按用户选项提交核心范围（scope=core），不增减任何能力；性能验收、并行模式、双作业均开启。"} |
| 05:34:45 | 37.2 | 调用 | `nanolize:submit_execution_review` {"review_id": "b8c7b847afd9469db4d21ba891daa9ab", "scope_preset": "core", "allow_execution": true, "submit_code": "FTTU-VXLL-7X8W"} |
| 05:35:32 | 38.0 | 调用 | `nanolize:record_run_progress` {"stage": "scope", "status": "done", "summary": "已代为提交核心范围。运行为两个作业：主作业 1592621820424593aaf15fa9ee7296c8（冻结契约并验证）和草稿作业 c49d4cee2cf54af8987b5981f54cc088（同时写第一版实现）。", "metrics": [{"label": "review_id", "value": "b8c7b847afd9469db4d21ba891daa9ab"}, {"label": "主作业", "value": "1592621820424593aaf15fa9ee7296c8"}, {"label": "草稿作业", "value": "c49d4cee2cf54af8987b5981f54cc088"}, {"label": "提交的范围", "value": "core（64 个能力）"}]} |
| 05:35:39 | 38.1 | 调用 | `Bash` Record issues and look at job state layout：`W=<工作根>; cat >> $W/issues.md <<'EOF' ## 6. 阶段 02：评审服务第一次启动超时 - job id：无（评审 '089c7e7c135b461bbd15f7b88439e7da'，未产生作业）。 - 错误原文：'Error executing tool start_execution_review: OSError: Review service startup timed out' - 原因：评审服务要在 30 秒内写出回执；当时这台计算节点被其他作业占满（load average 约 70， 系统态 CPU 39%），服务没能按时就绪，'service.log' 为空，启动方已把它终止。同样的规划在随后只用了 8 秒。 - 改动：没有改任何参数，原样再调用一次 'start_execution_review'。 - 结果：第二次成功，评审 'b8c7b847afd9469db4d21b …` |
| 05:35:45 | 38.2 | 调用 | `Bash` Inspect job directory and current events：`J=<工作根>/state/jobs/jobs; ls -la $J/1592621820424593aaf15fa9ee7296c8 \| head -40; ls $J/c49d4cee2cf54af8987b5981f54cc088 \| head -30; python3 -c " import json d=json.load(open('$J/1592621820424593aaf15fa9ee7296c8/job.json')) print({k:(v if not isinstance(v,(dict,list)) else type(v).__name__+str(len(v))) for k,v in d.items()}) for e in d.get('events',[])[-8:]: print(e.get('time','')[11:19], e.get('phase'), e.get('codes') …` |
| 05:35:48 | 38.2 | 说 | 作业已启动，正在写一个轻量的观察脚本，按几分钟一次读取主作业的公开状态和新事件。 |
| 05:35:57 | 38.4 | 调用 | `Bash` Create job watcher and show current events：`W=<工作根>; J=$W/state/jobs/jobs; python3 -c " import json d=json.load(open('$J/1592621820424593aaf15fa9ee7296c8/public.json')) print({k:(v if not isinstance(v,(dict,list)) else type(v).__name__+str(len(v))) for k,v in d.items()}) "; cat > $W/notes/watch.py <<'EOF' """Wait until the main job's public record changes (status, phase or a new event), at most N seconds.""" import json, sys, time J = "<工作根>/state/jobs/jobs/" …` |
| 05:36:02 | 38.5 | 调用 | `Bash` Wait for the next job event：`python3 <工作根>/notes/watch.py 420` |
| 05:36:24 | 38.8 | 调用 | `Bash` Watch job events for several minutes：`W=<工作根>; python3 - <<'EOF' p="<工作根>/notes/watch.py" s=open(p).read() s=s.replace('limit = float(sys.argv[1]) if len(sys.argv) > 1 else 540','limit = float(sys.argv[1]) if len(sys.argv) > 1 else 540\nleast = float(sys.argv[2]) if len(sys.argv) > 2 else 0') s=s.replace('''start = time.time() while True: out = [] ''','''start = time.time() while True: main = read(MAIN) if main.get("status") in ("running", "queued") and …` |
| 05:43:29 | 45.9 | 说 | 草稿作业报告原始基线有 1 个问题，正在查看是哪个检查在计算节点上没通过。 |
| 05:43:31 | 46.0 | 调用 | `Bash` Read draft job operations for the baseline problem：`J=<草稿①作业目录>; ls $J; python3 - <<EOF import json for line in open('$J/operations.jsonl'): op=json.loads(line) r=op.get('result') or {} print(op.get('tool'), op.get('status'), json.dumps(r)[:1800]) EOF` |
| 05:43:37 | 46.1 | 说 | 草稿作业的“基线不可用”只是它不设计测试的固有状态（主作业负责冻结契约），不是故障；45 个检查在计算节点上都执行了。继续观察。 |
| 05:43:38 | 46.1 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 570 540` |
| 05:52:51 | 55.3 | 调用 | `Bash` Record the observation and keep watching：`W=<工作根>; cat >> $W/issues.md <<'EOF' ## 8. 阶段 03（冻结）：7 个保留检查不能在原始提交的纯净导出里复现 - job id：主作业 '1592621820424593aaf15fa9ee7296c8'。 - 事件原文（'checks_not_reproduced_in_export'）：'7 of 45 retained checks pass on the original but not in a pristine export of its commit (what such a check needs beyond the committed files is missing there, or no export could be made): no knockout of them was tried, so they are a valid test of no lea …` |
| 06:02:25 | 64.9 | 说 | 主作业在为 21 个叶子设计测试、为 54 个叶子设计性能文件；草稿作业的 5 个作者会话在并行写第一版。继续观察。 |
| 06:02:26 | 64.9 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 580 560` |
| 06:12:16 | 74.7 | 调用 | `Bash` Watch job events and count model calls：`W=<工作根>; python3 $W/notes/watch.py 580 560; ls $W/model-calls 2>/dev/null \| wc -l; squeue -u <用户> -h -o "%i %P %T %M %j" 2>/dev/null \| head -8` |
| 06:22:06 | 84.5 | 说 | 测试设计仍在进行（已有 66 次模型调用，检查批次在 <队列> 上运行）。继续按约 10 分钟一次观察。 |
| 06:22:07 | 84.6 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 585 570` |
| 06:31:57 | 94.4 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 585 570` |
| 06:41:46 | 104.2 | 说 | 两个作业都在正常运行、暂无新事件（主作业：测试设计；草稿作业：并行作者）。我看一下设计会话的进度，然后继续观察。 |
| 06:41:49 | 104.3 | 调用 | `Bash` Check design session progress and keep watching：`W=<工作根>; J=$W/state/jobs/jobs; ls $W/model-calls \| wc -l; ls $J/1592621820424593aaf15fa9ee7296c8 \| tr '\n' ' '; echo; find $J/1592621820424593aaf15fa9ee7296c8 -maxdepth 3 -name "receipt*.json" 2>/dev/null \| wc -l; ps -u <用户> -o args \| grep -c "claude -p\\|claude_role\\|claude_author" ; python3 $W/notes/watch.py 500 480` |
| 06:50:25 | 112.9 | 调用 | `Bash` Inspect design directory and running sessions：`W=<工作根>; D=$W/state/jobs/jobs/1592621820424593aaf15fa9ee7296c8/design; ls $D \| head; find $D -maxdepth 4 -name "request*.json" \| wc -l; find $D -maxdepth 4 -name "receipt*.json" \| wc -l; find $D -maxdepth 2 \| head -30; ls -lt $W/model-calls \| head -5; ps -u <用户> -o pid,etime,args \| grep "runners.claude" \| grep -v grep \| awk '{print $2, $6}' \| sort \| uniq -c \| head` |
| 06:50:31 | 113.0 | 说 | 正在确认主作业的测试设计会话是否仍在推进（当前只看到 2 个作者会话在跑）。 |
| 06:50:33 | 113.0 | 调用 | `Bash` Inspect design round and job processes：`W=<工作根>; D=$W/state/jobs/jobs/1592621820424593aaf15fa9ee7296c8/design/round-1; date; ls $D \| head -20; ls $D \| wc -l; for d in $(ls $D \| head -3); do echo "== $d"; ls -la $D/$d \| head -12; ls $D/$d/runner 2>/dev/null \| head; done; ps -u <用户> -o pid,etime,pcpu,args \| grep -v grep \| grep -i "nanolize\\|claude\\|pytest\\|srun\\|sbatch" \| cut -c1-170 \| head -30` |
| 06:50:41 | 113.1 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 585 570` |
| 07:00:30 | 122.9 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 585 570` |
| 07:10:04 | 132.5 | 说 | 草稿作业已把 5 个并行作者写的文件合并，正在做整合阶段的编写；主作业仍在验证设计出的测试。继续观察。 |
| 07:10:05 | 132.5 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 585 570` |
| 07:19:54 | 142.3 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 585 570` |
| 07:29:44 | 152.2 | 说 | 主作业在“设计测试的验证”上已停留较久，我查看一下它的检查批次和 Slurm 队列，确认不是卡在排队。 |
| 07:29:46 | 152.2 | 调用 | `Bash` Check main job check batches and queue：`W=<工作根>; J=$W/state/jobs/jobs/1592621820424593aaf15fa9ee7296c8; date; squeue -u <用户> -h -o "%i %P %T %M %j" \| head; ls -lt $J/check-batches \| head -6; ls $J/check-batches \| wc -l; ls -lt $J/design/round-1 \| head -4; ls -lt $J/design \| head -8; ps -u <用户> -o pid,etime,pcpu,args \| grep -v grep \| grep "claude_role\\|claude -p --model" \| wc -l; ls $W/model-calls \| wc -l` |
| 07:29:51 | 152.3 | 说 | 主作业在推进：设计的测试已收入，正在计算节点上带着它们重新捕获基线（批次已跑 30 分钟），另有 3 个评审/设计会话在运行。继续观察。 |
| 07:29:52 | 152.3 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 585 570` |
| 07:39:27 | 161.9 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 585 570` |
| 07:49:01 | 171.5 | 说 | 草稿作业的第一版（candidate-7）首次全量对比有 9 个检查未过（共 45 个），已开始修复循环；主作业仍在冻结阶段。继续观察。 |
| 07:49:02 | 171.5 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 585 570` |
| 07:58:39 | 181.1 | 说 | 草稿作业两轮对比都是同样 9 个检查失败（含 native 算子相关的 nms/roi-align/deform-conv），我查一下失败原因是否与环境（扩展模块）有关。 |
| 07:58:40 | 181.1 | 调用 | `Bash` List draft job artifacts：`J=<草稿①作业目录>; ls $J/artifacts \| tail -30; python3 - <<EOF import json,glob,os fs=sorted(glob.glob('$J/artifacts/*'), key=os.path.getmtime) print([os.path.basename(f) for f in fs][-12:]) EOF` |
| 07:58:47 | 181.2 | 调用 | `Bash` Read failing check output from draft verification：`J=<草稿①作业目录>; python3 - <<EOF import json d=json.load(open('$J/artifacts/verification-14.json')) def find(o, path=''): if isinstance(o, dict): if 'name' in o and ('status' in o) and ('stdout' in o or 'stderr' in o): yield o else: for k,v in o.items(): yield from find(v, path+'/'+k) elif isinstance(o, list): for v in o: yield from find(v, path) seen=set() for r in find(d): if r.get('status') not in ('passed','not_run') …` |
| 07:58:57 | 181.4 | 调用 | `Bash` Check whether the candidate worktree holds the extension module：`J=<草稿①作业目录>; ls -la $J/worktree/detectron2/ \| head -30; ls -la $J/worktree/detectron2/model_zoo/ 2>&1 \| head; ls -la $J/original-worktree/detectron2/*.so; cat $J/worktree/.gitignore 2>/dev/null \| head -20; python3 - <<EOF import json d=json.load(open('$J/artifacts/preparation-15.json')) print(json.dumps(d)[:1500]) EOF` |
| 07:59:06 | 181.5 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 585 570` |
| 08:08:56 | 191.4 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 585 570` |
| 08:18:31 | 201.0 | 说 | 草稿作业修复后仍有 2 个检查未过，看起来是我加的输出对比检查；我确认一下它们是否合理可过（不是检查本身的问题）。 |
| 08:18:36 | 201.0 | 调用 | `Bash` Diff the two failing contract checks against the original output：`W=<工作根>; J=$W/state/jobs/jobs/c49d4cee2cf54af8987b5981f54cc088; python3 - <<EOF import json,glob,os,difflib fs=sorted(glob.glob('$J/artifacts/verification-*.json'), key=os.path.getmtime) d=json.load(open(fs[-1])); print(os.path.basename(fs[-1])) def find(o): if isinstance(o, dict): if 'name' in o and 'status' in o and ('stdout' in o or 'stderr' in o): yield o else: for v in o.values(): yield from find(v) elif isinsta …` |
| 08:18:44 | 201.2 | 调用 | `Bash` Find failing checks in recent draft verifications：`W=<工作根>; J=$W/state/jobs/jobs/c49d4cee2cf54af8987b5981f54cc088; python3 - <<EOF import json,glob,os,difflib fs=sorted(glob.glob('$J/artifacts/verification-*.json'), key=os.path.getmtime) def find(o): if isinstance(o, dict): if 'name' in o and 'status' in o and ('stdout' in o or 'stderr' in o): yield o else: for v in o.values(): yield from find(v) elif isinstance(o, list): for v in o: yield from find(v) for f in fs[-3 …` |
| 08:18:53 | 201.3 | 调用 | `Bash` Show the two failing checks after preparation：`W=<工作根>; J=$W/state/jobs/jobs/c49d4cee2cf54af8987b5981f54cc088; python3 - <<EOF import json,collections,difflib,os d=json.load(open('$J/artifacts/verification-19.json')) ch=d['checks'] print(type(ch), len(ch)) rows=ch if isinstance(ch,list) else list(ch.values()) print(rows[0].keys()) print(collections.Counter(r.get('status') for r in rows)) for r in rows: if r.get('status') not in ('passed','not_run','unchanged'): c …` |
| 08:19:09 | 201.6 | 调用 | `Bash` Compare baseline and candidate output of the regressed contract checks：`W=<工作根>; J=$W/state/jobs/jobs/c49d4cee2cf54af8987b5981f54cc088; python3 - <<EOF import json d=json.load(open('$J/artifacts/verification-19.json')) for r in d['checks']: if r['status']=='regressed': b,c=r['baseline'],r['current'] print('==', r['name']) print(' baseline keys', sorted(b.keys())); print(' current keys', sorted(c.keys())) for k in ('exit_code','status','stdout_sha256','stderr_sha256','output_truncated','r …` |
| 08:19:49 | 202.3 | 调用 | `nanolize:cancel_execution_job` {"review_id": "b8c7b847afd9469db4d21ba891daa9ab", "job_id": "<调度作业>aaf15fa9ee7296c8", "allow_execution": true} |
| 08:20:04 | 202.5 | 调用 | `ToolSearch` select:stop_execution_review |
| 08:20:09 | 202.6 | 调用 | `Bash` Confirm both jobs stopped and fix the contract programs：`W=<工作根>; python3 -c " import json for j in ('1592621820424593aaf15fa9ee7296c8','c49d4cee2cf54af8987b5981f54cc088'): d=json.load(open('$W/state/jobs/jobs/'+j+'/public.json')); print(j, d['status'], d['phase']) "; ps -u <用户> -o pid,etime,args \| grep -v grep \| grep "runners.claude\\|nanolize.execution --worker" \| cut -c1-140; squeue -u <用户> -h -o "%i %P %T %M %j" \| grep nanolize cd $W/notes && python3 - <<'EOF' s=open('m …` |
| 08:20:16 | 202.7 | 调用 | `nanolize:stop_execution_review` {"review_id": "b8c7b847afd9469db4d21ba891daa9ab"} |
| 08:20:21 | 202.8 | 调用 | `Bash` Verify contract checks give identical output in two different trees：`cd <工作根>/notes; python3 - <<'EOF' import json, subprocess, os, hashlib m = json.load(open("capabilities-4.json")) T = "<工作根>/notes/trial/" for c in m["checks"]: if c["compare"] != "output": continue seen = [] for tree in (T + "export", T + "clone"): r = subprocess.run(["bwrap", "--ro-bind", "/", "/", "--dev", "/dev", "--proc", "/proc", "--unshare-net", "--tmpfs", "/tmp", "--bind", tree, tree, "--chdir", tree] + c["ar …` |
| 08:20:59 | 203.4 | 说 | 修正后的 4 个输出检查在两棵不同路径的原始树上 stdout、stderr 完全一致，且 stdout 与修改前逐字节相同。现在重新转换清单并启动新评审。 |
| 08:21:01 | 203.5 | 调用 | `nanolize:propose_contract` {"path": "<原仓库>", "manifest_path": "<工作根>/notes/capabilities-4.json", "output_path": "<工作根>/notes/graph-manifest-4.json"} |
| 08:21:20 | 203.8 | 调用 | `nanolize:plan_capabilities` {"path": "<原仓库>", "manifest_path": "<工作根>/notes/graph-manifest-4.json", "plan_output": "<工作根>/notes/plan-2.json"} |
| 08:21:28 | 203.9 | 调用 | `nanolize:audit_check_scope` {"path": "<原仓库>", "plan_path": "<工作根>/notes/plan-2.json"} |
| 08:21:42 | 204.1 | 调用 | `nanolize:start_execution_review` {"path": "<原仓库>", "manifest_path": "<工作根>/notes/graph-manifest-4.json", "allow_execution": true, "public": false, "scope_preset": "core", "unattended": true, "pair": "on", "performance": {"enabled": true}, "runner_argv": ["<nanolize 解释器>/a003430d/bin/python3", "-P", "-m", "nanolize.runners.claude_author", "--settings", "<工作根>/claude-runners.json"], "controller_policy": {"runner_argv": ["<nanolize 解释器>/a003430d/bin/python3", "-P", "-m", "nanolize.runners.claude_controller", "--settings", "<工作根>/claude-runners.json", … |
| 08:22:05 | 204.5 | 说 | 新评审已就绪（3e9636ff…），现在关联到运行页面并重新提交核心范围。 |
| 08:22:08 | 204.6 | 调用 | `nanolize:record_run_progress` {"stage": "scope", "status": "active", "review_id": "3e9636ff8b60422b880261ce0b92860c", "summary": "第一对作业已取消：清单里两个输出对比检查的 stderr 含工作树绝对路径，任何候选都无法通过。已让 4 个输出检查只比较 stdout（stdout 与修改前逐字节相同），重新转换、规划、审计，并启动新评审，按 scope=core 重新提交。"} |
| 08:22:10 | 204.6 | 调用 | `nanolize:submit_execution_review` {"review_id": "3e9636ff8b60422b880261ce0b92860c", "scope_preset": "core", "allow_execution": true, "submit_code": "2P4P-JLE5-J5S3"} |
| 08:22:42 | 205.1 | 调用 | `nanolize:record_run_progress` {"stage": "scope", "status": "done", "summary": "已重新提交核心范围。新的两个作业：主作业 c52b52e8068a41f9962c8fd761d3f11f（冻结契约并验证）和草稿作业 757d930c5a934fdc91ffc9b14360d051（同时写第一版实现）。此前的一对（1592621820…、c49d4cee…）已取消。", "metrics": [{"label": "review_id", "value": "3e9636ff8b60422b880261ce0b92860c"}, {"label": "主作业", "value": "c52b52e8068a41f9962c8fd761d3f11f"}, {"label": "草稿作业", "value": "757d930c5a934fdc91ffc9b14360d051"}, {"label": "提交的范围", "value": "core（64 个能力）"}, {"label": "已取消的第一对作业", "value": "1592621820424593aaf15fa9ee7296c8 / c49d … |
| 08:22:58 | 205.4 | 调用 | `Bash` Record the restart in issues.md and watch the new jobs：`W=<工作根>; cat >> $W/issues.md <<'EOF' ## 9. 阶段 04（草稿作业的验证）：两个输出对比检查任何候选都无法通过，取消并重新提交 - job id：主作业 '1592621820424593aaf15fa9ee7296c8'、草稿作业 'c49d4cee2cf54af8987b5981f54cc088' （评审 'b8c7b847afd9469db4d21ba891daa9ab'）。 - 事件原文：'The targeted comparison of candidate-9 found 2 failed checks, in config-yacs, model-backbones, model-cascade-rcnn, model-dense-detectors, model-keypoint-head and others; 36 checks were not run (regre …` |
| 08:30:02 | 212.5 | 说 | 新的一对作业已正常起跑（主作业在捕获基线并验证叶子测试，草稿作业开始并行写第一版）。继续按约 10 分钟一次观察。 |
| 08:30:04 | 212.5 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 585 570` |
| 08:39:38 | 222.1 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 585 570` |
| 08:49:28 | 231.9 | 说 | 两个作业都在运行、无新事件（主作业：设计测试；草稿作业：6 个并行作者）。继续观察。 |
| 08:49:29 | 231.9 | 调用 | `Bash` Watch job events for ten minutes：`python3 <工作根>/notes/watch.py 590 580` |
| 08:59:35 | 242.0 | 调用 | `Bash` Read the backgrounded watcher's output：`F=<临时目录>; for i in $(seq 1 12); do [ -s "$F" ] && break; sleep 5; done; cat "$F"` |
| 08:59:39 | 242.1 | 说 | 仍无新事件，两个作业都在运行。继续观察。 |
| 08:59:40 | 242.1 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 09:08:59 | 251.4 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 09:18:18 | 260.7 | 说 | 两个作业仍在各自阶段内运行（冻结中的测试设计、并行作者）。继续观察。 |
| 09:18:20 | 260.8 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 09:27:39 | 270.1 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 09:36:58 | 279.4 | 说 | 暂无新事件；我顺便确认一下两个作业的进程和设计会话确实在推进。 |
| 09:37:01 | 279.5 | 调用 | `Bash` Check design progress and keep watching：`W=<工作根>; J=$W/state/jobs/jobs/c52b52e8068a41f9962c8fd761d3f11f; date; D=$J/design/round-1; echo "design sessions: $(ls $D 2>/dev/null \| wc -l), with result: $(ls $D/*/runner/result.json 2>/dev/null \| wc -l)"; ls -lt $J/design 2>/dev/null \| head -4; ps -u <用户> -o args \| grep -v grep \| grep -c "runners.claude_role"; ps -u <用户> -o args \| grep -v grep \| grep -c "runners.claude_author"; squeue -u <用户> -h -o "%i %P %T %M % …` |
| 09:44:51 | 287.3 | 说 | 设计会话 54 个都已交回，主作业在计算节点上验证它们；草稿作业已合并并行作者的文件，进入整合编写。继续观察。 |
| 09:44:52 | 287.3 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 09:54:12 | 296.6 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 10:03:30 | 305.9 | 说 | 仍在运行、无新事件。继续观察。 |
| 10:03:31 | 306.0 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 10:12:36 | 315.0 | 说 | 修正奏效：草稿作业的第一版（candidate-8）在准备后全量对比没有任何检查失败。主作业仍在冻结契约，封存后会导入这一版。继续观察。 |
| 10:12:37 | 315.1 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 10:21:42 | 324.1 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 10:31:01 | 333.5 | 说 | 草稿作业已完成（第一版 132 个文件已保存，等主作业导入）；主作业仍在冻结阶段验证设计出的测试。继续观察。 |
| 10:31:02 | 333.5 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 10:40:23 | 342.8 | 调用 | `Bash` Check main job freeze progress and keep watching：`W=<工作根>; J=$W/state/jobs/jobs/c52b52e8068a41f9962c8fd761d3f11f; date; ls -lt $J/design \| head -6; ls -lt $J/check-batches \| head -4; squeue -u <用户> -h -o "%i %P %T %M %j" \| grep nanolize; ps -u <用户> -o args \| grep -v grep \| grep -c "runners.claude_role"; python3 $W/notes/watch.py 500 480` |
| 10:48:58 | 351.4 | 说 | 主作业正在计算节点上带着设计出的测试重新捕获基线并做叶子敲除（该批次已运行 1 小时），属正常耗时。继续观察。 |
| 10:48:59 | 351.4 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 10:58:18 | 360.7 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 11:07:37 | 370.1 | 说 | 无新事件，主作业仍在冻结阶段的基线重捕与敲除。继续观察。 |
| 11:07:38 | 370.1 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 11:16:59 | 379.4 | 调用 | `Bash` Check batch activity and keep watching：`W=<工作根>; J=$W/state/jobs/jobs/c52b52e8068a41f9962c8fd761d3f11f; date; squeue -u <用户> -h -o "%i %P %T %M %l %j" \| grep nanolize; ls -lt $J/check-batches \| head -4; B=$(ls -t $J/check-batches \| head -1); ls $J/check-batches/$B \| head; find $J/check-batches/$B -type f \| wc -l; find $J/check-batches/$B -type f -mmin -3 \| wc -l; python3 $W/notes/watch.py 480 460` |
| 11:25:04 | 387.5 | 说 | 主作业的检查批次已运行 1 小时 37 分，我看一下它的服务日志，确认确实在逐个执行检查。 |
| 11:25:07 | 387.6 | 调用 | `Bash` Inspect the check batch service log：`W=<工作根>; J=$W/state/jobs/jobs/c52b52e8068a41f9962c8fd761d3f11f; B=$J/check-batches/8d9654e0bdbd4aa89f4fb2a3e84532fb; date; ls -la $B $B/next \| head -20; tail -n 6 $B/served.log \| cut -c1-300; tail -n 4 $B/batch.log \| cut -c1-300; wc -l $B/served.log; ps -u <用户> -o pid,etime,pcpu,args \| grep -v grep \| grep "nanolize.execution --worker" \| cut -c1-120; ls -lt $J \| head -8` |
| 11:25:18 | 387.7 | 调用 | `Bash` Inspect the long-running batch request and its CPU usage：`W=<工作根>; B=$W/state/jobs/jobs/c52b52e8068a41f9962c8fd761d3f11f/check-batches/8d9654e0bdbd4aa89f4fb2a3e84532fb; cat $B/served.log; echo; cat $B/job.json; echo; cat $B/batch.sh \| cut -c1-400; python3 -c " import json r=json.load(open('$B/request.json')) print(type(r), list(r.keys())[:20] if isinstance(r,dict) else len(r)) for k,v in (r.items() if isinstance(r,dict) else []): print(k, (v if not isinstance(v,(dict,list)) …` |
| 11:25:27 | 387.9 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 11:34:47 | 397.2 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 11:44:05 | 406.5 | 说 | 测量批次仍在计算节点上运行，无新事件。继续观察。 |
| 11:44:07 | 406.6 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 11:53:26 | 415.9 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 12:02:45 | 425.2 | 说 | 仍在测量阶段（批次已运行约 2.5 小时，上限 4 小时），无新事件。继续观察。 |
| 12:02:47 | 425.2 | 调用 | `Bash` Check batch time and keep watching：`squeue -u <用户> -h -o "%i %T %M %l %j" \| grep nanolize; python3 <工作根>/notes/watch.py 550 535` |
| 12:12:07 | 434.6 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 12:21:25 | 443.9 | 说 | 测量批次还在跑（约 2 小时 45 分），尚无新事件。继续观察。 |
| 12:21:27 | 443.9 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 12:30:46 | 453.2 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 12:40:05 | 462.5 | 说 | 仍无新事件；我看一下批次已用时间和主作业是否有新产物。 |
| 12:40:07 | 462.6 | 调用 | `Bash` Check batch time and artifacts, keep watching：`W=<工作根>; J=$W/state/jobs/jobs/c52b52e8068a41f9962c8fd761d3f11f; date; squeue -u <用户> -h -o "%i %T %M %l %j" \| grep nanolize; ls -lt $J \| head -5; ls -lt $J/check-batches \| head -4; ls -lt $J/design \| head -4; python3 $W/notes/watch.py 500 480` |
| 12:48:42 | 471.1 | 说 | 主作业有进展：第二轮设计（6 个会话）和 31 个评审会话已启动，基线已带着设计的测试重捕过一次。继续观察。 |
| 12:48:43 | 471.2 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 12:58:03 | 480.5 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 13:00:38 | 483.1 | 说 | 主作业暂停了：提交检查批次时 sbatch 命令超时（调度器一时无响应）。按无人值守的规定，我原样恢复该作业。 |
| 13:00:40 | 483.1 | 调用 | `nanolize:resume_execution_job` {"review_id": "3e9636ff8b60422b880261ce0b92860c", "job_id": "c52b52e8068a41f9962c8fd761d3f11f", "allow_execution": true} |
| 13:00:41 | 483.1 | 调用 | `Bash` Check that the scheduler answers now：`date; (time sinfo -h -p <队列> -o "%P %a %D %t" \| head -5) 2>&1 \| tail -8; squeue -u <用户> -h -o "%i %T %M %l %j" \| head` |
| 13:01:00 | 483.4 | 调用 | `Bash` Record the pause and keep watching：`W=<工作根>; cat >> $W/issues.md <<'EOF' ## 11. 阶段 03（冻结）：主作业因 sbatch 超时而暂停，原样恢复 - job id：主作业 'c52b52e8068a41f9962c8fd761d3f11f'。 - 事件原文：'The compute node this job's checks run on could not be used within the owner's queue limit (the batch could not be submitted: Scheduler command timed out: sbatch); no check ran, and the freeze steps that ended are kept. Resume the job once the scheduler runs batches again.'（2026-11-22 …` |
| 13:09:50 | 492.3 | 说 | 主作业已恢复并回到测试设计步骤。我确认一下它是沿用已完成的设计结果，还是重新开始设计。 |
| 13:09:52 | 492.3 | 调用 | `Bash` Inspect design directories after the resume：`W=<工作根>; J=$W/state/jobs/jobs/c52b52e8068a41f9962c8fd761d3f11f; date; ls -lt $J \| head -12; ls -lt $J/design \| head -10; for d in $J/design/*/; do echo "$d $(ls $d \| wc -l)"; done; ps -u <用户> -o args \| grep -v grep \| grep -c "runners.claude_role"; squeue -u <用户> -h -o "%i %T %M %l %j" \| grep nanolize` |
| 13:10:04 | 492.5 | 说 | 恢复后测试设计这一步是从头重做的（call-2，60 个设计会话在跑），冻结阶段会再花几个小时。我把这一点记入 issues.md，继续观察。 |
| 13:10:08 | 492.6 | 调用 | `Bash` Note the redone design step and keep watching：`W=<工作根>; cat >> $W/issues.md <<'EOF' - 补充（恢复之后）：暂停发生在测试设计这一步中途（已做到第 3 轮设计和第 2 轮评审），这一步没有结束， 所以恢复后它从头重做（'design/call-2'，60 个设计会话重新运行）；此前约 4.5 小时的设计与测量结果 （'design/round-1..3'、'baseline-1..3.json'）留在作业目录里但不再使用。草稿作业的第一版（candidate-8， 全量对比无失败）不受影响，仍等主作业封存契约后导入。 EOF python3 $W/notes/watch.py 555 540` |
| 13:19:28 | 501.9 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 13:28:47 | 511.2 | 说 | 主作业在重做测试设计，无新事件。继续观察。 |
| 13:28:48 | 511.2 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 13:38:08 | 520.6 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 13:47:27 | 529.9 | 说 | 仍在重做测试设计，无新事件。继续观察。 |
| 13:47:28 | 529.9 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 13:56:49 | 539.3 | 调用 | `Bash` Check redone design progress and keep watching：`W=<工作根>; J=$W/state/jobs/jobs/c52b52e8068a41f9962c8fd761d3f11f; date; ls -lt $J/design/call-2 \| head -6; ps -u <用户> -o args \| grep -v grep \| grep -c "runners.claude_role"; squeue -u <用户> -h -o "%i %T %M %l %j" \| grep "nanolize\\|d2m"; python3 $W/notes/watch.py 500 480` |
| 14:05:27 | 547.9 | 说 | 重做的设计会话已全部交回，正在计算节点上验证（批次已跑 37 分钟）。按上一轮的节奏，封存契约预计还要 3–4 小时。继续观察。 |
| 14:05:28 | 547.9 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 14:14:48 | 557.2 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 14:24:06 | 566.5 | 说 | 无新事件，主作业仍在冻结阶段。继续观察。 |
| 14:24:08 | 566.6 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 14:33:27 | 575.9 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 14:42:46 | 585.2 | 说 | 仍无新事件；主作业在冻结阶段的测量批次里。继续观察。 |
| 14:42:48 | 585.2 | 调用 | `Bash` Check freeze progress and keep watching：`W=<工作根>; J=$W/state/jobs/jobs/c52b52e8068a41f9962c8fd761d3f11f; date; ls -lt $J/design/call-2 \| head -5; squeue -u <用户> -h -o "%i %T %M %l %j" \| grep "nanolize\\|d2m"; python3 $W/notes/watch.py 520 500` |
| 14:51:39 | 594.1 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 15:01:05 | 603.5 | 说 | 测量批次进行中（约 14:00 开始，预计 16:30 左右结束），无新事件。继续观察。 |
| 15:01:07 | 603.6 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 15:10:26 | 612.9 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 15:19:45 | 622.2 | 说 | 无新事件，测量批次仍在运行。继续观察。 |
| 15:19:47 | 622.2 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 15:29:06 | 631.5 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 15:38:25 | 640.9 | 说 | 仍在测量阶段，无新事件。继续观察。 |
| 15:38:26 | 640.9 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 15:47:47 | 650.2 | 调用 | `Bash` Check batch time and keep watching：`W=<工作根>; date; squeue -u <用户> -h -o "%i %T %M %l %j" \| grep "nanolize\\|d2m"; python3 $W/notes/watch.py 540 520` |
| 15:56:50 | 659.3 | 说 | 测量批次已运行约 1 小时 50 分（上次约 2.5 小时完成）。继续观察。 |
| 15:56:52 | 659.3 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 16:06:12 | 668.6 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 16:15:30 | 677.9 | 说 | 无新事件，主作业仍在冻结阶段。继续观察。 |
| 16:15:31 | 678.0 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 16:24:52 | 687.3 | 调用 | `Bash` Check freeze progress and keep watching：`W=<工作根>; J=$W/state/jobs/jobs/c52b52e8068a41f9962c8fd761d3f11f; date; ls -lt $J/design/call-2 \| head -6; squeue -u <用户> -h -o "%i %T %M %l %j" \| grep "nanolize\\|d2m"; python3 $W/notes/watch.py 520 500` |
| 16:33:41 | 696.1 | 说 | 测量批次已 2 小时 25 分，接近上次完成的用时。继续观察。 |
| 16:33:42 | 696.1 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 16:43:02 | 705.5 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 16:52:20 | 714.8 | 说 | 仍无新事件；我看一下测量是否已结束、是否进入第二轮设计。 |
| 16:52:23 | 714.8 | 调用 | `Bash` Check freeze progress and keep watching：`W=<工作根>; J=$W/state/jobs/jobs/c52b52e8068a41f9962c8fd761d3f11f; date; ls -lt $J/design/call-2 \| head -6; squeue -u <用户> -h -o "%i %T %M %l %j" \| grep "nanolize\\|d2m"; ps -u <用户> -o args \| grep -v grep \| grep -c "runners.claude_role"; python3 $W/notes/watch.py 500 480` |
| 17:00:59 | 723.4 | 说 | 测量已结束，进入第二轮设计和评审（54 个评审/设计会话在跑）。继续观察。 |
| 17:01:00 | 723.4 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 17:10:20 | 732.8 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 17:19:39 | 742.1 | 说 | 主作业仍在冻结阶段的评审环节，无新事件。继续观察。 |
| 17:19:41 | 742.1 | 调用 | `Bash` Check freeze progress and keep watching：`W=<工作根>; J=$W/state/jobs/jobs/c52b52e8068a41f9962c8fd761d3f11f; date; ls -lt $J/design/call-2 \| head -5; ps -u <用户> -o args \| grep -v grep \| grep -c "runners.claude_role"; python3 $W/notes/watch.py 500 480` |
| 17:28:17 | 750.7 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 17:37:35 | 760.0 | 说 | 设计与评审已完成两轮，主作业正在做封存前的基线重捕。继续观察。 |
| 17:37:38 | 760.1 | 调用 | `Bash` Check freeze progress and keep watching：`W=<工作根>; J=$W/state/jobs/jobs/c52b52e8068a41f9962c8fd761d3f11f; date; ls -lt $J \| head -6; ls -lt $J/design/call-2 \| head -3; squeue -u <用户> -h -o "%i %T %M %l %j" \| grep "nanolize\\|d2m"; python3 $W/notes/watch.py 500 480` |
| 17:46:14 | 768.7 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 17:55:32 | 778.0 | 说 | 主作业在跑封存前的又一个检查批次（17:13 开始），无新事件。继续观察。 |
| 17:55:34 | 778.0 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 18:04:56 | 787.4 | 调用 | `Bash` Estimate the current batch and keep watching：`W=<工作根>; J=$W/state/jobs/jobs/c52b52e8068a41f9962c8fd761d3f11f; date; B=$J/check-batches/$(ls -t $J/check-batches \| head -1); python3 -c " import json r=json.load(open('$B/request.json')); print(r.get('function'), r.get('workers'), r.get('needs_seconds'))"; squeue -u <用户> -h -o "%i %T %M %l %j" \| grep "nanolize\\|d2m"; tail -c 600 $J/operations.jsonl \| cut -c1-600; python3 $W/notes/watch.py 420 400` |
| 18:11:50 | 794.3 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 540 520` |
| 18:20:56 | 803.4 | 调用 | `Bash` Check remaining time and watch once more：`W=<工作根>; date; squeue -u <用户> -h -o "%i %T %M %l %j" \| grep "nanolize\\|d2m"; python3 $W/notes/watch.py 480 460` |
| 18:29:00 | 811.4 | 说 | 分配即将到时，我读取一次最终状态并写下总结。 |
| 18:29:02 | 811.5 | 调用 | `nanolize:run_dashboard_status` {} |
| 18:29:08 | 811.6 | 调用 | `Bash` Record the end of observation and confirm repository state：`W=<工作根>; cat >> $W/issues.md <<'EOF' ## 12. 观察在作业结束前停止 - job id：主作业 'c52b52e8068a41f9962c8fd761d3f11f'（运行中，冻结阶段），草稿作业 '757d930c5a934fdc91ffc9b14360d051'（'draft_ready'）。 - 原因：我所在的调度器分配有 14 小时的时限，约在 2026-11-22 18:57（PST）到时；主作业此时还在 带着 158 个检查重新捕获基线（重复运行与叶子敲除），尚未封存契约。 - 最后看到的事件（2026-11-23 02:05–02:06 UTC）：接受 82 个设计的测试（24 个叶子）、27 个场景文件 （725 个用例，23 个叶子）；13 个待改写的原始测试中 12 个已改写、1 个仍未验证；在原始代码上提交了 113 个设计文件和 111 个性能文件（其中 37 个计数 …` |
| 18:29:35 | 812.0 | 说 | 运行还没有结束：主作业仍在冻结阶段，尚未封存契约，也没有任何交付结果。我在这里停止观察，因为我所在的调度器分配约在 18:57（PST）到时；我没有取消或挂起任何作业。 ## 标识 - **run_id**：`6567125f76004fcd964e88f0d2a00fdf` - **review_id**：`3e9636ff8b60422b880261ce0b92860c` - **作业**： - 主作业 `c52b52e8068a41f9962c8fd761d3f11f`：运行中，阶段 `baseline`，正带着 158 个检查重新捕获原始基线。 - 草稿作业 `757d930c5a934fdc91ffc9b14360d051`：`draft_ready`，第一版实现（candidate-8，132 个文件）已保存，等主作业封存后导入。 - **工作根目录**：`<工作根>` - **恢复测试的提交**：`d9e4e207b736d87b230f4f249002268e0251d4c4`，分支 `main`，提交身份是仓库所有者（Git 按用户名和主机名自动得到，我没有设置身份）。包含 6 个文件、19 个测试： - `tests/data/test_nanolize_recovered_test_sampler.py` - `tests/modeling/test_nanolize_recovered_test_roi_heads_1.py` - `tests/modeling/test_nanolize_recovered_test_roi_heads_2.py` - `tests/test_nanolize_recovered_test_checkpoint.py` - `tests/test_nanolize_recovered_test_packaging.py` - `tests/test_nanolize_recovered_test_solver.py` - **运行页面**：`http://127.0.0.1:<端口>/?key=<已隐去>` - **终端视图**：`nanolize run-watch --state-root <工作根目录>/state` ## 已取消的第一对作业 第一次提交（评审 `b8c7b847afd9469db4d21ba891daa9ab`，主作业 `1592621820424593aaf15fa9ee7296c8`，草稿作业 `c49d4cee2cf54af8987b5981f54cc088`）被我取消并重新提交，约 2 小时 45 分钟的运行作废。 原因是我清单里的两个输出对比检查（`contract-model-zoo-configs`、`contract-model-parameters`）任何候选都过不了。候选的 stdout 与原始逐字节相同，但 stderr 里有一条带工作树绝对路径的警告，而输出对比把 stderr 也算在内。 我让 4 个输出检查在程序开头关闭 stderr，只比较 stdout。被比较的 stdout 内容没有变化，所以没有放宽验收标准。修正后，新草稿作业的第一版在全量对比中没有失败的检查。 ## 当前这对作业的进展 - **范围**：按 `scope=core` 提交，保留 64 个能力（161 个文件，约 29.7 万 tokens），移除 47 个，没有增减任何能力。 - **检查**：45 个保留检查在原始代码上全部通过，另有 7 个随移除的能力退役 … |
| 19:11:11 | 853.6 | 续跑 | **批处理作业到时之后，在新的批处理作业里用同一个会话继续（提示见上）** |
| 19:11:20 | 853.8 | 调用 | `ToolSearch` select:resume_execution_job,execution_job_status,run_dashboard_status,job_state,start_run_dashboard,execution_revi … |
| 19:11:22 | 853.8 | 调用 | `Bash` Read current issues.md tail and repository and queue state：`W=<工作根>; date; hostname; tail -n 40 $W/issues.md; cd <原仓库> && git status --porcelain \| wc -l && git log --oneline -1; squeue -u <用户> -h -o "%i %P %T %M %l %j" \| head` |
| 19:11:28 | 853.9 | 调用 | `nanolize:execution_job_status` {"review_id": "3e9636ff8b60422b880261ce0b92860c", "job_id": "c52b52e8068a41f9962c8fd761d3f11f"} |
| 19:11:31 | 854.0 | 说 | Status confirmed: failed, worker gone, resume available from the sealed checkpoint. Resuming as it is. |
| 19:11:33 | 854.0 | 调用 | `nanolize:resume_execution_job` {"review_id": "3e9636ff8b60422b880261ce0b92860c", "job_id": "c52b52e8068a41f9962c8fd761d3f11f", "allow_execution": true} |
| 19:11:54 | 854.3 | 调用 | `Bash` Record the resume and watch the job restart：`W=<工作根>; cat >> $W/issues.md <<'EOF' ## 13. 阶段 04：分配到时，主作业的工作进程被杀；在新分配里从检查点恢复 - job id：主作业 'c52b52e8068a41f9962c8fd761d3f11f'。 - 错误原文（'execution_job_status'）：'"status": "failed", "phase": "failed", "error": "Execution worker is no longer running."'，事件 'The execution worker stopped before final evidence was saved.'，'resume_available: true'。 - 原因：旧计算节点上的调度器分配在 2026-11-22 18:57（PST）到时，该节点上本次运行的全部进程 （nanolize MCP 服务、评审服务 …` |
| 19:15:58 | 858.4 | 说 | 主作业已从检查点恢复并在运行：控制器第 3 轮启动了 2 个并行作者会话来修复那 10 个未过的检查。继续按约 10 分钟一次观察，直到交付。 |
| 19:15:59 | 858.4 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 19:25:18 | 867.7 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 19:34:31 | 877.0 | 说 | 两个作者的修复已合并，主作业正在对新候选做对比。继续观察。 |
| 19:34:32 | 877.0 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 19:43:37 | 886.1 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 19:52:42 | 895.1 | 说 | candidate-4 的全量对比有 17 个检查未过（看模式多半又是候选保存后扩展模块未准备，控制器会先调用准备配方再比）。继续观察。 |
| 19:52:43 | 895.2 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 20:01:48 | 904.2 | 说 | 准备后只剩 packaging 的 2 个检查未过，作者正在修。我顺便看一下这 2 个检查失败的内容，确认它们对候选是可通过的。 |
| 20:01:52 | 904.3 | 调用 | `Bash` Show the two failing packaging checks：`W=<工作根>; J=$W/state/jobs/jobs/c52b52e8068a41f9962c8fd761d3f11f; python3 - <<EOF import json,glob,os fs=sorted(glob.glob('$J/artifacts/verification-*.json'), key=os.path.getmtime) d=json.load(open(fs[-1])); print(os.path.basename(fs[-1])) for r in d['checks']: if r['status']=='regressed': b,c=r['baseline'],r['current'] print('==', r['name'], r['compare'], r.get('capabilities'), 'exit', b.get('exit_code'), c.get('exit_ …` |
| 20:02:15 | 904.7 | 调用 | `Bash` Record the packaging tension and keep watching：`W=<工作根>; cat >> $W/issues.md <<'EOF' ## 14. 阶段 05（修复）：packaging 的 2 个设计测试与核心范围有张力（只记录，不改契约） - job id：主作业 'c52b52e8068a41f9962c8fd761d3f11f'，candidate-4。 - 事件原文：'The targeted comparison of candidate-4 found 2 failed checks, in packaging; 155 checks were not run (regressed).' - 失败的两个测试（都是冻结时设计的测试，检查 'contract-packaging-c52bn2-120'、'-121'）： 'test_setup_build.py::test_build_ships_builtin_projects_under_detectron2_project …` |
| 20:11:35 | 914.0 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 20:20:38 | 923.1 | 说 | 好消息：candidate-5 的全量对比没有失败的检查（checks_passed），packaging 的 2 个测试也修过了；主作业正在做安装检查，之后是性能测量。继续观察。 |
| 20:20:40 | 923.1 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 20:29:46 | 932.2 | 调用 | `Bash` Note the outcome and keep watching：`W=<工作根>; cat >> $W/issues.md <<'EOF' - 第 14 条的结果：一次修复后 candidate-5 的全量对比没有失败的检查（'comparison_checks_passed'，195 个检查的批次）， 安装检查 2/2 通过（2026-11-23 04:19–04:20 UTC）；随后开始性能测量。候选是怎样同时满足这两个测试和安装检查的， 要在交付后看它的 'setup.py'（我没有读作者的工作区）。 EOF python3 $W/notes/watch.py 555 540` |
| 20:39:05 | 941.5 | 说 | 性能测量批次在计算节点上运行中，无新事件。继续观察。 |
| 20:39:06 | 941.5 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 20:48:25 | 950.9 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 20:57:44 | 960.2 | 说 | 性能测量仍在进行，无新事件。继续观察。 |
| 20:57:45 | 960.2 | 调用 | `Bash` Check batch time and keep watching：`squeue -u <用户> -h -o "%i %T %M %l %j" \| grep "nanolize\\|d2m"; python3 <工作根>/notes/watch.py 550 535` |
| 21:07:04 | 969.5 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 21:16:23 | 978.8 | 说 | 性能测量批次已跑约 55 分钟（582 条性能标准），无新事件。继续观察。 |
| 21:16:25 | 978.9 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 21:25:44 | 988.2 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 21:35:03 | 997.5 | 说 | 仍在性能测量阶段，无新事件。继续观察。 |
| 21:35:04 | 997.5 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 21:44:24 | 1006.8 | 调用 | `Bash` Check batch time and keep watching：`squeue -u <用户> -h -o "%i %T %M %l %j" \| grep "nanolize"; python3 <工作根>/notes/watch.py 550 535` |
| 21:53:28 | 1015.9 | 说 | 性能测量出结果：582 条标准中 5 条比允许的慢（容差 20%）。控制器已启动性能修复（并行作者），之后会重新对比行为、安装和性能。继续观察。 |
| 21:53:29 | 1015.9 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 22:02:44 | 1025.2 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |
| 22:12:03 | 1034.5 | 说 | 5 个并行作者会话在做性能修复，无新事件。继续观察。 |
| 22:12:04 | 1034.5 | 调用 | `Bash` Watch job events for nine minutes：`python3 <工作根>/notes/watch.py 555 540` |

<details><summary>主持会话写的 issues.md（它在运行中记下的问题和决定，原文）</summary>

```
# issues.md — detectron2 的无人值守 nanolize 运行

每条记录：步骤、job id、错误原文、我判断的原因、我改了什么、之后发生了什么。

## 1. 阶段 01 / 步骤 0（env）：原始测试需要 model zoo 配置链接
- job id：无（阶段 01）。
- 现象：在只复制了 `_C.*.so` 的原始副本上，38 个测试失败，其中约 30 个报
  `RuntimeError: ... not available in Model Zoo!`。
- 原因：`detectron2/model_zoo/configs` 是 `setup.py` 在构建时创建的指向 `configs/` 的链接
  （被 `.gitignore` 忽略），只复制扩展模块的树里没有它。
- 改动：准备配方（`prepare_checks`）除了复制 `_C.cpython-311-x86_64-linux-gnu.so`，再建一条相对链接
  `detectron2/model_zoo/configs -> ../../configs`（与 `setup.py` 的构建结果一致，文件被忽略，不改动受跟踪内容）。
- 结果：同一副本上 284 通过、16 失败、30 跳过、1 个文件收集出错。

## 2. 阶段 01 / 步骤 0（env）：在本环境的原始代码上无法通过的测试被排除
- 排除的测试（不是验收标准，也不为它们修环境）：
  - `tests/data/test_coco_evaluation.py` 整个文件（`test_unknown_category` 缺数据集文件
    `datasets/coco/annotations/instances_val2017_100.json`；`test_fast_eval` 报 `KeyError: 'precision'`）。
  - `tests/data/test_dataset.py` 的 `test_build_dataloader_train`、`test_build_iterable_dataloader_train`（缺数据集文件）。
  - `tests/data/test_detection_utils.py` 的 `test_read_exif_orientation`、`test_opencv_exif_orientation`（沙箱无网络）。
  - `tests/test_engine.py` 的 `test_default_trainer`（缺数据集文件）。
  - `tests/test_export_torchscript.py` 的 9 个下载 model zoo 权重的测试（沙箱无网络）。
  - `tests/test_export_onnx.py`（未安装 onnx，收集出错）、`tests/test_export_caffe2.py` 与
    `tests/export/test_c10.py`（未安装 caffe2，全部跳过，pytest 退出码 5）。
- 做法：对应检查用显式的测试节点 id 只选能通过的测试。

## 3. 阶段 01 / 步骤 4（manifest）：`--deselect` 的检查无法被转换拆分
- 错误原文（`recovery_skipped_checks`）：`Whether the node ids it deselects (--deselect) leave a case of
  tests/data/test_dataset.py::TestDatasetFromList::test_using_lazy_path cannot be read statically: ...`
- 原因：仓库根目录没有固定 pytest rootdir 的配置，转换读不出 `--deselect` 之后剩下哪些用例。
- 改动：`make_manifest.py` 里把 `--deselect` 换成按节点 id 正向选择（`file::Class`、`file::Class::test`）。
- 结果：第二次转换不再有 `recovery_skipped_checks`。

## 4. 阶段 01 / 步骤 4（manifest）：第一次转换留出的检查太多，补充接口后重新转换
- 现象：第一次转换留出 16 个检查（101 个测试），原因多是测试用到了不在 `__all__` 里的公开名字
  （`convert_to_coco_dict`、`TORCH_VERSION`、`patch_instances` 等）。
- 改动：在清单里沿用第一次转换提出的接口，并补充这些公开名字和静态阅读找不到的内容
  （默认配置、注册名、文件格式、环境变量、包元数据），然后重新转换。
- 结果：保留 52 个检查，留出 8 个（32 个测试，其中 16 个公开测试）；恢复 6 个测试文件共 19 个测试；
  13 个测试待测试设计改写（migrate），3 个只测内部名字（internal）。
- 中间产物：第一次转换写入的 8 个未提交文件，用该次报告自带的 `recovered_files.discard` 命令原样撤回，
  再转换一次写出最终的 6 个文件；没有手工删除或改动仓库里的其他文件。

## 5. 阶段 01 / 步骤 4（manifest）：提交恢复的测试文件
- 命令：转换报告的 `recovered_files.command`，原样执行，成功。
- 提交：`d9e4e207b736d87b230f4f249002268e0251d4c4`，分支 `main`，提交身份是仓库所有者
  （Git 按用户名和主机名自动得到的身份；没有为它设置 Git 身份）。
- 文件：`tests/data/test_nanolize_recovered_test_sampler.py`、
  `tests/modeling/test_nanolize_recovered_test_roi_heads_1.py`、
  `tests/modeling/test_nanolize_recovered_test_roi_heads_2.py`、
  `tests/test_nanolize_recovered_test_checkpoint.py`、`tests/test_nanolize_recovered_test_packaging.py`、
  `tests/test_nanolize_recovered_test_solver.py`。

## 6. 阶段 02：评审服务第一次启动超时
- job id：无（评审 `089c7e7c135b461bbd15f7b88439e7da`，未产生作业）。
- 错误原文：`Error executing tool start_execution_review: OSError: Review service startup timed out`
- 原因：评审服务要在 30 秒内写出回执；当时这台计算节点被其他作业占满（load average 约 70，
  系统态 CPU 39%），服务没能按时就绪，`service.log` 为空，启动方已把它终止。同样的规划在随后只用了 8 秒。
- 改动：没有改任何参数，原样再调用一次 `start_execution_review`。
- 结果：第二次成功，评审 `b8c7b847afd9469db4d21ba891daa9ab`。失败的那次只留下一个空的评审目录。

## 7. 阶段 01 / 步骤 9：没有调用 `sbatch --test-only`
- 原因：account、partition、qos 三项都由用户给定（<账户> / <队列> / normal），按原样使用，
  不需要再找；本机约定不由我发起任何 sbatch/srun/salloc，所以没有向调度器发询问。
- 结果：`check_executor` 为 `{"kind": "auto", "account": "<账户>", "partition": "<队列>",
  "qos": "normal", "queue_timeout": 1800, "python": ".../rtenv/a003430d/bin/python"}`；`task_doctor` 的
  `check_scheduler` 报告调度器可达（`reachable: true`）。

## 8. 阶段 03（冻结）：7 个保留检查不能在原始提交的纯净导出里复现
- job id：主作业 `1592621820424593aaf15fa9ee7296c8`。
- 事件原文（`checks_not_reproduced_in_export`）：`7 of 45 retained checks pass on the original but not in a
  pristine export of its commit (what such a check needs beyond the committed files is missing there, or no
  export could be made): no knockout of them was tried, so they are a valid test of no leaf.`
- 原因（我的判断）：这些检查通过 model zoo 读取配置，需要准备配方建立的
  `detectron2/model_zoo/configs` 链接；敲除用的纯净导出只借到构建出的扩展模块，没有这条链接。
- 改动：无。它们仍是比较原始代码与候选代码的验收检查，只是不算作任何叶子的“有效测试”；
  这些叶子由测试设计补测试（事件：为 21 个没有有效测试的叶子设计测试）。
- 结果：作业继续。

## 9. 阶段 04（草稿作业的验证）：两个输出对比检查任何候选都无法通过，取消并重新提交
- job id：主作业 `1592621820424593aaf15fa9ee7296c8`、草稿作业 `c49d4cee2cf54af8987b5981f54cc088`
  （评审 `b8c7b847afd9469db4d21ba891daa9ab`）。
- 事件原文：`The targeted comparison of candidate-9 found 2 failed checks, in config-yacs, model-backbones,
  model-cascade-rcnn, model-dense-detectors, model-keypoint-head and others; 36 checks were not run (regressed).`
  连续三个候选都是这两个检查：`contract-model-zoo-configs` 和 `contract-model-parameters`。
- 原因：这两个检查是我在清单里写的输出对比检查。候选的 stdout 与原始完全相同（sha256 一致），
  退出码相同；不同的只有 stderr 里 fvcore 的一条警告
  `Loading config <工作树绝对路径>/detectron2/model_zoo/configs/COCO-Detection/../Base-RetinaNet.yaml with
  yaml.unsafe_load. ...`。原始代码在 `original-worktree` 下运行，候选在 `worktree` 下运行，路径必然不同，
  而输出对比把 stderr 也算在内，所以无论候选怎么写都判为退化。这是检查本身的缺陷，不是候选的缺陷。
  预跑时我只在同一棵树上跑了两遍，没有发现。
- 改动：`notes/make_manifest.py` 里 4 个输出对比检查的程序开头加上
  `import os, sys` 和 `sys.stderr = open(os.devnull, 'w')`，只把 stdout 作为契约。
  在两棵不同路径的原始树（导出副本和克隆）上验证：4 个检查的 stdout、stderr 完全一致，
  stdout 与修改前逐字节相同。**没有放宽任何验收标准**：被比较的 stdout 内容没有变化，
  去掉的只是一条含本机路径、任何实现都无法复现的警告。
- 之后：取消了这一对作业（主作业尚未封存契约，不能恢复；候选和证据保留在状态目录里），
  停掉旧评审，重新转换（`graph-manifest-4.json`，恢复的测试文件没有变化，无需新提交）、
  规划（`plan-2.json`）、审计（无问题），启动新评审 `3e9636ff8b60422b880261ce0b92860c` 并提交：
  主作业 `c52b52e8068a41f9962c8fd761d3f11f`，草稿作业 `757d930c5a934fdc91ffc9b14360d051`。
- 代价：第一对作业约 2 小时 45 分钟的运行（54 个测试设计会话、草稿作业的 9 个候选）作废。

## 10. 阶段 04：候选保存后第一次对比缺少扩展模块（作业自己处理，记录备查）
- job id：草稿作业 `c49d4cee2cf54af8987b5981f54cc088`。
- 现象：候选保存后的第一次对比有 9 个检查失败，其中 7 个报
  `ImportError: Cannot import 'detectron2._C'`；控制器随后调用准备配方（复制扩展模块、建配置链接），
  再对比只剩上面第 9 条的 2 个检查。
- 原因：保存候选会重写候选工作树，被忽略的 `_C.*.so` 和配置链接需要重新准备。
- 改动：无（控制器每轮都会先调用 `prepare_environment`）。

## 11. 阶段 03（冻结）：主作业因 sbatch 超时而暂停，原样恢复
- job id：主作业 `c52b52e8068a41f9962c8fd761d3f11f`。
- 事件原文：`The compute node this job's checks run on could not be used within the owner's queue limit
  (the batch could not be submitted: Scheduler command timed out: sbatch); no check ran, and the freeze steps
  that ended are kept. Resume the job once the scheduler runs batches again.`（2026-11-22 21:00:31 UTC）
- 原因（我的判断）：调度器一时没有应答 sbatch；随后 `sinfo` 立即应答，<队列> 分区正常。
- 改动：无。按无人值守的规定原样恢复（`resume_execution_job`，`allow_execution=True`），没有把检查移到本机
  （这是一对作业里的主作业，它的检查留在计算节点上）。这是第 1 次因该原因暂停。
- 结果：作业从冻结阶段已完成的步骤之后继续（`Resuming the job in its freeze`），新的检查批次已在 <队列> 上运行。
- 补充（恢复之后）：暂停发生在测试设计这一步中途（已做到第 3 轮设计和第 2 轮评审），这一步没有结束，
  所以恢复后它从头重做（`design/call-2`，60 个设计会话重新运行）；此前约 4.5 小时的设计与测量结果
  （`design/round-1..3`、`baseline-1..3.json`）留在作业目录里但不再使用。草稿作业的第一版（candidate-8，
  全量对比无失败）不受影响，仍等主作业封存契约后导入。

## 12. 观察在作业结束前停止
- job id：主作业 `c52b52e8068a41f9962c8fd761d3f11f`（运行中，冻结阶段），草稿作业
  `757d930c5a934fdc91ffc9b14360d051`（`draft_ready`）。
- 原因：我所在的调度器分配有 14 小时的时限，约在 2026-11-22 18:57（PST）到时；主作业此时还在
  带着 158 个检查重新捕获基线（重复运行与叶子敲除），尚未封存契约。
- 最后看到的事件（2026-11-23 02:05–02:06 UTC）：接受 82 个设计的测试（24 个叶子）、27 个场景文件
  （725 个用例，23 个叶子）；13 个待改写的原始测试中 12 个已改写、1 个仍未验证；在原始代码上提交了
  113 个设计文件和 111 个性能文件（其中 37 个计数文件）。
- 之后：作业自行继续；没有取消、挂起或改动任何东西。

## 13. 阶段 04：分配到时，主作业的工作进程被杀；在新分配里从检查点恢复
- job id：主作业 `c52b52e8068a41f9962c8fd761d3f11f`。
- 错误原文（`execution_job_status`）：`"status": "failed", "phase": "failed", "error": "Execution worker is no
  longer running."`，事件 `The execution worker stopped before final evidence was saved.`，`resume_available: true`。
- 原因：旧计算节点上的调度器分配在 2026-11-22 18:57（PST）到时，该节点上本次运行的全部进程
  （nanolize MCP 服务、评审服务和运行页面、主作业的工作进程）随之被杀；不是经 nanolize 取消或挂起的。
  此前主作业已封存契约（427 个验证方文件）、导入草稿作业的第一版为 candidate-1、全量对比两次
  （27 个失败的检查；控制器第 1 轮准备环境后 10 个）、安装检查通过（2/2），控制器正在选第 2 轮的调用。
- 改动：无。按所有者的指示，在新分配（节点 <节点>）里原样恢复
  （`resume_execution_job`，`allow_execution=True`；没有 `checks_local`、`deliver`、追加时间或 token），
  清单、契约和运行选项都没有改，没有新的评审或作业。
- 结果：`Validated checkpoint accepted; resuming only unfinished stages.`，作业状态回到 `queued`。
- 运行页面：旧节点上的页面和评审服务已不存在。技能里没有“为已有的 run 重新打开页面”的办法
  （`start_run_dashboard` 会新建一个 run），所以没有重开；用 `execution_job_status` 和作业目录里的记录观察。

## 14. 阶段 05（修复）：packaging 的 2 个设计测试与核心范围有张力（只记录，不改契约）
- job id：主作业 `c52b52e8068a41f9962c8fd761d3f11f`，candidate-4。
- 事件原文：`The targeted comparison of candidate-4 found 2 failed checks, in packaging; 155 checks were not run (regressed).`
- 失败的两个测试（都是冻结时设计的测试，检查 `contract-packaging-c52bn2-120`、`-121`）：
  `test_setup_build.py::test_build_ships_builtin_projects_under_detectron2_projects` 和
  `test_setup_relocated.py::test_build_without_a_project_directory_fails`（`DID NOT RAISE BaseException`）。
- 原因（我的判断）：原始 `setup.py` 无条件把 `projects/PointRend`、`DeepLab`、`Panoptic-DeepLab` 打包成
  `detectron2.projects.*`，缺目录时构建失败；测试设计把这一行为定成了 packaging 的标准。但核心范围里这些
  项目属于被移除的能力，候选树里没有 `projects/`，而安装检查要求候选能直接 `pip install`。
  我在清单里给 packaging 写的说明提到了“内置项目作为 detectron2.projects.* 发布”，这是来源。
- 改动：无。所有者指示不改清单、契约和运行选项；也没有关掉检查或放宽标准。
- 结果：见后续条目（作业自己的修复循环在处理；若修不掉，会按规则带着失败清单交付）。
- 第 14 条的结果：一次修复后 candidate-5 的全量对比没有失败的检查（`comparison_checks_passed`，195 个检查的批次），
  安装检查 2/2 通过（2026-11-23 04:19–04:20 UTC）；随后开始性能测量。候选是怎样同时满足这两个测试和安装检查的，
  要在交付后看它的 `setup.py`（我没有读作者的工作区）。
```

</details>

## 5. 四个作业的事件和操作（按时间）

“事件”是作业写给人看的进度消息；“操作”是作业执行的一步（工具名、结果、用时）；“controller”是 controller 的一轮决定。四个作业的记录合在一起按时间排。

| 时间 | 第几分钟 | 作业 | 类型 | 内容 |
| --- | --- | --- | --- | --- |
| 05:35:15 | 37.7 | 主① | 事件 | [queued] Selection accepted; waiting for an execution slot. |
| 05:35:15 | 37.7 | 主① | 事件 | `pair_started` [queued] This run is two jobs: this one freezes the contract and verifies, and a draft job (c49d4cee2cf54af8987b5981f54cc088) writes the first implementation meanwhile on a second clone. This job imports it after its seal. |
| 05:35:15 | 37.7 | 草稿① | 事件 | `pair_started` [queued] The draft job of a pair: it writes the first implementation on a second clone while its main job (1592621820424593aaf15fa9ee7296c8) freezes the contract, then compares it with the original's own checks and repairs what fails, at the latest until its main job has sealed. It designs no test and delivers nothing, and what it compares is no evidence. |
| 05:35:16 | 37.7 | 主① | 事件 | [preparing] Trying the job's runners with one small call each before anything is prepared: the author's runner, the controller's runner, the test designers' runner. |
| 05:35:16 | 37.7 | 草稿① | 事件 | `draft_job` [controller] The controller is not asked (draft job); the job follows the advice from create_workspace. |
| 05:35:16 | 37.7 | 草稿① | 操作 | `create_workspace` → created（23 秒），由 strategy:fixed 发起 |
| 05:35:24 | 37.8 | 主① | 事件 | [preparing] The author's runner passed its trial call (8 s). |
| 05:35:28 | 37.9 | 草稿① | 事件 | [preparing] Creating isolated original and candidate worktrees. |
| 05:35:33 | 38.0 | 主① | 事件 | [preparing] The controller's runner passed its trial call (9 s). |
| 05:35:39 | 38.1 | 草稿① | 操作 | `prepare_environment` → passed（4 秒），由 strategy:fixed 发起 |
| 05:35:40 | 38.1 | 草稿① | 事件 | [preparing] Running the owner's preparation recipes in the original's worktree. |
| 05:35:42 | 38.1 | 草稿① | 操作 | `prepare_environment` → passed（7 秒），由 strategy:fixed 发起 |
| 05:35:44 | 38.2 | 草稿① | 事件 | [preparing] Running the owner's preparation recipes in the candidate's worktree. |
| 05:35:45 | 38.2 | 主① | 事件 | [preparing] The test designers' runner passed its trial call (12 s). |
| 05:35:49 | 38.3 | 草稿① | 操作 | `capture_baseline` → ready（247 秒），由 strategy:fixed 发起 |
| 05:35:49 | 38.3 | 草稿① | 事件 | [baseline] Capturing the original baseline in the original's worktree, unless a saved one still observes it. |
| 05:35:52 | 38.3 | 主① | 事件 | [preparing] The job's checks run on a compute node (Slurm, partition <队列>). Installation checks and preparation recipes run on this machine. |
| 05:35:52 | 38.3 | 主① | 事件 | `before_first_comparison` [controller] The controller is not asked (before first comparison); the job follows the advice from create_workspace. |
| 05:35:52 | 38.3 | 主① | 操作 | `create_workspace` → created（27 秒），由 strategy:fixed 发起 |
| 05:36:06 | 38.5 | 主① | 事件 | [preparing] Creating isolated original and candidate worktrees. |
| 05:36:19 | 38.8 | 主① | 操作 | `prepare_environment` → passed（6 秒），由 strategy:fixed 发起 |
| 05:36:21 | 38.8 | 主① | 事件 | [preparing] Running the owner's preparation recipes in the original's worktree. |
| 05:36:25 | 38.9 | 主① | 操作 | `prepare_environment` → passed（6 秒），由 strategy:fixed 发起 |
| 05:36:27 | 38.9 | 主① | 事件 | [preparing] Running the owner's preparation recipes in the candidate's worktree. |
| 05:36:31 | 39.0 | 主① | 操作 | `capture_baseline` → ready（611 秒），由 strategy:fixed 发起 |
| 05:36:31 | 39.0 | 主① | 事件 | [baseline] Capturing the original baseline in the original's worktree, unless a saved one still observes it. Validating leaf tests with repeated runs and leaf knockouts. |
| 05:40:02 | 42.5 | 草稿① | 操作 | `seal_contract` → done（23 秒），由 strategy:fixed 发起 |
| 05:40:24 | 42.8 | 草稿① | 事件 | `contract_sealed` [baseline] The contract is sealed: 203 verifier-owned files; the verification bundle is exported. The original baseline is no usable oracle (1 problems, named in this step's result). |
| 05:40:26 | 42.9 | 草稿① | 事件 | [controller] Controller round 1: choosing the next tool calls. |
| 05:43:15 | 45.7 | 草稿① | controller | 第 1 轮（applied，170 秒，3 个调用：`run_parallel_agents`、`run_agent`、`save_candidate`）：Six scopes form a chain, so the mainline's layers would cost six sessions in a row while the main job freezes. Scopes 1-5 are written in one split group (the external contract fixes the module-qualified names they share), then scope-6 alone on the merged candidate as the integration call that writes the shared package-level files and checks cross-scope paths. The delegation then runs the first full comparison; if the group ends partial, it only starts the rerun and I am asked again. |
| 05:43:15 | 45.7 | 草稿① | 事件 | `applied` [controller] Controller round 1: run_parallel_agents, run_agent, save_candidate then the mainline up to verify. |
| 05:43:15 | 45.7 | 草稿① | 操作 | `run_parallel_agents` → done（4715 秒），由 strategy:controller 发起 |
| 05:45:50 | 48.3 | 草稿① | 事件 | [workspace_agents] A parallel group (split) of 5 author sessions in implementation workspaces, 4 at a time. |
| 05:46:43 | 49.2 | 主① | 事件 | `checks_not_reproduced_in_export` [baseline] 7 of 45 retained checks pass on the original but not in a pristine export of its commit (what such a check needs beyond the committed files is missing there, or no export could be made): no knockout of them was tried, so they are a valid test of no leaf. The baseline record names each under validity.issues (check_not_reproduced_in_export), with the last line it printed. |
| 05:46:43 | 49.2 | 主① | 操作 | `design_leaf_tests` → stopped（9186 秒），由 strategy:fixed 发起：`JobCancelled` Owner requested cancellation |
| 05:46:43 | 49.2 | 主① | 事件 | [baseline] Designing tests for 21 selected leaves without a valid test. 13 original tests that could not stay as written are given to the designers of 6 leaves to migrate. Performance files are designed for 54 selected leaves. |
| 07:01:37 | 124.1 | 草稿① | 事件 | [restoring] Combining the files a parallel group's authors changed, without invoking an author. |
| 07:01:50 | 124.3 | 草稿① | 操作 | `run_agent` → completed（2221 秒），候选 candidate-6，由 strategy:controller 发起 |
| 07:01:52 | 124.3 | 草稿① | 事件 | [refactoring] The configured agent is writing its own implementation of the selected graph. |
| 07:38:51 | 161.3 | 草稿① | 操作 | `save_candidate` → done（12 秒），候选 candidate-6，由 strategy:controller 发起 |
| 07:39:04 | 161.5 | 草稿① | 事件 | `candidate_saved` [refactoring] The drafts are saved as candidate-7. |
| 07:39:07 | 161.6 | 草稿① | 操作 | `compare_behavior` → regressed（93 秒），候选 candidate-7，由 strategy:controller 发起 |
| 07:39:07 | 161.6 | 草稿① | 事件 | [verifying] Comparing this candidate with the original frozen checks and source budget. |
| 07:40:41 | 163.1 | 草稿① | 事件 | `comparison_regressed` [verifying] The full comparison of candidate-7 found 9 failed checks, in config-yacs, layers-deform-conv, layers-nms, layers-roi-align, model-backbones and others (regressed). |
| 07:40:42 | 163.1 | 草稿① | 事件 | [controller] Controller round 2: choosing the next tool calls. |
| 07:43:22 | 165.8 | 草稿① | controller | 第 2 轮（applied，160 秒，8 个调用：`prepare_environment`、`capture_baseline`、`compare_behavior`、`compare_behavior`、`run_agent`、`save_candidate`、`compare_behavior`、`compare_behavior`）：All failures but check-44 trace to detectron2._C not being importable or its rotated operators missing, and the candidate's environment was prepared (13:35) before any rewrite source existed (authors started 13:43). So first run the owner's preparation recipes on the candidate again, capture (reuse) the baseline and screen the nine failed checks: seconds instead of a 40-minute author call. A clear screen is followed by the full comparison; if failures remain after recipes that passed, one repair call with its save, screen and full comparison goes on in the same batch. If a recipe fails, nothing else triggers and the delegation only re-observes, so I can read the recipe result before spending a repair. |
| 07:43:22 | 165.8 | 草稿① | 事件 | `applied` [controller] Controller round 2: prepare_environment, capture_baseline, compare_behavior, compare_behavior, run_agent, save_candidate and 2 more then the mainline up to deliver. |
| 07:43:22 | 165.8 | 草稿① | 操作 | `prepare_environment` → passed（1 秒），候选 candidate-7，由 strategy:controller 发起 |
| 07:43:22 | 165.8 | 草稿① | 事件 | [preparing] Running the owner's preparation recipes in the candidate's worktree. |
| 07:43:23 | 165.8 | 草稿① | 操作 | `capture_baseline` → ready（3 秒），候选 candidate-7，由 strategy:controller 发起 |
| 07:43:23 | 165.8 | 草稿① | 事件 | [baseline] Capturing the original baseline in the original's worktree, unless a saved one still observes it. |
| 07:43:26 | 165.9 | 草稿① | 操作 | `compare_behavior` → regressed（37 秒），候选 candidate-7，由 strategy:controller 发起 |
| 07:43:26 | 165.9 | 草稿① | 事件 | [verifying] Comparing this candidate with the original frozen checks and source budget. |
| 07:44:02 | 166.5 | 草稿① | 事件 | `comparison_regressed` [verifying] The targeted comparison of candidate-7 found 2 failed checks, in config-yacs, model-backbones, model-cascade-rcnn, model-dense-detectors, model-keypoint-head and others; 36 checks were not run (regressed). |
| 07:44:03 | 166.5 | 草稿① | 操作 | `compare_behavior` → not_triggered（没有执行），由 strategy:controller 发起：Its condition was not met: call 3 ended regressed, and it runs only after unverified |
| 07:44:03 | 166.5 | 草稿① | 操作 | `run_agent` → completed（540 秒），候选 candidate-7，由 strategy:controller 发起 |
| 07:44:05 | 166.5 | 草稿① | 事件 | [refactoring] The configured agent is repairing its implementation of the selected graph. |
| 07:53:02 | 175.5 | 草稿① | 操作 | `save_candidate` → done（12 秒），候选 candidate-7，由 strategy:controller 发起 |
| 07:53:15 | 175.7 | 草稿① | 事件 | `candidate_saved` [refactoring] The drafts are saved as candidate-8. |
| 07:53:15 | 175.7 | 草稿① | 操作 | `compare_behavior` → regressed（69 秒），候选 candidate-8，由 strategy:controller 发起 |
| 07:53:15 | 175.7 | 草稿① | 事件 | [verifying] Comparing this candidate with the original frozen checks and source budget. |
| 07:54:23 | 176.8 | 草稿① | 事件 | `comparison_regressed` [verifying] The targeted comparison of candidate-8 found 9 failed checks, in config-yacs, layers-deform-conv, layers-nms, layers-roi-align, model-backbones and others; 36 checks were not run (regressed). |
| 07:54:24 | 176.8 | 草稿① | 操作 | `compare_behavior` → not_triggered（没有执行），由 strategy:controller 发起：Its condition was not met: call 7 ended regressed, and it runs only after unverified |
| 07:54:25 | 176.9 | 草稿① | 事件 | [controller] Controller round 3: choosing the next tool calls. |
| 07:56:36 | 179.0 | 草稿① | controller | 第 3 轮（applied，131 秒，10 个调用：`prepare_environment`、`capture_baseline`、`compare_behavior`、`compare_behavior`、`run_agent`、`save_candidate`、`prepare_environment`、`capture_baseline`、`compare_behavior`、`compare_behavior`）：Candidate-8 differs from candidate-7 in model_zoo.py alone, yet the seven extension checks that passed on candidate-7 right after the candidate's preparation fail again with the same import errors: the save left the worktree without the prepared extension, so that screen says nothing about the repair. Prepare the candidate again, reuse the baseline and screen the nine checks; a clear screen goes to the full comparison. If check-44 or check-45 still differ, one repair for those output differences follows, with its save, a new preparation (needed after every save here), screen and full comparison. The delegation only takes what the mainline does next without a repair. |
| 07:56:36 | 179.0 | 草稿① | 事件 | `applied` [controller] Controller round 3: prepare_environment, capture_baseline, compare_behavior, compare_behavior, run_agent, save_candidate and 4 more then the mainline up to deliver. |
| 07:56:36 | 179.0 | 草稿① | 操作 | `prepare_environment` → passed（1 秒），候选 candidate-8，由 strategy:controller 发起 |
| 07:56:36 | 179.0 | 草稿① | 事件 | [preparing] Running the owner's preparation recipes in the candidate's worktree. |
| 07:56:37 | 179.1 | 草稿① | 操作 | `capture_baseline` → ready（3 秒），候选 candidate-8，由 strategy:controller 发起 |
| 07:56:37 | 179.1 | 草稿① | 事件 | [baseline] Capturing the original baseline in the original's worktree, unless a saved one still observes it. |
| 07:56:40 | 179.1 | 草稿① | 操作 | `compare_behavior` → regressed（37 秒），候选 candidate-8，由 strategy:controller 发起 |
| 07:56:40 | 179.1 | 草稿① | 事件 | [verifying] Comparing this candidate with the original frozen checks and source budget. |
| 07:57:17 | 179.7 | 草稿① | 事件 | `comparison_regressed` [verifying] The targeted comparison of candidate-8 found 2 failed checks, in config-yacs, model-backbones, model-cascade-rcnn, model-dense-detectors, model-keypoint-head and others; 36 checks were not run (regressed). |
| 07:57:17 | 179.7 | 草稿① | 操作 | `compare_behavior` → not_triggered（没有执行），由 strategy:controller 发起：Its condition was not met: call 3 ended regressed, and it runs only after unverified |
| 07:57:17 | 179.7 | 草稿① | 操作 | `run_agent` → completed（1070 秒），候选 candidate-8，由 strategy:controller 发起 |
| 07:57:20 | 179.8 | 草稿① | 事件 | [refactoring] The configured agent is repairing its implementation of the selected graph. |
| 08:15:07 | 197.6 | 草稿① | 操作 | `save_candidate` → done（12 秒），候选 candidate-8，由 strategy:controller 发起 |
| 08:15:20 | 197.8 | 草稿① | 事件 | `candidate_saved` [refactoring] The drafts are saved as candidate-9. |
| 08:15:20 | 197.8 | 草稿① | 操作 | `prepare_environment` → passed（2 秒），候选 candidate-9，由 strategy:controller 发起 |
| 08:15:20 | 197.8 | 草稿① | 事件 | [preparing] Running the owner's preparation recipes in the candidate's worktree. |
| 08:15:22 | 197.8 | 草稿① | 操作 | `capture_baseline` → ready（4 秒），候选 candidate-9，由 strategy:controller 发起 |
| 08:15:22 | 197.8 | 草稿① | 事件 | [baseline] Capturing the original baseline in the original's worktree, unless a saved one still observes it. |
| 08:15:26 | 197.9 | 草稿① | 操作 | `compare_behavior` → regressed（38 秒），候选 candidate-9，由 strategy:controller 发起 |
| 08:15:26 | 197.9 | 草稿① | 事件 | [verifying] Comparing this candidate with the original frozen checks and source budget. |
| 08:16:04 | 198.5 | 草稿① | 事件 | `comparison_regressed` [verifying] The targeted comparison of candidate-9 found 2 failed checks, in config-yacs, model-backbones, model-cascade-rcnn, model-dense-detectors, model-keypoint-head and others; 36 checks were not run (regressed). |
| 08:16:04 | 198.5 | 草稿① | 操作 | `compare_behavior` → not_triggered（没有执行），由 strategy:controller 发起：Its condition was not met: call 9 ended regressed, and it runs only after unverified |
| 08:16:05 | 198.5 | 草稿① | 事件 | [controller] Controller round 4: choosing the next tool calls. |
| 08:18:25 | 200.9 | 草稿① | controller | 第 4 轮（applied，140 秒，4 个调用：`run_parallel_agents`、`prepare_environment`、`capture_baseline`、`compare_behavior`）：check-44 and check-45 kept the same output mismatch through two single-author repairs that only touched model_zoo.py and detection_checkpoint.py. A third repair is one split group with one author per check, each told what the earlier repairs changed without effect, to reproduce the differing line before changing code, and where else output can differ (unconfirmed hypotheses). The merged candidate is prepared again (each save loses the extension here) and compared in full, since repair 2's checkpoint change was only screened on nine checks. |
| 08:18:25 | 200.9 | 草稿① | 事件 | `applied` [controller] Controller round 4: run_parallel_agents, prepare_environment, capture_baseline, compare_behavior then the mainline up to deliver. |
| 08:19:35 | 202.0 | 草稿① | 事件 | [workspace_agents] A parallel group (split) of 2 author sessions in implementation workspaces, 2 at a time. |
| 08:19:49 | 202.3 | 主① | 事件 | [cancel_requested] Owner requested cancellation; confirming resource shutdown. |
| 08:19:49 | 202.3 | 草稿① | 事件 | [cancel_requested] Owner requested cancellation; confirming resource shutdown. |
| 08:19:49 | 202.3 | 主① | 事件 | [cancelled] Execution stopped; private candidate and evidence are retained for owner review. |
| 08:19:49 | 202.3 | 草稿① | 事件 | [cancel_requested] Owner requested cancellation; confirming resource shutdown. |
| 08:20:00 | 202.4 | 草稿① | 事件 | [cancelled] Owned computation stopped; candidate and evidence were retained. |
| 08:20:00 | 202.4 | 草稿① | 事件 | [cancelled] Owned computation stopped; candidate and evidence were retained. |
| 08:20:00 | 202.4 | 主① | 事件 | [cancelled] Owned computation stopped; candidate and evidence were retained. |
| 08:22:32 | 205.0 | 主② | 事件 | [queued] Selection accepted; waiting for an execution slot. |
| 08:22:32 | 205.0 | 主② | 事件 | `pair_started` [queued] This run is two jobs: this one freezes the contract and verifies, and a draft job (757d930c5a934fdc91ffc9b14360d051) writes the first implementation meanwhile on a second clone. This job imports it after its seal. |
| 08:22:32 | 205.0 | 草稿② | 事件 | `pair_started` [queued] The draft job of a pair: it writes the first implementation on a second clone while its main job (c52b52e8068a41f9962c8fd761d3f11f) freezes the contract, then compares it with the original's own checks and repairs what fails, at the latest until its main job has sealed. It designs no test and delivers nothing, and what it compares is no evidence. |
| 08:22:32 | 205.0 | 主② | 事件 | [preparing] Trying the job's runners with one small call each before anything is prepared: the author's runner, the controller's runner, the test designers' runner. |
| 08:22:32 | 205.0 | 草稿② | 事件 | `draft_job` [controller] The controller is not asked (draft job); the job follows the advice from create_workspace. |
| 08:22:32 | 205.0 | 草稿② | 操作 | `create_workspace` → created（15 秒），由 strategy:fixed 发起 |
| 08:22:40 | 205.1 | 草稿② | 事件 | [preparing] Creating isolated original and candidate worktrees. |
| 08:22:41 | 205.1 | 主② | 事件 | [preparing] The author's runner passed its trial call (9 s). |
| 08:22:48 | 205.2 | 草稿② | 操作 | `prepare_environment` → passed（3 秒），由 strategy:fixed 发起 |
| 08:22:48 | 205.2 | 主② | 事件 | [preparing] The controller's runner passed its trial call (7 s). |
| 08:22:49 | 205.3 | 草稿② | 事件 | [preparing] Running the owner's preparation recipes in the original's worktree. |
| 08:22:51 | 205.3 | 草稿② | 操作 | `prepare_environment` → passed（2 秒），由 strategy:fixed 发起 |
| 08:22:51 | 205.3 | 草稿② | 事件 | [preparing] Running the owner's preparation recipes in the candidate's worktree. |
| 08:22:53 | 205.3 | 草稿② | 操作 | `capture_baseline` → ready（141 秒），由 strategy:fixed 发起 |
| 08:22:53 | 205.3 | 草稿② | 事件 | [baseline] Capturing the original baseline in the original's worktree, unless a saved one still observes it. |
| 08:22:59 | 205.4 | 主② | 事件 | [preparing] The test designers' runner passed its trial call (11 s). |
| 08:23:04 | 205.5 | 主② | 事件 | [preparing] The job's checks run on a compute node (Slurm, partition <队列>). Installation checks and preparation recipes run on this machine. |
| 08:23:04 | 205.5 | 主② | 事件 | `before_first_comparison` [controller] The controller is not asked (before first comparison); the job follows the advice from create_workspace. |
| 08:23:04 | 205.5 | 主② | 操作 | `create_workspace` → created（18 秒），由 strategy:fixed 发起 |
| 08:23:12 | 205.6 | 主② | 事件 | [preparing] Creating isolated original and candidate worktrees. |
| 08:23:22 | 205.8 | 主② | 操作 | `prepare_environment` → passed（4 秒），由 strategy:fixed 发起 |
| 08:23:23 | 205.8 | 主② | 事件 | [preparing] Running the owner's preparation recipes in the original's worktree. |
| 08:23:25 | 205.9 | 主② | 操作 | `prepare_environment` → passed（3 秒），由 strategy:fixed 发起 |
| 08:23:26 | 205.9 | 主② | 事件 | [preparing] Running the owner's preparation recipes in the candidate's worktree. |
| 08:23:28 | 205.9 | 主② | 操作 | `capture_baseline` → ready（519 秒），由 strategy:fixed 发起 |
| 08:23:28 | 205.9 | 主② | 事件 | [baseline] Capturing the original baseline in the original's worktree, unless a saved one still observes it. Validating leaf tests with repeated runs and leaf knockouts. |
| 08:25:17 | 207.7 | 草稿② | 操作 | `seal_contract` → done（16 秒），由 strategy:fixed 发起 |
| 08:25:33 | 208.0 | 草稿② | 事件 | `contract_sealed` [baseline] The contract is sealed: 203 verifier-owned files; the verification bundle is exported. The original baseline is no usable oracle (1 problems, named in this step's result). |
| 08:25:34 | 208.0 | 草稿② | 事件 | [controller] Controller round 1: choosing the next tool calls. |
| 08:28:50 | 211.3 | 草稿② | controller | 第 1 轮（applied，196 秒，4 个调用：`run_parallel_agents`、`run_agent`、`save_candidate`、`compare_behavior`）：Draft job with a six-scope chain: speed before the main job seals matters, so all six scopes are written in one split group (4 sessions at once), each told to use other scopes only through external-contract names and to leave shared package files alone. If the group ends done, one implement call (no behavior repair spent) writes the shared package __init__ files and mends the seams, then save and the first full comparison. If it ends partial, follow lets the mainline write the lost requests again and stops before the comparison so I can integrate first. |
| 08:28:50 | 211.3 | 草稿② | 事件 | `applied` [controller] Controller round 1: run_parallel_agents, run_agent, save_candidate, compare_behavior then the mainline up to rewrite. |
| 08:28:50 | 211.3 | 草稿② | 操作 | `run_parallel_agents` → done（4145 秒），由 strategy:controller 发起 |
| 08:31:54 | 214.3 | 草稿② | 事件 | [workspace_agents] A parallel group (split) of 6 author sessions in implementation workspaces, 4 at a time. |
| 08:32:07 | 214.6 | 主② | 事件 | `checks_not_reproduced_in_export` [baseline] 7 of 45 retained checks pass on the original but not in a pristine export of its commit (what such a check needs beyond the committed files is missing there, or no export could be made): no knockout of them was tried, so they are a valid test of no leaf. The baseline record names each under validity.issues (check_not_reproduced_in_export), with the last line it printed. |
| 08:32:08 | 214.6 | 主② | 操作 | `design_leaf_tests` → error（16087 秒），由 strategy:fixed 发起：`_NotStarted` the batch could not be submitted: Scheduler command timed out: sbatch |
| 08:32:08 | 214.6 | 主② | 事件 | [baseline] Designing tests for 22 selected leaves without a valid test. 13 original tests that could not stay as written are given to the designers of 6 leaves to migrate. Performance files are designed for 54 selected leaves. |
| 09:37:43 | 280.2 | 草稿② | 事件 | [restoring] Combining the files a parallel group's authors changed, without invoking an author. |
| 09:37:56 | 280.4 | 草稿② | 操作 | `run_agent` → completed（1838 秒），候选 candidate-7，由 strategy:controller 发起 |
| 09:37:57 | 280.4 | 草稿② | 事件 | [refactoring] The configured agent is writing its own implementation of the selected graph. |
| 10:08:33 | 311.0 | 草稿② | 操作 | `save_candidate` → done（13 秒），候选 candidate-7，由 strategy:controller 发起 |
| 10:08:46 | 311.2 | 草稿② | 事件 | `candidate_saved` [refactoring] The drafts are saved as candidate-8. |
| 10:08:46 | 311.2 | 草稿② | 操作 | `compare_behavior` → regressed（94 秒），候选 candidate-8，由 strategy:controller 发起 |
| 10:08:46 | 311.2 | 草稿② | 事件 | [verifying] Comparing this candidate with the original frozen checks and source budget. |
| 10:10:20 | 312.8 | 草稿② | 事件 | `comparison_regressed` [verifying] The full comparison of candidate-8 found 8 failed checks, in layers-deform-conv, layers-nms, layers-roi-align, model-backbones, model-cascade-rcnn and others (regressed). |
| 10:10:21 | 312.8 | 草稿② | 事件 | [controller] Controller round 2: choosing the next tool calls. |
| 10:11:29 | 313.9 | 草稿② | controller | 第 2 轮（applied，68 秒，3 个调用：`prepare_environment`、`capture_baseline`、`compare_behavior`）：Seven of the eight failed checks fail because the compiled extension detectron2._C is not importable in the candidate worktree (ImportError from the missing-extension stand-in, AttributeError on the native rotated ops). The csrc sources are carried files, and the candidate's preparation recipes ran at 16:22, before any setup.py or package existed there. My hypothesis is that the extension was simply never built for the candidate, so I run the owner's recipes on the candidate again, take the baseline (reused) and compare in full before spending a behavior repair. If the recipes fail or checks still fail, the next round writes a targeted repair from that evidence; follow stops before any repair. |
| 10:11:29 | 313.9 | 草稿② | 事件 | `applied` [controller] Controller round 2: prepare_environment, capture_baseline, compare_behavior then the mainline up to deliver. |
| 10:11:29 | 313.9 | 草稿② | 操作 | `prepare_environment` → passed（1 秒），候选 candidate-8，由 strategy:controller 发起 |
| 10:11:29 | 313.9 | 草稿② | 事件 | [preparing] Running the owner's preparation recipes in the candidate's worktree. |
| 10:11:30 | 313.9 | 草稿② | 操作 | `capture_baseline` → ready（3 秒），候选 candidate-8，由 strategy:controller 发起 |
| 10:11:30 | 313.9 | 草稿② | 事件 | [baseline] Capturing the original baseline in the original's worktree, unless a saved one still observes it. |
| 10:11:33 | 314.0 | 草稿② | 操作 | `compare_behavior` → unverified（51 秒），候选 candidate-8，由 strategy:controller 发起 |
| 10:11:33 | 314.0 | 草稿② | 事件 | [verifying] Comparing this candidate with the original frozen checks and source budget. |
| 10:12:23 | 314.8 | 草稿② | 事件 | `comparison_unverified` [verifying] The full comparison of candidate-8 found no failed check (unverified). |
| 10:12:24 | 314.8 | 草稿② | 操作 | `finish_draft` → ready（9 秒），候选 candidate-8，由 strategy:fixed 发起 |
| 10:12:32 | 315.0 | 草稿② | 事件 | [draft_ready] The first implementation is written and saved (candidate-8, 132 files in 6 scopes). This draft job ends here: its main job imports the candidate, verifies it and delivers. |
| 13:00:31 | 483.0 | 主② | 事件 | [paused] The compute node this job's checks run on could not be used within the owner's queue limit (the batch could not be submitted: Scheduler command timed out: sbatch); no check ran, and the freeze steps that ended are kept. Resume the job once the scheduler runs batches again. This is the main job of a pair: its checks stay on a compute node, and its draft job goes on writing meanwhile. |
| 13:00:49 | 483.3 | 主② | 事件 | [queued] Resuming the job in its freeze: it has no checkpoint yet, and goes on after the freeze steps that ended. |
| 13:00:50 | 483.3 | 主② | 事件 | [preparing] The job's checks run on a compute node (Slurm, partition <队列>). Installation checks and preparation recipes run on this machine. |
| 13:00:50 | 483.3 | 主② | 操作 | `design_leaf_tests` → done（18314 秒），由 strategy:fixed 发起 |
| 13:00:51 | 483.3 | 主② | 事件 | [baseline] Designing tests for 22 selected leaves without a valid test. 13 original tests that could not stay as written are given to the designers of 6 leaves to migrate. Performance files are designed for 54 selected leaves. |
| 18:05:52 | 788.3 | 主② | 事件 | `designed_tests_pinned` [baseline] Accepted 82 designed tests for 24 leaves; 12 proposals rejected. Accepted 27 scenario files with 725 cases for 23 leaves; 6 scenario files rejected. What each case shows on the original is what a candidate must show. Of 13 original tests to migrate, 12 are migrated, 0 left out with a reason and 1 stay unverified; of those, 1 could not be checked where a designer runs or assert on a docstring. Accepted 111 performance files with 582 criteria for 51 leaves; 9 performance files rejected. The designers of 3 leaves found no work worth measuring. 1 selected leaves get no performance file (no Python source of their own, exempted or internal). Kept 4 more as pinned checks for 1 leaves: they passed on the original and their review, but also with their leaf knocked out, so these leaves stay without a valid test. 7 of the refused files, holding 126 tests and scenario functions, were not given back … |
| 18:06:01 | 788.5 | 主② | 事件 | `designed_tests_baseline` [baseline] Committed 113 designed files and 111 performance files on the original. The original baseline is captured again with them by the job's next step: 158 checks, validating leaf tests with repeated runs and leaf knockouts. The 37 count files run there too, as the performance criteria they are. |
| 18:06:03 | 788.5 | 主② | 操作 | `capture_baseline` → ready（2049 秒），由 strategy:fixed 发起 |
| 18:06:03 | 788.5 | 主② | 事件 | [baseline] Capturing the original baseline in the original's worktree, unless a saved one still observes it. Validating leaf tests with repeated runs and leaf knockouts. |
| 18:40:11 | 822.6 | 主② | 事件 | `checks_not_reproduced_in_export` [baseline] 8 of 158 retained checks pass on the original but not in a pristine export of its commit (what such a check needs beyond the committed files is missing there, or no export could be made): no knockout of them was tried, so they are a valid test of no leaf. The baseline record names each under validity.issues (check_not_reproduced_in_export), with the last line it printed. |
| 18:40:12 | 822.6 | 主② | 事件 | `designed_tests_baseline` [baseline] The original baseline with the designed tests is captured (ready): 1 selected leaves are still without a valid test. |
| 18:40:26 | 822.9 | 主② | 操作 | `seal_contract` → done（28 秒），由 strategy:fixed 发起 |
| 18:40:55 | 823.4 | 主② | 事件 | `contract_sealed` [baseline] The contract is sealed: 427 verifier-owned files; the verification bundle is exported. |
| 18:40:55 | 823.4 | 主② | 操作 | `import_draft` → imported（27 秒），由 strategy:fixed 发起 |
| 18:40:56 | 823.4 | 主② | 事件 | [restoring] Importing the draft job's first implementation (132 files), without invoking an author. |
| 18:41:14 | 823.7 | 主② | 事件 | `draft_imported` [restoring] The draft job's first implementation is this job's candidate-1 (132 files, 0 left out where the verifier provides its own). It is compared next. |
| 18:41:36 | 824.0 | 主② | 操作 | `compare_behavior` → regressed（359 秒），候选 candidate-1，由 strategy:fixed 发起 |
| 18:41:36 | 824.0 | 主② | 事件 | [verifying] Comparing this candidate with the original frozen checks and source budget. |
| 18:47:35 | 830.0 | 主② | 事件 | `comparison_regressed` [verifying] The full comparison of candidate-1 found 27 failed checks, in datasets-cityscapes, datasets-lvis, engine-train-loop, eval-coco, layers-deform-conv and others (regressed). |
| 18:47:37 | 830.1 | 主② | 事件 | [controller] Controller round 1: choosing the next tool calls. |
| 18:49:50 | 832.3 | 主② | controller | 第 1 轮（applied，133 秒，4 个调用：`prepare_environment`、`capture_baseline`、`compare_behavior`、`check_installation`）：About 14 of the 27 failed checks share one signature: the compiled extension detectron2._C is not importable where the candidate's checks run (ImportError at fast_eval_api.py:7 and develop.py:16, AttributeError in nms_rotated, roi_align_rotated and pairwise_iou_rotated). The candidate's worktree was prepared only once, before the draft's files were imported, so this may be the environment and not the code; an author cannot fix that and might write needless fallbacks. Re-running the owner's recipes on the candidate, re-binding the baseline and comparing in full separates environment failures from code failures without spending a behavior repair. The installation check is the mainline's next step and shows whether the candidate's setup.py builds the extension, which the packaging repair needs. I will write the per-scope repair group next round from that evidence. |
| 18:49:50 | 832.3 | 主② | 事件 | `applied` [controller] Controller round 1: prepare_environment, capture_baseline, compare_behavior, check_installation. |
| 18:49:50 | 832.3 | 主② | 操作 | `prepare_environment` → passed（1 秒），候选 candidate-1，由 strategy:controller 发起 |
| 18:49:51 | 832.3 | 主② | 事件 | [preparing] Running the owner's preparation recipes in the candidate's worktree. |
| 18:49:52 | 832.3 | 主② | 操作 | `capture_baseline` → ready（14 秒），候选 candidate-1，由 strategy:controller 发起 |
| 18:49:52 | 832.3 | 主② | 事件 | [baseline] Capturing the original baseline in the original's worktree, unless a saved one still observes it. Validating leaf tests with repeated runs and leaf knockouts. |
| 18:50:06 | 832.5 | 主② | 操作 | `compare_behavior` → regressed（273 秒），候选 candidate-1，由 strategy:controller 发起 |
| 18:50:06 | 832.5 | 主② | 事件 | [verifying] Comparing this candidate with the original frozen checks and source budget. |
| 18:54:39 | 837.1 | 主② | 事件 | `comparison_regressed` [verifying] The full comparison of candidate-1 found 10 failed checks, in datasets-cityscapes, datasets-lvis, engine-train-loop, model-dense-detectors, model-rcnn and others (regressed). |
| 18:54:39 | 837.1 | 主② | 操作 | `check_installation` → passed（96 秒），候选 candidate-1，由 strategy:controller 发起 |
| 18:54:40 | 837.1 | 主② | 事件 | [installing] Building and checking this candidate in a fresh isolated Python environment. |
| 18:56:16 | 838.7 | 主② | 事件 | `installation_passed` [installing] The installation check of candidate-1 ended passed: 2 of 2 steps passed. |
| 18:56:18 | 838.7 | 主② | 事件 | [controller] Controller round 2: choosing the next tool calls. |
| 19:11:10 | 853.6 | 主② | 事件 | [failed] The execution worker stopped before final evidence was saved. |
| 19:11:41 | 854.1 | 主② | 事件 | [queued] Validated checkpoint accepted; resuming only unfinished stages. |
| 19:11:53 | 854.3 | 主② | 事件 | [resuming] Resuming a validated edited checkpoint. |
| 19:11:54 | 854.3 | 主② | controller | 第 2 轮（unavailable，0 秒，0 个调用：）： |
| 19:11:55 | 854.4 | 主② | 事件 | [controller] Controller round 3: choosing the next tool calls. |
| 19:14:04 | 856.5 | 主② | controller | 第 3 轮（applied，129 秒，3 个调用：`run_parallel_agents`、`compare_behavior`、`compare_behavior`）：The second comparison, made after the candidate's environment was prepared, left 10 failed checks, and none is an environment failure. Two share a ModuleNotFoundError raised in the candidate's coco.py and two more share one in meta_arch/rcnn.py. These may be the same missing module, so I give those five issues to one author instead of splitting them between scope-4 and scope-5, where two authors could write the same file differently. The five scope-6 issues (train loop, model zoo, lazy configs, packaging) go to a second author, since model zoo and packaging may share a package-data cause. Both run in one split group, which costs one behavior repair. A screen of the 10 checks follows, then the full comparison, then the mainline (installation, performance, selection, delivery) by delegation; a failed screen or comparison comes back to me. |
| 19:14:04 | 856.5 | 主② | 事件 | `applied` [controller] Controller round 3: run_parallel_agents, compare_behavior, compare_behavior then the mainline up to deliver. |
| 19:14:04 | 856.5 | 主② | 操作 | `run_parallel_agents` → done（1191 秒），候选 candidate-1，由 strategy:controller 发起 |
| 19:15:18 | 857.7 | 主② | 事件 | [workspace_agents] A parallel group (split) of 2 author sessions in implementation workspaces, 2 at a time. |
| 19:33:42 | 876.1 | 主② | 事件 | [restoring] Combining the files a parallel group's authors changed, without invoking an author. |
| 19:33:56 | 876.4 | 主② | 操作 | `compare_behavior` → regressed（134 秒），候选 candidate-4，由 strategy:controller 发起 |
| 19:33:56 | 876.4 | 主② | 事件 | [verifying] Comparing this candidate with the original frozen checks and source budget. |
| 19:34:50 | 877.3 | 主② | 事件 | `batch_queued` [verifying] A batch of 10 checks waits for a compute node as scheduler job <调度作业>. It asked for 51 minutes, 8 CPUs and 32768 MB of memory in partition <队列>, and may wait 18000 s in the queue. |
| 19:34:57 | 877.4 | 主② | 事件 | `batch_started` [verifying] Scheduler job <调度作业> (a batch of 10 checks) was seen started on a compute node about 26 s after it was submitted. |
| 19:36:10 | 878.6 | 主② | 事件 | `comparison_regressed` [verifying] The targeted comparison of candidate-4 found 2 failed checks, in packaging; 148 checks were not run (regressed). |
| 19:36:10 | 878.6 | 主② | 操作 | `compare_behavior` → not_triggered（没有执行），由 strategy:controller 发起：Its condition was not met: call 2 ended regressed, and it runs only after unverified |
| 19:36:10 | 878.6 | 主② | 操作 | `check_installation` → passed（91 秒），候选 candidate-4，由 strategy:controller 发起 |
| 19:36:11 | 878.6 | 主② | 事件 | [installing] Building and checking this candidate in a fresh isolated Python environment. |
| 19:37:42 | 880.1 | 主② | 事件 | `installation_passed` [installing] The installation check of candidate-4 ended passed: 2 of 2 steps passed. |
| 19:37:45 | 880.2 | 主② | 事件 | [controller] Controller round 4: choosing the next tool calls. |
| 19:40:28 | 882.9 | 主② | controller | 第 4 轮（applied，164 秒，4 个调用：`compare_behavior`、`run_agent`、`save_candidate`、`compare_behavior`）：Candidate-4 has only a ten-check screen: check-128 and check-129 (packaging) still fail, and the other 148 checks were never run on the merged code. A full comparison takes about five minutes and a repair is one of five left, so I compare in full first; the repair author then gets every failure of this code in its feedback. The repair names no capability, so that a regression from the merge can be mended in the same call; its instructions centre on packaging, say what the last repair changed without reaching check-129, and list the interface entries to compare with the original. Then save, a full comparison of the new candidate, and the mainline by delegation (installation, performance, selection, delivery); a failed comparison comes back to me. |
| 19:40:28 | 882.9 | 主② | 事件 | `applied` [controller] Controller round 4: compare_behavior, run_agent, save_candidate, compare_behavior then the mainline up to deliver. |
| 19:40:28 | 882.9 | 主② | 操作 | `compare_behavior` → unverified（721 秒），候选 candidate-4，由 strategy:controller 发起 |
| 19:40:28 | 882.9 | 主② | 事件 | [verifying] Comparing this candidate with the original frozen checks and source budget. |
| 19:52:29 | 894.9 | 主② | 事件 | `comparison_unverified` [verifying] The full comparison of candidate-4 found 17 failed checks, in eval-coco, layers-deform-conv, layers-nms, layers-roi-align, model-backbones and others; 3 checks were not run (unverified). |
| 19:52:31 | 895.0 | 主② | 操作 | `run_agent` → not_triggered（没有执行），由 strategy:controller 发起：Its condition was not met: call 1 ended unverified, and it runs only after regressed |
| 19:52:31 | 895.0 | 主② | 操作 | `save_candidate` → not_triggered（没有执行），由 strategy:controller 发起：Its condition was not met: call 2 ended not_triggered, and it runs only after completed |
| 19:52:31 | 895.0 | 主② | 操作 | `compare_behavior` → not_triggered（没有执行），由 strategy:controller 发起：Its condition was not met: call 3 ended not_triggered, and it runs only after done |
| 19:52:33 | 895.0 | 主② | 事件 | [controller] Controller round 5: choosing the next tool calls. |
| 19:54:31 | 897.0 | 主② | controller | 第 5 轮（applied，117 秒，10 个调用：`prepare_environment`、`capture_baseline`、`compare_behavior`、`compare_behavior`、`run_agent`、`save_candidate`、`prepare_environment`、`capture_baseline`、`compare_behavior`、`compare_behavior`）：15 of the 17 failed checks on candidate-4 carry the signature of a missing compiled extension (ImportError at develop.py and fast_eval_api.py, AttributeError in nms_rotated, roi_align_rotated, pairwise_iou_rotated), the same checks that passed on candidate-1 only after its environment was prepared; candidate-4 was never prepared, and its installation check passes. So I prepare the candidate again, re-bind the baseline and screen those 15 plus the 3 incomplete checks, without spending a repair on what is most likely the environment. If that screen shows no failure, a second screen confirms the packaging checks, and one repair restricted to packaging (check-128, check-129) follows; the new candidate is prepared again before its screen and full comparison, since a new candidate loses the built extension. A failed first screen leaves everything else not triggered for my next round. |
| 19:54:31 | 897.0 | 主② | 事件 | `applied` [controller] Controller round 5: prepare_environment, capture_baseline, compare_behavior, compare_behavior, run_agent, save_candidate and 4 more then the mainline up to deliver. |
| 19:54:31 | 897.0 | 主② | 操作 | `prepare_environment` → passed（1 秒），候选 candidate-4，由 strategy:controller 发起 |
| 19:54:31 | 897.0 | 主② | 事件 | [preparing] Running the owner's preparation recipes in the candidate's worktree. |
| 19:54:32 | 897.0 | 主② | 操作 | `capture_baseline` → ready（15 秒），候选 candidate-4，由 strategy:controller 发起 |
| 19:54:32 | 897.0 | 主② | 事件 | [baseline] Capturing the original baseline in the original's worktree, unless a saved one still observes it. Validating leaf tests with repeated runs and leaf knockouts. |
| 19:54:48 | 897.2 | 主② | 操作 | `compare_behavior` → unverified（92 秒），候选 candidate-4，由 strategy:controller 发起 |
| 19:54:48 | 897.2 | 主② | 事件 | [verifying] Comparing this candidate with the original frozen checks and source budget. |
| 19:56:19 | 898.8 | 主② | 事件 | `comparison_unverified` [verifying] The targeted comparison of candidate-4 found no failed check; 140 checks were not run (unverified). |
| 19:56:20 | 898.8 | 主② | 操作 | `compare_behavior` → regressed（83 秒），候选 candidate-4，由 strategy:controller 发起 |
| 19:56:20 | 898.8 | 主② | 事件 | [verifying] Comparing this candidate with the original frozen checks and source budget. |
| 19:57:43 | 900.2 | 主② | 事件 | `comparison_regressed` [verifying] The targeted comparison of candidate-4 found 2 failed checks, in packaging; 155 checks were not run (regressed). |
| 19:57:44 | 900.2 | 主② | 操作 | `run_agent` → completed（814 秒），候选 candidate-4，由 strategy:controller 发起 |
| 19:57:47 | 900.2 | 主② | 事件 | [refactoring] The configured agent is repairing its implementation of the selected graph. |
| 20:11:17 | 913.7 | 主② | 操作 | `save_candidate` → done（15 秒），候选 candidate-4，由 strategy:controller 发起 |
| 20:11:33 | 914.0 | 主② | 事件 | `candidate_saved` [refactoring] The drafts are saved as candidate-5. |
| 20:11:33 | 914.0 | 主② | 操作 | `prepare_environment` → passed（3 秒），候选 candidate-5，由 strategy:controller 发起 |
| 20:11:33 | 914.0 | 主② | 事件 | [preparing] Running the owner's preparation recipes in the candidate's worktree. |
| 20:11:37 | 914.1 | 主② | 操作 | `capture_baseline` → ready（17 秒），候选 candidate-5，由 strategy:controller 发起 |
| 20:11:37 | 914.1 | 主② | 事件 | [baseline] Capturing the original baseline in the original's worktree, unless a saved one still observes it. Validating leaf tests with repeated runs and leaf knockouts. |
| 20:11:54 | 914.3 | 主② | 操作 | `compare_behavior` → unverified（88 秒），候选 candidate-5，由 strategy:controller 发起 |
| 20:11:54 | 914.3 | 主② | 事件 | [verifying] Comparing this candidate with the original frozen checks and source budget. |
| 20:13:22 | 915.8 | 主② | 事件 | `comparison_unverified` [verifying] The targeted comparison of candidate-5 found no failed check; 155 checks were not run (unverified). |
| 20:13:23 | 915.8 | 主② | 操作 | `compare_behavior` → checks_passed（342 秒），候选 candidate-5，由 strategy:controller 发起 |
| 20:13:23 | 915.8 | 主② | 事件 | [verifying] Comparing this candidate with the original frozen checks and source budget. |
| 20:14:14 | 916.7 | 主② | 事件 | `batch_queued` [verifying] A batch of 195 checks waits for a compute node as scheduler job <调度作业>. It asked for 240 minutes, 8 CPUs and 32768 MB of memory in partition <队列>, and may wait 18000 s in the queue. |
| 20:14:24 | 916.8 | 主② | 事件 | `batch_started` [verifying] Scheduler job <调度作业> (a batch of 195 checks) was seen started on a compute node about 31 s after it was submitted. |
| 20:19:05 | 921.5 | 主② | 事件 | `comparison_checks_passed` [verifying] The full comparison of candidate-5 found no failed check (checks_passed). |
| 20:19:06 | 921.5 | 主② | 操作 | `check_installation` → passed（96 秒），候选 candidate-5，由 strategy:controller 发起 |
| 20:19:07 | 921.6 | 主② | 事件 | [installing] Building and checking this candidate in a fresh isolated Python environment. |
| 20:20:41 | 923.1 | 主② | 事件 | `installation_passed` [installing] The installation check of candidate-5 ended passed: 2 of 2 steps passed. |
| 20:20:42 | 923.1 | 主② | 操作 | `compare_performance` → failed（5362 秒），候选 candidate-5，由 strategy:controller 发起 |
| 20:20:43 | 923.2 | 主② | 事件 | [performance] Measuring this candidate against the original on the frozen performance benchmarks, both in one batch on one machine. |
| 20:21:08 | 923.6 | 主② | 事件 | `batch_queued` [performance] A performance measurement waits for a compute node as scheduler job <调度作业>. It asked for 240 minutes, 8 CPUs and 32768 MB of memory in partition <队列>, and may wait 18000 s in the queue. |
| 20:21:12 | 923.6 | 主② | 事件 | `batch_started` [performance] Scheduler job <调度作业> (a performance measurement) was seen started on a compute node about 24 s after it was submitted. |
| 21:50:04 | 1012.5 | 主② | 事件 | `performance_failed` [performance] The performance comparison of candidate-5 ended failed: 5 of 582 criteria failed, 5 of them slower than the owner allows. |
| 21:50:07 | 1012.6 | 主② | 事件 | [controller] Controller round 6: choosing the next tool calls. |
| 21:51:26 | 1013.9 | 主② | controller | 第 6 轮（applied，79 秒，6 个调用：`run_parallel_agents`、`prepare_environment`、`capture_baseline`、`compare_behavior`、`check_installation`、`compare_performance`）：Candidate-5 is behavior accepted (full comparison passed, installation passed) and its performance measurement failed 5 of 582 benchmarks, in five capabilities with separate files (layers-deform-conv 114.7% slower, datasets-coco, layers-mask-ops, data-detection-utils, engine-distributed). Two performance repairs are left and a split group costs one however many authors it has, so one focused author per capability repairs them side by side; three of the five are close to their allowance, so those authors are told to change nothing if the source shows no extra work. The merged candidate loses the built extension, so I prepare the candidate's environment and re-bind the baseline before the full comparison, then installation and the performance measurement, each only after the one before passed. The mainline then selects and delivers by delegation; a broken behavior check or a failed measurement comes back to me (restore candidate-5 or the second repair). |
| 21:51:26 | 1013.9 | 主② | 事件 | `applied` [controller] Controller round 6: run_parallel_agents, prepare_environment, capture_baseline, compare_behavior, check_installation, compare_performance then the mainline up to deliver. |
| 21:54:18 | 1016.7 | 主② | 事件 | [workspace_agents] A parallel group (split) of 5 author sessions in implementation workspaces, 4 at a time. |

## 6. 模型会话（每次调用）

“位置”是这次调用在作业目录里的位置：`design/round-N/<叶子>` 是第 N 轮的测试设计者，`design/review…` 是评审者，`design/call-2/…` 是测试设计第二遍里的同类会话，`authoring` 是作者，`implementation-workspaces/workspace-…/authoring` 是并行组里的一个作者，`controller/NNNN` 是 controller 的第 N 轮。没有结束时间的是批处理作业到时那一刻还在跑的会话。每个会话逐步的记录（每条命令和输出）不在这份文件里，在运行目录的 `model-calls/<编号>/events.jsonl`。

| 开始 | 结束 | 第几分钟 | 作业 | 角色 | 位置 | 秒 | 轮数 | 美元 | 输入 token（含缓存） | 输出 token | 记录编号 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 05:22:53 | 05:23:01 | 25.3 | – | 试调：作者 | 试调用的临时目录 | 8 | 2 | 0.07 | 14,191 | 153 | `3062f147` |
| 05:23:01 | 05:23:08 | 25.5 | – | 试调：controller | 试调用的临时目录 | 6 | 1 | 0.07 | 6,601 | 269 | `a6f646f9` |
| 05:23:08 | 05:23:18 | 25.6 | – | 试调：测试设计者 | 试调用的临时目录 | 10 | 2 | 0.09 | 13,977 | 412 | `bbb79349` |
| 05:35:17 | 05:35:24 | 37.7 | – | 试调：作者 | 试调用的临时目录 | 7 | 2 | 0.03 | 14,186 | 152 | `250e7e94` |
| 05:35:25 | 05:35:32 | 37.9 | – | 试调：controller | 试调用的临时目录 | 7 | 1 | 0.03 | 6,600 | 264 | `bdabdb44` |
| 05:35:34 | 05:35:45 | 38.0 | – | 试调：测试设计者 | 试调用的临时目录 | 11 | 2 | 0.05 | 14,029 | 475 | `e45de40d` |
| 05:40:27 | 05:43:15 | 42.9 | 草稿① | controller | controller/0001 | 168 | 4 | 1.74 | 208,342 | 15,330 | `f8d6c4e0` |
| 05:45:51 | 06:33:45 | 48.3 | 草稿① | 作者 | implementation-workspaces/workspace-91a504e7efd5/authoring | 2874 | 63 | 22.29 | 16,100,236 | 260,116 | `04da98f9` |
| 05:45:51 | 06:19:31 | 48.3 | 草稿① | 作者 | implementation-workspaces/workspace-6914e749adfc/authoring | 2019 | 66 | 17.93 | 14,091,041 | 199,533 | `d4b00742` |
| 05:45:51 | 06:14:44 | 48.3 | 草稿① | 作者 | implementation-workspaces/workspace-f31347e53509/authoring | 1733 | 66 | 17.10 | 14,074,243 | 176,203 | `a76a1284` |
| 05:45:51 | 06:15:56 | 48.3 | 草稿① | 作者 | implementation-workspaces/workspace-b5e41ef3f853/authoring | 1804 | 64 | 17.25 | 14,494,439 | 177,688 | `1410ee95` |
| 05:46:57 | 05:57:17 | 49.4 | 主① | 测试设计者 | design/round-1/data_transforms_8967f4a5 | 620 | 22 | 5.33 | 1,754,547 | 56,445 | `777ebf3c` |
| 05:46:57 | 05:57:16 | 49.4 | 主① | 测试设计者 | design/round-1/eval_framework_4544602b | 619 | 15 | 3.86 | 808,576 | 50,159 | `038552da` |
| 05:46:57 | 05:57:27 | 49.4 | 主① | 测试设计者 | design/round-1/model_cascade_rcnn_d2d8ceb9 | 630 | 14 | 4.51 | 837,918 | 60,474 | `35827913` |
| 05:46:57 | 05:52:30 | 49.4 | 主① | 测试设计者 | design/round-1/datasets_coco_2dbec6a3 | 334 | 13 | 1.93 | 553,459 | 18,523 | `2f46c510` |
| 05:46:57 | 05:57:09 | 49.4 | 主① | 测试设计者 | design/round-1/model_mask_head_b87bf214 | 613 | 17 | 4.13 | 1,078,706 | 52,153 | `3831ffa8` |
| 05:46:57 | 05:54:28 | 49.4 | 主① | 测试设计者 | design/round-1/model_zoo_b9ca42f9 | 451 | 14 | 2.85 | 656,465 | 34,282 | `a6a0747f` |
| 05:46:57 | 05:51:53 | 49.4 | 主① | 测试设计者 | design/round-1/checkpointing | 296 | 12 | 2.01 | 511,693 | 20,484 | `bc5ac829` |
| 05:46:57 | 05:54:07 | 49.4 | 主① | 测试设计者 | design/round-1/datasets_registry_04d0fc24 | 431 | 13 | 3.64 | 796,060 | 40,170 | `836a47f3` |
| 05:46:57 | 05:57:46 | 49.4 | 主① | 测试设计者 | design/round-1/model_rotated_rcnn_aa4471c0 | 649 | 19 | 4.55 | 1,223,301 | 54,392 | `a11697b2` |
| 05:46:57 | 05:56:02 | 49.4 | 主① | 测试设计者 | design/round-1/zoo_lazy_configs_90d84a50 | 545 | 20 | 4.13 | 1,278,890 | 44,384 | `927fe36e` |
| 05:46:57 | 05:55:23 | 49.4 | 主① | 测试设计者 | design/round-1/layers_mask_ops_b69e7f4f | 506 | 14 | 3.76 | 776,727 | 46,776 | `6e6cd9f0` |
| 05:46:57 | 05:54:59 | 49.4 | 主① | 测试设计者 | design/round-1/model_rcnn_beac6e6a | 482 | 17 | 3.78 | 1,040,798 | 42,487 | `88c151d6` |
| 05:46:57 | 05:56:03 | 49.4 | 主① | 测试设计者 | design/round-1/packaging | 546 | 13 | 3.67 | 775,270 | 42,486 | `93a5fdb1` |
| 05:46:57 | 05:57:21 | 49.4 | 主① | 测试设计者 | design/round-1/engine_train_loop_cab52fc9 | 624 | 16 | 4.88 | 1,127,052 | 57,895 | `d3d6a3f7` |
| 05:46:57 | 05:56:48 | 49.4 | 主① | 测试设计者 | design/round-1/export_torchscript_ceee9d66 | 591 | 19 | 3.92 | 1,002,985 | 46,384 | `8efd1558` |
| 05:46:57 | 05:53:42 | 49.4 | 主① | 测试设计者 | design/round-1/engine_distributed_c5788eb2 | 404 | 8 | 1.77 | 295,737 | 20,765 | `2931590a` |
| 05:46:57 | 05:54:55 | 49.4 | 主① | 测试设计者 | design/round-1/datasets_pascal_voc_d5ffa80e | 478 | 13 | 3.39 | 596,524 | 43,855 | `ce225c2b` |
| 05:46:57 | 05:55:03 | 49.4 | 主① | 测试设计者 | design/round-1/datasets_lvis_770ba881 | 485 | 12 | 3.27 | 642,721 | 42,586 | `169a03c8` |
| 05:46:57 | 05:54:11 | 49.4 | 主① | 测试设计者 | design/round-1/datasets_cityscapes_5c6b2f0e | 434 | 11 | 3.24 | 504,804 | 41,616 | `06c70f6f` |
| 05:46:57 | 05:58:10 | 49.4 | 主① | 测试设计者 | design/round-1/model_keypoint_head_9b5e1e18 | 672 | 17 | 4.73 | 1,240,292 | 58,686 | `e6cb79db` |
| 05:46:57 | 05:52:23 | 49.4 | 主① | 测试设计者 | design/round-1/layers_losses_0c70c173 | 326 | 10 | 0.98 | 286,132 | 8,816 | `3c554149` |
| 05:46:57 | 05:56:20 | 49.4 | 主① | 测试设计者 | design/round-1/model_dense_detectors_4bd36534 | 563 | 16 | 4.40 | 1,115,432 | 51,676 | `89d89d97` |
| 05:46:57 | 05:53:38 | 49.4 | 主① | 测试设计者 | design/round-1/data_loading_bc917fe4 | 401 | 16 | 3.27 | 922,661 | 33,904 | `35ecffb8` |
| 05:46:57 | 05:57:21 | 49.4 | 主① | 测试设计者 | design/round-1/model_semantic_panoptic_9b3bd7f2 | 623 | 20 | 4.83 | 1,377,620 | 58,791 | `f19f9bdf` |
| 05:46:57 | 05:56:31 | 49.4 | 主① | 测试设计者 | design/round-1/utils_foundation_688a2f7c | 574 | 14 | 4.00 | 893,023 | 49,830 | `96306ac3` |
| 05:46:57 | 05:56:57 | 49.4 | 主① | 测试设计者 | design/round-1/engine_defaults_cb41ff03 | 599 | 17 | 4.72 | 1,301,796 | 53,770 | `89f51438` |
| 05:46:57 | 05:52:38 | 49.4 | 主① | 测试设计者 | design/round-1/data_detection_utils_ab187b1b | 340 | 12 | 2.41 | 528,459 | 27,071 | `2a2fd8b5` |
| 05:46:57 | 05:51:50 | 49.4 | 主① | 测试设计者 | design/round-1/config_lazy_c0cc0529 | 293 | 10 | 1.84 | 420,731 | 19,078 | `388cdb36` |
| 05:46:57 | 05:55:13 | 49.4 | 主① | 测试设计者 | design/round-1/eval_coco_c7511481 | 496 | 24 | 4.20 | 1,359,294 | 45,960 | `019d53ba` |
| 05:46:57 | 05:50:49 | 49.4 | 主① | 测试设计者 | design/round-1/data_catalog_4b9d42d1 | 231 | 10 | 1.28 | 334,304 | 13,009 | `31d3d533` |
| 05:46:57 | 05:49:12 | 49.4 | 主① | 测试设计者 | design/round-1/layers_deform_conv_2e904f28 | 134 | 7 | 1.01 | 213,124 | 9,142 | `71b27cc0` |
| 05:46:58 | 05:51:17 | 49.4 | 主① | 测试设计者 | design/round-1/config_yacs_dac9f918 | 259 | 9 | 1.58 | 321,835 | 15,950 | `1a93d716` |
| 05:49:17 | 05:53:37 | 51.7 | 主① | 测试设计者 | design/round-1/layers_nms_e3260776 | 260 | 12 | 1.19 | 362,538 | 10,833 | `ab0a49de` |
| 05:50:56 | 05:54:51 | 53.4 | 主① | 测试设计者 | design/round-1/layers_norm_blocks_f29237d9 | 235 | 11 | 1.81 | 420,042 | 19,155 | `2c43a603` |
| 05:51:24 | 06:00:25 | 53.8 | 主① | 测试设计者 | design/round-1/layers_roi_align_74ce8595 | 541 | 16 | 4.21 | 1,106,780 | 50,443 | `93059daf` |
| 05:51:56 | 05:55:39 | 54.4 | 主① | 测试设计者 | design/round-1/layers_wrappers_89caf8f5 | 223 | 11 | 1.49 | 346,480 | 16,176 | `6d8e1bde` |
| 05:51:58 | 05:56:55 | 54.4 | 主① | 测试设计者 | design/round-1/model_anchor_generator_1426eeeb | 297 | 11 | 1.85 | 467,822 | 18,996 | `97db1f29` |
| 05:52:28 | 05:56:46 | 54.9 | 主① | 测试设计者 | design/round-1/model_backbones_a74c70cc | 258 | 12 | 1.93 | 543,650 | 17,758 | `6ad36103` |
| 05:52:35 | 05:54:50 | 55.0 | 主① | 测试设计者 | design/round-1/model_box_regression_c9525272 | 134 | 10 | 1.09 | 312,796 | 8,470 | `26e30f3e` |
| 05:52:43 | 05:54:30 | 55.2 | 主① | 测试设计者 | design/round-1/model_matcher_sampling_bc2ea027 | 107 | 7 | 0.84 | 191,443 | 7,152 | `a0b3515c` |
| 05:53:42 | 05:57:08 | 56.1 | 主① | 测试设计者 | design/round-1/model_poolers_b90577b2 | 205 | 10 | 1.27 | 312,812 | 13,008 | `7c1a342f` |
| 05:53:44 | 05:58:46 | 56.2 | 主① | 测试设计者 | design/round-1/model_proposal_generators_0c431779 | 303 | 14 | 2.46 | 638,182 | 25,499 | `945dd387` |
| 05:53:47 | 05:58:02 | 56.2 | 主① | 测试设计者 | design/round-1/model_roi_heads_0dc03ed6 | 255 | 15 | 2.60 | 840,739 | 23,226 | `b2022a01` |
| 05:54:13 | 05:59:34 | 56.7 | 主① | 测试设计者 | design/round-1/solver | 321 | 13 | 2.02 | 523,409 | 21,880 | `f0979231` |
| 05:54:17 | 05:56:38 | 56.7 | 主① | 测试设计者 | design/round-1/struct_boxes_a89c21d9 | 141 | 8 | 1.26 | 295,405 | 10,904 | `99ebc99c` |
| 05:54:34 | 05:57:25 | 57.0 | 主① | 测试设计者 | design/round-1/struct_image_list_5bb71e68 | 171 | 9 | 1.20 | 272,312 | 12,300 | `3a969717` |
| 05:54:36 | 05:59:15 | 57.0 | 主① | 测试设计者 | design/round-1/struct_instances_8571c87b | 279 | 15 | 1.85 | 556,377 | 20,274 | `2c130813` |
| 05:54:55 | 05:57:38 | 57.4 | 主① | 测试设计者 | design/round-1/struct_keypoints_5ee0bebe | 163 | 8 | 1.22 | 269,707 | 11,545 | `23707871` |
| 05:54:57 | 05:59:14 | 57.4 | 主① | 测试设计者 | design/round-1/struct_masks_85bbcc53 | 257 | 11 | 1.88 | 471,535 | 19,153 | `6d21fa6a` |
| 05:55:00 | 05:58:48 | 57.4 | 主① | 测试设计者 | design/round-1/struct_rotated_boxes_9f751aca | 228 | 10 | 1.50 | 371,420 | 15,154 | `45660f6a` |
| 05:55:04 | 05:57:36 | 57.5 | 主① | 测试设计者 | design/round-1/utils_collect_env_40df2a68 | 153 | 8 | 0.97 | 228,119 | 8,942 | `cf71e465` |
| 05:55:08 | 05:59:17 | 57.6 | 主① | 测试设计者 | design/round-1/utils_events_84e15e87 | 249 | 11 | 2.00 | 509,348 | 20,650 | `36c38e5e` |
| 05:55:18 | 06:02:36 | 57.7 | 主① | 测试设计者 | design/round-1/utils_logging_a1ff81c1 | 437 | 16 | 3.16 | 805,763 | 39,727 | `a501da7d` |
| 05:55:29 | 06:00:09 | 57.9 | 主① | 测试设计者 | design/round-1/utils_testing_1cb15057 | 280 | 16 | 2.14 | 752,588 | 21,124 | `6f90f05b` |
| 06:14:47 | 07:00:48 | 77.2 | 草稿① | 作者 | implementation-workspaces/workspace-ce0bac2f81f5/authoring | 2761 | 87 | 22.34 | 22,235,718 | 226,590 | `0ca561ee` |
| 07:01:54 | 07:38:40 | 124.3 | 草稿① | 作者 | authoring | 2206 | 88 | 20.76 | 22,701,940 | 191,378 | `9beffc00` |
| 07:40:42 | 07:43:22 | 163.1 | 草稿① | controller | controller/0002 | 160 | 6 | 2.32 | 401,097 | 15,549 | `6ebbd123` |
| 07:44:07 | 07:52:51 | 166.6 | 草稿① | 作者 | authoring | 525 | 28 | 4.42 | 2,123,158 | 41,213 | `f579bcb2` |
| 07:54:25 | 07:56:35 | 176.9 | 草稿① | controller | controller/0003 | 130 | 6 | 1.97 | 352,595 | 12,489 | `eaffddbc` |
| 07:57:21 | 08:14:56 | 179.8 | 草稿① | 作者 | authoring | 1054 | 56 | 9.44 | 7,773,825 | 86,153 | `342c60d0` |
| 08:16:06 | 08:18:25 | 198.5 | 草稿① | controller | controller/0004 | 139 | 8 | 2.02 | 506,999 | 12,269 | `6c8ce79a` |
| 08:19:36 | – | 202.0 | 草稿① | 作者 | implementation-workspaces/workspace-2b34467b5d4c/authoring | 0 | None | 0.00 | 0 | 0 | `d8409b6a` |
| 08:19:36 | – | 202.0 | 草稿① | 作者 | implementation-workspaces/workspace-a2d9a9ddc532/authoring | 0 | None | 0.00 | 0 | 0 | `0e24176f` |
| 08:22:33 | 08:22:41 | 205.0 | – | 试调：作者 | 试调用的临时目录 | 8 | 2 | 0.03 | 14,183 | 162 | `8359afc6` |
| 08:22:41 | 08:22:48 | 205.1 | – | 试调：controller | 试调用的临时目录 | 7 | 1 | 0.03 | 6,599 | 253 | `5aa05349` |
| 08:22:49 | 08:22:59 | 205.3 | – | 试调：测试设计者 | 试调用的临时目录 | 10 | 2 | 0.05 | 13,950 | 408 | `cde7f1e8` |
| 08:25:35 | 08:28:50 | 208.0 | 草稿② | controller | controller/0001 | 195 | 4 | 2.03 | 216,080 | 19,309 | `ec944e13` |
| 08:31:55 | 09:05:58 | 214.4 | 草稿② | 作者 | implementation-workspaces/workspace-f888ed4e7ee8/authoring | 2043 | 61 | 18.00 | 13,710,366 | 192,848 | `641813e2` |
| 08:31:55 | 08:59:59 | 214.4 | 草稿② | 作者 | implementation-workspaces/workspace-4317c4fc64e4/authoring | 1683 | 77 | 16.79 | 15,652,924 | 170,230 | `ad38e556` |
| 08:31:56 | 09:05:40 | 214.4 | 草稿② | 作者 | implementation-workspaces/workspace-545fc6bf063b/authoring | 2024 | 82 | 20.08 | 18,496,938 | 210,213 | `a4d6d710` |
| 08:31:56 | 09:01:27 | 214.4 | 草稿② | 作者 | implementation-workspaces/workspace-31e68186c1cd/authoring | 1771 | 73 | 17.85 | 16,615,158 | 176,334 | `b7f2c59f` |
| 08:32:22 | 08:40:17 | 214.8 | 主② | 测试设计者 | design/round-1/utils_foundation_688a2f7c | 475 | 16 | 3.68 | 897,933 | 44,516 | `df850328` |
| 08:32:22 | 08:41:59 | 214.8 | 主② | 测试设计者 | design/round-1/eval_framework_4544602b | 576 | 14 | 3.53 | 740,876 | 45,281 | `ddf4b931` |
| 08:32:22 | 08:40:38 | 214.8 | 主② | 测试设计者 | design/round-1/model_semantic_panoptic_9b3bd7f2 | 496 | 15 | 4.11 | 962,703 | 48,634 | `c90798b3` |
| 08:32:22 | 08:42:27 | 214.8 | 主② | 测试设计者 | design/round-1/export_torchscript_ceee9d66 | 604 | 16 | 4.40 | 1,010,589 | 50,552 | `99fe7257` |
| 08:32:22 | 08:41:27 | 214.8 | 主② | 测试设计者 | design/round-1/packaging | 545 | 16 | 3.67 | 908,266 | 45,802 | `40d51610` |
| 08:32:22 | 08:41:15 | 214.8 | 主② | 测试设计者 | design/round-1/data_loading_bc917fe4 | 532 | 13 | 2.60 | 693,395 | 24,392 | `bef6a368` |
| 08:32:23 | 08:37:17 | 214.8 | 主② | 测试设计者 | design/round-1/datasets_coco_2dbec6a3 | 295 | 15 | 1.84 | 605,079 | 17,602 | `29dc89c3` |
| 08:32:23 | 08:43:53 | 214.8 | 主② | 测试设计者 | design/round-1/model_keypoint_head_9b5e1e18 | 690 | 20 | 4.84 | 1,320,813 | 62,920 | `2be7b5de` |
| 08:32:23 | 08:40:55 | 214.8 | 主② | 测试设计者 | design/round-1/layers_mask_ops_b69e7f4f | 512 | 13 | 3.73 | 751,556 | 45,049 | `866d7eab` |
| 08:32:23 | 08:38:20 | 214.8 | 主② | 测试设计者 | design/round-1/datasets_registry_04d0fc24 | 357 | 14 | 3.17 | 830,164 | 33,228 | `641fd0a0` |
| 08:32:23 | 08:40:24 | 214.8 | 主② | 测试设计者 | design/round-1/engine_defaults_cb41ff03 | 481 | 15 | 3.67 | 950,554 | 40,109 | `7c0bbfd3` |
| 08:32:23 | 08:41:39 | 214.8 | 主② | 测试设计者 | design/round-1/engine_train_loop_cab52fc9 | 556 | 17 | 5.07 | 1,400,441 | 57,153 | `acca8471` |
| 08:32:23 | 08:38:32 | 214.8 | 主② | 测试设计者 | design/round-1/config_lazy_c0cc0529 | 369 | 15 | 2.48 | 715,171 | 27,683 | `fd9733ae` |
| 08:32:23 | 08:40:05 | 214.8 | 主② | 测试设计者 | design/round-1/datasets_pascal_voc_d5ffa80e | 462 | 14 | 3.19 | 653,293 | 41,351 | `52e9b620` |
| 08:32:23 | 08:42:16 | 214.8 | 主② | 测试设计者 | design/round-1/config_yacs_dac9f918 | 593 | 24 | 4.94 | 1,406,240 | 59,759 | `cdd73a91` |
| 08:32:23 | 08:43:31 | 214.8 | 主② | 测试设计者 | design/round-1/model_cascade_rcnn_d2d8ceb9 | 668 | 22 | 5.24 | 1,497,242 | 64,277 | `2348aa08` |
| 08:32:23 | 08:41:14 | 214.8 | 主② | 测试设计者 | design/round-1/model_dense_detectors_4bd36534 | 531 | 23 | 4.07 | 1,473,631 | 46,409 | `b9d7cdbc` |
| 08:32:23 | 08:36:51 | 214.8 | 主② | 测试设计者 | design/round-1/data_detection_utils_ab187b1b | 268 | 12 | 2.08 | 513,251 | 21,958 | `60f13a64` |
| 08:32:23 | 08:42:31 | 214.8 | 主② | 测试设计者 | design/round-1/datasets_lvis_770ba881 | 608 | 12 | 3.98 | 709,967 | 52,357 | `a64180a1` |
| 08:32:23 | 08:42:06 | 214.8 | 主② | 测试设计者 | design/round-1/datasets_cityscapes_5c6b2f0e | 583 | 15 | 3.89 | 903,884 | 49,831 | `c6dd31fd` |
| 08:32:23 | 08:42:19 | 214.8 | 主② | 测试设计者 | design/round-1/model_rotated_rcnn_aa4471c0 | 596 | 19 | 4.45 | 1,114,348 | 54,494 | `95c62d51` |
| 08:32:23 | 08:40:18 | 214.8 | 主② | 测试设计者 | design/round-1/model_rcnn_beac6e6a | 475 | 18 | 3.82 | 1,145,278 | 42,872 | `eeb30277` |
| 08:32:23 | 08:37:05 | 214.8 | 主② | 测试设计者 | design/round-1/checkpointing | 282 | 11 | 2.14 | 479,738 | 23,346 | `8e607d1d` |
| 08:32:23 | 08:41:24 | 214.8 | 主② | 测试设计者 | design/round-1/engine_distributed_c5788eb2 | 541 | 14 | 2.63 | 579,276 | 32,647 | `f69f51b0` |
| 08:32:23 | 08:34:48 | 214.8 | 主② | 测试设计者 | design/round-1/layers_deform_conv_2e904f28 | 145 | 6 | 1.13 | 192,626 | 10,841 | `486c4422` |
| 08:32:23 | 08:42:29 | 214.8 | 主② | 测试设计者 | design/round-1/model_mask_head_b87bf214 | 606 | 18 | 4.10 | 940,602 | 50,833 | `2329b598` |
| 08:32:23 | 08:41:15 | 214.8 | 主② | 测试设计者 | design/round-1/eval_coco_c7511481 | 532 | 20 | 4.57 | 1,277,783 | 53,428 | `3b9931f7` |
| 08:32:23 | 08:42:34 | 214.8 | 主② | 测试设计者 | design/round-1/data_transforms_8967f4a5 | 610 | 19 | 5.55 | 1,642,197 | 59,777 | `51d90ae7` |
| 08:32:23 | 08:42:15 | 214.8 | 主② | 测试设计者 | design/round-1/model_zoo_b9ca42f9 | 591 | 17 | 3.23 | 884,189 | 38,802 | `96b52931` |
| 08:32:23 | 08:34:19 | 214.8 | 主② | 测试设计者 | design/round-1/layers_losses_0c70c173 | 115 | 7 | 0.72 | 176,615 | 5,671 | `35667686` |
| 08:32:23 | 08:35:27 | 214.8 | 主② | 测试设计者 | design/round-1/data_catalog_4b9d42d1 | 183 | 9 | 1.26 | 287,816 | 13,194 | `ea181610` |
| 08:32:23 | 08:40:45 | 214.8 | 主② | 测试设计者 | design/round-1/zoo_lazy_configs_90d84a50 | 501 | 18 | 4.32 | 1,215,698 | 45,518 | `cc07b691` |
| 08:34:24 | 08:40:03 | 216.8 | 主② | 测试设计者 | design/round-1/layers_nms_e3260776 | 339 | 10 | 1.01 | 271,190 | 8,558 | `fde559cb` |
| 08:34:53 | 08:43:42 | 217.3 | 主② | 测试设计者 | design/round-1/layers_norm_blocks_f29237d9 | 529 | 20 | 2.99 | 953,342 | 34,688 | `3f605d56` |
| 08:35:32 | 08:46:12 | 218.0 | 主② | 测试设计者 | design/round-1/layers_roi_align_74ce8595 | 640 | 18 | 4.83 | 1,316,064 | 60,169 | `89aa7854` |
| 08:36:56 | 08:41:13 | 219.4 | 主② | 测试设计者 | design/round-1/layers_wrappers_89caf8f5 | 256 | 9 | 1.39 | 291,532 | 15,278 | `84555fb4` |
| 08:37:10 | 08:40:02 | 219.6 | 主② | 测试设计者 | design/round-1/model_anchor_generator_1426eeeb | 172 | 9 | 1.42 | 295,362 | 14,258 | `aa0e6e9e` |
| 08:37:23 | 08:43:02 | 219.8 | 主② | 测试设计者 | design/round-1/model_backbones_a74c70cc | 339 | 15 | 2.55 | 799,511 | 25,591 | `b73cce33` |
| 08:38:25 | 08:40:36 | 220.9 | 主② | 测试设计者 | design/round-1/model_box_regression_c9525272 | 132 | 8 | 1.02 | 227,320 | 8,014 | `ba26cd36` |
| 08:38:37 | 08:41:12 | 221.1 | 主② | 测试设计者 | design/round-1/model_matcher_sampling_bc2ea027 | 155 | 7 | 0.83 | 185,638 | 7,542 | `aec89422` |
| 08:40:09 | 08:43:06 | 222.6 | 主② | 测试设计者 | design/round-1/model_poolers_b90577b2 | 177 | 10 | 1.35 | 306,016 | 14,133 | `f64918c8` |
| 08:40:09 | 08:44:57 | 222.6 | 主② | 测试设计者 | design/round-1/model_proposal_generators_0c431779 | 288 | 16 | 2.51 | 662,351 | 26,573 | `9a7c0354` |
| 08:40:12 | 08:45:49 | 222.6 | 主② | 测试设计者 | design/round-1/model_roi_heads_0dc03ed6 | 337 | 19 | 3.33 | 1,164,820 | 29,991 | `c79bbaee` |
| 08:40:23 | 08:45:48 | 222.8 | 主② | 测试设计者 | design/round-1/solver | 325 | 15 | 2.40 | 577,864 | 27,657 | `e2fa26cd` |
| 08:40:24 | 08:42:52 | 222.8 | 主② | 测试设计者 | design/round-1/struct_boxes_a89c21d9 | 148 | 7 | 1.24 | 247,135 | 11,036 | `5a82cfe3` |
| 08:40:30 | 08:43:26 | 222.9 | 主② | 测试设计者 | design/round-1/struct_image_list_5bb71e68 | 176 | 9 | 1.25 | 275,818 | 13,537 | `c092a383` |
| 08:40:42 | 08:43:11 | 223.1 | 主② | 测试设计者 | design/round-1/struct_instances_8571c87b | 149 | 7 | 1.09 | 205,946 | 11,150 | `cd6b57ca` |
| 08:40:44 | 08:43:22 | 223.2 | 主② | 测试设计者 | design/round-1/struct_keypoints_5ee0bebe | 158 | 8 | 1.14 | 252,463 | 11,146 | `15a79386` |
| 08:40:51 | 08:44:27 | 223.3 | 主② | 测试设计者 | design/round-1/struct_masks_85bbcc53 | 216 | 10 | 1.71 | 417,361 | 15,480 | `59399615` |
| 08:41:01 | 08:44:41 | 223.5 | 主② | 测试设计者 | design/round-1/struct_rotated_boxes_9f751aca | 220 | 11 | 1.41 | 393,665 | 13,559 | `eb030896` |
| 08:41:17 | 08:43:15 | 223.7 | 主② | 测试设计者 | design/round-1/utils_collect_env_40df2a68 | 118 | 7 | 0.92 | 201,650 | 7,721 | `7470ae64` |
| 08:41:18 | 08:48:09 | 223.7 | 主② | 测试设计者 | design/round-1/utils_events_84e15e87 | 411 | 13 | 2.18 | 545,667 | 23,809 | `5cbaf965` |
| 08:41:19 | 08:48:06 | 223.8 | 主② | 测试设计者 | design/round-1/utils_logging_a1ff81c1 | 407 | 11 | 2.98 | 557,767 | 36,969 | `4c2f9105` |
| 08:41:20 | 08:44:20 | 223.8 | 主② | 测试设计者 | design/round-1/utils_testing_1cb15057 | 180 | 12 | 1.56 | 482,677 | 14,050 | `b1470960` |
| 09:00:03 | 09:36:37 | 242.5 | 草稿② | 作者 | implementation-workspaces/workspace-ed1411aba51f/authoring | 2194 | 78 | 22.68 | 21,160,948 | 235,260 | `b5ce1ef1` |
| 09:01:29 | 09:28:41 | 243.9 | 草稿② | 作者 | implementation-workspaces/workspace-44c0e53109e8/authoring | 1632 | 78 | 17.13 | 15,711,435 | 165,222 | `6778eb88` |
| 09:38:00 | 10:08:22 | 280.4 | 草稿② | 作者 | authoring | 1822 | 81 | 12.08 | 13,639,722 | 95,355 | `07571ce1` |
| 10:10:21 | 10:11:28 | 312.8 | 草稿② | controller | controller/0002 | 67 | 6 | 1.78 | 298,647 | 6,119 | `a0e6d7bc` |
| 12:08:47 | 12:14:54 | 431.2 | 主② | 测试设计者 | design/round-2/datasets_registry_04d0fc24 | 367 | 14 | 3.19 | 725,360 | 35,380 | `45aae9d6` |
| 12:08:47 | 12:13:14 | 431.2 | 主② | 测试设计者 | design/round-2/layers_roi_align_74ce8595 | 268 | 11 | 1.97 | 480,084 | 19,453 | `405f6948` |
| 12:08:47 | 12:11:55 | 431.2 | 主② | 测试设计者 | design/round-2/model_box_regression_c9525272 | 188 | 9 | 1.83 | 344,748 | 16,799 | `294dc84c` |
| 12:08:47 | 12:16:48 | 431.2 | 主② | 测试设计者 | design/round-2/datasets_cityscapes_5c6b2f0e | 481 | 18 | 3.35 | 1,009,782 | 36,553 | `7aa33af7` |
| 12:35:06 | 12:37:49 | 457.5 | 主② | 测试评审者 | design/review/9 | 163 | 13 | 2.00 | 497,128 | 14,931 | `3bdf0985` |
| 12:35:06 | 12:39:06 | 457.5 | 主② | 测试评审者 | design/review/18 | 240 | 14 | 2.43 | 569,364 | 22,205 | `97b269a6` |
| 12:35:06 | 12:38:00 | 457.5 | 主② | 测试评审者 | design/review/16 | 174 | 14 | 2.31 | 686,823 | 14,632 | `daf97c75` |
| 12:35:06 | 12:38:14 | 457.5 | 主② | 测试评审者 | design/review/11 | 187 | 16 | 2.41 | 418,218 | 17,793 | `370883f3` |
| 12:35:06 | 12:39:03 | 457.5 | 主② | 测试评审者 | design/review/7 | 237 | 14 | 2.89 | 485,907 | 22,021 | `4d618241` |
| 12:35:06 | 12:38:23 | 457.5 | 主② | 测试评审者 | design/review/2 | 197 | 12 | 2.28 | 487,540 | 17,887 | `a9bc1b39` |
| 12:35:06 | 12:37:35 | 457.5 | 主② | 测试评审者 | design/review/5 | 149 | 17 | 2.15 | 438,633 | 13,202 | `99132b0f` |
| 12:35:06 | 12:38:17 | 457.5 | 主② | 测试评审者 | design/review/23 | 191 | 14 | 2.07 | 421,357 | 16,853 | `7b233f75` |
| 12:35:06 | 12:36:51 | 457.5 | 主② | 测试评审者 | design/review/26 | 105 | 11 | 1.47 | 304,923 | 8,825 | `c2cc3e29` |
| 12:35:06 | 12:39:04 | 457.5 | 主② | 测试评审者 | design/review/4 | 237 | 17 | 2.78 | 519,732 | 22,558 | `9f9da7b2` |
| 12:35:06 | 12:39:37 | 457.5 | 主② | 测试评审者 | design/review/14 | 271 | 25 | 3.58 | 1,274,841 | 24,264 | `5d321a8e` |
| 12:35:06 | 12:38:19 | 457.5 | 主② | 测试评审者 | design/review/15 | 192 | 15 | 2.01 | 257,551 | 18,430 | `858256d5` |
| 12:35:06 | 12:41:43 | 457.5 | 主② | 测试评审者 | design/review/20 | 397 | 22 | 3.76 | 1,071,678 | 34,822 | `4f2c792d` |
| 12:35:06 | 12:39:09 | 457.5 | 主② | 测试评审者 | design/review/22 | 243 | 22 | 3.19 | 1,031,393 | 21,104 | `048ec9d8` |
| 12:35:06 | 12:38:18 | 457.5 | 主② | 测试评审者 | design/review/19 | 192 | 13 | 2.26 | 635,779 | 17,629 | `a66a3ec7` |
| 12:35:06 | 12:40:39 | 457.5 | 主② | 测试评审者 | design/review/27 | 333 | 19 | 3.23 | 829,996 | 28,973 | `aa5d39ca` |
| 12:35:06 | 12:38:44 | 457.5 | 主② | 测试评审者 | design/review/10 | 218 | 18 | 3.02 | 556,648 | 20,856 | `01d23634` |
| 12:35:06 | 12:39:24 | 457.5 | 主② | 测试评审者 | design/review/17 | 258 | 22 | 3.41 | 1,038,088 | 22,725 | `20c42f1b` |
| 12:35:06 | 12:38:44 | 457.5 | 主② | 测试评审者 | design/review/1 | 217 | 18 | 3.01 | 838,623 | 18,871 | `bf7f2271` |
| 12:35:06 | 12:38:14 | 457.5 | 主② | 测试评审者 | design/review/3 | 188 | 12 | 2.40 | 449,119 | 17,591 | `3131ee68` |
| 12:35:06 | 12:37:29 | 457.5 | 主② | 测试评审者 | design/review/6 | 143 | 10 | 1.72 | 339,077 | 11,887 | `f7509128` |
| 12:35:06 | 12:40:20 | 457.5 | 主② | 测试评审者 | design/review/8 | 313 | 19 | 3.64 | 746,264 | 27,464 | `eb302aef` |
| 12:35:06 | 12:39:38 | 457.5 | 主② | 测试评审者 | design/review/21 | 272 | 24 | 2.80 | 781,838 | 25,307 | `7d1334c2` |
| 12:35:06 | 12:40:49 | 457.5 | 主② | 测试评审者 | design/review/24 | 342 | 15 | 3.40 | 804,889 | 30,490 | `aef8b5e9` |
| 12:35:06 | 12:39:03 | 457.5 | 主② | 测试评审者 | design/review/25 | 236 | 16 | 2.79 | 661,145 | 21,988 | `fff5f4ab` |
| 12:35:07 | 12:40:19 | 457.6 | 主② | 测试评审者 | design/review/13 | 313 | 22 | 3.13 | 755,715 | 29,190 | `e43f6e5c` |
| 12:35:07 | 12:38:22 | 457.6 | 主② | 测试评审者 | design/review/12 | 195 | 17 | 2.22 | 374,072 | 18,935 | `d61c3576` |
| 12:35:07 | 12:40:30 | 457.6 | 主② | 测试评审者 | design/review/28 | 323 | 19 | 3.36 | 985,137 | 28,621 | `bfebc988` |
| 12:35:07 | 12:37:03 | 457.6 | 主② | 测试评审者 | design/review/29 | 116 | 13 | 1.65 | 370,060 | 10,946 | `245c2c77` |
| 12:41:51 | 12:50:25 | 464.3 | 主② | 测试设计者 | design/round-3/zoo_lazy_configs_90d84a50 | 514 | 20 | 4.18 | 1,367,996 | 43,491 | `bec139a6` |
| 12:41:51 | 12:43:25 | 464.3 | 主② | 测试设计者 | design/round-3/model_keypoint_head_9b5e1e18 | 94 | 7 | 1.02 | 267,984 | 6,742 | `75b5a5cf` |
| 12:41:51 | 12:43:51 | 464.3 | 主② | 测试设计者 | design/round-3/model_zoo_b9ca42f9 | 119 | 7 | 1.13 | 172,541 | 9,675 | `16a4d7f3` |
| 12:41:51 | 12:42:36 | 464.3 | 主② | 测试设计者 | design/round-3/model_dense_detectors_4bd36534 | 45 | 5 | 0.80 | 150,093 | 3,088 | `637b1d9b` |
| 12:55:24 | 12:59:08 | 477.8 | 主② | 测试评审者 | design/review-2 | 225 | 21 | 2.82 | 753,685 | 21,080 | `d4c236f5` |
| 13:01:05 | 13:13:11 | 483.5 | 主② | 测试设计者 | design/call-2/round-1/packaging | 727 | 19 | 3.87 | 1,155,378 | 46,700 | `eadf222a` |
| 13:01:05 | 13:09:59 | 483.5 | 主② | 测试设计者 | design/call-2/round-1/layers_mask_ops_b69e7f4f | 535 | 21 | 3.76 | 808,488 | 46,715 | `7e636280` |
| 13:01:05 | 13:08:46 | 483.5 | 主② | 测试设计者 | design/call-2/round-1/model_rcnn_beac6e6a | 462 | 17 | 3.71 | 998,653 | 43,426 | `6d8b481a` |
| 13:01:05 | 13:14:16 | 483.5 | 主② | 测试设计者 | design/call-2/round-1/model_keypoint_head_9b5e1e18 | 791 | 16 | 4.34 | 1,074,542 | 54,888 | `de4c13e0` |
| 13:01:05 | 13:09:46 | 483.5 | 主② | 测试设计者 | design/call-2/round-1/data_transforms_8967f4a5 | 521 | 20 | 4.69 | 1,435,641 | 49,804 | `7919e206` |
| 13:01:05 | 13:09:52 | 483.5 | 主② | 测试设计者 | design/call-2/round-1/datasets_lvis_770ba881 | 527 | 12 | 3.57 | 623,705 | 47,779 | `75045df7` |
| 13:01:05 | 13:10:50 | 483.5 | 主② | 测试设计者 | design/call-2/round-1/eval_coco_c7511481 | 585 | 24 | 4.73 | 1,615,902 | 52,564 | `7e89f751` |
| 13:01:05 | 13:03:42 | 483.5 | 主② | 测试设计者 | design/call-2/round-1/layers_deform_conv_2e904f28 | 157 | 8 | 1.27 | 287,108 | 12,070 | `8cb78adc` |
| 13:01:05 | 13:09:00 | 483.5 | 主② | 测试设计者 | design/call-2/round-1/eval_framework_4544602b | 475 | 10 | 3.12 | 494,587 | 40,982 | `ba085af6` |
| 13:01:05 | 13:11:58 | 483.5 | 主② | 测试设计者 | design/call-2/round-1/model_cascade_rcnn_d2d8ceb9 | 653 | 17 | 4.35 | 1,068,425 | 55,238 | `10bfaf73` |
| 13:01:05 | 13:08:24 | 483.5 | 主② | 测试设计者 | design/call-2/round-1/datasets_coco_2dbec6a3 | 439 | 15 | 2.50 | 651,795 | 26,323 | `3bd15f99` |
| 13:01:05 | 13:10:11 | 483.5 | 主② | 测试设计者 | design/call-2/round-1/model_zoo_b9ca42f9 | 545 | 18 | 3.70 | 1,007,380 | 44,167 | `28ca3f43` |
| 13:01:05 | 13:08:38 | 483.5 | 主② | 测试设计者 | design/call-2/round-1/utils_foundation_688a2f7c | 453 | 14 | 3.28 | 765,221 | 39,717 | `e8776481` |
| 13:01:05 | 13:12:32 | 483.5 | 主② | 测试设计者 | design/call-2/round-1/config_yacs_dac9f918 | 687 | 21 | 4.95 | 1,492,264 | 58,787 | `f34f04d6` |
| 13:01:05 | 13:12:35 | 483.5 | 主② | 测试设计者 | design/call-2/round-1/model_mask_head_b87bf214 | 690 | 16 | 4.40 | 999,433 | 55,135 | `28b0833c` |
| 13:01:05 | 13:14:51 | 483.5 | 主② | 测试设计者 | design/call-2/round-1/model_dense_detectors_4bd36534 | 826 | 24 | 5.77 | 1,818,648 | 69,012 | `2c02313d` |
| 13:01:05 | 13:05:51 | 483.5 | 主② | 测试设计者 | design/call-2/round-1/data_detection_utils_ab187b1b | 286 | 14 | 2.05 | 477,076 | 20,958 | `6abff274` |
| 13:01:05 | 13:12:49 | 483.5 | 主② | 测试设计者 | design/call-2/round-1/engine_defaults_cb41ff03 | 704 | 4 | 4.74 | 1,678,018 | 52,141 | `409bda6f` |
| 13:01:05 | 13:09:00 | 483.5 | 主② | 测试设计者 | design/call-2/round-1/datasets_pascal_voc_d5ffa80e | 475 | 16 | 3.09 | 720,565 | 40,049 | `dcd16841` |
| 13:01:05 | 13:13:38 | 483.5 | 主② | 测试设计者 | design/call-2/round-1/datasets_cityscapes_5c6b2f0e | 752 | 16 | 5.20 | 1,139,637 | 67,788 | `132210d3` |
| 13:01:05 | 13:07:56 | 483.5 | 主② | 测试设计者 | design/call-2/round-1/export_torchscript_ceee9d66 | 411 | 19 | 3.56 | 947,956 | 38,574 | `932159bc` |
| 13:01:05 | 13:06:56 | 483.5 | 主② | 测试设计者 | design/call-2/round-1/engine_distributed_c5788eb2 | 351 | 9 | 2.14 | 343,744 | 27,025 | `5cb98a13` |
| 13:01:05 | 13:05:43 | 483.5 | 主② | 测试设计者 | design/call-2/round-1/checkpointing | 277 | 14 | 2.10 | 643,504 | 21,839 | `22faa6ac` |
| 13:01:05 | 13:02:17 | 483.5 | 主② | 测试设计者 | design/call-2/round-1/layers_losses_0c70c173 | 72 | 6 | 0.63 | 143,861 | 4,870 | `91df7d4a` |
| 13:01:05 | 13:09:18 | 483.5 | 主② | 测试设计者 | design/call-2/round-1/datasets_registry_04d0fc24 | 493 | 17 | 4.05 | 1,100,618 | 45,079 | `ce3ba172` |
| 13:01:05 | 13:13:49 | 483.5 | 主② | 测试设计者 | design/call-2/round-1/engine_train_loop_cab52fc9 | 764 | 19 | 5.60 | 1,707,145 | 66,431 | `90155bf6` |
| 13:01:05 | 13:04:44 | 483.5 | 主② | 测试设计者 | design/call-2/round-1/data_catalog_4b9d42d1 | 219 | 8 | 1.45 | 235,969 | 16,395 | `43e0d56f` |
| 13:01:06 | 13:08:55 | 483.5 | 主② | 测试设计者 | design/call-2/round-1/data_loading_bc917fe4 | 469 | 16 | 2.79 | 928,836 | 26,200 | `fdf1a776` |
| 13:01:06 | 13:12:33 | 483.5 | 主② | 测试设计者 | design/call-2/round-1/model_rotated_rcnn_aa4471c0 | 687 | 19 | 4.82 | 1,355,401 | 56,254 | `bef1302e` |
| 13:01:06 | 13:06:44 | 483.5 | 主② | 测试设计者 | design/call-2/round-1/zoo_lazy_configs_90d84a50 | 338 | 15 | 2.82 | 830,240 | 28,431 | `c383648f` |
| 13:01:06 | 13:11:00 | 483.5 | 主② | 测试设计者 | design/call-2/round-1/model_semantic_panoptic_9b3bd7f2 | 594 | 19 | 4.62 | 1,327,164 | 55,259 | `7029d581` |
| 13:01:06 | 13:05:35 | 483.5 | 主② | 测试设计者 | design/call-2/round-1/config_lazy_c0cc0529 | 269 | 9 | 1.75 | 358,987 | 19,041 | `602e1dbb` |
| 13:02:22 | 13:04:41 | 484.8 | 主② | 测试设计者 | design/call-2/round-1/layers_nms_e3260776 | 139 | 6 | 0.81 | 160,880 | 6,776 | `b6da9ab1` |
| 13:03:47 | 13:07:23 | 486.2 | 主② | 测试设计者 | design/call-2/round-1/layers_norm_blocks_f29237d9 | 216 | 9 | 1.64 | 379,705 | 16,033 | `6402543e` |
| 13:04:46 | 13:14:04 | 487.2 | 主② | 测试设计者 | design/call-2/round-1/layers_roi_align_74ce8595 | 557 | 17 | 4.05 | 1,022,470 | 49,313 | `fa13fbc3` |
| 13:04:50 | 13:07:46 | 487.3 | 主② | 测试设计者 | design/call-2/round-1/layers_wrappers_89caf8f5 | 176 | 8 | 1.27 | 218,771 | 13,736 | `dffc75bc` |
| 13:05:41 | 13:08:46 | 488.1 | 主② | 测试设计者 | design/call-2/round-1/model_anchor_generator_1426eeeb | 184 | 10 | 1.59 | 388,335 | 15,433 | `1328ef52` |
| 13:05:48 | 13:12:29 | 488.2 | 主② | 测试设计者 | design/call-2/round-1/model_backbones_a74c70cc | 402 | 18 | 3.00 | 812,106 | 31,951 | `7e448832` |
| 13:05:57 | 13:07:40 | 488.4 | 主② | 测试设计者 | design/call-2/round-1/model_box_regression_c9525272 | 104 | 6 | 0.90 | 188,164 | 6,847 | `3ef8af3e` |
| 13:06:50 | 13:08:40 | 489.3 | 主② | 测试设计者 | design/call-2/round-1/model_matcher_sampling_bc2ea027 | 111 | 9 | 0.86 | 225,739 | 7,100 | `d8c9b564` |
| 13:07:01 | 13:10:50 | 489.5 | 主② | 测试设计者 | design/call-2/round-1/model_poolers_b90577b2 | 228 | 9 | 1.47 | 288,426 | 15,640 | `82dcaa94` |
| 13:07:28 | 13:14:08 | 489.9 | 主② | 测试设计者 | design/call-2/round-1/model_proposal_generators_0c431779 | 400 | 17 | 2.41 | 782,240 | 25,757 | `2f9121f6` |
| 13:07:46 | 13:12:43 | 490.2 | 主② | 测试设计者 | design/call-2/round-1/model_roi_heads_0dc03ed6 | 297 | 14 | 2.72 | 716,636 | 23,580 | `ee3407d0` |
| 13:07:51 | 13:16:51 | 490.3 | 主② | 测试设计者 | design/call-2/round-1/solver | 540 | 13 | 2.44 | 544,189 | 27,921 | `4ebf5532` |
| 13:08:01 | 13:12:13 | 490.5 | 主② | 测试设计者 | design/call-2/round-1/struct_boxes_a89c21d9 | 251 | 8 | 1.32 | 265,465 | 12,175 | `c8f6f8f6` |
| 13:08:29 | 13:11:49 | 490.9 | 主② | 测试设计者 | design/call-2/round-1/struct_image_list_5bb71e68 | 199 | 7 | 1.00 | 200,561 | 9,746 | `b5758c70` |
| 13:08:44 | 13:14:42 | 491.2 | 主② | 测试设计者 | design/call-2/round-1/struct_instances_8571c87b | 359 | 10 | 1.45 | 329,783 | 15,700 | `76357b1c` |
| 13:08:45 | 13:11:53 | 491.2 | 主② | 测试设计者 | design/call-2/round-1/struct_keypoints_5ee0bebe | 188 | 7 | 0.96 | 210,953 | 8,448 | `ec6836d4` |
| 13:08:51 | 13:13:19 | 491.3 | 主② | 测试设计者 | design/call-2/round-1/struct_masks_85bbcc53 | 268 | 12 | 1.76 | 524,628 | 16,080 | `3a24ec02` |
| 13:08:51 | 13:12:47 | 491.3 | 主② | 测试设计者 | design/call-2/round-1/struct_rotated_boxes_9f751aca | 236 | 10 | 1.38 | 367,647 | 12,989 | `475acd26` |
| 13:08:59 | 13:11:40 | 491.4 | 主② | 测试设计者 | design/call-2/round-1/utils_collect_env_40df2a68 | 161 | 5 | 0.87 | 135,986 | 7,467 | `e4db6eb0` |
| 13:09:05 | 13:13:30 | 491.5 | 主② | 测试设计者 | design/call-2/round-1/utils_events_84e15e87 | 265 | 8 | 1.67 | 326,007 | 17,400 | `90a86726` |
| 13:09:05 | 13:18:27 | 491.5 | 主② | 测试设计者 | design/call-2/round-1/utils_logging_a1ff81c1 | 562 | 15 | 3.81 | 914,294 | 47,518 | `2ae4e571` |
| 13:09:25 | 13:15:06 | 491.9 | 主② | 测试设计者 | design/call-2/round-1/utils_testing_1cb15057 | 341 | 12 | 2.06 | 538,313 | 20,176 | `d8b916ef` |
| 16:40:20 | 16:47:23 | 702.8 | 主② | 测试设计者 | design/call-2/round-2/datasets_registry_04d0fc24 | 423 | 16 | 3.77 | 1,004,082 | 42,049 | `95a3eec3` |
| 16:40:20 | 16:44:23 | 702.8 | 主② | 测试设计者 | design/call-2/round-2/model_box_regression_c9525272 | 243 | 9 | 2.08 | 468,799 | 20,690 | `4cfacf6e` |
| 16:50:14 | 16:56:19 | 712.7 | 主② | 测试评审者 | design/call-2/review/20 | 365 | 19 | 3.12 | 853,005 | 33,826 | `37d4ac00` |
| 16:50:14 | 16:53:55 | 712.7 | 主② | 测试评审者 | design/call-2/review/10 | 221 | 15 | 3.01 | 536,829 | 21,050 | `4ed761ed` |
| 16:50:14 | 16:54:45 | 712.7 | 主② | 测试评审者 | design/call-2/review/14 | 271 | 23 | 3.28 | 907,522 | 25,451 | `7df279e7` |
| 16:50:14 | 16:54:51 | 712.7 | 主② | 测试评审者 | design/call-2/review/12 | 277 | 16 | 2.76 | 724,840 | 25,211 | `879becb2` |
| 16:50:14 | 16:53:50 | 712.7 | 主② | 测试评审者 | design/call-2/review/25 | 216 | 15 | 2.45 | 627,276 | 19,207 | `ccd98bb9` |
| 16:50:14 | 16:54:22 | 712.7 | 主② | 测试评审者 | design/call-2/review/19 | 248 | 16 | 2.70 | 749,109 | 21,658 | `f94e8c53` |
| 16:50:14 | 16:55:32 | 712.7 | 主② | 测试评审者 | design/call-2/review/11 | 318 | 22 | 3.51 | 890,257 | 29,268 | `e5336cbc` |
| 16:50:14 | 16:54:11 | 712.7 | 主② | 测试评审者 | design/call-2/review/5 | 237 | 20 | 3.13 | 761,863 | 21,230 | `ad6d91ee` |
| 16:50:14 | 16:55:01 | 712.7 | 主② | 测试评审者 | design/call-2/review/9 | 286 | 15 | 3.07 | 803,343 | 26,321 | `db3551ec` |
| 16:50:14 | 16:52:43 | 712.7 | 主② | 测试评审者 | design/call-2/review/15 | 149 | 13 | 1.64 | 407,570 | 12,718 | `f12a26dc` |
| 16:50:14 | 16:55:00 | 712.7 | 主② | 测试评审者 | design/call-2/review/13 | 286 | 17 | 3.12 | 786,968 | 26,916 | `5930c1ea` |
| 16:50:14 | 16:53:49 | 712.7 | 主② | 测试评审者 | design/call-2/review/7 | 215 | 14 | 2.78 | 580,918 | 19,318 | `73ee7368` |
| 16:50:14 | 16:52:50 | 712.7 | 主② | 测试评审者 | design/call-2/review/8 | 156 | 17 | 2.77 | 539,755 | 13,707 | `f03cebca` |
| 16:50:14 | 16:52:20 | 712.7 | 主② | 测试评审者 | design/call-2/review/16 | 126 | 15 | 2.05 | 537,892 | 11,065 | `9799807a` |
| 16:50:14 | 16:54:59 | 712.7 | 主② | 测试评审者 | design/call-2/review/17 | 284 | 26 | 3.48 | 1,109,907 | 24,910 | `ab1d4c39` |
| 16:50:14 | 16:55:53 | 712.7 | 主② | 测试评审者 | design/call-2/review/21 | 339 | 22 | 3.52 | 1,091,511 | 31,656 | `e9f23d7c` |
| 16:50:14 | 16:56:26 | 712.7 | 主② | 测试评审者 | design/call-2/review/18 | 371 | 16 | 3.30 | 483,713 | 34,388 | `6d21a067` |
| 16:50:14 | 16:53:40 | 712.7 | 主② | 测试评审者 | design/call-2/review/6 | 205 | 16 | 2.23 | 290,735 | 19,681 | `1e3dcc20` |
| 16:50:14 | 16:54:02 | 712.7 | 主② | 测试评审者 | design/call-2/review/3 | 227 | 17 | 2.72 | 815,870 | 20,930 | `c5d796f6` |
| 16:50:14 | 16:54:18 | 712.7 | 主② | 测试评审者 | design/call-2/review/2 | 244 | 17 | 3.09 | 720,651 | 22,683 | `ab4d87ce` |
| 16:50:15 | 16:52:51 | 712.7 | 主② | 测试评审者 | design/call-2/review/1 | 156 | 11 | 2.02 | 375,905 | 14,746 | `8ecc901f` |
| 16:50:15 | 16:52:25 | 712.7 | 主② | 测试评审者 | design/call-2/review/29 | 130 | 14 | 1.86 | 365,288 | 12,435 | `124d2da2` |
| 16:50:15 | 16:52:09 | 712.7 | 主② | 测试评审者 | design/call-2/review/27 | 114 | 12 | 1.54 | 274,651 | 10,849 | `cf592350` |
| 16:50:15 | 16:53:21 | 712.7 | 主② | 测试评审者 | design/call-2/review/4 | 187 | 15 | 2.25 | 550,385 | 17,258 | `cc52f0fe` |
| 16:50:15 | 16:53:56 | 712.7 | 主② | 测试评审者 | design/call-2/review/23 | 221 | 18 | 2.87 | 1,050,349 | 17,440 | `e8fd63bf` |
| 16:50:15 | 16:54:47 | 712.7 | 主② | 测试评审者 | design/call-2/review/22 | 273 | 21 | 3.14 | 676,223 | 24,687 | `3fc46553` |
| 16:50:15 | 16:53:03 | 712.7 | 主② | 测试评审者 | design/call-2/review/28 | 168 | 14 | 2.06 | 516,816 | 14,183 | `69e6eb10` |
| 16:50:15 | 16:52:27 | 712.7 | 主② | 测试评审者 | design/call-2/review/26 | 133 | 11 | 1.61 | 263,091 | 12,383 | `7908c31c` |
| 16:50:15 | 16:53:21 | 712.7 | 主② | 测试评审者 | design/call-2/review/24 | 187 | 12 | 2.29 | 365,262 | 16,906 | `680b7a86` |
| 16:56:34 | 17:02:54 | 719.0 | 主② | 测试设计者 | design/call-2/round-3/zoo_lazy_configs_90d84a50 | 380 | 17 | 3.16 | 892,129 | 35,697 | `12b69e43` |
| 16:56:34 | 16:57:14 | 719.0 | 主② | 测试设计者 | design/call-2/round-3/utils_logging_a1ff81c1 | 40 | 4 | 0.61 | 113,754 | 3,019 | `92f52469` |
| 16:56:34 | 16:57:16 | 719.0 | 主② | 测试设计者 | design/call-2/round-3/engine_defaults_cb41ff03 | 42 | 4 | 0.74 | 138,879 | 3,010 | `63b2018a` |
| 16:56:34 | 16:58:46 | 719.0 | 主② | 测试设计者 | design/call-2/round-3/model_zoo_b9ca42f9 | 132 | 8 | 1.41 | 346,713 | 11,463 | `9a5dcf66` |
| 16:56:34 | 16:57:31 | 719.0 | 主② | 测试设计者 | design/call-2/round-3/layers_mask_ops_b69e7f4f | 57 | 7 | 0.73 | 217,999 | 3,517 | `dab90ae9` |
| 17:08:21 | 17:13:27 | 730.8 | 主② | 测试评审者 | design/call-2/review-2 | 305 | 18 | 3.38 | 986,150 | 27,510 | `834836e3` |
| 18:47:38 | 18:49:50 | 830.1 | 主② | controller | controller/0001 | 132 | 6 | 2.12 | 485,263 | 11,345 | `0493f90f` |
| 18:56:19 | – | 838.8 | 主② | controller | controller/0002 | 0 | None | 0.00 | 0 | 0 | `3837f0e7` |
| 19:11:56 | 19:14:04 | 854.4 | 主② | controller | controller/0003 | 128 | 6 | 1.93 | 461,119 | 11,023 | `8393cbf6` |
| 19:15:20 | 19:28:01 | 857.8 | 主② | 作者 | implementation-workspaces/workspace-d883dde2562b/authoring | 761 | 42 | 6.09 | 3,687,723 | 61,275 | `6730c229` |
| 19:15:20 | 19:33:15 | 857.8 | 主② | 作者 | implementation-workspaces/workspace-eea4be9ac862/authoring | 1074 | 42 | 9.28 | 5,319,413 | 98,337 | `ac4dddc5` |
| 19:37:46 | 19:40:28 | 880.2 | 主② | controller | controller/0004 | 163 | 7 | 2.45 | 523,912 | 15,222 | `3e33857f` |
| 19:52:34 | 19:54:30 | 895.0 | 主② | controller | controller/0005 | 116 | 3 | 2.06 | 248,410 | 10,580 | `a62c8d0a` |
| 19:57:49 | 20:11:05 | 900.3 | 主② | 作者 | authoring | 796 | 32 | 5.99 | 2,831,967 | 66,739 | `4b92494e` |
| 21:50:08 | 21:51:26 | 1012.6 | 主② | controller | controller/0006 | 77 | 3 | 1.70 | 155,856 | 7,483 | `cdd2535a` |
| 21:54:20 | 21:56:34 | 1016.8 | 主② | 作者 | implementation-workspaces/workspace-61bf4d14a051/authoring | 134 | 11 | 1.19 | 365,205 | 8,970 | `935935bd` |
| 21:54:20 | 21:59:15 | 1016.8 | 主② | 作者 | implementation-workspaces/workspace-441ee91ee49f/authoring | 295 | 22 | 2.09 | 931,432 | 16,876 | `6cc3cda3` |
| 21:54:20 | 21:56:17 | 1016.8 | 主② | 作者 | implementation-workspaces/workspace-79cfbeb26b3c/authoring | 117 | 10 | 1.14 | 297,354 | 8,540 | `f3d24af1` |
| 21:54:20 | – | 1016.8 | 主② | 作者 | implementation-workspaces/workspace-d578b9149cb6/authoring | 0 | None | 0.00 | 0 | 0 | `fedbd183` |
| 21:56:21 | 21:58:43 | 1018.8 | 主② | 作者 | implementation-workspaces/workspace-d33db6512a24/authoring | 142 | 13 | 1.26 | 473,173 | 9,305 | `af12a8d2` |

| 作业 | 角色 | 调用次数 | 美元 | 会话时间合计（分钟） | 输出 token |
| --- | --- | --- | --- | --- | --- |
| 主① | 测试设计者 | 54 | 147.81 | 345.8 | 1,674,368 |
| 主② | 作者 | 8 | 27.03 | 55.3 | 270,042 |
| 主② | controller | 6 | 10.27 | 10.3 | 55,653 |
| 主② | 测试设计者 | 123 | 336.00 | 784.4 | 3,769,248 |
| 主② | 测试评审者 | 60 | 160.95 | 229.7 | 1,251,671 |
| 草稿① | 作者 | 10 | 131.53 | 249.6 | 1,358,874 |
| 草稿① | controller | 4 | 8.05 | 9.9 | 55,637 |
| 草稿② | 作者 | 7 | 124.61 | 219.5 | 1,245,462 |
| 草稿② | controller | 2 | 3.81 | 4.4 | 25,428 |
| 合计 | 不含试调和主持会话 | 274 | 950.06 | 1908.9 | 9,706,383 |

## 7. 测试设计和评审

开了性能验收以后，测试设计除了给没有有效测试的叶子设计测试，还给每个有自己独占源码的选中叶子设计性能文件（基准文件）。设计出的文件先试跑，再评审，没过的回到下一轮。下面按“第几遍、第几轮”列出会话；主作业①的设计随第一对作业一起作废，主作业②的第一遍因暂停作废，用上的是第二遍。

| 作业 | 第几遍 | 轮或评审 | 角色 | 会话数 | 开始 | 结束 | 美元 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 主① | 第 1 遍 | round-1 | 测试设计者 | 54 | 05:46:57 | 06:02:36 | 147.81 |
| 主② | 第 1 遍 | round-1 | 测试设计者 | 54 | 08:32:22 | 08:48:09 | 153.20 |
| 主② | 第 1 遍 | round-2 | 测试设计者 | 4 | 12:08:47 | 12:16:48 | 10.33 |
| 主② | 第 1 遍 | review | 测试评审者 | 29 | 12:35:06 | 12:41:43 | 77.38 |
| 主② | 第 1 遍 | round-3 | 测试设计者 | 4 | 12:41:51 | 12:50:25 | 7.12 |
| 主② | 第 1 遍 | review-2 | 测试评审者 | 1 | 12:55:24 | 12:59:08 | 2.82 |
| 主② | 第 2 遍 | round-1 | 测试设计者 | 54 | 13:01:05 | 13:18:27 | 152.84 |
| 主② | 第 2 遍 | round-2 | 测试设计者 | 2 | 16:40:20 | 16:47:23 | 5.85 |
| 主② | 第 2 遍 | review | 测试评审者 | 29 | 16:50:14 | 16:56:26 | 77.38 |
| 主② | 第 2 遍 | round-3 | 测试设计者 | 5 | 16:56:34 | 17:02:54 | 6.65 |
| 主② | 第 2 遍 | review-2 | 测试评审者 | 1 | 17:08:21 | 17:13:27 | 3.38 |

主作业②用上的那一遍（第二遍）的结果：

| 项目 | 数量 |
| --- | --- |
| 作业记下的会话数（原样） | `{"completed": 91, "failed": {}, "started": 91}` |
| 提交到原版上的设计文件 | 85 个测试文件 + 28 个场景文件 + 111 个性能文件 |
| 通过的文件（不含性能文件） | 109 |
| 被拒的文件（按原因） | outside_external_contract 2、not_repeated_identically 2、no_behavioral_knockout_failure 6、import_only_knockout_failure 4、no_performance_criterion 3、reviewer_veto 10 |
| 没有按评审意见改完的文件 | 12 |
| 留作固定测试（pinned）的文件 | 4 |
| 原测试的迁移 | 给了 13 条，迁移成 12 条，没法验证 1 条 |
| 各次基线的检查数 | 45 → 158 → 0 → 0 → 0 |
| 第一次基线时没有有效测试的叶子 | config-yacs、datasets-cityscapes、datasets-lvis、datasets-pascal-voc、datasets-registry、engine-defaults、engine-distributed、engine-train-loop、eval-coco、eval-framework、layers-mask-ops、model-cascade-rcnn、model-dense-detectors、model-keypoint-head、model-mask-head、model-rcnn、model-rotated-rcnn、model-semantic-panoptic、model-zoo、packaging、utils-foundation、zoo-lazy-configs |
| 封存时校验方持有的文件 | 427 |

每个叶子的结果：

| 叶子 | 通过的测试文件 | 通过的场景文件 | 通过的性能文件 | 固定测试 | 被拒的测试（按原因） | 被拒的性能文件（按原因） | 原测试迁移 / 没验证 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| checkpointing | 0 | – | 2 | 0 | – | – | – / – |
| config-lazy | 0 | – | 3 | 0 | – | – | – / – |
| config-yacs | 6 | 1 | 2 | 0 | – | – | – / – |
| data-catalog | 0 | – | 3 | 0 | – | – | – / – |
| data-detection-utils | 0 | – | 3 | 0 | – | – | – / – |
| data-loading | 0 | – | 3 | 0 | – | – | – / – |
| data-transforms | 3 | 1 | 1 | 0 | outside_external_contract 1 | – | 1 / 0 |
| datasets-cityscapes | 3 | 1 | 2 | 0 | – | – | – / – |
| datasets-coco | 0 | – | 3 | 0 | – | – | – / – |
| datasets-lvis | 3 | 1 | 3 | 0 | – | – | – / – |
| datasets-pascal-voc | 2 | 1 | 2 | 0 | – | – | – / – |
| datasets-registry | 0 | 0 | – | 3 | no_behavioral_knockout_failure 3 | – | – / – |
| engine-defaults | 4 | 1 | 2 | 0 | reviewer_veto 1 | reviewer_veto 1 | – / – |
| engine-distributed | 3 | 0 | 2 | 0 | – | – | – / – |
| engine-train-loop | 4 | 1 | 2 | 0 | outside_external_contract 1 | – | – / – |
| eval-coco | 2 | 1 | 1 | 0 | – | – | – / – |
| eval-framework | 3 | 3 | 2 | 0 | – | – | – / – |
| export-torchscript | 6 | 1 | 2 | 0 | – | – | 0 / 1 |
| layers-deform-conv | 0 | – | 2 | 0 | – | – | – / – |
| layers-losses | 0 | – | 1 | 0 | – | – | – / – |
| layers-mask-ops | 3 | 1 | 1 | 0 | reviewer_veto 1 | – | – / – |
| layers-nms | 0 | – | 1 | 0 | – | – | – / – |
| layers-norm-blocks | 0 | – | 3 | 0 | – | – | – / – |
| layers-roi-align | 3 | 2 | 1 | 0 | – | – | 5 / 0 |
| layers-wrappers | 0 | – | 3 | 0 | – | – | – / – |
| model-anchor-generator | 0 | – | 2 | 0 | – | reviewer_veto 1 | – / – |
| model-backbones | 0 | – | 3 | 0 | – | – | – / – |
| model-box-regression | 0 | – | 2 | 0 | – | no_performance_criterion 2 | – / – |
| model-cascade-rcnn | 3 | 1 | 2 | 0 | – | – | – / – |
| model-dense-detectors | 3 | 1 | 2 | 0 | – | – | – / – |
| model-keypoint-head | 3 | 1 | 2 | 0 | – | – | – / – |
| model-mask-head | 3 | 1 | 2 | 0 | – | – | – / – |
| model-matcher-sampling | 0 | – | 1 | 0 | – | – | – / – |
| model-poolers | 0 | – | 2 | 0 | – | reviewer_veto 1 | – / – |
| model-proposal-generators | 0 | – | 3 | 0 | – | – | – / – |
| model-rcnn | 4 | 1 | 2 | 0 | – | – | 1 / 0 |
| model-roi-heads | 0 | – | 3 | 0 | – | – | – / – |
| model-rotated-rcnn | 2 | 1 | 1 | 0 | – | – | – / – |
| model-semantic-panoptic | 3 | 1 | 2 | 0 | – | – | – / – |
| model-zoo | 3 | 1 | 2 | 0 | – | no_performance_criterion 1、reviewer_veto 1 | – / – |
| packaging | 3 | 0 | – | 0 | – | – | – / – |
| solver | 0 | – | 2 | 0 | – | reviewer_veto 1 | – / – |
| struct-boxes | 0 | – | 3 | 0 | – | – | – / – |
| struct-image-list | 0 | – | 3 | 0 | – | – | – / – |
| struct-instances | 0 | – | 3 | 0 | – | – | – / – |
| struct-keypoints | 0 | – | 3 | 0 | – | – | – / – |
| struct-masks | 0 | – | 3 | 0 | – | – | – / – |
| struct-rotated-boxes | 0 | – | 2 | 0 | – | – | – / – |
| utils-collect-env | 0 | – | 2 | 0 | – | – | – / – |
| utils-events | 0 | – | 2 | 0 | – | reviewer_veto 1 | – / – |

（作业的记录里另有 4 个叶子没有逐个列出。）

被拒的文件和理由（原文的开头）：

| 叶子 | 轮 | 文件 | 理由 |
| --- | --- | --- | --- |
| engine-train-loop | 1 | `tests/nanolize_contracts/engine_train_loop_cab52fc9/test_hooks_callback_eval_writer_timer.py` | outside_external_contract；not in the external contract: detectron2.engine.(dynamic attribute), detectron2.engine.hooks.(dynamic attribute) |
| data-transforms | 1 | `tests/nanolize_contracts/data_transforms_8967f4a5/test_augmentation_core.py` | outside_external_contract；not in the external contract: detectron2.data.transforms.VFlipTransform |
| datasets-cityscapes | 1 | `tests/nanolize_contracts/datasets_cityscapes_5c6b2f0e/scenario_cityscapes_program.py` | not_repeated_identically；These functions showed something else in a second run on the original: scenario_instance_run_on_image_with_another_suffix, scenario_semantic_run_on_empty_image_directory. Give them inputs that do not depend on the clock, a random number or the machine (fixed seeds, times as arguments, no elapsed time in what they show), or remove them.；The repeated runs took other hash seeds than the first (P … |
| datasets-registry | 1 | `tests/nanolize_contracts/datasets_registry_04d0fc24/test_builtin_env_root.py` | no_behavioral_knockout_failure |
| datasets-registry | 1 | `tests/nanolize_contracts/datasets_registry_04d0fc24/test_builtin_default_root.py` | no_behavioral_knockout_failure |
| datasets-registry | 1 | `tests/nanolize_contracts/datasets_registry_04d0fc24/test_builtin_home_root.py` | no_behavioral_knockout_failure |
| datasets-registry | 1 | `tests/nanolize_contracts/datasets_registry_04d0fc24/scenario_builtin_loading.py` | no_behavioral_knockout_failure |
| datasets-registry | 1 | `tests/nanolize_contracts/datasets_registry_04d0fc24/scenario_builtin_metadata.py` | no_behavioral_knockout_failure |
| engine-distributed | 1 | `tests/nanolize_contracts/engine_distributed_c5788eb2/scenario_launch_inline.py` | not_repeated_identically；These functions showed something else in a second run on the original: scenario_helpers_in_process_group_of_one. Give them inputs that do not depend on the clock, a random number or the machine (fixed seeds, times as arguments, no elapsed time in what they show), or remove them.；The repeated runs took other hash seeds than the first (PYTHONHASHSEED), and with them the order in which a set of … |
| packaging | 1 | `tests/nanolize_contracts/packaging/scenario_setup_program.py` | import_only_knockout_failure；With the leaf's functions knocked out this file failed while a module was being imported or collected, before any of its tests ran, so no behavior was measured. Call the leaf's functions inside test functions only: not at the file's top level, in a class body, a default value or the arguments of a decorator. |
| zoo-lazy-configs | 1 | `tests/nanolize_contracts/zoo_lazy_configs_90d84a50/test_coco_schedule.py` | import_only_knockout_failure；With the leaf's functions knocked out this file failed while a module was being imported or collected, before any of its tests ran, so no behavior was measured. Call the leaf's functions inside test functions only: not at the file's top level, in a class body, a default value or the arguments of a decorator. |
| zoo-lazy-configs | 1 | `tests/nanolize_contracts/zoo_lazy_configs_90d84a50/test_baseline_1x_configs.py` | no_behavioral_knockout_failure |
| model-zoo | 1 | `tests/nanolize_contracts/model_zoo_b9ca42f9/bench_configs.py` | no_performance_criterion；bench_config_files: fails_on_original: the function raised RuntimeError on the original.；bench_yaml_configs: fails_on_original: the function raised RuntimeError on the original.；bench_python_configs: fails_on_original: the function raised RuntimeError on the original.；bench_build_model: fails_on_original: the function raised RuntimeError on the original. |
| model-box-regression | 1 | `tests/nanolize_contracts/model_box_regression_c9525272/bench_box_regression_batch.py` | no_performance_criterion；bench_standard_get_deltas: fails_when_slowed: the function raised torch.jit.frontend.UnsupportedNodeError when the leaf's functions were made slower, and did not on the original.；bench_standard_apply_deltas: fails_when_slowed: the function raised torch.jit.frontend.UnsupportedNodeError when the leaf's functions were made slower, and did not on the original.；bench_standard_apply_class_deltas: … |
| model-box-regression | 1 | `tests/nanolize_contracts/model_box_regression_c9525272/bench_box_regression_small_calls.py` | no_performance_criterion；bench_standard_small_round_trips: fails_when_slowed: the function raised torch.jit.frontend.UnsupportedNodeError when the leaf's functions were made slower, and did not on the original.；bench_rotated_small_round_trips: fails_when_slowed: the function raised torch.jit.frontend.UnsupportedNodeError when the leaf's functions were made slower, and did not on the original.；bench_linear_small_round … |
| engine-defaults | review | `tests/nanolize_contracts/engine_defaults_cb41ff03/test_default_trainer.py` | reviewer_veto；test_trainer_uses_amp_trainer_when_enabled is at fault: it wraps the construction in `with pytest.warns(Warning)`, so it fails unless some warning is emitted while the trainer is built. DefaultTrainer and AMPTrainer emit no warning themselves; the one seen comes from torch, because the original creates its gradient scaler through the deprecated torch.cuda.amp.GradScaler and because the machine has no CU … |
| layers-mask-ops | review | `tests/nanolize_contracts/layers_mask_ops_b69e7f4f/test_paste_masks_in_image.py` | reviewer_veto；test_gradient_mask_soft_values_on_non_square_image: the exact `hard` mask assertion pins floating-point rounding noise of the original's operation order. With masks = arange(16)/15 (4x4), box [1,2,7,5] and image (6,8), pixel row 3, col 6 samples mask rows 1 and 2 with weight 0.5 each and mask column 3 with weight 5/6 (column 4 is zero padding), so its value is (7/15 + 11/15)/2 * 5/6 = exactly 0.5 in rea … |
| zoo-lazy-configs | review | `tests/nanolize_contracts/zoo_lazy_configs_90d84a50/scenario_coco_schedule.py` | reviewer_veto；Most functions do not reach the project through its public interfaces. The helper schedule() (and scenario_same_call_twice_after_editing_the_first directly) executes the source file configs/common/coco_schedule.py with runpy.run_path and pulls out the function default_X_scheduler; that name is not on the external-names list, nor a member of a listed name, and the file is not loaded through the public lo … |
| solver | review | `tests/nanolize_contracts/solver/count_solver_work.py` | reviewer_veto；Two tests assert a returned value instead of an amount of work. test_reduced_groups_bounded_by_distinct_hyperparameters only checks len() of the list reduce_param_groups returns (and the number of params inside it): the number of merged groups is the function's output, i.e. behavior, and nothing the leaf does (calls, reads, copies) is counted. test_default_params_groups_do_not_grow_with_model likewise o … |
| utils-events | review | `tests/nanolize_contracts/utils_events_84e15e87/count_events_work.py` | reviewer_veto；test_count_samples_is_bounded_by_window_and_by_samples asserts a returned value instead of an amount of work: every assertion compares the number that EventStorage.count_samples returns with the window size, with 64 and with 20. That is the function's result (a weakened behavior check), not work the leaf does; an implementation that scans the whole history for every call passes it exactly like one that … |
| utils-logging | review | `tests/nanolize_contracts/utils_logging_a1ff81c1/test_setup_logger.py` | reviewer_veto；Three tests pin how the original builds its handlers rather than what a user of setup_logger observes. (1) test_default_stdout_handler_is_one_debug_stream_handler asserts `type(handler) is logging.StreamHandler`, `handler.level == logging.DEBUG` and `handler.stream is buf`: a rewrite that writes exactly the same text through a StreamHandler subclass or another Handler (for example with the coloring done … |
| engine-defaults | review | `tests/nanolize_contracts/engine_defaults_cb41ff03/bench_engine_defaults.py` | reviewer_veto；bench_trainer_construction builds its own input inside the timed part: it calls trainer_cfg() in the function body, which deep-copies the whole default config with get_cfg() and merges six overrides with merge_from_list. That is work of the config package, not of the default trainer, and it is not negligible next to 30 constructions of a trainer around a 4-to-2 linear model, so the timing also moves whe … |
| model-zoo | review | `tests/nanolize_contracts/model_zoo_b9ca42f9/bench_checkpoint_urls.py` | reviewer_veto；bench_unreleased_names: its docstring does not describe what is timed. setup_unreleased_names derives the names with name.replace("_R_", "_Q_"), but three of the 41 names contain no "_R_" (COCO-Detection/faster_rcnn_X_101_32x8d_FPN_3x, COCO-InstanceSegmentation/mask_rcnn_X_101_32x8d_FPN_3x, COCO-Keypoints/keypoint_rcnn_X_101_32x8d_FPN_3x), so they stay unchanged and are released models: get_checkpoint_u … |
| model-anchor-generator | review | `tests/nanolize_contracts/model_anchor_generator_1426eeeb/bench_anchor_cells.py` | reviewer_veto；Four functions time workloads no user of an anchor generator runs; their sizes are chosen only to make the per-anchor loop show up in the timing. bench_default_cell_anchors_grid asks for 400 sizes x 50 aspect ratios (20,000 anchors per cell) and bench_rotated_cell_anchors_grid for 100 sizes x 20 ratios x 10 angles (20,000 per cell); bench_default_construct_many_cell_anchors builds a generator with 200 s … |
| model-poolers | review | `tests/nanolize_contracts/model_poolers_b90577b2/bench_pooler_bookkeeping.py` | reviewer_veto；Several workloads are not ones a user of the pooler would run; their sizes or paths are chosen only so that overhead shows up, as the docstrings themselves say ('so that ... dominates'). bench_many_boxes_tiny_outputs: 100000 boxes per image on 1-channel feature maps pooled to 1x1 with sampling ratio 1 is a degenerate configuration no model uses. bench_many_images_few_boxes: a 256-image batch of 64-pixel … |
| zoo-lazy-configs | 3 | `tests/nanolize_contracts/zoo_lazy_configs_90d84a50/test_coco_schedule_loaded.py` | import_only_knockout_failure；With the leaf's functions knocked out this file failed while a module was being imported or collected, before any of its tests ran, so no behavior was measured. Call the leaf's functions inside test functions only: not at the file's top level, in a class body, a default value or the arguments of a decorator. |
| zoo-lazy-configs | 3 | `tests/nanolize_contracts/zoo_lazy_configs_90d84a50/test_baseline_1x_loaded.py` | import_only_knockout_failure；With the leaf's functions knocked out this file failed while a module was being imported or collected, before any of its tests ran, so no behavior was measured. Call the leaf's functions inside test functions only: not at the file's top level, in a class body, a default value or the arguments of a decorator. |

没有迁移成的原测试：

| 原测试 | 叶子 | 状态 | 设计者给的理由 |
| --- | --- | --- | --- |
| `tests/modeling/test_roi_heads.py::ROIHeadsTest::test_PointRend_mask_head_tracing` | export-torchscript | unverifiable | It builds PointRendMaskHead from detectron2.projects.point_rend, an import outside the external contract; the part reachable here (a mask head traced under patch_builtin_len serves other box counts) is tested with MaskRCNNConvUpsampleHead in test_mask_head_tracing.py. |

封存时就定下的上限（这些缺口之后的工具关不掉，原样）：

| 缺口 | 原因 | 涉及 |
| --- | --- | --- |
| behavior_obligations_incomplete | no_valid_test | {"capabilities": ["datasets-registry"]} |
| behavior_obligations_incomplete | no_case_on_original | {"capabilities": ["layers-mask-ops"]} |
| original_checks_not_verified | original_tests_unverified | {"checks": 7, "tests": 1} |

## 8. 性能验收

性能契约在封存时和行为契约一起定下：每个基准文件由测试设计者写，在冻结阶段先在原版上试跑（原版、原版再一次、把这个叶子故意减慢一倍的原版），能测出减慢的函数才成为验收标准。之后每个通过了行为检查的候选都和原版在同一台机器上对比。计时基准比较耗时，计数基准比较某个操作被执行的次数。

| 项目 | 内容 |
| --- | --- |
| 设置（原样） | `{"max_repairs": 2, "repetitions": 5, "slowdown_factor": 1.0, "tolerance_percent": 20}` |
| 基准文件 | 111 个：计时 74 个，计数 37 个 |
| 基准函数 / 其中是验收标准的 | 585 / 582 |
| 有标准的叶子 / 契约里的叶子 / 没有标准的叶子 | 51 / 55 / 4 |
| 不算标准的基准（按原因） | `{"slowdown_not_detected": 1, "too_noisy": 2}` |
| 因为噪声放宽了允许值的 | 5 |
| 冻结阶段试跑基准用的时间（契约记下的 `validation_seconds`） | 9752 秒（162.5 分钟） |

没有性能标准的叶子和原因（设计者写的理由是原文）：

| 叶子 | 情况 | 理由 |
| --- | --- | --- |
| datasets-registry | 设计者放弃 | Registration runs once while detectron2.data is imported and cannot be repeated through the contract; the only calls left are loaders whose time is directory listing and file reading, not this leaf's own work. |
| packaging | 设计者放弃 | setup.py is a build script run once per install; its own functions only read one file and glob a few directories, so a run is dominated by setuptools, torch import and file copying, and a slower leaf would not show in any timed workload. |
| zoo-lazy-configs | 设计者放弃 | The leaf is declarative config data; its only function builds one small schedule config when a file is loaded, and loading or instantiating a config spends its time in LazyConfig, instantiate and the model classes of other leaves. |
| native-ops | 不设计 | `internal_capability` |

每个叶子的基准（点开看每个基准函数和它测的内容，原文）：

| 叶子 | 计时基准 | 计数基准 | 文件 |
| --- | --- | --- | --- |
| checkpointing | 5 | 7 | `count_checkpointing.py`、`bench_checkpointing.py` |
| config-lazy | 15 | 7 | `count_lazy_calls.py`、`bench_lazy_objects.py`、`bench_lazy_config_files.py` |
| config-yacs | 6 | 4 | `count_configurable_calls.py`、`bench_config_yacs.py` |
| data-catalog | 9 | 7 | `count_catalog.py`、`bench_catalog_metadata.py`、`bench_catalog_registry.py` |
| data-detection-utils | 16 | 7 | `count_transform_calls.py`、`bench_image_io.py`、`bench_annotations.py` |
| data-loading | 11 | 9 | `count_data_loading.py`、`bench_data_loading_core.py`、`bench_data_loading_pipeline.py` |
| data-transforms | 7 | 0 | `bench_transforms.py` |
| datasets-cityscapes | 3 | 0 | `bench_cityscapes_semantic_panoptic.py`、`bench_cityscapes_instances.py` |
| datasets-coco | 14 | 6 | `count_coco_conversion_loads.py`、`bench_coco_loading.py`、`bench_coco_conversion.py` |
| datasets-lvis | 4 | 3 | `count_lvis.py`、`bench_lvis_meta.py`、`bench_lvis_load.py` |
| datasets-pascal-voc | 2 | 4 | `count_voc_class_lookups.py`、`bench_load_voc.py` |
| engine-defaults | 1 | 3 | `count_engine_defaults.py`、`bench_trainer_train.py` |
| engine-distributed | 4 | 4 | `count_launch_calls.py`、`bench_comm_helpers.py` |
| engine-train-loop | 5 | 8 | `count_train_loop_work.py`、`bench_train_loop.py` |
| eval-coco | 3 | 0 | `bench_coco_eval.py` |
| eval-framework | 6 | 5 | `count_eval_calls.py`、`bench_eval_loop.py` |
| export-torchscript | 3 | 2 | `count_tracing_adapter.py`、`bench_flatten.py` |
| layers-deform-conv | 7 | 7 | `count_deform_conv.py`、`bench_deform_conv.py` |
| layers-losses | 7 | 0 | `bench_box_losses.py` |
| layers-mask-ops | 6 | 0 | `bench_mask_ops.py` |
| layers-nms | 7 | 0 | `bench_nms.py` |
| layers-norm-blocks | 15 | 6 | `count_norm_blocks.py`、`bench_norm_forward.py`、`bench_norm_build.py` |
| layers-roi-align | 6 | 0 | `bench_roi_align.py` |
| layers-wrappers | 10 | 8 | `count_wrappers.py`、`bench_conv2d_forward.py`、`bench_tensor_wrappers.py` |
| model-anchor-generator | 4 | 7 | `count_anchor_generator_reads.py`、`bench_anchor_forward.py` |
| model-backbones | 16 | 10 | `count_backbone_work.py`、`bench_backbone_build.py`、`bench_backbone_forward.py` |
| model-box-regression | 0 | 12 | `count_box_regression_tensor_ops.py`、`count_box_regression_classes_and_calls.py` |
| model-cascade-rcnn | 3 | 3 | `count_cascade_calls.py`、`bench_cascade_forward.py` |
| model-dense-detectors | 4 | 3 | `count_dense_detector_calls.py`、`bench_dense_detector_workloads.py` |
| model-keypoint-head | 5 | 5 | `count_keypoint_head.py`、`bench_keypoint_head.py` |
| model-mask-head | 6 | 4 | `count_mask_head.py`、`bench_mask_head.py` |
| model-matcher-sampling | 8 | 0 | `bench_matcher_sampling.py` |
| model-poolers | 6 | 6 | `count_pooler_work.py`、`bench_pooler_forward.py` |
| model-proposal-generators | 14 | 7 | `count_rpn_calls.py`、`bench_rpn_proposal_selection.py`、`bench_rpn_module.py` |
| model-rcnn | 4 | 4 | `count_model_rcnn_calls.py`、`bench_model_rcnn.py` |
| model-roi-heads | 14 | 7 | `count_roi_heads_calls.py`、`bench_fast_rcnn_outputs.py`、`bench_roi_heads_forward.py` |
| model-rotated-rcnn | 3 | 0 | `bench_rotated_rcnn.py` |
| model-semantic-panoptic | 4 | 2 | `count_semantic_panoptic.py`、`bench_semantic_panoptic.py` |
| model-zoo | 5 | 0 | `bench_checkpoint_url_lookups.py`、`bench_missing_configs.py` |
| solver | 11 | 0 | `bench_solver_param_groups.py`、`bench_solver_schedules.py` |
| struct-boxes | 19 | 0 | `bench_boxes_pairwise.py`、`bench_boxes_methods.py`、`bench_boxmode_convert.py` |
| struct-image-list | 8 | 6 | `count_image_list_work.py`、`bench_image_list_batching.py`、`bench_image_list_access.py` |
| struct-instances | 10 | 9 | `count_instances_field_work.py`、`bench_instances_core.py`、`bench_instances_attribute_fields.py` |
| struct-keypoints | 7 | 0 | `bench_keypoints_decode.py`、`bench_keypoints_encode.py`、`bench_keypoints_ops.py` |
| struct-masks | 13 | 3 | `count_polygon_conversions.py`、`bench_polygon_masks.py`、`bench_bit_masks.py` |
| struct-rotated-boxes | 12 | 0 | `bench_rotated_iou.py`、`bench_rotated_box_ops.py` |
| utils-collect-env | 1 | 3 | `count_collect_env_work.py`、`bench_collect_env_report.py` |
| utils-events | 11 | 0 | `bench_events_storage.py`、`bench_events_writers.py` |
| utils-foundation | 5 | 6 | `count_utils_foundation.py`、`bench_utils_foundation.py` |
| utils-logging | 6 | 3 | `count_logging_writes.py`、`bench_rate_limited_logging.py` |
| utils-testing | 10 | 7 | `count_utils_testing_calls.py`、`bench_utils_testing_compute.py`、`bench_utils_testing_reload.py` |

<details><summary>checkpointing：12 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `test_load_writes_model_and_each_checkpointable_at_most_once` | 计数 | 是 | – | – | Counts the state loads a single load of a two-layer checkpoint file hands to the model and to each of two extra checkpointable objects: at most one each. |
| `test_repeated_loads_write_model_once_per_load` | 计数 | 是 | – | – | Counts the state loads handed to the model over three loads of one two-layer checkpoint file, plain and with heuristic name matching: at most one for each load. |
| `test_model_state_reads_do_not_grow_with_number_of_weights` | 计数 | 是 | – | – | Counts how often one load with heuristic name matching reads the whole model state, for a model of 2 layers and one of 16 layers: the larger model is read no more often than the smaller. |
| `test_save_reads_model_and_each_checkpointable_at_most_once` | 计数 | 是 | – | – | Counts the state reads one save makes on a two-layer model and on each of two extra checkpointable objects: at most one each, and none when saving to disk is switched off. |
| `test_periodic_checkpointer_saves_once_per_period_and_once_at_end` | 计数 | 是 | – | – | Counts the saves a periodic checkpointer with period 5 asks of its checkpointer over 20 iterations, and the model state reads they cause: at most one per full period plus one final save. |
| `test_periodic_checkpointer_saves_double_when_iterations_double` | 计数 | 是 | – | – | Counts the saves a periodic checkpointer with period 4 and no final iteration asks for over 16 and over 32 iterations: doubling the iterations at most doubles the saves. |
| `test_align_item_lookups_grow_linearly_with_number_of_weights` | 计数 | 是 | – | – | Counts the item lookups that matching unprefixed checkpoint names to prefixed model names makes on both state dicts, for 8 and 16 layers (16 and 32 weights): doubling the weights at most doubles the lookups. |
| `bench_align_plain_names` | 计时 | 是 | 20 | 1.7 | Matching about 520 checkpoint weight names without renaming to a model state of about 570 longer, prefixed names of tiny tensors. |
| `bench_align_caffe2_names` | 计时 | 是 | 20 | 1.7 | Renaming about 570 Caffe2 Detectron blob names (backbone, FPN, RPN, box and mask heads) and matching them to a model state of about 570 names of tiny tensors. |
| `bench_load_pth_exact_names` | 计时 | 是 | 20 | 7.5 | Loading, five times in a row, a small checkpoint file of about 570 tiny tensors whose names equal the model's, without heuristic matching. |
| `bench_load_pth_matching_heuristics` | 计时 | 是 | 20 | 1.4 | Loading a small checkpoint file of about 520 tiny tensors with unprefixed names into a model with prefixed names, with heuristic matching requested in the path. |
| `bench_load_caffe2_pickle` | 计时 | 是 | 20 | 1.5 | Loading a Caffe2 ImageNet pickle of about 520 tiny arrays plus momentum blobs into a ResNet-101 like model, with names converted and matched. |

</details>

<details><summary>config-lazy：22 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `test_describing_calls_runs_no_target` | 计数 | 是 | – | – | Describing 50 calls lazily, each with a nested described call, must not run any of the described functions. |
| `test_instantiate_runs_each_described_call_at_most_once` | 计数 | 是 | – | – | Instantiating a list of 20 described calls that each nest one more must run at most 40 functions, and at most 80 for a list of 40. |
| `test_instantiate_plain_dicts_runs_each_target_at_most_once` | 计数 | 是 | – | – | Instantiating a plain dict tree of 31 described calls five levels deep must run at most 31 functions. |
| `test_config_without_calls_runs_nothing_when_instantiated` | 计数 | 是 | – | – | Instantiating a config whose 30 entries describe no call must run no function, even beside one lazily described call kept elsewhere. |
| `test_save_override_and_print_run_no_target` | 计数 | 是 | – | – | Saving to YAML, loading it back, applying 3 overrides and printing as Python a config of 10 described calls must run none of the described functions. |
| `test_load_executes_each_config_file_at_most_once_per_import` | 计数 | 是 | – | – | Loading a config file that imports two others, which both import one shared file it also loads by relative path, must execute each at most once per import; a second load at most doubles that. |
| `test_load_with_keys_executes_the_file_at_most_once` | 计数 | 是 | – | – | Loading one config file asking for a single key, then for a tuple of two keys, must execute the file at most once for each of the two loads. |
| `bench_build_lazy_calls` | 计时 | 是 | 20 | 1.9 | Describing 300 calls lazily, each with five keyword arguments including a short list and a small dict, without running any of them. |
| `bench_build_nested_lazy_calls` | 计时 | 是 | 20 | 2.0 | Describing 100 calls lazily where each argument list nests three further lazy calls, one of them of a dataclass. |
| `bench_instantiate_lazy_tree` | 计时 | 是 | 20 | 1.5 | Instantiating a tree of lazily described calls with 341 nested objects in lists four levels deep plus 85 small function calls. |
| `bench_instantiate_plain_tree` | 计时 | 是 | 20 | 3.4 | Instantiating a tree given as plain dicts and lists with 5461 nested objects six levels deep plus 1365 small function calls. |
| `bench_instantiate_string_targets` | 计时 | 是 | 20 | 3.4 | Instantiating a plain list of 900 descriptions whose targets are dotted names given as strings, each nesting one more such description. |
| `bench_instantiate_config_list` | 计时 | 是 | 20 | 2.8 | Instantiating a config list of 200 lazily described calls, each with one nested call, followed by 100 plain mappings left as they are. |
| `bench_instantiate_passthrough` | 计时 | 是 | 20 | 1.9 | Instantiating inputs that describe no call: 1000 times a config of 400 plain sections, and once a list of 10000 short lists of numbers and strings. |
| `bench_dump_dataclasses` | 计时 | 是 | 20 | 5.5 | Dumping 1500 dataclass objects into instantiable dicts, each holding a nested dataclass, a list of six more and one further nested level. |
| `bench_load_python_config` | 计时 | 是 | 20 | 2.2 | Loading a Python config file with 53 top-level entries that relatively imports 12 other config files in two directory levels, each of which imports one shared file. |
| `bench_load_selected_keys` | 计时 | 是 | 20 | 1.9 | Loading a small Python config file 20 times, half of the times asking for one key and half for a tuple of two keys. |
| `bench_load_relative_to_caller` | 计时 | 是 | 20 | 4.9 | Loading a Python config file that itself loads 41 other small config files by a path relative to its own location. |
| `bench_save_yaml` | 计时 | 是 | 20 | 2.4 | Saving to YAML a config of 12 groups that hold 120 lazily described calls, each with one nested call and a short list. |
| `bench_load_yaml` | 计时 | 是 | 20 | 2.3 | Loading back a saved YAML config of 12 groups that hold 120 described calls, each with one nested call and a short list. |
| `bench_apply_overrides` | 计时 | 是 | 20 | 2.8 | Applying 96 command-line style overrides to a config of 12 groups: existing values, new nested keys, lists, strings and small dicts. |
| `bench_to_python_text` | 计时 | 是 | 20 | 7.4 | Printing as Python code a config of 12 groups that hold 120 lazily described calls, each with one nested call and a short list. |

</details>

<details><summary>config-yacs：10 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `test_class_built_from_cfg_calls_from_config_and_init_once_each` | 计数 | 是 | – | – | Counts how often the argument translator and the constructor body run when a configurable class is built 1, 10 and 20 times from a two-key config. |
| `test_class_built_from_explicit_arguments_never_calls_from_config` | 计数 | 是 | – | – | Counts how often the argument translator and the constructor body run when a configurable class is built 10 times from explicit arguments. |
| `test_function_called_with_cfg_calls_from_config_and_itself_once_each` | 计数 | 是 | – | – | Counts how often the argument translator and the function body run for 10 and 20 calls of a configurable function with a one-key config, and for 10 explicit calls. |
| `test_decorating_calls_nothing` | 计数 | 是 | – | – | Counts the user callbacks run merely by making one class and one function configurable and fetching the default config once. |
| `bench_get_cfg_copies` | 计时 | 是 | 20 | 9.7 | Fetch a fresh copy of the full default config tree 40 times in a row. |
| `bench_dump_defaults` | 计时 | 是 | 20 | 5.3 | Dump the full default config tree (192 values in 28 sections) to YAML text 5 times. |
| `bench_merge_full_file` | 计时 | 是 | 20 | 10.9 | Merge one YAML file of the latest version that names all 192 default keys into the default config, 3 times. |
| `bench_merge_small_file_with_base` | 计时 | 是 | 20 | 10.9 | Merge a five-key YAML file that inherits a four-key base file into fresh default configs, 30 times. |
| `bench_version_round_trip` | 计时 | 是 | 20 | 6.5 | Downgrade the full default config from version 2 to version 0 and upgrade it back, 20 times. |
| `bench_configurable_calls` | 计时 | 是 | 20 | 12.5 | Build a small configurable class from a two-key config 3000 times and call a configurable function with it 3000 times, each with one extra keyword. |

</details>

<details><summary>data-catalog：16 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `test_loader_runs_only_when_dataset_is_fetched` | 计数 | 是 | – | – | Counts how often a registered dataset's loader runs: never for registering, listing or describing the catalog, and at most once for each of 8 fetches by name. |
| `test_loader_runs_grow_no_faster_than_fetches` | 计数 | 是 | – | – | Counts loader runs for 10 and for 20 fetches of one registered dataset: doubling the number of fetches at most doubles the number of runs. |
| `test_removed_dataset_loader_is_not_run_again` | 计数 | 是 | – | – | Counts loader runs around removing a dataset: 3 fetches run it at most 3 times, and removing it and failing to fetch it afterwards adds no run. |
| `test_metadata_value_compared_at_most_once_per_assignment` | 计数 | 是 | – | – | Counts equality checks on a stored metadata value: none when it is first stored, and at most one for each of 12 later assignments of the same value to that key. |
| `test_metadata_comparisons_grow_no_faster_than_assignments` | 计数 | 是 | – | – | Counts equality checks on stored metadata values for 5 and for 10 repeated assignments of an equal value: doubling the assignments at most doubles the checks made on either value. |
| `test_metadata_reads_and_export_do_not_copy_or_compare_values` | 计数 | 是 | – | – | Counts copies and equality checks of a stored metadata value during 20 lookups by key and 20 exports as a dictionary: none of either is made. |
| `test_metadata_catalog_keeps_one_entry_per_name` | 计数 | 是 | – | – | Counts metadata catalog entries after asking 15 times each for 4 and then 8 new dataset names: the catalog grows by at most one entry per name, so doubling the names at most doubles the growth. |
| `bench_set_six_keys_on_fresh_metadata` | 计时 | 是 | 20 | 5.0 | Storing six metadata entries (class names, colors, id map, evaluator type, two paths) in one call on each of 6000 freshly made, empty dataset metadata objects. |
| `bench_add_keys_one_by_one` | 计时 | 是 | 20 | 4.3 | Adding 60 new metadata keys one after another, each in a call of its own, to each of 160 dataset metadata objects that start empty. |
| `bench_reassign_equal_values` | 计时 | 是 | 20 | 2.4 | Setting six already stored metadata entries again to equal values (lists and a map of 80 items, three strings), 20000 times on one dataset metadata object, which checks each for consistency. |
| `bench_get_present_keys` | 计时 | 是 | 20 | 4.5 | Looking up six stored metadata entries by key with a default, 100000 rounds (600000 lookups) on one dataset metadata object holding six entries. |
| `bench_get_missing_keys` | 计时 | 是 | 20 | 3.0 | Looking up four metadata keys that are not stored, with a default to fall back on, 10000 rounds (40000 lookups) on one dataset metadata object holding six entries. |
| `bench_as_dict` | 计时 | 是 | 20 | 5.7 | Exporting all entries of one dataset metadata object that holds 50 entries as a dictionary, 200000 times. |
| `bench_dataset_register_get_remove` | 计时 | 是 | 20 | 0.7 | Registering 20000 datasets by name with a trivial loader, fetching each one's records five times by name, and removing all 20000 again. |
| `bench_metadata_catalog_get_and_remove` | 计时 | 是 | 20 | 5.0 | Asking the metadata catalog for 3000 dataset names it has not seen (creating their metadata), asking for each of them 30 more times, and removing all 3000 again. |
| `bench_list_and_describe_catalogs` | 计时 | 是 | 20 | 2.9 | With 300 extra datasets registered in both catalogs: listing the registered names and rendering each catalog as text, 1500 times each, then removing the 300 datasets again. |

</details>

<details><summary>data-detection-utils：23 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `test_box_only_annotation_asks_transform_once` | 计数 | 是 | – | – | One annotation that holds only a box is transformed: the transform is asked for the box at most once, for coordinates at most once, and never for a mask or an image. |
| `test_polygon_annotation_coordinate_calls_bounded_by_polygons` | 计数 | 是 | – | – | One annotation with a box, 5 polygons and 17 keypoints is transformed: the transform is asked for coordinates at most once for each polygon plus once for the box and once for the keypoints. |
| `test_polygon_annotation_coordinate_calls_at_most_double_with_polygons` | 计数 | 是 | – | – | One annotation is transformed with 8 polygons and then with 16: the number of times the transform is asked for coordinates at most doubles. |
| `test_keypoint_calls_do_not_grow_with_keypoint_number` | 计数 | 是 | – | – | One annotation with a box and keypoints is transformed with 4 keypoints and then with 256: the transform is asked for coordinates at most twice in both cases. |
| `test_run_length_mask_asks_each_transform_once` | 计数 | 是 | – | – | One annotation with a run-length encoded 40x30 mask is transformed by a list of three transforms: each is asked for the mask at most once and for the box at most once. |
| `test_proposals_are_transformed_in_one_batch` | 计数 | 是 | – | – | The proposals of one dataset record are transformed for 10 proposals and then for 2000: the transform is asked for boxes at most once in both cases, whatever the number of proposals. |
| `test_record_without_proposals_asks_transform_nothing` | 计数 | 是 | – | – | A dataset record without precomputed proposals is passed on: the transform is asked for nothing at all. |
| `bench_read_png_as_bgr` | 计时 | 是 | 20 | 0.5 | Reading one 640x480 colour picture from a lossless file into blue-green-red channel order, eight times in a row. |
| `bench_read_png_as_yuv` | 计时 | 是 | 20 | 2.1 | Reading one 640x480 colour picture from a lossless file into the luma-chroma format with its matrix conversion, four times in a row. |
| `bench_read_jpeg_with_orientation` | 计时 | 是 | 20 | 2.6 | Reading one 640x480 compressed picture whose metadata asks for a quarter turn, applying that turn and returning colour channels, twenty times in a row. |
| `bench_convert_bgr_to_rgb` | 计时 | 是 | 20 | 0.5 | Converting one 1920x1080 picture of unsigned bytes from blue-green-red order to red-green-blue order, ten times in a row. |
| `bench_convert_yuv_to_rgb` | 计时 | 是 | 20 | 4.1 | Converting one 640x480 floating point picture from the luma-chroma format back to red-green-blue values, four times in a row. |
| `bench_convert_gray_tensor_to_rgb` | 计时 | 是 | 20 | 2.3 | Converting one 1920x1080 single-channel picture held as a float tensor to a red-green-blue byte picture, ten times in a row. |
| `bench_check_image_size` | 计时 | 是 | 20 | 3.0 | Checking a 640x480 picture against 200000 dataset records, half of which state the size and half of which have it filled in. |
| `bench_crop_around_instance` | 计时 | 是 | 20 | 3.5 | Choosing a 224x224 crop window inside a 640x480 picture that contains the centre of an instance box, for 5000 instance boxes. |
| `bench_transform_polygon_keypoint_annotations` | 计时 | 是 | 20 | 1.6 | Applying a horizontal flip and a resize to 1000 instance annotations, each with a box, two polygons and 17 keypoints that swap sides. |
| `bench_transform_run_length_mask_annotations` | 计时 | 是 | 20 | 1.2 | Applying a horizontal flip and a resize to 40 instance annotations whose masks are run-length encoded 640x480 images, giving 800x600 mask arrays. |
| `bench_instances_from_polygon_annotations` | 计时 | 是 | 20 | 0.7 | Building the ground-truth boxes, classes, polygon masks and keypoints of one image from 3000 instance annotations with two polygons and 17 keypoints each. |
| `bench_instances_from_bitmask_annotations` | 计时 | 是 | 20 | 6.9 | Building the ground-truth boxes, classes and bit masks of one 320x240 image from 240 instance annotations given as polygons, run-length encodings and mask arrays in equal parts. |
| `bench_instances_from_rotated_annotations` | 计时 | 是 | 20 | 3.4 | Building the clipped rotated ground-truth boxes and classes of one image from 60000 rotated-box annotations. |
| `bench_filter_empty_instances` | 计时 | 是 | 20 | 0.9 | Dropping the instances with an empty box or an empty mask from 2000 instances with 64x64 bit masks, eight times, each time also returning which were kept. |
| `bench_transform_proposals` | 计时 | 是 | 20 | 0.5 | Flipping, resizing, clipping and size-filtering the 20000 precomputed proposals of each of 20 dataset records and keeping the first 1000 of each. |
| `bench_keypoint_flip_indices` | 计时 | 是 | 20 | 6.5 | Working out the left-right swapped keypoint order for two built-in person keypoint datasets with 17 keypoints, 5000 times. |

</details>

<details><summary>data-loading：20 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `test_map_dataset_calls_map_function_once_per_item` | 计数 | 是 | – | – | A mapped dataset of 50 and of 100 items is read once by index and the calls of the map function are counted: at most one per item read. |
| `test_map_dataset_fallback_calls_map_function_twice_for_one_rejected_item` | 计数 | 是 | – | – | A mapped dataset of 20 items in which the map function rejects one item is read at that item: the map function is called at most twice, and at most 21 times more for a pass over all 20. |
| `test_dataset_from_list_serializes_once` | 计数 | 是 | – | – | A list dataset of 30 items is built with a given serialize function and every item is read twice: the serialize function is called at most once. |
| `test_to_iterable_dataset_reads_each_sampled_item_once` | 计数 | 是 | – | – | A mapped dataset of 40 and of 80 items is iterated once through an iterable dataset with a sequential sampler: at most one call of the map function per item, and stopping after 10 items costs at most 10 calls. |
| `test_aspect_ratio_grouping_consumes_only_what_batches_need` | 计数 | 是 | – | – | Three batches of 4 are taken from aspect-ratio grouping over a counted stream of 100 records, every third one tall: at most 3*4 plus 3 records are consumed. |
| `test_test_loader_maps_each_item_once` | 计数 | 是 | – | – | A test loader over 24 and over 48 records in batches of 4 is iterated once without worker processes: the mapper is called at most once per record, so doubling the records at most doubles the calls. |
| `test_train_loader_maps_only_what_batches_need` | 计数 | 是 | – | – | Five batches of 4 are taken from a training loader over 60 records, every third one tall, with and without aspect-ratio grouping and no worker processes: the mapper is called at most 5*4 plus 4 times. |
| `test_dataset_mapper_applies_each_augmentation_once_per_record` | 计数 | 是 | – | – | The dataset mapper with one counting augmentation maps one 8x6 image record with one box 3 and then 6 times: the augmentation is asked for a transform at most once per mapped record. |
| `test_get_detection_dataset_dicts_loads_each_dataset_once` | 计数 | 是 | – | – | Two registered datasets of 10 records each are loaded together with filtering: the function registered for each dataset is called at most once. |
| `bench_serialize_list` | 计时 | 是 | 20 | 3.8 | Wrapping a list of 30000 annotated image records into a list dataset with the default serialization. |
| `bench_read_serialized_items` | 计时 | 是 | 20 | 2.8 | Reading every one of 10000 annotated image records by index from a serialized list dataset. |
| `bench_map_dataset_items` | 计时 | 是 | 20 | 6.4 | Reading each of 20000 items five times by index from a mapped dataset over an unserialized list with a trivial map function. |
| `bench_map_dataset_fallback` | 计时 | 是 | 86 | 68.2 | Reading 20000 items by index from a mapped dataset whose map function rejects every twentieth item, so another item is tried in its place. |
| `bench_repeat_factors_from_frequency` | 计时 | 是 | 20 | 14.7 | Computing per-image repeat factors from category frequency for 30000 image records with 1 to 6 annotations each. |
| `bench_repeat_factor_sampler_stream` | 计时 | 是 | 20 | 0.8 | Drawing the first 120000 indices from a shuffled repeat-factor sampler over 4000 images with factors between 1 and 3. |
| `bench_get_dataset_dicts` | 计时 | 是 | 20 | 1.6 | Loading a registered dataset of 4000 image records with filtering of crowd-only images and of images with under 6 visible keypoints, and the class histogram. |
| `bench_dataset_mapper_calls` | 计时 | 是 | 20 | 2.9 | Mapping 100 training records of one 64x48 image with 8 polygon annotations each through the dataset mapper with a resize and a flip. |
| `bench_to_iterable_dataset` | 计时 | 是 | 20 | 2.1 | Iterating once over a serialized list dataset of 20000 image records turned into an iterable dataset with a sequential sampler. |
| `bench_train_loader_batches` | 计时 | 是 | 20 | 1.9 | Taking the first 600 aspect-ratio grouped batches of 16 from a training loader over 20000 image records with a trivial mapper and no worker processes. |
| `bench_test_loader_pass` | 计时 | 是 | 20 | 2.0 | One full pass in batches of 16 over a test loader of 8000 image records with a trivial mapper and no worker processes. |

</details>

<details><summary>data-transforms：7 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `bench_resize_uint8` | 计时 | 是 | 20 | 1.0 | Bilinear resize of one 480x640 three-channel 8-bit image to 800x1067, done five times. |
| `bench_resize_float` | 计时 | 是 | 20 | 2.6 | Bilinear resize of one 480x640 three-channel float image to 800x1067, done five times. |
| `bench_rotation` | 计时 | 是 | 20 | 7.9 | Building a 30 degree rotation of a 480x640 image and applying it to the image and to 200000 points, five times. |
| `bench_extent` | 计时 | 是 | 20 | 2.2 | Extracting a 400x500 window of a 480x640 image scaled to 800x1000 and mapping 200000 points, five times. |
| `bench_output_shape` | 计时 | 是 | 20 | 2.0 | Computing the shortest-edge output size for 20000 different input sizes. |
| `bench_pipeline` | 计时 | 是 | 20 | 5.6 | A pipeline of shortest-edge resize, flip, fixed-size crop and rotation applied ten times to a 240x320 image with 50 boxes and a label map. |
| `bench_policies_and_repr` | 计时 | 是 | 20 | 2.8 | Creating eight builtin augmentations, printing them and sampling their transforms for a small image, 300 times. |

</details>

<details><summary>datasets-cityscapes：3 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `bench_semantic_split` | 计时 | 是 | 20 | 2.3 | Load the semantic segmentation split of 600 images in 10 cities, reading the size of every image from its small annotation file. |
| `bench_panoptic_split` | 计时 | 是 | 20 | 8.8 | Load the panoptic split of 600 images in 10 cities with 40 segments each from one annotation file, converting every segment's category id. |
| `bench_instance_split` | 计时 | 是 | 20 | 2.8 | Load the instance split of 96 images in 4 cities, each with 60 overlapping polygons of things and stuff, into dataset dicts with polygon masks. |

</details>

<details><summary>datasets-coco：20 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `test_conversion_to_dict_loads_dataset_at_most_once_whatever_its_size` | 计数 | 是 | – | – | Converting a registered dataset to a COCO dictionary asks the dataset's loading function for its data at most once, for 4 images and for 8 images alike. |
| `test_repeated_conversion_to_dict_loads_once_per_conversion` | 计数 | 是 | – | – | Converting the same registered dataset of 3 images to a COCO dictionary three times asks its loading function for the data at most three times. |
| `test_cached_json_file_is_reused_without_loading_again` | 计数 | 是 | – | – | Writing the COCO json file of a registered dataset of 5 images loads the dataset at most once, and three further requests with caching allowed load it no more. |
| `test_existing_json_file_means_dataset_is_never_loaded` | 计数 | 是 | – | – | When the output json file exists before the first request and caching is allowed, two requests for a dataset of 5 images never call its loading function. |
| `test_uncached_json_writes_load_once_per_write` | 计数 | 是 | – | – | With caching turned off, writing the COCO json file of a dataset of 5 images three times loads the dataset at most once for each write. |
| `test_registering_metadata_for_known_dataset_loads_nothing` | 计数 | 是 | – | – | Registering COCO-instances metadata twice under a name whose dataset is already in the catalog never calls that dataset's loading function, and a later fetch calls it at most once. |
| `bench_load_boxes` | 计时 | 是 | 20 | 3.3 | Load a COCO instances file of 3000 images with 20 box annotations each (60000 boxes, 20 categories) into dataset dicts, without a dataset name. |
| `bench_load_polygons_named` | 计时 | 是 | 20 | 9.7 | Load a COCO instances file of 2000 images with 20 annotations each (40000), every one with two polygons, under a dataset name so that category ids are mapped to contiguous ids. |
| `bench_load_keypoints` | 计时 | 是 | 20 | 5.2 | Load a COCO person-keypoints file of 2000 images with 10 annotations of 17 keypoints each (340000 keypoints), with two extra annotation keys kept. |
| `bench_load_sem_seg_matching` | 计时 | 是 | 20 | 4.1 | Pair 15000 ground-truth segmentation files with 15000 image files of the same names from two flat directories of empty files. |
| `bench_load_sem_seg_mismatched` | 计时 | 是 | 20 | 3.5 | Pair 8000 ground-truth segmentation files with 10000 image files, of which only the 8000 with a ground-truth file of the same name are kept. |
| `bench_registered_instances` | 计时 | 是 | 20 | 6.6 | Fetch from the dataset catalog a dataset registered from a COCO instances file of 2000 images with 20 box annotations each (40000), which loads the file on each fetch. |
| `bench_registered_panoptic` | 计时 | 是 | 20 | 3.8 | Fetch from the dataset catalog a panoptic dataset registered from a panoptic annotation file of 4000 images with 20 segments each, half things and half stuff, which loads the file on each fetch. |
| `bench_registered_panoptic_separated` | 计时 | 是 | 20 | 5.3 | Fetch from the dataset catalog a separated panoptic dataset of 6000 images, which loads 30000 box annotations, pairs 6000 segmentation files with the images and merges both per image. |
| `bench_convert_xyxy_boxes` | 计时 | 是 | 20 | 1.8 | Convert a registered dataset of 400 images with 10 corner-format box annotations each (4000 boxes, 10 categories with mapped ids) to a COCO dictionary. |
| `bench_convert_xywh_boxes` | 计时 | 是 | 20 | 0.5 | Convert a registered dataset of 400 images with 10 box annotations each already in COCO's box format (4000 boxes) to a COCO dictionary. |
| `bench_convert_polygons` | 计时 | 是 | 20 | 1.6 | Convert a registered dataset of 400 images with 10 annotations each, every one with a box and two polygons (4000 instances), to a COCO dictionary with areas computed from the polygons. |
| `bench_convert_keypoints` | 计时 | 是 | 20 | 1.0 | Convert a registered dataset of 400 images with 10 annotations of a box and 17 keypoints each (68000 keypoints) to a COCO dictionary. |
| `bench_convert_images_only` | 计时 | 是 | 20 | 1.8 | Convert a registered dataset of 300000 images without any annotation to a COCO dictionary. |
| `bench_write_json_uncached` | 计时 | 是 | 20 | 1.0 | Convert a registered dataset of 400 images with 10 box annotations each to a COCO json file with caching turned off, so that the file is written anew. |

</details>

<details><summary>datasets-lvis：7 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `test_one_load_opens_the_file_at_most_once` | 计数 | 是 | – | – | Counts how often the annotation file is opened by one load of a file with 10 images and 30 annotations: at most once. |
| `test_opens_do_not_grow_with_the_number_of_images` | 计数 | 是 | – | – | Counts annotation file opens for a load of 10 images and one of 40 images: at most one each, however many images the file holds. |
| `test_registering_opens_nothing_and_each_get_opens_at_most_once` | 计数 | 是 | – | – | Counts annotation file opens when 5 datasets are registered and one of them is fetched 3 times: none for registering, at most one for each fetch. |
| `bench_meta_v1_lookup` | 计时 | 是 | 20 | 2.7 | Building the LVIS v1 metadata (1203 class names and image counts) 40 times in a row. |
| `bench_meta_v0_5_lookup` | 计时 | 是 | 20 | 8.5 | Building the LVIS v0.5 metadata (1230 class names) 40 times in a row. |
| `bench_load_plain` | 计时 | 是 | 20 | 6.7 | Loading an LVIS annotation file of 1500 images with 12 two-polygon annotations each into dataset dicts, without a dataset name. |
| `bench_load_named_with_extra_keys` | 计时 | 是 | 20 | 6.9 | Loading an LVIS annotation file of 1500 images with 12 annotations each under a v1 dataset name, copying two extra annotation keys. |

</details>

<details><summary>datasets-pascal-voc：6 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `test_at_most_one_class_lookup_for_each_object` | 计数 | 是 | – | – | Counts position lookups in the given class names while loading 6 images with 5 objects each: at most one for each object. |
| `test_class_lookups_at_most_double_when_objects_double` | 计数 | 是 | – | – | Counts position lookups in the given class names for 4 images with 3 objects and with 6 objects each: doubling the objects at most doubles the lookups. |
| `test_no_class_lookup_for_images_without_objects` | 计数 | 是 | – | – | Counts position lookups in the given class names while loading 5 images that hold no object: none is needed. |
| `test_registration_does_no_lookup_and_each_request_one_per_object` | 计数 | 是 | – | – | Counts position lookups in the given class names when a dataset of 3 images with 4 objects each is registered and then requested twice: none at registration, at most one for each object in each request. |
| `bench_many_small_annotation_files` | 计时 | 是 | 20 | 2.8 | Loading a split of 400 images whose annotation files hold 4 objects each, with the 20 standard class names. |
| `bench_crowded_annotation_files` | 计时 | 是 | 20 | 1.1 | Loading a split of 80 images whose annotation files hold 100 objects each, with the 20 standard class names. |

</details>

<details><summary>engine-defaults：4 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `test_construction_builds_each_part_at_most_once` | 计数 | 是 | – | – | Constructing one default trainer for a tiny model builds the model, optimizer, scheduler and train loader at most once each and draws no batch. |
| `test_training_steps_grow_linearly_with_iterations` | 计数 | 是 | – | – | Training for 6 and for 12 iterations calls the model and draws batches at most once per iteration, so doubling the iterations at most doubles both. |
| `test_evaluation_builds_one_loader_and_evaluator_per_dataset` | 计数 | 是 | – | – | Evaluating a model on 1 and on 3 test datasets of two batches each builds at most one loader and one evaluator per dataset and runs the model at most once per batch. |
| `bench_trainer_train` | 计时 | 是 | 20 | 5.0 | Running 300 training iterations of a default trainer without hooks on a two-output linear model with batches of 3 rows. |

</details>

<details><summary>engine-distributed：8 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `test_inline_launch_calls_main_func_at_most_once` | 计数 | 是 | – | – | Counts how often one launch with a single process on a single machine calls the function it was given. |
| `test_calls_grow_linearly_with_number_of_launches` | 计数 | 是 | – | – | Counts calls of the given function over 10 and then 20 single-process launches; doubling the launches at most doubles the calls. |
| `test_inline_launch_starts_no_thread_or_process` | 计数 | 是 | – | – | Counts the threads alive and the processes and threads that ran the function over 5 single-process launches. |
| `test_rejected_multi_machine_auto_url_never_calls_main_func` | 计数 | 是 | – | – | Counts calls of the given function when a launch for 2 machines with an automatic url is rejected. |
| `bench_rank_queries` | 计时 | 是 | 20 | 6.6 | Asks for the rank of the current process 200000 times in a process without a process group. |
| `bench_world_size_queries` | 计时 | 是 | 20 | 7.6 | Asks for the world size 200000 times in a process without a process group. |
| `bench_synchronize_single_process` | 计时 | 是 | 20 | 6.8 | Calls the barrier helper 200000 times in a single process, where there is nobody to wait for. |
| `bench_inline_launch` | 计时 | 是 | 20 | 5.6 | Launches a do-nothing function 200000 times with one process on one machine, so it runs inline. |

</details>

<details><summary>engine-train-loop：13 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `test_each_hook_method_runs_at_most_once_per_iteration` | 计数 | 是 | – | – | Counts the calls a registered hook receives over 50 and 100 iterations: at most one per step for the step methods, one per run for the others, and doubling the iterations at most doubles them. |
| `test_simple_trainer_uses_loader_model_and_optimizer_once_per_step` | 计数 | 是 | – | – | Counts batches taken from the data loader, model forward passes and optimizer zero_grad and step calls over 40 training iterations: at most one of each per iteration and one iterator for the loader. |
| `test_eval_hook_evaluates_at_most_once_per_period_plus_the_end` | 计数 | 是 | – | – | Counts calls of the evaluation function over 100 iterations with period 10, and over 200: at most one per period plus one after training, and doubling the iterations at most doubles them. |
| `test_periodic_writer_writes_at_most_once_per_period_plus_end_and_closes_once` | 计数 | 是 | – | – | Counts write and close calls on a writer over 100 iterations with period 10: at most one write per period, one at the last step and one before closing, and a single close. |
| `test_periodic_checkpointer_saves_at_most_once_per_period_plus_final` | 计数 | 是 | – | – | Counts checkpoint saves over 60 iterations with period 20: at most one per period and one final save. |
| `test_precise_bn_takes_at_most_num_iter_batches_per_update` | 计数 | 是 | – | – | Counts batches taken and model forward passes by precise batch-norm updates of 5 iterations each, run every 10 of 30 training iterations: at most 5 per update and one iterator over the loader. |
| `test_profiler_predicate_is_asked_at_most_once_per_step` | 计数 | 是 | – | – | Counts calls of a profiler hook's enabling predicate over 50 iterations in which it never enables profiling: at most one per iteration. |
| `test_state_dict_asks_each_hook_once_and_loads_each_state_once` | 计数 | 是 | – | – | Counts state_dict and load_state_dict calls on 20 stateful hooks of distinct classes during one trainer state_dict and one load_state_dict: at most one of each per hook. |
| `bench_loop_with_hooks` | 计时 | 是 | 20 | 2.3 | Runs a 3000-iteration training loop with an empty step and five registered hooks: a timer, two no-op hooks, a callback hook and an evaluation hook of period 100. |
| `bench_simple_trainer_steps` | 计时 | 是 | 20 | 3.3 | Trains a two-parameter model for 300 iterations with the simple trainer, each step doing forward, backward, metric writing and an SGD update. |
| `bench_write_metrics` | 计时 | 是 | 20 | 1.9 | Writes a dict of four scalar losses and a data time to an event storage 2000 times, once per iteration number. |
| `bench_state_dict_round_trip` | 计时 | 是 | 20 | 2.9 | Builds the state dict of a trainer with 40 stateful hooks of distinct classes and loads it back, 200 times. |
| `bench_best_param_group_id` | 计时 | 是 | 20 | 3.5 | Picks the parameter group whose learning rate is summarized, 100 times, for an optimizer with 2000 single-parameter groups and seven distinct learning rates. |

</details>

<details><summary>eval-coco：3 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `bench_fast_eval_evaluate` | 计时 | 是 | 20 | 1.0 | Per-image box evaluation of the fast COCO evaluation for 150 images, 10 categories, 1800 ground-truth boxes and 4500 detections. |
| `bench_fast_eval_accumulate` | 计时 | 是 | 20 | 0.8 | Accumulating precision and recall, repeated 20 times, after the fast COCO evaluation of 150 images, 10 categories and 4500 box detections. |
| `bench_evaluator_process_and_evaluate` | 计时 | 是 | 20 | 4.3 | Collecting box predictions for 150 images with 30 detections each and computing the COCO box metrics with per-category AP over 10 categories. |

</details>

<details><summary>eval-framework：11 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `test_loop_calls_model_and_evaluator_at_most_once_per_batch` | 计数 | 是 | – | – | Counts model calls, evaluator calls and data loader passes for an inference run over 40 batches: at most one model call and one process call per batch, one pass over the loader, one reset and one evaluate. |
| `test_loop_calls_each_callback_at_most_once_per_stage` | 计数 | 是 | – | – | Counts callback calls for an inference run over 40 batches: start and end callbacks at most once, before and after inference callbacks at most once per batch. |
| `test_loop_work_at_most_doubles_when_batches_double` | 计数 | 是 | – | – | Compares the number of model, evaluator and callback calls of inference runs over 30 and 60 batches: doubling the batches at most doubles each count. |
| `test_evaluator_list_members_each_called_at_most_once_per_batch` | 计数 | 是 | – | – | Counts calls received by 8 evaluators given as a list to an inference run over 25 batches: each gets at most one process call per batch, one reset and one evaluate. |
| `test_combined_evaluator_dispatches_each_call_at_most_once_per_member` | 计数 | 是 | – | – | Counts calls a combined evaluator of 16 members forwards for 2 resets, 10 process calls and 3 evaluate calls: each member receives at most as many calls as the combined evaluator did. |
| `bench_inference_loop_no_evaluator` | 计时 | 是 | 20 | 19.4 | Runs the inference loop over 30000 tiny batches with a trivial model and no evaluator, so the time is the per-batch bookkeeping of the loop itself. |
| `bench_inference_loop_evaluator_list` | 计时 | 是 | 20 | 8.4 | Runs the inference loop over 8000 tiny batches with a trivial model and a list of 20 no-op evaluators that each see every batch. |
| `bench_evaluators_process_dispatch` | 计时 | 是 | 20 | 6.1 | Dispatches 40000 process calls and 4000 reset calls through a combined evaluator that wraps 50 no-op evaluators. |
| `bench_evaluators_merge_results` | 计时 | 是 | 20 | 4.2 | Merges the results of 1000 evaluators, each returning 20 distinct keys, into one combined result, thirty times. |
| `bench_print_csv_format_large` | 计时 | 是 | 20 | 9.6 | Formats the copy-paste summary of 1000 tasks that each hold 200 main metrics and 200 per-category metrics. |
| `bench_verify_results_many_expectations` | 计时 | 是 | 20 | 13.1 | Checks 100000 expected metric values, all within tolerance, against results of 500 tasks with 200 metrics each. |

</details>

<details><summary>export-torchscript：5 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `test_model_runs_at_most_once_per_adapter_call` | 计数 | 是 | – | – | Counts how often a tracing adapter runs the wrapped model: none when it is built from two tensors, and at most one run for each of five forward calls. |
| `test_inference_function_runs_at_most_once_per_adapter_call` | 计数 | 是 | – | – | Counts how often a tracing adapter calls the inference function it was given: none at construction and at most one call for each of four forward calls with one tensor. |
| `bench_flatten_nested` | 计时 | 是 | 20 | 6.3 | Flattening a nested structure of 300 dictionaries, each holding lists and tuples with about 25 plain values, into one flat tuple. |
| `bench_rebuild_nested` | 计时 | 是 | 20 | 10.5 | Rebuilding a nested structure of 300 dictionaries with about 25 plain values each from its flat tuple with the schema returned by flattening. |
| `bench_adapter_forward` | 计时 | 是 | 20 | 3.1 | Ten forward calls of a tracing adapter around an identity model whose input and output are a list of 200 dictionaries with three small tensors each. |

</details>

<details><summary>layers-deform-conv：14 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `test_one_forward_calls_norm_and_activation_at_most_once` | 计数 | 是 | – | – | One forward pass of a deformable convolution on 1 image of 2 channels and 6x6 calls the given normalisation and the given activation at most once each. |
| `test_norm_and_activation_calls_do_not_grow_with_batch_size` | 计数 | 是 | – | – | Growing the batch of a deformable convolution forward pass from 2 to 4 to 8 images of 6x6 keeps the given normalisation and activation at one call per pass at most. |
| `test_norm_and_activation_calls_do_not_grow_with_image_size` | 计数 | 是 | – | – | Growing the feature map of a deformable convolution forward pass from 4x4 to 8x8 to 16x16 keeps the given normalisation and activation at one call per pass at most. |
| `test_repeated_forwards_call_norm_and_activation_at_most_once_each_time` | 计数 | 是 | – | – | Running 3 and then 6 more forward passes of one deformable convolution on 2 images of 6x6 calls the given normalisation and activation at most once per pass, so doubling the passes at most doubles the calls. |
| `test_forward_without_norm_calls_only_the_activation` | 计数 | 是 | – | – | One forward pass of a deformable convolution that was given an activation but no normalisation, on 1 image of 6x6, calls the activation at most once. |
| `test_empty_batch_skips_norm_and_activation` | 计数 | 是 | – | – | Forward passes of a deformable convolution on an empty batch (0 images of 6x6), repeated 5 times, never call the given normalisation or activation. |
| `test_modulated_empty_batch_skips_norm_and_activation` | 计数 | 是 | – | – | Forward passes of a modulated deformable convolution on an empty batch (0 images of 6x6), repeated 5 times, never call the given normalisation or activation. |
| `bench_forward_3x3` | 计时 | 是 | 20 | 6.3 | One forward pass of a 3x3 deformable convolution, 32 to 32 channels, on a batch of 4 feature maps of 64x64 with random offsets. |
| `bench_forward_wide_inference` | 计时 | 是 | 20 | 4.0 | One gradient-free forward pass of a 3x3 deformable convolution, 256 to 256 channels, on one feature map of 32x32 with random offsets. |
| `bench_forward_strided_grouped` | 计时 | 是 | 20 | 3.9 | One forward pass of a 3x3 deformable convolution with stride 2 and 2 groups, 64 to 64 channels, on a batch of 4 feature maps of 96x96. |
| `bench_forward_5x5_dilated` | 计时 | 是 | 20 | 1.8 | One forward pass of a 5x5 deformable convolution with dilation 2, 8 to 8 channels, on a batch of 8 feature maps of 48x48. |
| `bench_construct_layers` | 计时 | 是 | 20 | 1.5 | Constructing 4 plain and 4 modulated deformable convolution layers of 256 to 256 channels with 3x3 kernels, including weight initialisation. |
| `bench_extra_repr` | 计时 | 是 | 20 | 4.5 | Building the parameter summary text of one plain and one modulated deformable convolution layer, 5000 times each. |
| `bench_empty_batch_forward` | 计时 | 是 | 20 | 1.6 | Forward passes on an empty batch (0 images of 16 channels, 32x32), 1500 times through a plain and 1500 times through a modulated deformable convolution. |

</details>

<details><summary>layers-losses：7 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `bench_diou_large_none` | 计时 | 是 | 20 | 9.7 | Distance-IoU loss without reduction for one batch of one million box pairs with random overlap. |
| `bench_ciou_large_none` | 计时 | 是 | 20 | 4.7 | Complete-IoU loss without reduction for one batch of one million box pairs with random overlap. |
| `bench_diou_large_mean` | 计时 | 是 | 20 | 4.4 | Distance-IoU loss averaged to one value over a batch of one million box pairs. |
| `bench_ciou_large_sum` | 计时 | 是 | 20 | 9.6 | Complete-IoU loss summed to one value over a batch of one million box pairs. |
| `bench_diou_small_repeated` | 计时 | 是 | 20 | 0.7 | Distance-IoU loss with mean reduction called 1000 times in a row on a small batch of 256 box pairs. |
| `bench_ciou_small_repeated` | 计时 | 是 | 20 | 0.6 | Complete-IoU loss with mean reduction called 1000 times in a row on a small batch of 256 box pairs. |
| `bench_ciou_single_box_repeated` | 计时 | 是 | 20 | 2.7 | Complete-IoU loss called 1000 times in a row on a single pair of boxes given as two vectors of four numbers. |

</details>

<details><summary>layers-mask-ops：6 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `bench_paste_128_masks_800px` | 计时 | 是 | 20 | 6.0 | Pasting 128 mask predictions of 28x28 cells, with boxes about 200 pixels wide, into binary masks of an 800x800 image on CPU. |
| `bench_paste_128_masks_800px_soft` | 计时 | 是 | 20 | 7.6 | Pasting 128 mask predictions of 28x28 cells into 800x800 soft byte masks on CPU, with a negative threshold so nothing is binarized. |
| `bench_paste_600_small_boxes` | 计时 | 是 | 20 | 3.0 | Pasting 600 mask predictions of 28x28 cells with 30-pixel boxes into binary masks of an 80x80 image on CPU, where the per-box overhead dominates. |
| `bench_old_paste_256_masks_800px` | 计时 | 是 | 20 | 2.3 | Padding 256 masks of 28x28 cells by one cell, scaling their boxes to match, and pasting each one into an 800x800 image with the older per-box paste. |
| `bench_pad_20000_masks` | 计时 | 是 | 20 | 13.1 | Padding a batch of 20000 masks of 28x28 cells with a one-cell zero border. |
| `bench_scale_3000000_boxes` | 计时 | 是 | 32 | 25.1 | Scaling three million boxes about their centres by a factor of 1.1. |

</details>

<details><summary>layers-nms：7 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `bench_batched_nms_3000_boxes_one_class` | 计时 | 是 | 20 | 1.8 | Class-aware suppression of 3000 heavily overlapping axis-aligned boxes that all share one class, at IoU threshold 0.5, repeated 40 times. |
| `bench_batched_nms_4000_boxes_80_classes` | 计时 | 是 | 20 | 1.3 | Class-aware suppression of 4000 crowded axis-aligned boxes spread over 80 classes, at IoU threshold 0.5, repeated 40 times. |
| `bench_batched_nms_30000_boxes_80_classes` | 计时 | 是 | 20 | 0.5 | Class-aware suppression of 30000 crowded axis-aligned boxes spread over 80 classes at IoU threshold 0.5, repeated 8 times. |
| `bench_batched_nms_per_image_calls` | 计时 | 是 | 20 | 0.5 | Class-aware suppression of axis-aligned boxes called once per image for 200 images of 1000 boxes and 80 classes each, at IoU threshold 0.6. |
| `bench_nms_rotated_700_boxes` | 计时 | 是 | 20 | 0.3 | Suppression of 700 overlapping rotated boxes with random angles in a single call, at IoU threshold 0.5. |
| `bench_batched_nms_rotated_700_boxes_10_classes` | 计时 | 是 | 20 | 0.4 | Class-aware suppression of 700 crowded rotated boxes with random angles spread over 10 classes in a single call, at IoU threshold 0.5. |
| `bench_batched_nms_rotated_small_calls` | 计时 | 是 | 20 | 1.6 | Class-aware suppression of rotated boxes called once per image for 80 images of 60 boxes and 5 classes each, at IoU threshold 0.3. |

</details>

<details><summary>layers-norm-blocks：21 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `test_get_norm_calls_factory_at_most_once_per_layer` | 计数 | 是 | – | – | Counts calls of a caller-supplied normalization factory while 1, 10 and 20 layers are requested one by one: at most one call for each requested layer. |
| `test_depthwise_separable_build_calls_each_norm_factory_at_most_once` | 计数 | 是 | – | – | Counts calls of the two caller-supplied normalization factories while one depthwise separable convolution of 8 to 16 channels is constructed: at most one call each. |
| `test_depthwise_separable_forward_calls_each_activation_at_most_once_per_pass` | 计数 | 是 | – | – | Counts calls of the two caller-supplied activations of a depthwise separable convolution over 3 and 6 forward passes of a 1x4x5x5 input: at most one call each per pass. |
| `test_aspp_build_calls_norm_factory_at_most_once_per_convolution` | 计数 | 是 | – | – | Counts calls of a caller-supplied normalization factory while one pyramid pooling module of 4 channels is built: at most 5 with plain convolutions and at most 8 with depthwise separable ones. |
| `test_aspp_forward_activation_calls_grow_linearly_with_passes` | 计数 | 是 | – | – | Counts calls of a caller-supplied activation over 2 and 4 forward passes of a pyramid pooling module on a 1x4x6x6 input: at most 6 per pass with plain convolutions, at most 9 with depthwise separable ones. |
| `test_cycle_bn_list_builds_and_runs_at_most_one_layer_per_step` | 计数 | 是 | – | – | Counts constructions and forward passes of the inner batch norms of a cycling list of 3 layers over 6 and 12 calls on a 2x4x3x3 input: at most 3 constructions and at most one inner pass per call. |
| `bench_frozen_bn_forward_plain` | 计时 | 是 | 20 | 5.8 | Two hundred forward passes of a frozen batch norm with 64 channels over an input of shape 4x64x48x48 that needs no gradient. |
| `bench_frozen_bn_forward_grad` | 计时 | 是 | 20 | 4.4 | Eighty forward passes of a frozen batch norm with 64 channels over an input of shape 4x64x48x48 that requires a gradient. |
| `bench_naive_sync_bn_forward` | 计时 | 是 | 20 | 11.6 | Fifty training-mode forward passes of a naive synchronized batch norm with 64 channels over an input of shape 4x64x48x48 in a single process. |
| `bench_cycle_bn_forward` | 计时 | 是 | 20 | 15.5 | Sixty training-mode forward passes of a cycling list of four batch norms with 32 channels and a shared affine over an input of shape 4x32x48x48. |
| `bench_layer_norm_forward` | 计时 | 是 | 20 | 2.2 | Thirty forward passes of the channel-wise layer norm obtained by its short name, with 64 channels, over an input of shape 2x64x48x48, without gradients. |
| `bench_depthwise_separable_forward` | 计时 | 是 | 20 | 2.8 | Forty inference forward passes of a depthwise separable 3x3 convolution with 64 channels, batch norm and ReLU on both convolutions, over an input of shape 2x64x32x32. |
| `bench_aspp_forward` | 计时 | 是 | 20 | 3.0 | Eight inference forward passes of an atrous spatial pyramid pooling module with 64 channels, dilations 2, 4, 6, batch norm and global pooling over an input of shape 2x64x32x32. |
| `bench_aspp_separable_forward` | 计时 | 是 | 20 | 2.8 | Eight inference forward passes of an atrous spatial pyramid pooling module with depthwise separable convolutions, 64 channels and a 32x32 pooling window over an input of shape 2x64x32x32. |
| `bench_convert_to_frozen` | 计时 | 是 | 20 | 1.7 | Converting every batch norm of a model into a frozen batch norm, for a sequence of 400 blocks of convolution, batch norm and ReLU with 4 channels. |
| `bench_convert_frozen_to_batchnorm` | 计时 | 是 | 20 | 1.9 | Converting every frozen batch norm of a model back into a trainable batch norm, for a sequence of 400 blocks of convolution, frozen batch norm and ReLU with 4 channels. |
| `bench_get_norm_by_name` | 计时 | 是 | 20 | 2.0 | Building normalization layers by short name: 150 layers of 64 channels for each of the eight named kinds, and 150 lookups of the empty name. |
| `bench_frozen_bn_build_and_repr` | 计时 | 是 | 20 | 2.1 | Constructing 600 frozen batch norm layers with 1 to 600 channels and formatting the text representation of each one five times. |
| `bench_depthwise_separable_build` | 计时 | 是 | 20 | 3.3 | Constructing 80 depthwise separable convolutions of 64 input and 64 output channels with batch norm and ReLU on both convolutions, including their weight initialization. |
| `bench_aspp_build` | 计时 | 是 | 20 | 3.8 | Constructing 24 atrous spatial pyramid pooling modules of 32 channels with batch norm and ReLU, half with plain and half with depthwise separable convolutions. |
| `bench_block_freeze` | 计时 | 是 | 20 | 3.2 | Freezing 100 residual bottleneck blocks of 16 input and 32 output channels, each with four convolutions followed by batch norm. |

</details>

<details><summary>layers-roi-align：6 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `bench_aligned_fixed_sampling` | 计时 | 是 | 20 | 2.5 | Pooling 256 axis-aligned boxes to 7x7 with 2x2 samples per bin from one 64-channel 64x64 feature map. |
| `bench_aligned_dense_sampling` | 计时 | 是 | 20 | 1.3 | Pooling 256 axis-aligned boxes to 7x7 with the adaptive sample count from one 64-channel 64x64 feature map. |
| `bench_legacy_fixed_sampling` | 计时 | 是 | 20 | 2.2 | Legacy (not aligned) pooling of 128 boxes to 14x14 at scale 0.5 with 2x2 samples per bin from a 64-channel 64x64 map. |
| `bench_rotated_fixed_sampling` | 计时 | 是 | 20 | 3.0 | Pooling 256 rotated boxes of random angles to 7x7 with 2x2 samples per bin from one 64-channel 64x64 feature map. |
| `bench_rotated_dense_sampling` | 计时 | 是 | 20 | 1.9 | Pooling 256 rotated boxes of random angles to 7x7 with the adaptive sample count from a 64-channel 64x64 map. |
| `bench_rotated_forward_and_backward` | 计时 | 是 | 20 | 0.5 | Pooling 128 rotated boxes to 7x7 from a 32-channel 64x64 map and backpropagating the summed result to the map. |

</details>

<details><summary>layers-wrappers：18 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `test_wrapping_a_loss_does_not_call_it` | 计数 | 是 | – | – | Wrapping one loss function to accept empty inputs runs the loss function zero times until the wrapped function is called. |
| `test_wrapped_loss_calls_loss_at_most_once_per_call` | 计数 | 是 | – | – | A wrapped loss function runs the underlying loss at most once per call on non-empty inputs, counted over 5 and then 10 calls with 6-element tensors, so doubling the calls at most doubles the count. |
| `test_wrapped_loss_skips_loss_for_empty_target_with_mean` | 计数 | 是 | – | – | A wrapped loss function called 20 times with an empty target and mean reduction never runs the underlying loss function. |
| `test_wrapped_loss_empty_target_with_sum_calls_loss_at_most_once` | 计数 | 是 | – | – | A wrapped loss function called 8 times with an empty target and sum reduction runs the underlying loss function at most once per call. |
| `test_conv_runs_norm_and_activation_at_most_once_per_forward` | 计数 | 是 | – | – | A convolution layer with a normalization layer and an activation attached runs each of them at most once per forward pass, counted over 3 and then 6 passes on a 2x3x8x8 input. |
| `test_conv_construction_runs_neither_norm_nor_activation` | 计数 | 是 | – | – | Building a convolution layer with a normalization layer and an activation attached runs neither of them before the first forward pass. |
| `test_conv_empty_batch_runs_norm_and_activation_at_most_once` | 计数 | 是 | – | – | A convolution layer in inference mode with a normalization layer and an activation attached runs each at most once per forward pass on an empty batch of zero 8x8 feature maps, over 4 passes. |
| `test_cat_single_tensor_copies_no_elements` | 计数 | 是 | – | – | Concatenating a list that holds one 1000-element tensor copies none of its elements: the result uses the same memory as the input, however large the tensor. |
| `bench_conv2d_norm_activation_forward` | 计时 | 是 | 20 | 1.0 | Forty inference passes of a 3x3 convolution layer (16 to 32 channels) with batch normalization and ReLU attached, on a batch of four 64x64 feature maps. |
| `bench_conv2d_small_input_forward` | 计时 | 是 | 20 | 2.0 | Three thousand inference passes of a 3x3 convolution layer (8 channels) with batch normalization and ReLU attached, each on one tiny 8x8 feature map, so per-call overhead dominates. |
| `bench_conv2d_plain_training_forward` | 计时 | 是 | 20 | 1.7 | Eight hundred training-mode forward passes of a plain strided 3x3 convolution layer (8 to 16 channels, no normalization, no activation) on a batch of two 32x32 feature maps. |
| `bench_conv2d_empty_batch_forward` | 计时 | 是 | 20 | 2.0 | Three thousand inference passes of a 3x3 convolution layer (16 to 32 channels) with batch normalization and ReLU attached, each on an empty batch of zero 32x32 feature maps. |
| `bench_cat_many_tensors` | 计时 | 是 | 20 | 12.4 | Four hundred concatenations along the first axis of a list of 64 float tensors of 2000 rows and 4 columns each. |
| `bench_cat_single_tensor` | 计时 | 是 | 20 | 1.0 | One million concatenations of a list that holds a single 1000x1000 float tensor, which needs no copy of the data. |
| `bench_nonzero_tuple_mask` | 计时 | 是 | 20 | 1.7 | Eight searches for the row and column indices of the true entries of a 1024x1024 boolean mask that is about half true. |
| `bench_cross_entropy_batch` | 计时 | 是 | 20 | 3.1 | Forty mean-reduced cross entropy losses over 20000 rows of 81 class scores with integer class targets. |
| `bench_cross_entropy_empty` | 计时 | 是 | 20 | 0.5 | Fifteen thousand mean-reduced cross entropy losses over an empty batch of zero rows of 81 class scores, which gives zero without the real loss computation. |
| `bench_shapes_to_tensor_pairs` | 计时 | 是 | 20 | 0.7 | Thirty thousand conversions of a two-integer height and width list into an integer vector outside tracing and scripting. |

</details>

<details><summary>model-anchor-generator：11 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `test_default_forward_never_reads_sizes_or_aspect_ratios_again` | 计数 | 是 | – | – | Counts item reads of the size and aspect-ratio sequences (4 sizes, 3 ratios, 2 levels): ten anchor generations on 3x5 and 2x3 feature maps after construction must add no read, because cell anchors are computed once. |
| `test_rotated_forward_never_reads_sizes_ratios_or_angles_again` | 计数 | 是 | – | – | Counts item reads of the size, aspect-ratio and angle sequences (3 sizes, 2 ratios, 4 angles, 2 levels): ten rotated anchor generations on 3x5 and 2x3 feature maps after construction must add no read. |
| `test_default_construction_reads_grow_at_most_linearly_with_levels` | 计数 | 是 | – | – | Counts item reads of shared size and aspect-ratio sequences (8 sizes, 4 ratios) while constructing a generator: going from 3 to 6 feature levels must at most double the reads of each sequence. |
| `test_default_construction_reads_grow_at_most_linearly_with_sizes` | 计数 | 是 | – | – | Counts item reads of the size and aspect-ratio sequences while constructing a two-level generator with 4 ratios: going from 8 to 16 sizes must at most double the reads of each sequence. |
| `test_default_construction_reads_grow_at_most_linearly_with_aspect_ratios` | 计数 | 是 | – | – | Counts item reads of the size and aspect-ratio sequences while constructing a two-level generator with 8 sizes: going from 4 to 8 aspect ratios must at most double the reads of each sequence. |
| `test_rotated_construction_reads_grow_at_most_linearly_with_levels` | 计数 | 是 | – | – | Counts item reads of shared size, aspect-ratio and angle sequences (6 sizes, 3 ratios, 5 angles) while constructing a rotated generator: going from 2 to 4 feature levels must at most double the reads of each sequence. |
| `test_rotated_construction_reads_grow_at_most_linearly_with_sizes` | 计数 | 是 | – | – | Counts item reads of the size, aspect-ratio and angle sequences while constructing a two-level rotated generator with 3 ratios and 5 angles: going from 6 to 12 sizes must at most double the reads of each sequence. |
| `bench_default_pyramid_many_anchors_per_cell` | 计时 | 是 | 20 | 3.4 | Generating axis-aligned anchors for a five-level feature pyramid of an 800x1344 image (strides 4 to 64, about 90 thousand cells) with 15 anchors per cell, about 1.3 million boxes. |
| `bench_default_single_level_dense` | 计时 | 是 | 20 | 4.0 | Generating axis-aligned anchors for one 300x400 feature map of stride 4 with zero offset and 15 anchors per cell, 1.8 million boxes. |
| `bench_rotated_pyramid` | 计时 | 是 | 20 | 9.2 | Generating rotated anchors for a five-level feature pyramid of an 800x1344 image (strides 4 to 64, about 90 thousand cells) with 3 aspect ratios and 7 angles per cell, about 1.9 million boxes. |
| `bench_default_many_small_levels` | 计时 | 是 | 20 | 3.3 | Generating axis-aligned anchors for 40 small feature maps of 25x40 cells each with 9 anchors per cell, 360 thousand boxes in all. |

</details>

<details><summary>model-backbones：26 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `test_stage_builder_constructs_at_most_one_block_per_requested_block` | 计数 | 是 | – | – | Creating one stage of 1, 4 and 8 blocks, with and without a stride given for each block, constructs at most one block for each block asked for. |
| `test_stage_builder_block_constructions_at_most_double_with_blocks` | 计数 | 是 | – | – | Doubling the number of blocks of one stage from 8 to 16, through the older stage-making function, at most doubles the number of blocks constructed. |
| `test_default_stages_construct_at_most_the_blocks_of_each_depth` | 计数 | 是 | – | – | Creating the predefined stages for depths 18, 34, 50, 101 and 152 constructs at most 8, 16, 16, 33 and 50 blocks, one for each block of the four stages. |
| `test_resnet_forward_runs_stem_and_each_block_at_most_once_per_pass` | 计数 | 是 | – | – | One forward pass of a residual network of a stem and four stages of two blocks runs the stem and every block at most once, and three passes at most three times. |
| `test_resnet_forward_skips_stages_after_the_last_requested_feature` | 计数 | 是 | – | – | A residual network given four stages of two blocks but asked only for an early feature runs no block of the later stages: none at all for the stem output, at most two for the first stage, at most four for the second. |
| `test_resnet_forward_block_runs_at_most_double_with_blocks_per_stage` | 计数 | 是 | – | – | Doubling the blocks of each of the four stages of a residual network from 3 to 6 at most doubles the number of blocks one forward pass runs. |
| `test_resnet_freeze_touches_only_the_requested_stages_once` | 计数 | 是 | – | – | Freezing a residual network of a stem and four stages of two blocks freezes nothing for zero stages, at most the stem for one, and at most the stem and the four blocks of the first two stages for three, each once per request. |
| `test_resnet_construction_freezes_each_requested_block_at_most_once` | 计数 | 是 | – | – | Constructing a residual network of a stem and four stages of two blocks with two stages to freeze freezes at most the stem and the two blocks of the first stage, each once, and runs no forward pass. |
| `test_fpn_runs_bottom_up_and_top_block_at_most_once_per_pass` | 计数 | 是 | – | – | A three-level feature pyramid with an extra top level runs its bottom-up network and its top block at most once for each forward pass, over one and then three passes, and not at all while it is constructed. |
| `test_build_backbone_calls_the_selected_builder_at_most_once` | 计数 | 是 | – | – | Building a backbone from a configuration that selects a registered builder calls that builder at most once for each build, over one and then three builds. |
| `bench_build_resnet50_from_config` | 计时 | 是 | 20 | 1.0 | Building the default 50-layer residual backbone from a configuration, once, with its three kept stages of bottleneck blocks and frozen normalization. |
| `bench_build_resnet18_fpn_from_config` | 计时 | 是 | 20 | 1.7 | Building an 18-layer residual backbone with a four-level feature pyramid and a pooled extra level from a configuration, once. |
| `bench_build_retinanet_resnet18_fpn_from_config` | 计时 | 是 | 20 | 1.5 | Building an 18-layer residual backbone with a three-level feature pyramid and two extra convolutional levels from a configuration, once. |
| `bench_build_narrow_deformable_resnet50_from_config` | 计时 | 是 | 20 | 2.8 | Building a narrow 50-layer residual backbone from a configuration, once, whose last three stages use modulated deformable bottleneck blocks (13 of the 16 blocks). |
| `bench_default_stages_depth18` | 计时 | 是 | 20 | 0.9 | Creating the four predefined stages of an 18-layer residual network, eight basic blocks of 64 to 512 channels with batch normalization, once. |
| `bench_make_stage_64_narrow_blocks` | 计时 | 是 | 20 | 2.6 | Creating one stage of 64 narrow bottleneck blocks (32 output channels) with a stride and a dilation given for each block, once. |
| `bench_assemble_resnet_with_pyramid` | 计时 | 是 | 20 | 2.0 | Assembling a residual network from a new stem and 64 ready-made blocks in four stages with a 10-class head, then adding a four-level feature pyramid of 128 channels on top, once. |
| `bench_freeze_all_stages` | 计时 | 是 | 20 | 1.8 | Freezing the stem and all four stages of a narrow residual network of 64 bottleneck blocks with batch normalization, once on a fresh network. |
| `bench_resnet50_forward` | 计时 | 是 | 20 | 5.0 | One inference pass of a 50-layer residual backbone built from a configuration, returning all four stage outputs, on a batch of two 64x64 images. |
| `bench_resnet50_fpn_forward` | 计时 | 是 | 20 | 2.3 | One inference pass of a 50-layer residual backbone with a five-level feature pyramid built from a configuration, on one 128x128 image. |
| `bench_retinanet_resnet18_fpn_forward` | 计时 | 是 | 20 | 4.8 | One inference pass of an 18-layer residual backbone with a three-level feature pyramid and two extra convolutional levels, on a batch of two 128x128 images. |
| `bench_deep_narrow_classifier_forward` | 计时 | 是 | 20 | 2.0 | Ten inference passes of a narrow residual network of 64 bottleneck blocks with a 10-class head, returning the stem, every stage and the class scores, on one 32x32 image. |
| `bench_deep_narrow_pyramid_forward` | 计时 | 是 | 20 | 1.8 | Ten inference passes of a four-level averaging feature pyramid of 16 channels over a narrow residual network of 64 bottleneck blocks, on one 32x32 image. |
| `bench_bottleneck_and_basic_blocks_forward` | 计时 | 是 | 20 | 3.5 | Ten inference passes through a chain of eight grouped bottleneck blocks and eight basic blocks, each group starting with a strided block with a projection shortcut, on a 2x32x32x32 input. |
| `bench_deformable_blocks_forward` | 计时 | 是 | 20 | 4.2 | Five inference passes through a chain of four deformable bottleneck blocks, the first one strided with a projection shortcut, on a 2x32x32x32 input. |
| `bench_stem_forward` | 计时 | 是 | 20 | 0.8 | Five inference passes of the standard 64-channel stem (7x7 convolution, normalization, activation and pooling) on a batch of two 128x128 images. |

</details>

<details><summary>model-box-regression：12 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `test_standard_get_deltas_ops_do_not_grow_with_boxes` | 计数 | 是 | – | – | Counts the tensor operations the standard transform spends on encoding 8, 512 and 4096 box pairs as deltas; the count must not grow with the number of boxes. |
| `test_standard_apply_deltas_ops_do_not_grow_with_boxes` | 计数 | 是 | – | – | Counts the tensor operations the standard transform spends on decoding one delta row for each of 8, 512 and 4096 boxes; the count must not grow with the number of boxes. |
| `test_rotated_get_deltas_ops_do_not_grow_with_boxes` | 计数 | 是 | – | – | Counts the tensor operations the rotated transform spends on encoding 8, 512 and 4096 rotated box pairs as deltas; the count must not grow with the number of boxes. |
| `test_rotated_apply_deltas_ops_do_not_grow_with_boxes` | 计数 | 是 | – | – | Counts the tensor operations the rotated transform spends on decoding one delta row for each of 8, 512 and 4096 rotated boxes; the count must not grow with the number of boxes. |
| `test_linear_get_deltas_ops_do_not_grow_with_boxes` | 计数 | 是 | – | – | Counts the tensor operations the linear transform, with and without size normalization, spends on encoding 8, 512 and 4096 anchor and target pairs; the count must not grow with the number of boxes. |
| `test_linear_apply_deltas_ops_do_not_grow_with_boxes` | 计数 | 是 | – | – | Counts the tensor operations the linear transform, with and without size normalization, spends on decoding one delta row for each of 8, 512 and 4096 anchors; the count must not grow with the number of boxes. |
| `test_standard_apply_deltas_ops_do_not_grow_with_classes` | 计数 | 是 | – | – | Counts the tensor operations the standard transform spends on decoding 1, 8 and 80 class-specific delta sets for each of 16 boxes; the count must not grow with the number of classes. |
| `test_rotated_apply_deltas_ops_do_not_grow_with_classes` | 计数 | 是 | – | – | Counts the tensor operations the rotated transform spends on decoding 1, 8 and 80 class-specific delta sets for each of 16 rotated boxes; the count must not grow with the number of classes. |
| `test_linear_apply_deltas_ops_do_not_grow_with_classes` | 计数 | 是 | – | – | Counts the tensor operations the linear transform without size normalization spends on decoding 1, 8 and 80 class-specific delta sets for each of 16 boxes; the count must not grow with the number of classes. |
| `test_standard_round_trip_ops_at_most_double_with_calls` | 计数 | 是 | – | – | Counts the tensor operations one standard transform spends on 5, 10 and 20 encode-then-decode round trips over 32 box pairs; doubling the number of round trips must at most double the count. |
| `test_rotated_round_trip_ops_at_most_double_with_calls` | 计数 | 是 | – | – | Counts the tensor operations one rotated transform spends on 5, 10 and 20 encode-then-decode round trips over 32 rotated box pairs; doubling the number of round trips must at most double the count. |
| `test_linear_round_trip_ops_at_most_double_with_calls` | 计数 | 是 | – | – | Counts the tensor operations one linear transform with size normalization spends on 5, 10 and 20 encode-then-decode round trips over 32 box pairs; doubling the number of round trips must at most double the count. |

</details>

<details><summary>model-cascade-rcnn：6 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `test_inference_calls_pooler_and_each_stage_head_once_per_stage` | 计数 | 是 | – | – | Counts calls of the region pooler, the per-stage box heads and the matchers in one inference pass over 2 images with 10 proposals each, for 1, 2 and 4 stages. |
| `test_training_calls_each_stage_matcher_at_most_once_per_image` | 计数 | 是 | – | – | Counts calls of the region pooler, box heads and per-stage matchers in one training pass of a 3-stage cascade over 2 images with 10 proposals each. |
| `test_matcher_calls_at_most_double_when_images_double` | 计数 | 是 | – | – | Compares how often the per-stage matchers and the pooler are called in a training pass of a 3-stage cascade over 2 images and over 4 images, 10 proposals each. |
| `bench_inference_forward` | 计时 | 是 | 20 | 4.2 | Inference pass of a three-stage cascade over 2 images with 300 proposals each, 20 classes, small fully connected heads. |
| `bench_training_forward` | 计时 | 是 | 20 | 6.5 | Training pass of a three-stage cascade over 2 images with 600 proposals and 8 ground-truth boxes each, computing the losses of all stages. |
| `bench_training_forward_backward` | 计时 | 否（slowdown_not_detected） | 20 | 3.9 | Training pass of a three-stage cascade over 2 images with 600 proposals each followed by backpropagation of the summed stage losses to the input features. |

</details>

<details><summary>model-dense-detectors：7 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `test_training_step_calls_each_part_once_and_matcher_once_per_image` | 计数 | 是 | – | – | One RetinaNet training step on 2 and then 4 images of 32x32 pixels runs the backbone, the head and the anchor generator at most once each and the anchor matcher at most once per image. |
| `test_inference_calls_each_part_once_for_a_batch` | 计数 | 是 | – | – | One RetinaNet inference call on a batch of 3 images of 32x32 pixels runs the backbone, the head and the anchor generator at most once each and never the anchor matcher. |
| `test_fcos_calls_backbone_and_head_once_per_step` | 计数 | 是 | – | – | One FCOS training step and one FCOS inference call on 4 images of 32x32 pixels each run the backbone and the head at most once. |
| `bench_retinanet_inference` | 计时 | 是 | 20 | 6.0 | RetinaNet decoding of given predictions into detections for 2 images of 256x320 pixels, 4 feature levels, 9 anchors per cell and 20 classes (about 15 thousand anchors per image). |
| `bench_retinanet_training_losses` | 计时 | 是 | 20 | 14.3 | RetinaNet anchor labeling and loss computation from given predictions for 2 images of 256x320 pixels with 12 boxes each, 4 feature levels, 9 anchors per cell and 20 classes. |
| `bench_fcos_inference` | 计时 | 是 | 20 | 1.7 | FCOS decoding of given predictions into detections for 2 images of 256x320 pixels, 4 feature levels and 20 classes (about 1700 points per image). |
| `bench_fcos_training_losses` | 计时 | 是 | 20 | 3.0 | FCOS point labeling, centerness targets and loss computation from given predictions for 2 images of 256x320 pixels with 12 boxes each, 4 feature levels and 20 classes. |

</details>

<details><summary>model-keypoint-head：10 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `test_training_forward_runs_the_layers_at_most_once` | 计数 | 是 | – | – | Counts how often one training-mode forward asks the head's layers for logits, for batches of 1, 2 and 4 images with 2 regions each. |
| `test_inference_forward_runs_the_layers_at_most_once` | 计数 | 是 | – | – | Counts how often one inference-mode forward asks the head's layers for logits, for batches of 1, 2 and 4 images with 2 boxes each. |
| `test_loss_converts_keypoints_to_targets_at_most_once_per_image` | 计数 | 是 | – | – | Counts the conversions of ground-truth keypoints to heatmap targets in one training-mode forward, for batches of 2 and 4 images with 2 regions each: at most one per image. |
| `test_layers_runs_each_submodule_at_most_once` | 计数 | 是 | – | – | Counts the forward passes of every layer of a head with 3 convolutions during one pass of 2 regions of 2x3x3 features through its layers: at most one per layer. |
| `test_build_calls_the_registered_object_at_most_once` | 计数 | 是 | – | – | Counts how often building a head from a config calls the object registered under the configured name: at most once per build, over 3 builds. |
| `bench_training_forward` | 计时 | 是 | 20 | 13.4 | Training-mode forward that computes the keypoint loss: 16 regions of 64x14x14 features over 2 images, four 64-channel convolutions, 17 keypoints. |
| `bench_inference_forward` | 计时 | 是 | 20 | 0.6 | Inference-mode forward that adds predicted keypoints to the instances: 16 boxes of 40 to 82 by 56 to 77 pixels over 2 images, 64x14x14 features, four 64-channel convolutions, 17 keypoints. |
| `bench_layers_only` | 计时 | 是 | 20 | 1.5 | The head's layers alone, without loss or decoding: 16 regions of 64x14x14 features through four 64-channel convolutions, the deconvolution and the 2x bilinear upsampling to 17x56x56 heatmaps. |
| `bench_construct_wide_head` | 计时 | 是 | 20 | 3.0 | Constructing one head with its weight initialization: 256 input channels, eight 3x3 convolutions of 512 channels, 17 keypoints. |
| `bench_build_from_config` | 计时 | 是 | 20 | 1.4 | Building the configured head by its registered name from a config node: 256 input channels, eight 3x3 convolutions of 256 channels, 17 keypoints. |

</details>

<details><summary>model-mask-head：10 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `test_forward_runs_layers_at_most_once_per_call` | 计数 | 是 | – | – | Counts how often one forward call runs the head's layers, in training with 3 instances and in inference with 3 detections: at most once each. |
| `test_ground_truth_is_cropped_at_most_once_per_image` | 计数 | 是 | – | – | Counts the crops of ground truth masks in one training loss over 4 and 8 images, some empty: at most one per image with instances, none for empty ones, at most doubling with the images. |
| `test_each_layer_runs_at_most_once_per_layers_call` | 计数 | 是 | – | – | Counts the runs of every sub-layer of a conv-upsample head with 3 convs during one pass over 2 regions: at most one run per layer. |
| `test_norm_factory_called_at_most_once_per_conv` | 计数 | 是 | – | – | Counts the calls of a normalization factory while building heads with 2 and 4 convs: at most one call per conv layer, so doubling the convs at most doubles the calls. |
| `bench_conv_head_inference` | 计时 | 是 | 20 | 9.1 | Inference of the conv-upsample mask head: 32 regions of 32 channels at 14x14, two 3x3 convs, deconv and a 20-class predictor, masks attached to 4 images. |
| `bench_conv_head_layers` | 计时 | 是 | 20 | 3.7 | Running the layers of a conv-upsample mask head (three 3x3 convs of 24 channels, deconv, 8-class predictor) on 24 regions of 14x14 features. |
| `bench_training_loss` | 计时 | 是 | 20 | 4.4 | Mask loss in training for given logits: 128 instances over 4 images, 20 classes, 28x28 masks, ground truth bit masks of 64x64 cropped by proposal boxes. |
| `bench_training_loss_class_agnostic` | 计时 | 是 | 20 | 3.8 | Class-agnostic mask loss in training for given logits: 256 instances over 16 images, 28x28 masks, ground truth bit masks of 48x48. |
| `bench_inference_selection` | 计时 | 是 | 20 | 14.4 | Mask inference for given logits: selecting the predicted class among 20 for 1000 detections over 8 images and turning 28x28 logits into probabilities. |
| `bench_build_head` | 计时 | 是 | 20 | 4.2 | Building the mask head from a config with four 3x3 convs of 128 channels, a deconv and an 80-class predictor, including weight initialization. |

</details>

<details><summary>model-matcher-sampling：8 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `bench_matcher_low_quality_large` | 计时 | 是 | 20 | 5.1 | Matching 300000 predictions against 40 ground truths with two thresholds, three labels and low-quality matches enabled, on one random quality matrix. |
| `bench_matcher_single_threshold_large` | 计时 | 是 | 20 | 1.3 | Matching 300000 predictions against 40 ground truths with one threshold and two labels, low-quality matches disabled, on one random quality matrix. |
| `bench_matcher_many_small_matrices` | 计时 | 是 | 20 | 1.6 | Matching 600 small quality matrices one after another, each 6 ground truths by 512 predictions, with two thresholds and low-quality matches enabled. |
| `bench_matcher_no_ground_truth` | 计时 | 是 | 20 | 1.9 | Matching 5000 times a quality matrix that has no ground truth rows and 20000 prediction columns, which yields default matches and labels. |
| `bench_set_low_quality_matches` | 计时 | 是 | 20 | 7.3 | Marking the best prediction of each of 40 ground truths as positive in a label vector of 300000 predictions, called directly on one random quality matrix. |
| `bench_matcher_construction` | 计时 | 是 | 20 | 7.0 | Constructing 20000 matchers, each from a list of four increasing thresholds and five labels, with the threshold and label checks that construction does. |
| `bench_subsample_labels_large` | 计时 | 是 | 20 | 13.7 | Sampling 512 labels with a positive fraction of 0.25 from one vector of 2000000 labels that mixes ignored, background and eight foreground values. |
| `bench_subsample_labels_many_small` | 计时 | 是 | 20 | 1.4 | Sampling 256 labels with a positive fraction of 0.5 from each of 600 label vectors of 2000 entries, one call after another. |

</details>

<details><summary>model-poolers：12 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `test_areas_computed_at_most_once_per_image` | 计数 | 是 | – | – | Counts how often the areas of an image's boxes are computed in one pooling call over a 4-level pyramid with 3 images of 16 boxes: at most once for each image. |
| `test_area_computations_do_not_grow_with_box_count` | 计数 | 是 | – | – | Counts area computations in one pooling call over a 4-level pyramid with 2 images, for 8, 16 and 64 boxes an image: more boxes an image must not cause more area computations. |
| `test_area_computations_do_not_grow_with_level_count` | 计数 | 是 | – | – | Counts area computations in one pooling call with 2 images of 16 boxes over pyramids of 2, 3 and 4 levels: each image's areas are computed at most once however many levels. |
| `test_area_computations_at_most_double_when_images_double` | 计数 | 是 | – | – | Counts area computations in one pooling call over a 4-level pyramid with 8 boxes an image, for 2, 4 and 8 images: the count is at most one for each image, so doubling the images at most doubles it. |
| `test_areas_computed_at_most_once_per_image_for_each_pooler_type` | 计数 | 是 | – | – | Counts area computations in one pooling call over a 4-level pyramid with 2 images of 16 boxes for the ROIAlign, ROIAlignV2 and ROIPool poolers: at most once for each image. |
| `test_repeated_calls_compute_areas_at_most_once_per_image_per_call` | 计数 | 是 | – | – | Counts area computations over 5 consecutive pooling calls of one 4-level pooler on the same 2 images of 16 boxes: at most one for each image in each call, 10 in all. |
| `bench_fpn_roialignv2` | 计时 | 是 | 20 | 2.5 | Pool 2000 boxes (2 images of 1000) of mixed sizes from a 4-level pyramid of 64-channel feature maps into 7x7 outputs with the aligned ROIAlign pooler, sampling ratio 2. |
| `bench_fpn_roialign` | 计时 | 是 | 20 | 9.2 | Pool 2000 boxes (2 images of 1000) of mixed sizes from a 4-level pyramid of 64-channel feature maps into 7x7 outputs with the legacy unaligned ROIAlign pooler, sampling ratio 2. |
| `bench_fpn_roipool` | 计时 | 是 | 20 | 8.7 | Pool 2000 boxes (2 images of 1000) of mixed sizes from a 4-level pyramid of 64-channel feature maps into 7x7 outputs with the max-pooling ROIPool pooler. |
| `bench_fpn_roialign_rotated` | 计时 | 是 | 20 | 2.7 | Pool 2000 rotated boxes (2 images of 1000) of mixed sizes and angles from a 4-level pyramid of 64-channel feature maps into 7x7 outputs with the rotated ROIAlign pooler. |
| `bench_mask_resolution_roialignv2` | 计时 | 是 | 20 | 2.0 | Pool 400 boxes (2 images of 200) of mixed sizes from a 4-level pyramid of 64-channel feature maps into 14x14 outputs with the aligned ROIAlign pooler and adaptive sampling. |
| `bench_single_level_roialignv2` | 计时 | 是 | 20 | 9.2 | Pool 500 boxes (2 images of 250) from one stride-16 feature map of 256 channels into 14x14 outputs with the aligned ROIAlign pooler, sampling ratio 2, no level assignment. |

</details>

<details><summary>model-proposal-generators：21 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `test_inference_pass_uses_each_part_once` | 计数 | 是 | – | – | One inference pass on 2 images with 3 feature levels runs the head and the anchor generator at most once each, decodes boxes at most once per level, and does no ground-truth matching or delta encoding. |
| `test_training_pass_work_is_bounded_by_images_and_levels` | 计数 | 是 | – | – | One training pass on 4 images with 3 feature levels runs the head and the anchor generator at most once each, matches and encodes ground truth at most once per image, and decodes boxes at most once per level. |
| `test_repeated_passes_do_not_accumulate_extra_work` | 计数 | 是 | – | – | Three inference passes in a row on 1 image with 3 feature levels run the head and the anchor generator at most three times in total and decode boxes at most three times per level. |
| `test_matching_grows_at_most_linearly_with_images` | 计数 | 是 | – | – | Labelling the 378 anchors of 3 feature levels matches ground truth at most once per image, so going from 2 to 4 images at most doubles the number of matchings, and each matching sees one image's boxes against all anchors at once. |
| `test_box_decoding_does_not_grow_with_images` | 计数 | 是 | – | – | Predicting proposals for 3 feature levels decodes box deltas at most once per level, whether the batch holds 1 image or 6 images. |
| `test_loss_encodes_targets_at_most_once_per_image` | 计数 | 是 | – | – | Computing the losses over 3 feature levels encodes regression targets at most once per image, so going from 2 to 4 images at most doubles the encodings, and decodes no boxes with the default regression loss. |
| `test_head_layers_run_at_most_once_per_level` | 计数 | 是 | – | – | The standard head runs each of its 3 weighted layers at most once per feature level: at most 3 layer calls for 1 level and 9 for 3 levels, and at most 5 per level with three hidden convolutions. |
| `bench_select_five_levels_two_images` | 计时 | 是 | 20 | 2.0 | Selecting the top proposals of two images from five pyramid levels (36486 candidate boxes per image), keeping 1000 per level before and 1000 per image after suppression at overlap 0.7, in inference mode. |
| `bench_select_training_four_images` | 计时 | 是 | 20 | 1.1 | Selecting the top proposals of four images from five pyramid levels (36486 candidate boxes per image) in training mode, keeping 2000 per level before and 1000 per image after suppression at overlap 0.7, with a minimum box side of 16 pixels. |
| `bench_select_single_level_dense` | 计时 | 是 | 20 | 3.5 | Selecting the top proposals of two images from one feature level of 60000 candidate boxes each, some of them not finite, keeping 6000 before and 1000 after suppression at overlap 0.7, in inference mode. |
| `bench_select_many_small_images` | 计时 | 是 | 20 | 5.6 | Selecting the top proposals of a batch of 64 small images from two feature levels (375 candidate boxes per image), keeping 100 per level before and 50 per image after suppression at overlap 0.5. |
| `bench_add_ground_truth_boxes` | 计时 | 是 | 20 | 4.7 | Appending 20 ground-truth boxes to the 1000 proposals of each of 200 images, with the ground truth given as plain boxes. |
| `bench_add_ground_truth_instances` | 计时 | 是 | 20 | 3.4 | Appending the 20 ground-truth instances of each of 200 images to that image's 1000 proposals, where both carry one additional per-box field that has to be carried over. |
| `bench_head_forward` | 计时 | 是 | 20 | 7.0 | Running the standard proposal head (64 input channels, 3 anchors per location) over five feature levels of two 320x480 images, from stride 4 to stride 64, without gradients. |
| `bench_head_forward_deep` | 计时 | 是 | 20 | 5.7 | Running a proposal head with three hidden convolutions (32, 48, 32 channels) and 9 anchors per location over five feature levels of two 320x480 images, without gradients. |
| `bench_inference_forward` | 计时 | 是 | 20 | 4.4 | One inference pass of the region proposal network on two 320x480 images with five feature levels of 32 channels (38370 anchors per image), producing up to 1000 proposals per image. |
| `bench_training_forward` | 计时 | 是 | 20 | 14.8 | One training pass of the region proposal network on two 320x480 images with 20 ground-truth boxes each and five feature levels of 32 channels (38370 anchors per image), computing both losses and the proposals. |
| `bench_label_and_sample` | 计时 | 是 | 20 | 7.8 | Matching 38370 anchors against 30 ground-truth boxes for each of 8 images and sampling 256 anchors per image for the loss. |
| `bench_losses` | 计时 | 是 | 20 | 5.4 | Computing the objectness and box regression losses of 8 images with 38370 anchors each over five feature levels, with 256 sampled anchors per image. |
| `bench_predict_proposals` | 计时 | 是 | 20 | 2.8 | Decoding the predicted box deltas of 4 images with 38370 anchors each over five feature levels into boxes and selecting up to 1000 proposals per image, in inference mode. |
| `bench_rotated_training_forward` | 计时 | 是 | 20 | 1.5 | One training pass of the rotated region proposal network on two 320x480 images with 5 rotated ground-truth boxes each and one stride-16 feature level of 32 channels (3600 rotated anchors per image), keeping 300 boxes before and 100 after suppression. |

</details>

<details><summary>model-rcnn：8 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `test_inference_runs_each_stage_once_per_batch` | 计数 | 是 | – | – | Counts how often the backbone, proposal generator and box heads run for one inference call on batches of 4 and 8 images: at most once each, whatever the batch size. |
| `test_training_runs_each_stage_once_per_batch` | 计数 | 是 | – | – | Counts how often the backbone, proposal generator and box heads run for one training step on batches of 4 and 8 images: at most once each, whatever the batch size. |
| `test_given_boxes_skip_proposals_and_box_detection` | 计数 | 是 | – | – | Counts stage runs for one inference call on 4 images whose boxes are given: the backbone and the given-box head run at most once, proposal generation and box detection never. |
| `test_proposal_network_runs_each_stage_once_per_batch` | 计数 | 是 | – | – | Counts how often the backbone and the proposal generator run for one proposal-only inference call on batches of 4 and 8 images: at most once each. |
| `bench_preprocess_batch` | 计时 | 是 | 20 | 10.6 | Normalizing, padding and batching 8 colour images of about 250 by 300 pixels for a detector whose backbone needs sizes divisible by 32. |
| `bench_inference_batch` | 计时 | 是 | 20 | 13.2 | Detector inference on a batch of 8 images of about 250 by 300 pixels with trivial components giving 200 boxes an image, so the time is input preparation and resizing the detections to twice the size. |
| `bench_postprocess_boxes_keypoints` | 计时 | 是 | 20 | 7.8 | Resizing the detections of 20 images, each with 2000 boxes and 17 keypoints a box, from 480 by 640 to 960 by 1280 pixels. |
| `bench_postprocess_masks` | 计时 | 是 | 20 | 8.6 | Resizing the detections of 4 images, each with 30 boxes and a 28 by 28 soft mask a box, from 120 by 160 to 240 by 320 pixels with masks pasted into the full image. |

</details>

<details><summary>model-roi-heads：21 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `test_federated_class_weights_are_fetched_at_most_once` | 计数 | 是 | – | – | Counts calls of the given function that supplies federated class weights: at most one over building the output layers and three loss computations of 2 images with 12 proposals each, and none when federated loss is off. |
| `test_box_decoding_calls_do_not_exceed_the_number_of_images` | 计数 | 是 | – | – | Counts uses of the given box transform by the output layers: decoding predicted boxes, decoding boxes of ground truth classes and detection each decode at most once per image, for 2 and for 4 images with 10 proposals each. |
| `test_box_encoding_calls_in_losses_do_not_exceed_the_number_of_images` | 计数 | 是 | – | – | Counts uses of the given box transform during one loss computation with smooth L1 regression: at most one encoding of target boxes per image and no decoding, for 2 and for 4 images with 10 labeled proposals each. |
| `test_proposal_matcher_is_called_at_most_once_per_image` | 计数 | 是 | – | – | Counts calls of the given proposal matcher while labeling and sampling proposals: at most one per image, for 2 and for 4 images with 30 proposals and 3 ground truth boxes each. |
| `test_standard_heads_inference_runs_each_box_part_once_per_batch` | 计数 | 是 | – | – | Counts calls of the given pooler, box head and box predictor during one detection pass of standard ROI heads: at most one call of each for the whole batch and no matching, for 1 and for 4 images with 20 proposals each. |
| `test_standard_heads_training_runs_each_box_part_once_per_batch` | 计数 | 是 | – | – | Counts calls of the given parts during one training pass of standard ROI heads: at most one call of the pooler, box head, predictor and its losses for the batch and one matching per image, for 2 and for 4 images with 30 proposals each. |
| `test_res5_heads_run_the_shared_block_once_per_batch` | 计数 | 是 | – | – | Counts calls of the given pooler, shared block and box predictor by Res5 ROI heads without a mask head: at most one call of each per pass, in detection and in training, for 2 and for 4 images with 30 proposals each. |
| `bench_detection_inference_class_specific` | 计时 | 是 | 20 | 2.8 | Thresholding, per-class suppression and top-100 selection of detections for 4 images, each with 1000 boxes regressed separately for 80 classes. |
| `bench_detection_inference_class_agnostic` | 计时 | 是 | 20 | 1.1 | Thresholding, suppression and selection of all detections above a low score for 4 images, each with 2000 class-agnostic boxes scored for 80 classes. |
| `bench_output_layers_forward` | 计时 | 是 | 20 | 3.7 | Class scores and box deltas of the output layers for 4000 region features of 1024 values with 80 classes, without gradients. |
| `bench_output_layers_inference` | 计时 | 是 | 20 | 2.4 | Decoding boxes and class probabilities from raw predictions and selecting the detections of 4 images with 1000 proposals each and 80 classes. |
| `bench_output_layers_losses_softmax` | 计时 | 是 | 20 | 9.9 | Softmax classification loss and smooth L1 box regression loss for 8 images with 2048 labeled proposals each and 80 classes. |
| `bench_output_layers_losses_federated` | 计时 | 是 | 20 | 8.9 | Sigmoid classification loss over 50 federated classes of 80 and GIoU loss of class-agnostic boxes for 8 images with 2048 labeled proposals each. |
| `bench_predict_boxes_for_gt_classes` | 计时 | 是 | 20 | 11.5 | Decoding the box of each proposal's ground truth class for 8 images with 2048 proposals each and 80 classes of box deltas. |
| `bench_box_head_forward` | 计时 | 是 | 20 | 2.5 | Forward pass of a box head with two 3x3 convolutions of 32 channels and two fully connected layers of 256 units over 256 pooled regions of 7x7, without gradients. |
| `bench_label_and_sample_proposals` | 计时 | 是 | 20 | 3.6 | Matching 2000 proposals to 40 ground truth boxes and sampling 512 labeled proposals for each of 8 images. |
| `bench_select_foreground_proposals` | 计时 | 是 | 20 | 5.6 | Selecting the foreground proposals of 64 images with 512 labeled proposals each, about a tenth of them ignored or background. |
| `bench_standard_heads_inference` | 计时 | 是 | 20 | 9.5 | Detection by standard ROI heads with a two-layer box head for 2 images with 500 proposals each, pooled at 7x7 from two feature levels of 32 channels, 20 classes. |
| `bench_standard_heads_training` | 计时 | 是 | 20 | 4.8 | Training losses of standard ROI heads for 2 images with 1000 proposals and 20 ground truth boxes each, 256 sampled per image, without the backward pass. |
| `bench_res5_heads_inference` | 计时 | 是 | 20 | 5.3 | Detection by Res5 ROI heads with a narrow res5 block for 2 images with 200 proposals each, pooled at 7x7 from one feature map of 32 channels, 20 classes. |
| `bench_res5_heads_training` | 计时 | 是 | 20 | 4.1 | Training losses of Res5 ROI heads with a narrow res5 block for 2 images with 1000 proposals and 20 ground truth boxes each, 64 sampled per image, without the backward pass. |

</details>

<details><summary>model-rotated-rcnn：3 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `bench_inference_two_images` | 计时 | 是 | 20 | 4.2 | Rotated box inference (decode, clip, score filter, per-class rotated NMS, top 100) for 2 images of 200 proposals each with 10 classes. |
| `bench_inference_single_class` | 计时 | 是 | 20 | 2.7 | Rotated box inference (decode, clip, score filter, rotated NMS, top 100) for 1 image of 700 proposals with a single foreground class. |
| `bench_label_and_sample` | 计时 | 是 | 20 | 3.1 | Labelling and sampling of training proposals (rotated IoU matching against ground truth, sampling 512 per image) for 4 images of 1000 proposals and 30 ground-truth boxes each. |

</details>

<details><summary>model-semantic-panoptic：6 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `test_segmentor_runs_backbone_and_head_once_per_batch` | 计数 | 是 | – | – | Counts how often a semantic segmentor runs its backbone and its head for one batch of 1 and of 8 small images: at most once each, whatever the batch size. |
| `test_panoptic_runs_each_part_once_per_batch` | 计数 | 是 | – | – | Counts how often panoptic inference runs its backbone, semantic head, proposal generator and ROI heads for one batch of 1 and of 8 small images: at most once each. |
| `bench_fpn_head_inference` | 计时 | 是 | 20 | 1.2 | Semantic FPN head in inference: four feature levels of 32 channels for two 128x128 images, 20 classes, group norm, logits upsampled to the image size. |
| `bench_fpn_head_training_loss` | 计时 | 是 | 20 | 2.2 | Semantic FPN head in training: forward and cross entropy loss for four feature levels of 32 channels of two 128x128 images with 20 classes. |
| `bench_segmentor_inference` | 计时 | 是 | 20 | 1.9 | Semantic segmentor inference on two images of about 128x128 pixels with a pooling backbone and a 10 class FPN head, one result resized to 240x200. |
| `bench_panoptic_combine` | 计时 | 是 | 20 | 1.7 | Panoptic inference that postprocesses and combines 40 scored box-shaped instances with a 6 class semantic map of one 256x256 image into panoptic segments. |

</details>

<details><summary>model-zoo：5 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `bench_released_urls` | 计时 | 是 | 20 | 2.2 | Look up the address of the pretrained checkpoint of 40 released builtin configs (28 named as YAML, 12 as Python files), 500 times each: 20000 successful lookups. |
| `bench_unreleased_names` | 计时 | 是 | 20 | 1.4 | Ask for the pretrained checkpoint of 40 config names that have no released model, 300 times each: 12000 lookups that all end in the error saying the model is not available. |
| `bench_config_file_of_absent_names` | 计时 | 是 | 20 | 3.0 | Ask for the file of 40 config names that are not among the builtin configs (20 YAML, 20 Python names), 10 times each: 400 lookups that all end in the not-available error. |
| `bench_config_of_absent_names` | 计时 | 是 | 20 | 4.6 | Ask for the config of 40 names that are not among the builtin configs, once as it is and once with trained weights, 5 times over: 400 requests that all end in the not-available error. |
| `bench_model_of_absent_names` | 计时 | 是 | 20 | 3.7 | Ask for the built model of 40 config names that are not among the builtin configs, 10 times each: 400 requests that all end in the not-available error before any model is built. |

</details>

<details><summary>solver：11 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `bench_reduce_single_param_groups` | 计时 | 是 | 20 | 7.2 | Merging 10000 one-parameter groups that carry six distinct learning-rate and weight-decay combinations into the smallest list of parameter groups. |
| `bench_reduce_named_overlapping_groups` | 计时 | 是 | 20 | 2.4 | Regrouping 125 named parameter groups of 100 parameters each (10000 parameters, a quarter of the groups overwritten by later entries) into merged groups. |
| `bench_default_params_plain` | 计时 | 是 | 20 | 7.5 | Collecting default optimizer parameters of a model with 1000 linear and 1000 batch-norm layers (4000 parameters) with a base rate and a norm weight decay. |
| `bench_default_params_all_overrides` | 计时 | 是 | 20 | 7.0 | Collecting optimizer parameters of a 2000-layer model (4000 parameters) with a bias rate factor, bias and norm weight decay, a per-name rate function and a name override. |
| `bench_build_optimizer_default` | 计时 | 是 | 20 | 5.9 | Building the configured optimizer for a model with 1000 linear and 1000 batch-norm layers (4000 parameters) with the default solver settings. |
| `bench_build_optimizer_clipping_and_bias` | 计时 | 是 | 20 | 2.3 | Building the configured optimizer with gradient clipping, a bias rate factor and bias and norm weight decay for a 2000-layer model with 4000 parameters. |
| `bench_lr_multiplier_rates` | 计时 | 是 | 20 | 4.0 | Advancing a warmup multi-step multiplier schedule through 300 iterations and computing the learning rates of 200 parameter groups 20 times after each iteration. |
| `bench_legacy_multistep_rates` | 计时 | 是 | 20 | 1.6 | Advancing the legacy warmup multi-step schedule (60 warmup iterations, three milestones) through 300 iterations and computing the rates of 200 parameter groups 20 times after each. |
| `bench_legacy_cosine_rates` | 计时 | 是 | 20 | 3.7 | Advancing the legacy warmup cosine schedule (60 warmup iterations) through 300 iterations and computing the rates of 200 parameter groups 20 times after each. |
| `bench_build_lr_scheduler` | 计时 | 是 | 20 | 2.7 | Building 900 schedulers from configuration, 300 each of the multi-step, cosine and fixed-gamma step schedules with warmup, for an optimizer with 20 parameter groups. |
| `bench_warmup_param_scheduler_construction` | 计时 | 是 | 20 | 4.1 | Wrapping a cosine and a multi-step schedule with a warmup stage 16000 times, alternating linear and constant warmup with and without rescaled intervals. |

</details>

<details><summary>struct-boxes：19 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `bench_pairwise_iou_dense` | 计时 | 是 | 20 | 10.1 | Intersection over union between every pair of two sets of 1500 boxes each, giving a 1500 by 1500 matrix. |
| `bench_pairwise_ioa_dense` | 计时 | 是 | 20 | 9.8 | Intersection over the second box's area between every pair of two sets of 1500 boxes each. |
| `bench_pairwise_point_box_distance` | 计时 | 是 | 20 | 11.5 | Distances from each of 2000 points to the four edges of each of 1500 boxes. |
| `bench_pairwise_iou_per_image` | 计时 | 是 | 20 | 3.5 | Intersection over union for 200 separate small problems, each matching 20 boxes against 300 boxes. |
| `bench_pairwise_ioa_per_image` | 计时 | 是 | 20 | 1.4 | Intersection over area for 200 separate small problems, each comparing 20 boxes against 300 boxes. |
| `bench_measure_large` | 计时 | 是 | 20 | 7.6 | Area, non-empty test, inside-image test and centers of one set of 500000 boxes, ten rounds. |
| `bench_clip_scale_clone_large` | 计时 | 是 | 20 | 5.1 | Clip to an image size, rescale and copy one set of 500000 boxes, three rounds. |
| `bench_index_single_boxes` | 计时 | 是 | 20 | 9.0 | Picking each of 5000 boxes out of one set by its integer position, one at a time. |
| `bench_mask_slice_cat` | 计时 | 是 | 20 | 8.7 | Selecting by a boolean mask and by a slice from 5000 boxes and joining the parts, 300 rounds. |
| `bench_cat_many_small` | 计时 | 是 | 20 | 4.4 | Joining 2000 sets of 50 boxes each into one set, 40 rounds. |
| `bench_construct_from_lists` | 计时 | 是 | 20 | 2.2 | Building 1500 box sets, each from a plain nested list of 10 boxes, and taking the length of each. |
| `bench_per_image_cleanup` | 计时 | 是 | 20 | 1.9 | For 1000 sets of 100 boxes: build the set, clip it to the image, keep the non-empty boxes and take their areas. |
| `bench_convert_single_lists` | 计时 | 是 | 20 | 1.2 | Converting 2000 single boxes, each a plain list of four numbers, from corner-and-size to two-corner form. |
| `bench_convert_single_tuples` | 计时 | 是 | 20 | 1.1 | Converting 2000 single boxes, each a tuple of four numbers, from two-corner to corner-and-size form. |
| `bench_convert_single_rotated_lists` | 计时 | 是 | 20 | 7.4 | Converting 2000 single rotated boxes, each a plain list of five numbers, to their upright bounding boxes. |
| `bench_convert_tensor_batch` | 计时 | 否（too_noisy） | 118 | 93.8 | Converting one tensor of 2000000 boxes from corner-and-size to two-corner form and the result back again. |
| `bench_convert_numpy_batch` | 计时 | 是 | 20 | 18.6 | Converting one numpy array of 2000000 boxes from corner-and-size to two-corner form and the result back again. |
| `bench_convert_rotated_batch` | 计时 | 是 | 20 | 16.9 | Converting one tensor of 500000 rotated boxes to their upright two-corner bounding boxes. |
| `bench_convert_batch_to_rotated` | 计时 | 是 | 61 | 48.3 | Converting one tensor of 500000 corner-and-size boxes to center, size and angle form. |

</details>

<details><summary>struct-image-list：14 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `test_input_reads_grow_at_most_linearly` | 计数 | 是 | – | – | Counts how many times images are taken out of the input list while batching 50, 100 and 200 small images with a size divisibility of 8; doubling the number of images must at most double that count. |
| `test_input_reads_bounded_per_image` | 计数 | 是 | – | – | Counts how many times images are taken out of the input list while batching 64 small images; the count must stay within ten reads for each image. |
| `test_single_image_reads_bounded` | 计数 | 是 | – | – | Counts how many times the one image is taken out of the input list while batching a single small image; the count must stay within ten reads. |
| `test_padding_constraints_lookups_do_not_grow_with_batch` | 计数 | 是 | – | – | Counts how often the padding constraints are consulted while batching 4 and then 128 small images to a 16 pixel square; the count must not grow with the number of images and must stay within ten lookups. |
| `test_indexing_returns_views_without_new_storage` | 计数 | 是 | – | – | Counts the distinct storages behind the 32 images read back by index from a padded batch; every one must share the single storage of the batch, so no image data is copied. |
| `test_same_dtype_conversion_copies_nothing` | 计数 | 是 | – | – | Counts the tensors copied when a padded batch of 8 images is converted 20 times to the device and precision it already has; none may be copied. |
| `bench_many_small_images_divisible` | 计时 | 是 | 20 | 4.9 | Batching 3000 small three-channel images of 8 to 16 pixels a side into one padded batch with a size divisibility of 32. |
| `bench_photo_sized_batch` | 计时 | 是 | 20 | 3.5 | Batching 16 three-channel images of about 200 by 300 pixels into one padded batch with a size divisibility of 32 and a pad value of 1. |
| `bench_square_padding_batch` | 计时 | 是 | 20 | 5.9 | Batching 1500 three-channel images of 40 to 59 pixels a side into one batch padded to a 64 pixel square through the padding constraints. |
| `bench_single_images_one_by_one` | 计时 | 是 | 20 | 5.0 | Batching 300 three-channel images of about 30 by 40 pixels one at a time, each into its own single-image batch with a size divisibility of 32. |
| `bench_many_masks_no_divisibility` | 计时 | 是 | 20 | 1.3 | Batching 2000 two-dimensional byte images of 4 to 16 pixels a side into one padded batch without size divisibility. |
| `bench_index_every_image` | 计时 | 是 | 20 | 1.5 | Reading each of the 4000 images of a padded batch back in its original size by its index, once each, with the batch length read once. |
| `bench_construct_and_measure` | 计时 | 是 | 20 | 2.4 | Wrapping one ready 16-image tensor with its sizes 100000 times, reading the length and the device of every wrapper. |
| `bench_convert_dtype_repeatedly` | 计时 | 是 | 20 | 4.9 | Converting a padded batch of 16 three-channel images of 64 by 64 pixels to double precision 300 times. |

</details>

<details><summary>struct-instances：19 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `test_setting_fields_asks_lengths_linearly` | 计数 | 是 | – | – | Counts length queries on field values while adding 8 and then 16 fields of five entries one by one; doubling the number of fields may at most double the queries, plus two. |
| `test_indexing_reads_each_field_once` | 计数 | 是 | – | – | Counts item reads on field values when a container of six fields and five instances is indexed once by an integer or a slice; each field may be read at most once. |
| `test_indexing_reads_do_not_grow_with_instances` | 计数 | 是 | – | – | Counts item reads on field values for one integer index into containers of three fields holding 4 and then 400 instances; the count may not grow with the number of instances. |
| `test_length_asks_one_field` | 计数 | 是 | – | – | Counts length queries on field values for one length request on containers of 2 and of 12 fields; at most one field may be asked, however many fields there are. |
| `test_lookup_does_not_touch_field_values` | 计数 | 是 | – | – | Counts length queries and item reads on field values during 50 rounds of existence checks, reads by name and by attribute and image size reads on a four-field container; none may happen. |
| `test_move_calls_each_field_once` | 计数 | 是 | – | – | Counts device-move calls on field values when containers of 4 and of 8 fields are moved once; each field may be moved at most once, so doubling the fields at most doubles the calls. |
| `test_cat_joins_each_field_once` | 计数 | 是 | – | – | Counts join calls on the field type when 2 and then 32 containers of three fields are concatenated; at most one join per field may happen, however many containers are given. |
| `test_cat_reads_no_items` | 计数 | 是 | – | – | Counts item reads on field values when 16 containers of three fields and two instances are concatenated; the fields are joined whole, so no item may be read. |
| `test_string_form_renders_each_field_once` | 计数 | 是 | – | – | Counts string renderings of field values for one string form of containers of 3 and of 9 fields; each field may be rendered at most once. |
| `bench_construct_with_fields` | 计时 | 是 | 20 | 6.5 | Build 10000 containers, each given four named list fields of three entries at construction. |
| `bench_set_has_get_remove` | 计时 | 是 | 20 | 11.2 | Add a list field of four entries to a one-field container, check it exists, read it and remove it, 40000 times. |
| `bench_read_fields` | 计时 | 是 | 20 | 7.1 | Read two fields by attribute, the length, the image size and the field mapping of a four-field container, 60000 rounds. |
| `bench_index_int_and_slice` | 计时 | 是 | 20 | 6.3 | Index a container of 40 instances with three list fields by each integer position and by 40 slices, 150 times over. |
| `bench_index_mask_tensor_fields` | 计时 | 是 | 20 | 2.4 | Select instances by a boolean mask from a container of 16 instances with three small tensor fields, 2500 times. |
| `bench_cat_many_small` | 计时 | 是 | 20 | 4.8 | Concatenate 4000 single-instance containers with three list fields: five times all at once, then 6000 groups of four. |
| `bench_string_form` | 计时 | 是 | 20 | 2.4 | Render the string form of a container of 30 instances with four list fields, 4000 times. |
| `bench_to_device` | 计时 | 是 | 20 | 4.6 | Move a container of eight instances with three small tensor fields and one list field to the CPU device, 5000 times. |
| `bench_assign_fields_by_attribute` | 计时 | 是 | 20 | 11.4 | Create 10000 empty containers and give each three list fields of two entries by attribute assignment, reading one back. |
| `bench_overwrite_field_by_attribute` | 计时 | 是 | 20 | 8.3 | Overwrite one field of a two-field container of five instances by attribute assignment 30000 times. |

</details>

<details><summary>struct-keypoints：7 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `bench_heatmaps_to_keypoints_many_rois` | 计时 | 是 | 20 | 2.1 | Decoding predicted keypoint locations from heatmaps of 60 boxes with 17 keypoints each at 56x56 resolution, the boxes being 40 to 160 pixels on a side. |
| `bench_heatmaps_to_keypoints_small_rois` | 计时 | 是 | 20 | 3.6 | Decoding predicted keypoint locations from heatmaps of 400 small boxes (4 to 24 pixels on a side) with 17 keypoints each at 28x28 resolution. |
| `bench_to_heatmap_repeated` | 计时 | 是 | 34 | 27.0 | Converting the keypoints of 4000 instances with 17 keypoints each into training heatmap labels of side 56 inside one box per instance, repeated 30 times. |
| `bench_construct_from_nested_list` | 计时 | 是 | 20 | 3.1 | Building one keypoint container from a nested Python list holding 6000 instances with 17 keypoints each. |
| `bench_index_by_slice_and_mask` | 计时 | 是 | 20 | 1.6 | Taking 1000 slices and 1000 boolean-mask selections from a keypoint container of 2000 instances with 17 keypoints each. |
| `bench_cat_many_containers` | 计时 | 是 | 20 | 5.4 | Concatenating 2000 keypoint containers of 4 instances with 17 keypoints each into one container, repeated 60 times. |
| `bench_convert_dtype_and_inspect` | 计时 | 是 | 20 | 9.0 | Converting a keypoint container of 3000 instances with 17 keypoints each to double precision 300 times, taking the length, device and text form of each result. |

</details>

<details><summary>struct-masks：16 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `test_construction_converts_each_polygon_at_most_once` | 计数 | 是 | – | – | Counts how often each given polygon is converted to an array while polygon masks are built from 8 instances of 3 polygons each: at most once per polygon. |
| `test_doubling_instances_at_most_doubles_conversions` | 计数 | 是 | – | – | Counts array conversions of the given polygons while polygon masks are built from 10 and then 20 instances of 2 polygons each: doubling the input at most doubles the conversions. |
| `test_operations_after_construction_convert_nothing_again` | 计数 | 是 | – | – | Counts array conversions of the 12 given polygons (6 instances of 2) after construction, across area, bounding boxes, emptiness, selection, concatenation, iteration, cropping to 7x7 and rasterizing to 16x16: none are added. |
| `bench_construct_from_float32_arrays` | 计时 | 是 | 20 | 4.7 | Building polygon masks for 6000 instances, each given as 2 float32 arrays of 12 points, validating and converting every polygon. |
| `bench_construct_from_tensors` | 计时 | 是 | 20 | 3.1 | Building polygon masks for 3000 instances, each given as 2 torch tensors of 12 points. |
| `bench_area` | 计时 | 是 | 20 | 3.9 | Computing the per-instance area of polygon masks holding 2000 instances of 2 polygons with 16 points each. |
| `bench_polygon_bounding_boxes` | 计时 | 是 | 20 | 0.8 | Computing tight bounding boxes of polygon masks holding 1000 instances of 2 polygons with 16 points each. |
| `bench_polygon_crop_and_resize` | 计时 | 是 | 20 | 1.1 | Cropping polygon masks of 400 instances (2 polygons of 16 points each) to their boxes and rasterizing them at 28x28. |
| `bench_bitmasks_from_polygon_masks` | 计时 | 是 | 20 | 2.0 | Rasterizing polygon masks of 600 instances (2 polygons of 16 points each) into full 128x128 bit masks. |
| `bench_polygons_to_bitmask_large` | 计时 | 是 | 20 | 0.8 | Rasterizing one instance made of 400 polygons with 32 points each into a single 512x512 boolean mask. |
| `bench_select_and_concatenate` | 计时 | 是 | 20 | 2.5 | Selecting from polygon masks of 2000 instances by a boolean vector, by an index list and by a slice, then concatenating the three selections and testing which are non-empty. |
| `bench_bitmask_bounding_boxes` | 计时 | 是 | 20 | 0.7 | Computing tight bounding boxes of 1500 bit masks of 64x64 pixels, one filled rectangle each and every seventh mask empty. |
| `bench_bitmask_crop_and_resize` | 计时 | 是 | 20 | 1.5 | Cropping 300 bit masks of 96x96 pixels to one box each and resizing the crops to 28x28. |
| `bench_roi_masks_to_bitmasks` | 计时 | 是 | 20 | 1.5 | Pasting 60 region masks of 28x28 scores into full 160x160 bit masks at their boxes with the default threshold. |
| `bench_construct_from_uint8_array` | 计时 | 是 | 20 | 3.4 | Building bit masks from a numpy uint8 array of 400 maps of 128x128 pixels and testing which masks are non-empty. |
| `bench_select_iterate_concatenate` | 计时 | 是 | 20 | 4.5 | Selecting from 1200 bit masks of 64x64 pixels by a boolean vector, a slice and 200 single integers, concatenating all selections, then iterating over the result and reading its length and text form. |

</details>

<details><summary>struct-rotated-boxes：12 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `bench_pairwise_iou_dense_overlap` | 计时 | 是 | 20 | 1.3 | Pairwise rotated IoU between two sets of 160 rotated boxes each (25600 pairs) whose centers lie in a 100x100 area, so most pairs overlap. |
| `bench_pairwise_iou_sparse_overlap` | 计时 | 是 | 20 | 1.3 | Pairwise rotated IoU between two sets of 300 rotated boxes each (90000 pairs) spread over a 2000x2000 area, so most pairs do not overlap. |
| `bench_pairwise_iou_one_against_many` | 计时 | 是 | 20 | 1.2 | Rotated IoU of a single rotated box against 20000 rotated boxes with centers in a 100x100 area (a 1 x 20000 IoU matrix). |
| `bench_tensor_iou_self_comparison` | 计时 | 是 | 20 | 1.3 | Rotated IoU of a plain 150x5 tensor of rotated boxes against itself (22500 pairs) through the tensor-level IoU function. |
| `bench_clip_mixed_angles` | 计时 | 是 | 20 | 5.4 | Clipping 300000 rotated boxes to a 120x200 image with the default angle threshold, where half of the boxes are nearly horizontal and get clipped. |
| `bench_clip_all_boxes` | 计时 | 是 | 20 | 3.5 | Clipping 300000 rotated boxes to a 120x200 image with an angle threshold of 180 degrees, so that every box is clipped. |
| `bench_scale_anisotropic` | 计时 | 是 | 20 | 9.9 | Scaling one million rotated boxes in place with different horizontal and vertical factors (1.5 and 0.75). |
| `bench_normalize_angles` | 计时 | 是 | 20 | 9.2 | Normalizing the angles of one million rotated boxes whose angles span -720 to 720 degrees. |
| `bench_inside_box` | 计时 | 是 | 20 | 11.4 | Testing one million rotated boxes for lying inside a 120x200 reference box, once without and once with a boundary threshold of 10. |
| `bench_area_nonempty_filter` | 计时 | 是 | 20 | 1.0 | Computing areas and the non-empty mask (threshold 20) of one million rotated boxes, then selecting the non-empty boxes by that mask and taking their centers. |
| `bench_index_single_boxes` | 计时 | 是 | 20 | 1.1 | Indexing a set of 4000 rotated boxes 4000 times with an integer and 2000 times with a two-box slice, cloning every tenth result. |
| `bench_build_and_cat_many` | 计时 | 是 | 20 | 2.0 | Building 1500 rotated-box sets of 20 boxes each from tensors and concatenating all of them into one set of 30000 boxes, twenty times over. |

</details>

<details><summary>utils-collect-env：4 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `test_report_starts_no_lasting_threads` | 计数 | 是 | – | – | Counts the threads alive before and after building the environment report five times: the report leaves no additional thread running. |
| `test_program_writes_report_in_few_writes` | 计数 | 是 | – | – | Counts the writes that reach standard output when the report program runs once on a CPU-only machine: at most one write for each line of the report plus one. |
| `test_program_writes_do_not_grow_with_repeated_runs` | 计数 | 是 | – | – | Counts the writes to standard output over one run and over two runs of the report program: two runs write at most twice as often as one. |
| `bench_report_repeated` | 计时 | 是 | 20 | 4.0 | Builds the complete environment report text 200 times in a row on a CPU-only machine, after one untimed warm-up call that loads the libraries it reports on. |

</details>

<details><summary>utils-events：11 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `bench_put_scalar_stream` | 计时 | 是 | 20 | 5.9 | Recording 20 differently named scalars at each of 10000 consecutive iterations of a fresh metric storage, one scalar per call (200000 calls). |
| `bench_put_scalars_keywords` | 计时 | 是 | 20 | 5.8 | Recording 20 scalars at once from keyword arguments, without smoothing, at each of 8000 consecutive iterations of a fresh metric storage. |
| `bench_name_scope_puts` | 计时 | 是 | 20 | 5.5 | Entering one of 10 name scopes and recording 2 scalars inside it, repeated for all scopes at each of 4000 iterations (40000 scope entries, 80000 scalars). |
| `bench_count_samples_wide_window` | 计时 | 是 | 20 | 2.3 | Counting the samples of one scalar that fall in the last 10000 iterations, 200 times, on a storage holding 20000 samples of it (one per iteration). |
| `bench_latest_with_smoothing_hint` | 计时 | 是 | 20 | 2.6 | Asking 150 times for the latest value of every scalar, median-smoothed over a window of 100 iterations, on a storage with 30 smoothed and 30 unsmoothed scalars of 300 samples each. |
| `bench_latest_default_window` | 计时 | 是 | 20 | 4.0 | Asking 60 times for the latest smoothed value of every scalar with the default window of 20 iterations, on a storage with 100 smoothed scalars of 100 samples each. |
| `bench_put_histogram` | 计时 | 否（too_noisy） | 346 | 276.6 | Recording 100 histograms of 500 bins each from one tensor of 200000 values on a fresh metric storage, then discarding them. |
| `bench_metric_printer_write` | 计时 | 是 | 20 | 1.7 | Printing the common training metrics line with ETA 300 times for a storage holding 200 iterations of 20 losses, one extra metric, time, data time and learning rate. |
| `bench_metric_printer_no_eta` | 计时 | 是 | 20 | 2.1 | Printing the common training metrics line without ETA 150 times, smoothing over 50 iterations, for a storage holding 100 iterations of 40 losses plus time, data time and learning rate. |
| `bench_json_writer_new_data` | 计时 | 是 | 20 | 3.6 | Recording 150 scalars for one more iteration and appending them as one JSON line, smoothed over 100 iterations, 40 times in a row on a storage that already holds 100 iterations of those scalars. |
| `bench_json_writer_nothing_new` | 计时 | 是 | 20 | 3.4 | Writing the latest values of 100 scalars as JSON 60 times, smoothed over 60 iterations, where only the first write has new data and the other 59 find nothing new to append. |

</details>

<details><summary>utils-foundation：11 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `test_retry_calls_function_once_when_it_succeeds` | 计数 | 是 | – | – | Counts calls of the given function through the retry wrapper when no error occurs: at most one for each of 1, 10 and 20 wrapper calls. |
| `test_retry_calls_function_at_most_three_times_on_persistent_oom` | 计数 | 是 | – | – | Counts calls of the given function through the retry wrapper when every call fails with an out-of-memory error: at most three for one wrapper call. |
| `test_retry_does_not_repeat_other_errors` | 计数 | 是 | – | – | Counts calls of the given function through the retry wrapper when it fails with an error that is not out-of-memory: at most one for one wrapper call. |
| `test_retry_stops_at_first_success` | 计数 | 是 | – | – | Counts calls of the given function through the retry wrapper when only its first call fails with an out-of-memory error: at most two for one wrapper call. |
| `test_wrapper_calls_wrapped_once_per_call_even_when_nested` | 计数 | 是 | – | – | Counts calls of a function held by one and by five nested picklable wrappers: at most one for each of 10 and 20 wrapper calls. |
| `test_wrapper_pickling_does_not_call_wrapped` | 计数 | 是 | – | – | Counts calls of a function held by a picklable wrapper while the wrapper is pickled and restored three times: none. |
| `bench_locate_dotted_names` | 计时 | 是 | 20 | 3.9 | Resolving eight dotted names of modules, classes and functions to their objects, repeated 400 times (3200 lookups). |
| `bench_retry_calls` | 计时 | 是 | 20 | 2.3 | Calling a trivial two-argument function 30000 times through the out-of-memory retry wrapper when no error occurs. |
| `bench_wrapper_calls` | 计时 | 是 | 20 | 2.8 | Calling a trivial function 50000 times through the picklable wrapper and reading one forwarded attribute each time. |
| `bench_wrapper_pickle` | 计时 | 是 | 20 | 3.4 | Pickling 1000 picklable wrappers that each hold a small closure, once each. |
| `bench_dummy_objects` | 计时 | 是 | 20 | 3.0 | Creating 3000 placeholder classes and 3000 placeholder functions for a missing dependency and triggering the import error of each once. |

</details>

<details><summary>utils-logging：9 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `test_writes_per_record_do_not_grow_with_repeated_setup` | 计数 | 是 | – | – | Setting up the same logger 20 times with the same arguments and logging 10 records: at most two console writes for each record. |
| `test_first_n_writes_at_most_n_records` | 计数 | 是 | – | – | Calling the log-only-the-first-times helper 200 times with n of 3 from one place: at most two console writes for each of the 3 records. |
| `test_every_n_writes_grow_no_faster_than_calls` | 计数 | 是 | – | – | Calling the log-once-per-n-calls helper 100 and then 200 times with n of 10: at most two console writes per logged record, and doubling the calls at most doubles the writes. |
| `bench_first_n_suppressed` | 计时 | 是 | 20 | 1.7 | Calling the log-only-the-first-time helper 100000 times from one place, keyed by caller, where every call is suppressed. |
| `bench_first_n_caller_and_message` | 计时 | 是 | 20 | 1.4 | Calling the log-only-the-first-time helper 100000 times from one place, keyed by caller and message, cycling through 50 messages. |
| `bench_every_n_sparse` | 计时 | 是 | 20 | 2.7 | Calling the log-once-per-n-calls helper 100000 times from one place with n of 1000, to a logger that discards the records. |
| `bench_every_n_seconds_suppressed` | 计时 | 是 | 20 | 3.2 | Calling the log-at-most-once-per-interval helper 100000 times from one place with an interval of a million seconds. |
| `bench_every_call_written_plain` | 计时 | 是 | 20 | 4.6 | Logging 10000 short messages through the log-once-per-n-calls helper with n of 1 to a logger set up without color, written to an in-memory console. |
| `bench_every_call_written_colored` | 计时 | 是 | 20 | 4.4 | Logging 10000 short warnings through the log-once-per-n-calls helper with n of 1 to a logger set up with color, written to an in-memory console. |

</details>

<details><summary>utils-testing：17 个基准</summary>

| 函数 | 类型 | 是标准 | 允许慢（%） | 原版噪声（%） | 测的内容 |
| --- | --- | --- | --- | --- | --- |
| `test_opset_decorator_runs_body_at_most_once_per_call` | 计数 | 是 | – | – | Counts runs of a test body wrapped by the minimum opset check when the opset is supported, for 10 and 20 calls. |
| `test_opset_decorator_never_runs_body_when_unsupported` | 计数 | 是 | – | – | Counts runs of a test body wrapped by the minimum opset check over 25 calls with an opset that is too old. |
| `test_opset_decorator_with_fallback_version_never_runs_skipped_body` | 计数 | 是 | – | – | Counts runs of a test body over 25 calls when the case has no opset of its own and the fallback opset is too old. |
| `test_torch_version_decorator_runs_body_at_most_once_per_call` | 计数 | 是 | – | – | Counts runs of a test body guarded by a satisfied minimum torch version, at decoration and over 10 and 20 calls. |
| `test_torch_version_decorator_never_runs_body_when_too_old` | 计数 | 是 | – | – | Counts runs of a test body guarded by a minimum torch version far above the installed one over 25 calls. |
| `test_custom_op_registration_is_silent_and_lazy_when_version_is_met` | 计数 | 是 | – | – | Counts lines printed and calls of the symbolic function over 20 register and unregister rounds that are no-ops. |
| `test_custom_op_registration_prints_at_most_one_line_per_call` | 计数 | 是 | – | – | Counts lines printed and calls of the symbolic function over 5 and 10 rounds of real registering and unregistering. |
| `bench_random_boxes_half_million` | 计时 | 是 | 20 | 7.0 | Generating 500000 random boxes with the default coordinate limit in a single call. |
| `bench_random_boxes_many_small_calls` | 计时 | 是 | 20 | 4.6 | Generating random boxes in 400 separate calls of 1000 boxes each with a coordinate limit of 512. |
| `bench_compare_large_instances` | 计时 | 是 | 20 | 7.7 | Comparing two equal sets of 20000 instances holding boxes, scores, classes and 14x14 masks for closeness. |
| `bench_compare_many_small_instances` | 计时 | 是 | 20 | 7.1 | Comparing 400 pairs of equal 50-instance results with boxes, scores and classes, image sizes compared as tensors. |
| `bench_convert_scripted_instances` | 计时 | 是 | 20 | 4.7 | Converting 2000 scripted instance objects of 5 detections with three fields each back to regular instances. |
| `bench_compare_scripted_instances` | 计时 | 是 | 20 | 7.7 | Comparing 500 scripted instance objects of 5 detections each against their regular counterparts for closeness. |
| `bench_dynamic_axes_large_graph` | 计时 | 是 | 30 | 23.5 | Checking that all axes are dynamic on a model graph with 20000 four-axis inputs and 20000 two-axis outputs. |
| `bench_reload_script_model` | 计时 | 是 | 20 | 5.7 | Saving a scripted model of eight 512x512 linear layers, about two million parameters, and loading it back. |
| `bench_reload_many_small_script_models` | 计时 | 是 | 20 | 1.9 | Saving and loading back five small scripted models of two 8x8 linear layers, four times each. |
| `bench_reload_lazy_config` | 计时 | 是 | 20 | 5.0 | Saving a lazy configuration that holds a list of 100 nested object descriptions with four arguments each and loading it back. |

</details>

候选的性能测量：

| 开始 | 结束 | 第几分钟 | 候选 | 分钟 | 结果 | 标准 | 通过 | 慢于允许值 | 出错 / 超时 / 无结论 | 记录 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 20:20:42 | 21:50:04 | 923.1 | candidate-5 | 89.4 | failed | 582 | 577 | 5 | 0 / 0 / 0 | `performance-23` |

`performance-23`：381 个计时基准里，候选耗时与原版之比的中位数 0.999，最小 0.102，最大 2.147；比原版快的占 55%。测量本身用了 5359 秒。

`performance-23` 里慢于允许值的标准：

| 叶子 | 函数 | 候选 / 原版 | 允许慢（%） | 原版噪声（%） | 轮数 | 时钟 | 测的内容 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| engine-distributed | `bench_synchronize_single_process` | 1.241 | 20 | 1.0 | 5 | wall | Calls the barrier helper 200000 times in a single process, where there is nobody to wait for. |
| layers-mask-ops | `bench_scale_3000000_boxes` | 1.418 | 31 | 24.6 | 5 | wall | Scaling three million boxes about their centres by a factor of 1.1. |
| data-detection-utils | `bench_check_image_size` | 1.267 | 20 | 11.5 | 5 | wall | Checking a 640x480 picture against 200000 dataset records, half of which state the size and half of which have it filled in. |
| datasets-coco | `bench_load_keypoints` | 1.569 | 55 | 43.6 | 5 | processor | Load a COCO person-keypoints file of 2000 images with 10 annotations of 17 keypoints each (340000 keypoints), with two extra annotation keys kept. |
| layers-deform-conv | `bench_extra_repr` | 2.147 | 20 | 4.0 | 5 | wall | Building the parameter summary text of one plain and one modulated deformable convolution layer, 5000 times each. |

`performance-23` 里只测量、不算标准的基准：

| 叶子 | 函数 | 状态 | 原因 | 候选 / 原版 |
| --- | --- | --- | --- | --- |
| model-cascade-rcnn | `bench_training_forward_backward` | measured | slowdown_not_detected | 0.991 |
| struct-boxes | `bench_convert_tensor_batch` | measured | too_noisy | 1.789 |
| utils-events | `bench_put_histogram` | measured | too_noisy | 0.969 |

## 9. 候选、对比和修复

作者的每次调用。并行组（`run_parallel_agents`）里的每个请求是一个作者会话，各在自己的工作区里写，写完由程序合并：

| 开始 | 第几分钟 | 作业 | 做什么 | 范围或叶子 | 分钟 | 轮数 | 美元 | 文件（加 / 改 / 删） | 候选 | 退出码 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 05:45:51 | 48.3 | 草稿① | 并行组（split）的请求 1：第一版 | scope-1 | 47.9 | 63 | 22.29 | +21 / 改 0 / 删 0 | candidate-1 | 0 |
| 05:45:51 | 48.3 | 草稿① | 并行组（split）的请求 2：第一版 | scope-2 | 33.7 | 66 | 17.93 | +27 / 改 0 / 删 0 | candidate-2 | 0 |
| 05:45:51 | 48.3 | 草稿① | 并行组（split）的请求 3：第一版 | scope-3 | 30.1 | 64 | 17.25 | +17 / 改 0 / 删 0 | candidate-3 | 0 |
| 05:45:51 | 48.3 | 草稿① | 并行组（split）的请求 4：第一版 | scope-4 | 28.9 | 66 | 17.10 | +19 / 改 0 / 删 0 | candidate-4 | 0 |
| 06:14:47 | 77.2 | 草稿① | 并行组（split）的请求 5：第一版 | scope-5 | 46.0 | 87 | 22.34 | +18 / 改 0 / 删 0 | candidate-5 | 0 |
| 05:43:15 | 45.7 | 草稿① | ↑ 这个并行组整体（含合并） | 5 个请求，冲突 0 处 | 78.6 | – | – | – | candidate-6 | – |
| 07:01:50 | 124.3 | 草稿① | 单个作者：第一版（并行组之后的集成） | scope-6 | 37.0 | 88 | 20.76 | +39 / 改 2 / 删 0 | candidate-6 | 0 |
| 07:44:03 | 166.5 | 草稿① | 单个作者：行为修复 | native-ops、packaging、layers-nms、layers-roi-align、layers-deform-conv、struct-rotated-boxes、utils-foundation、config-yacs、model-zoo、model-poolers、model-proposal-generators、model-roi-heads、model-rcnn、model-dense-detectors、model-semantic-panoptic、model-backbones、model-mask-head、model-keypoint-head、model-cascade-rcnn | 9.0 | 28 | 4.42 | +0 / 改 1 / 删 0 | candidate-7 | 0 |
| 07:57:17 | 179.7 | 草稿① | 单个作者：行为修复 | config-yacs、model-zoo、model-backbones、model-proposal-generators、model-roi-heads、model-mask-head、model-keypoint-head、model-cascade-rcnn、model-rcnn、model-dense-detectors、model-semantic-panoptic | 17.8 | 56 | 9.44 | +0 / 改 2 / 删 0 | candidate-8 | 0 |
| 19:15:20 | 857.8 | 主② | 并行组（split）的请求 1：行为修复 | datasets-coco、datasets-cityscapes、datasets-lvis、model-rcnn、model-dense-detectors | 12.7 | 42 | 6.09 | +1 / 改 6 / 删 0 | candidate-2 | 0 |
| 19:15:20 | 857.8 | 主② | 并行组（split）的请求 2：行为修复 | scope-6 | 18.0 | 42 | 9.28 | +19 / 改 7 / 删 0 | candidate-3 | 0 |
| 19:14:04 | 856.5 | 主② | ↑ 这个并行组整体（含合并） | 2 个请求，冲突 0 处 | 19.9 | – | – | – | candidate-4 | – |
| 19:57:44 | 900.2 | 主② | 单个作者：行为修复 | packaging | 13.6 | 32 | 5.99 | +3 / 改 3 / 删 0 | candidate-4 | 0 |
| 08:31:55 | 214.4 | 草稿② | 并行组（split）的请求 1：第一版 | scope-1 | 34.1 | 61 | 18.00 | +19 / 改 0 / 删 0 | candidate-1 | 0 |
| 08:31:55 | 214.4 | 草稿② | 并行组（split）的请求 2：第一版 | scope-2 | 28.1 | 77 | 16.79 | +26 / 改 0 / 删 0 | candidate-2 | 0 |
| 08:31:56 | 214.4 | 草稿② | 并行组（split）的请求 3：第一版 | scope-3 | 33.8 | 82 | 20.08 | +15 / 改 0 / 删 0 | candidate-3 | 0 |
| 08:31:56 | 214.4 | 草稿② | 并行组（split）的请求 4：第一版 | scope-4 | 29.6 | 73 | 17.85 | +18 / 改 0 / 删 0 | candidate-4 | 0 |
| 09:00:03 | 242.5 | 草稿② | 并行组（split）的请求 5：第一版 | scope-5 | 36.6 | 78 | 22.68 | +16 / 改 0 / 删 0 | candidate-5 | 0 |
| 09:01:29 | 243.9 | 草稿② | 并行组（split）的请求 6：第一版 | scope-6 | 27.2 | 78 | 17.13 | +35 / 改 0 / 删 0 | candidate-6 | 0 |
| 08:28:50 | 211.3 | 草稿② | ↑ 这个并行组整体（含合并） | 6 个请求，冲突 0 处 | 69.1 | – | – | – | candidate-7 | – |
| 09:37:56 | 280.4 | 草稿② | 单个作者：第一版（并行组之后的集成） | 整个选择 | 30.6 | 81 | 12.08 | +8 / 改 1 / 删 0 | candidate-7 | 0 |

行为对比（四个作业的都列在这里）：

| 开始 | 第几分钟 | 作业 | 范围 | 候选 | 分钟 | 结果 | 失败的检查 | 失败的用例 | 没有运行的检查 | 体积 | 记录 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 07:39:07 | 161.6 | 草稿① | 完整 | candidate-7 | 1.6 | regressed | 9 | 29 | 0 | 26.01% | `verification-10` |
| 07:43:26 | 165.9 | 草稿① | 针对性 | candidate-7 | 0.6 | regressed | 2 | 2 | 36 | 26.01% | `verification-12` |
| 07:53:15 | 175.7 | 草稿① | 针对性 | candidate-8 | 1.1 | regressed | 9 | 29 | 36 | 26.02% | `verification-14` |
| 07:56:40 | 179.1 | 草稿① | 针对性 | candidate-8 | 0.6 | regressed | 2 | 2 | 36 | 26.02% | `verification-16` |
| 08:15:26 | 197.9 | 草稿① | 针对性 | candidate-9 | 0.6 | regressed | 2 | 2 | 36 | 26.03% | `verification-19` |
| 10:08:46 | 311.2 | 草稿② | 完整 | candidate-8 | 1.6 | regressed | 8 | 28 | 0 | 25.58% | `verification-11` |
| 10:11:33 | 314.0 | 草稿② | 完整 | candidate-8 | 0.8 | unverified | 0 | 0 | 0 | 25.58% | `verification-13` |
| 18:41:36 | 824.0 | 主② | 完整 | candidate-1 | 6.0 | regressed | 27 | 224 | 0 | 25.58% | `verification-6` |
| 18:50:06 | 832.5 | 主② | 完整 | candidate-1 | 4.5 | regressed | 10 | 28 | 0 | 25.58% | `verification-8` |
| 19:33:56 | 876.4 | 主② | 针对性 | candidate-4 | 2.2 | regressed | 2 | 2 | 148 | 26.82% | `verification-12` |
| 19:40:28 | 882.9 | 主② | 完整 | candidate-4 | 12.0 | unverified | 17 | 150 | 3 | 26.82% | `verification-14` |
| 19:54:48 | 897.2 | 主② | 针对性 | candidate-4 | 1.5 | unverified | 0 | 0 | 140 | 26.82% | `verification-16` |
| 19:56:20 | 898.8 | 主② | 针对性 | candidate-4 | 1.4 | regressed | 2 | 2 | 155 | 26.82% | `verification-17` |
| 20:11:54 | 914.3 | 主② | 针对性 | candidate-5 | 1.5 | unverified | 0 | 0 | 155 | 26.84% | `verification-20` |
| 20:13:23 | 915.8 | 主② | 完整 | candidate-5 | 5.7 | checks_passed | 0 | 0 | 0 | 26.84% | `verification-21` |

<details><summary>草稿①作业 `verification-10`（candidate-7，完整对比，07:40:41）里没过的 9 条检查</summary>

| 检查 | 叶子 | 结果变了的用例 | 出错的类型和位置（次数） |
| --- | --- | --- | --- |
| `tests-layers-test-deformable` | layers-deform-conv | `test_forward_output_on_cpu`、`test_repr` | ImportError @ detectron2/utils/develop.py:16 ×2 |
| `tests-layers-test-nms-rotated` | layers-nms、native-ops | `test_batched_nms_rotated_0_degree_cpu`、`test_nms_rotated_0_degree_cpu`、`test_nms_rotated_180_degrees_cpu`、`test_nms_rotated_90_degrees_cpu`、`test_scriptable_cpu` | AttributeError @ detectron2/layers/nms.py:21 in nms_rotated ×4；RuntimeError @ other ×1 |
| `tests-layers-test-roi-align-rotated` | layers-roi-align、native-ops | `test_empty_box`、`test_forward_output_0_90_180_270`、`test_resize`、`test_roi_align_rotated_gradcheck_cpu` | AttributeError @ detectron2/layers/roi_align_rotated.py:18 in forward ×4 |
| `tests-modeling-test-roi-pooler` | model-poolers | `test_roialignv2_roialignrotated_match_cpu` | AttributeError @ detectron2/layers/roi_align_rotated.py:18 in forward ×1 |
| `tests-modeling-test-rpn` | model-proposal-generators | `test_rrpn` | AttributeError @ detectron2/layers/rotated_boxes.py:7 in pairwise_iou_rotated ×1 |
| `tests-structures-test-rotated-boxes` | struct-rotated-boxes、native-ops | `test_iou_0_dim_cpu`、`test_iou_extreme`、`test_iou_half_overlap_cpu`、`test_iou_issue_2154`、`test_iou_issue_2167`、`test_iou_precision` 等 13 个 | AttributeError @ detectron2/layers/rotated_boxes.py:7 in pairwise_iou_rotated ×13 |
| `contract-model-zoo-configs` | model-zoo、config-yacs | – | – |
| `contract-model-parameters` | model-rcnn、model-dense-detectors、model-semantic-panoptic、model-backbones、model-roi-heads、model-mask-head、model-keypoint-head、model-cascade-rcnn、model-proposal-generators | – | – |
| `recovered-test_roi_heads-2` | model-roi-heads | `test_rroi_heads` | AttributeError @ detectron2/layers/rotated_boxes.py:7 in pairwise_iou_rotated ×1 |

</details>

<details><summary>草稿①作业 `verification-12`（candidate-7，针对性对比，07:44:02）里没过的 2 条检查</summary>

| 检查 | 叶子 | 结果变了的用例 | 出错的类型和位置（次数） |
| --- | --- | --- | --- |
| `contract-model-zoo-configs` | model-zoo、config-yacs | – | – |
| `contract-model-parameters` | model-rcnn、model-dense-detectors、model-semantic-panoptic、model-backbones、model-roi-heads、model-mask-head、model-keypoint-head、model-cascade-rcnn、model-proposal-generators | – | – |

</details>

<details><summary>草稿①作业 `verification-14`（candidate-8，针对性对比，07:54:23）里没过的 9 条检查</summary>

| 检查 | 叶子 | 结果变了的用例 | 出错的类型和位置（次数） |
| --- | --- | --- | --- |
| `tests-layers-test-deformable` | layers-deform-conv | `test_forward_output_on_cpu`、`test_repr` | ImportError @ detectron2/utils/develop.py:16 ×2 |
| `tests-layers-test-nms-rotated` | layers-nms、native-ops | `test_batched_nms_rotated_0_degree_cpu`、`test_nms_rotated_0_degree_cpu`、`test_nms_rotated_180_degrees_cpu`、`test_nms_rotated_90_degrees_cpu`、`test_scriptable_cpu` | AttributeError @ detectron2/layers/nms.py:21 in nms_rotated ×4；RuntimeError @ other ×1 |
| `tests-layers-test-roi-align-rotated` | layers-roi-align、native-ops | `test_empty_box`、`test_forward_output_0_90_180_270`、`test_resize`、`test_roi_align_rotated_gradcheck_cpu` | AttributeError @ detectron2/layers/roi_align_rotated.py:18 in forward ×4 |
| `tests-modeling-test-roi-pooler` | model-poolers | `test_roialignv2_roialignrotated_match_cpu` | AttributeError @ detectron2/layers/roi_align_rotated.py:18 in forward ×1 |
| `tests-modeling-test-rpn` | model-proposal-generators | `test_rrpn` | AttributeError @ detectron2/layers/rotated_boxes.py:7 in pairwise_iou_rotated ×1 |
| `tests-structures-test-rotated-boxes` | struct-rotated-boxes、native-ops | `test_iou_0_dim_cpu`、`test_iou_extreme`、`test_iou_half_overlap_cpu`、`test_iou_issue_2154`、`test_iou_issue_2167`、`test_iou_precision` 等 13 个 | AttributeError @ detectron2/layers/rotated_boxes.py:7 in pairwise_iou_rotated ×13 |
| `contract-model-zoo-configs` | model-zoo、config-yacs | – | – |
| `contract-model-parameters` | model-rcnn、model-dense-detectors、model-semantic-panoptic、model-backbones、model-roi-heads、model-mask-head、model-keypoint-head、model-cascade-rcnn、model-proposal-generators | – | – |
| `recovered-test_roi_heads-2` | model-roi-heads | `test_rroi_heads` | AttributeError @ detectron2/layers/rotated_boxes.py:7 in pairwise_iou_rotated ×1 |

</details>

<details><summary>草稿①作业 `verification-16`（candidate-8，针对性对比，07:57:17）里没过的 2 条检查</summary>

| 检查 | 叶子 | 结果变了的用例 | 出错的类型和位置（次数） |
| --- | --- | --- | --- |
| `contract-model-zoo-configs` | model-zoo、config-yacs | – | – |
| `contract-model-parameters` | model-rcnn、model-dense-detectors、model-semantic-panoptic、model-backbones、model-roi-heads、model-mask-head、model-keypoint-head、model-cascade-rcnn、model-proposal-generators | – | – |

</details>

<details><summary>草稿①作业 `verification-19`（candidate-9，针对性对比，08:16:04）里没过的 2 条检查</summary>

| 检查 | 叶子 | 结果变了的用例 | 出错的类型和位置（次数） |
| --- | --- | --- | --- |
| `contract-model-zoo-configs` | model-zoo、config-yacs | – | – |
| `contract-model-parameters` | model-rcnn、model-dense-detectors、model-semantic-panoptic、model-backbones、model-roi-heads、model-mask-head、model-keypoint-head、model-cascade-rcnn、model-proposal-generators | – | – |

</details>

<details><summary>主②作业 `verification-6`（candidate-1，完整对比，18:47:35）里没过的 27 条检查</summary>

| 检查 | 叶子 | 结果变了的用例 | 出错的类型和位置（次数） |
| --- | --- | --- | --- |
| `tests-layers-test-deformable` | layers-deform-conv | `test_forward_output_on_cpu`、`test_repr` | ImportError @ detectron2/utils/develop.py:16 ×2 |
| `tests-layers-test-nms-rotated` | layers-nms、native-ops | `test_batched_nms_rotated_0_degree_cpu`、`test_nms_rotated_0_degree_cpu`、`test_nms_rotated_180_degrees_cpu`、`test_nms_rotated_90_degrees_cpu`、`test_scriptable_cpu` | AttributeError @ detectron2/layers/nms.py:21 in nms_rotated ×4；RuntimeError @ other ×1 |
| `tests-layers-test-roi-align-rotated` | layers-roi-align、native-ops | `test_empty_box`、`test_forward_output_0_90_180_270`、`test_resize`、`test_roi_align_rotated_gradcheck_cpu` | AttributeError @ detectron2/layers/roi_align_rotated.py:20 in forward ×4 |
| `tests-modeling-test-roi-pooler` | model-poolers | `test_roialignv2_roialignrotated_match_cpu` | AttributeError @ detectron2/layers/roi_align_rotated.py:20 in forward ×1 |
| `tests-modeling-test-rpn` | model-proposal-generators | `test_rrpn` | AttributeError @ detectron2/layers/rotated_boxes.py:8 in pairwise_iou_rotated ×1 |
| `tests-structures-test-rotated-boxes` | struct-rotated-boxes、native-ops | `test_iou_0_dim_cpu`、`test_iou_extreme`、`test_iou_half_overlap_cpu`、`test_iou_issue_2154`、`test_iou_issue_2167`、`test_iou_precision` 等 13 个 | AttributeError @ detectron2/layers/rotated_boxes.py:8 in pairwise_iou_rotated ×13 |
| `contract-model-parameters` | model-rcnn、model-dense-detectors、model-semantic-panoptic、model-backbones、model-roi-heads、model-mask-head、model-keypoint-head、model-cascade-rcnn、model-proposal-generators | – | – |
| `recovered-test_roi_heads-2` | model-roi-heads | `test_rroi_heads` | AttributeError @ detectron2/layers/rotated_boxes.py:8 in pairwise_iou_rotated ×1 |
| `contract-datasets_cityscapes_5c6b2f0e-c52bn2-12` | datasets-cityscapes | `test_default_type_is_instance`、`test_instance_run_with_an_unknown_label_is_a_key_error`、`test_run_on_a_directory_without_images_is_an_assertion_error`、`test_semantic_picture_shows_the_class_colour_over_the_image`、`test_semantic_run_does_not_read_the_objects`、`test_semantic_run_prints_progress_and_writes_one_picture_per_image` | ModuleNotFoundError @ detectron2/data/datasets/coco.py:339 ×4；AssertionError @ verifier ×2 |
| `contract-datasets_lvis_770ba881-c52bn2-19` | datasets-lvis | `test_program_fails_when_image_file_is_missing`、`test_program_limit_larger_than_dataset_draws_all_and_reuses_folder`、`test_program_loads_and_draws_limited_number_of_images`、`test_program_needs_four_arguments[3]`、`test_program_rejects_non_integer_limit_after_loading`、`test_program_with_limit_zero_only_creates_output_folder` | ModuleNotFoundError @ detectron2/data/datasets/coco.py:339 ×4；FileNotFoundError @ verifier ×1；AssertionError @ verifier ×1 |
| `scenario-datasets_lvis_770ba881-c52bn2-20` | datasets-lvis | `scenario_program_limit_zero` | – |
| `contract-engine_train_loop_cab52fc9-c52bn2-48` | engine-train-loop | `test_register_hooks_rejects_objects_that_are_not_hooks` | AssertionError @ verifier ×1 |
| `contract-eval_coco_c7511481-c52bn2-56` | eval-coco | `tests.nanolize_contracts.eval_coco_c7511481.test_cocoeval_opt` | ImportError @ detectron2/evaluation/fast_eval_api.py:7 in <module> ×1 |
| `scenario-eval_coco_c7511481-c52bn2-57` | eval-coco | `scenario_boxes_and_masks_three_images`、`scenario_boxes_official_implementation`、`scenario_boxes_three_images_two_categories`、`scenario_boxes_with_crowd_ground_truth`、`scenario_boxes_without_class_names`、`scenario_class_id_equal_to_class_count` 等 20 个 | – |
| `contract-model_dense_detectors_4bd36534-c52bn2-80` | model-dense-detectors | `test_visualize_training_puts_one_stacked_image` | ModuleNotFoundError @ detectron2/modeling/meta_arch/rcnn.py:64 ×1 |
| `contract-model_rcnn_beac6e6a-c52bn2-98` | model-rcnn | `test_training_visualizes_every_vis_period_iterations`、`test_visualize_training_puts_one_image_per_batch` | ModuleNotFoundError @ detectron2/modeling/meta_arch/rcnn.py:64 ×2 |
| `contract-model_rotated_rcnn_aa4471c0-c52bn2-103` | model-rotated-rcnn | `test_construct_from_cfg_inference_uses_cfg_thresholds`、`test_inference_applies_class_specific_deltas`、`test_inference_class_agnostic_deltas_and_transform_weights`、`test_inference_clips_nearly_horizontal_boxes_only`、`test_inference_drops_rows_with_non_finite_values`、`test_inference_multiple_images_split_by_proposal_count` 等 18 个 | AttributeError @ detectron2/layers/nms.py:21 in nms_rotated ×18 |
| `contract-model_rotated_rcnn_aa4471c0-c52bn2-104` | model-rotated-rcnn | `test_construct_from_explicit_arguments`、`test_forward_inference_with_fixed_weights`、`test_forward_training_losses_with_fixed_weights`、`test_label_and_sample_appends_ground_truth_by_default`、`test_label_and_sample_copies_only_boxes_and_classes_of_targets`、`test_label_and_sample_image_without_ground_truth` 等 11 个 | AttributeError @ detectron2/layers/rotated_boxes.py:8 in pairwise_iou_rotated ×10；AttributeError @ detectron2/layers/roi_align_rotated.py:20 in forward ×1 |
| `scenario-model_rotated_rcnn_aa4471c0-c52bn2-105` | model-rotated-rcnn | `scenario_from_config_five_weight_cfg_inference`、`scenario_inference_angle_delta_past_half_turn`、`scenario_inference_class_agnostic_shift_and_scale`、`scenario_inference_four_boxes_default_thresholds`、`scenario_inference_horizontal_boxes_outside_small_image`、`scenario_inference_huge_width_delta` 等 26 个 | – |
| `contract-model_zoo_b9ca42f9-c52bn2-114` | model-zoo | `test_config_file_holds_the_named_config`、`test_config_file_is_found_exactly_when_it_is_in_the_configs_directory`、`test_config_file_lookup_repeats`、`test_config_file_of_a_builtin_config[Base-RCNN-FPN.yaml]`、`test_config_file_of_a_builtin_config[COCO-Detection/faster_rcnn_R_50_FPN_1x.yaml]`、`test_config_file_of_a_builtin_config[Misc/scratch_mask_rcnn_R_50_FPN_3x_gn.yaml]` 等 19 个 | Failed @ verifier ×18；AssertionError @ verifier ×1 |
| `contract-model_zoo_b9ca42f9-c52bn2-115` | model-zoo | `test_each_call_builds_a_model_of_its_own`、`test_failure_does_not_stop_a_later_build`、`test_model_of_a_python_config`、`test_model_of_a_python_retinanet_config`、`test_model_of_a_yaml_config`、`test_model_of_a_yaml_config_with_defaults` 等 7 个 | Failed @ verifier ×6；AssertionError @ verifier ×1 |
| `scenario-model_zoo_b9ca42f9-c52bn2-116` | model-zoo | `scenario_config_file_markdown_file`、`scenario_config_lazy_50ep_trained_not_released`、`scenario_config_lazy_r101_200ep_untrained_after_trained`、`scenario_config_lazy_regnety_400ep_trained`、`scenario_config_markdown_file` | – |
| `contract-packaging-c52bn2-120` | packaging | `test_build_ships_builtin_projects_under_detectron2_projects`、`test_build_ships_configs_inside_model_zoo`、`test_build_ships_only_yaml_and_py_configs`、`test_building_twice_gives_the_same_files` | AssertionError @ verifier ×4 |
| `contract-packaging-c52bn2-121` | packaging | `test_build_without_a_project_directory_fails` | Failed @ verifier ×1 |
| `contract-layers_roi_align_74ce8595-c52bn2-176` | layers-roi-align | `test_45_degree_values_follow_bilinear_interpolation`、`test_angle_is_in_degrees_counter_clockwise[-90-expected4]`、`test_angle_is_in_degrees_counter_clockwise[0-expected0]`、`test_angle_is_in_degrees_counter_clockwise[180-expected2]`、`test_angle_is_in_degrees_counter_clockwise[270-expected3]`、`test_angle_is_in_degrees_counter_clockwise[30-expected7]` 等 32 个 | AttributeError @ detectron2/layers/roi_align_rotated.py:20 in forward ×32 |
| `scenario-layers_roi_align_74ce8595-c52bn2-178` | layers-roi-align | `scenario_angle_135_degrees_one_sample`、`scenario_angle_30_degrees`、`scenario_angle_450_degrees_same_as_90`、`scenario_angle_90_degrees_wide_box`、`scenario_angle_minus_45_degrees`、`scenario_angle_zero_adaptive_samples` 等 25 个 | – |
| `scenario-zoo_lazy_configs_90d84a50-c52bn2-248` | zoo-lazy-configs | `scenario_panoptic_fpn_1x_dataloader` | – |

</details>

<details><summary>主②作业 `verification-8`（candidate-1，完整对比，18:54:39）里没过的 10 条检查</summary>

| 检查 | 叶子 | 结果变了的用例 | 出错的类型和位置（次数） |
| --- | --- | --- | --- |
| `contract-datasets_cityscapes_5c6b2f0e-c52bn2-12` | datasets-cityscapes | `test_default_type_is_instance`、`test_instance_run_with_an_unknown_label_is_a_key_error`、`test_run_on_a_directory_without_images_is_an_assertion_error`、`test_semantic_picture_shows_the_class_colour_over_the_image`、`test_semantic_run_does_not_read_the_objects`、`test_semantic_run_prints_progress_and_writes_one_picture_per_image` | ModuleNotFoundError @ detectron2/data/datasets/coco.py:339 ×4；AssertionError @ verifier ×2 |
| `contract-datasets_lvis_770ba881-c52bn2-19` | datasets-lvis | `test_program_fails_when_image_file_is_missing`、`test_program_limit_larger_than_dataset_draws_all_and_reuses_folder`、`test_program_loads_and_draws_limited_number_of_images`、`test_program_needs_four_arguments[3]`、`test_program_rejects_non_integer_limit_after_loading`、`test_program_with_limit_zero_only_creates_output_folder` | ModuleNotFoundError @ detectron2/data/datasets/coco.py:339 ×4；FileNotFoundError @ verifier ×1；AssertionError @ verifier ×1 |
| `scenario-datasets_lvis_770ba881-c52bn2-20` | datasets-lvis | `scenario_program_limit_zero` | – |
| `contract-engine_train_loop_cab52fc9-c52bn2-48` | engine-train-loop | `test_register_hooks_rejects_objects_that_are_not_hooks` | AssertionError @ verifier ×1 |
| `contract-model_dense_detectors_4bd36534-c52bn2-80` | model-dense-detectors | `test_visualize_training_puts_one_stacked_image` | ModuleNotFoundError @ detectron2/modeling/meta_arch/rcnn.py:64 ×1 |
| `contract-model_rcnn_beac6e6a-c52bn2-98` | model-rcnn | `test_training_visualizes_every_vis_period_iterations`、`test_visualize_training_puts_one_image_per_batch` | ModuleNotFoundError @ detectron2/modeling/meta_arch/rcnn.py:64 ×2 |
| `scenario-model_zoo_b9ca42f9-c52bn2-116` | model-zoo | `scenario_config_file_markdown_file`、`scenario_config_lazy_50ep_trained_not_released`、`scenario_config_lazy_r101_200ep_untrained_after_trained`、`scenario_config_lazy_regnety_400ep_trained`、`scenario_config_markdown_file` | – |
| `contract-packaging-c52bn2-120` | packaging | `test_build_ships_builtin_projects_under_detectron2_projects`、`test_build_ships_configs_inside_model_zoo`、`test_build_ships_only_yaml_and_py_configs`、`test_building_twice_gives_the_same_files` | AssertionError @ verifier ×4 |
| `contract-packaging-c52bn2-121` | packaging | `test_build_without_a_project_directory_fails` | Failed @ verifier ×1 |
| `scenario-zoo_lazy_configs_90d84a50-c52bn2-248` | zoo-lazy-configs | `scenario_panoptic_fpn_1x_dataloader` | – |

</details>

<details><summary>主②作业 `verification-12`（candidate-4，针对性对比，19:36:10）里没过的 2 条检查</summary>

| 检查 | 叶子 | 结果变了的用例 | 出错的类型和位置（次数） |
| --- | --- | --- | --- |
| `contract-packaging-c52bn2-120` | packaging | `test_build_ships_builtin_projects_under_detectron2_projects` | AssertionError @ verifier ×1 |
| `contract-packaging-c52bn2-121` | packaging | `test_build_without_a_project_directory_fails` | Failed @ verifier ×1 |

</details>

<details><summary>主②作业 `verification-14`（candidate-4，完整对比，19:52:29）里没过的 17 条检查</summary>

| 检查 | 叶子 | 结果变了的用例 | 出错的类型和位置（次数） |
| --- | --- | --- | --- |
| `tests-layers-test-deformable` | layers-deform-conv | `test_forward_output_on_cpu`、`test_repr` | ImportError @ detectron2/utils/develop.py:16 ×2 |
| `tests-layers-test-nms-rotated` | layers-nms、native-ops | `test_batched_nms_rotated_0_degree_cpu`、`test_nms_rotated_0_degree_cpu`、`test_nms_rotated_180_degrees_cpu`、`test_nms_rotated_90_degrees_cpu`、`test_scriptable_cpu` | AttributeError @ detectron2/layers/nms.py:21 in nms_rotated ×4；RuntimeError @ other ×1 |
| `tests-layers-test-roi-align-rotated` | layers-roi-align、native-ops | `test_empty_box`、`test_forward_output_0_90_180_270`、`test_resize`、`test_roi_align_rotated_gradcheck_cpu` | AttributeError @ detectron2/layers/roi_align_rotated.py:20 in forward ×4 |
| `tests-modeling-test-roi-pooler` | model-poolers | `test_roialignv2_roialignrotated_match_cpu` | AttributeError @ detectron2/layers/roi_align_rotated.py:20 in forward ×1 |
| `tests-modeling-test-rpn` | model-proposal-generators | `test_rrpn` | AttributeError @ detectron2/layers/rotated_boxes.py:8 in pairwise_iou_rotated ×1 |
| `tests-structures-test-rotated-boxes` | struct-rotated-boxes、native-ops | `test_iou_0_dim_cpu`、`test_iou_extreme`、`test_iou_half_overlap_cpu`、`test_iou_issue_2154`、`test_iou_issue_2167`、`test_iou_precision` 等 13 个 | AttributeError @ detectron2/layers/rotated_boxes.py:8 in pairwise_iou_rotated ×13 |
| `contract-model-parameters` | model-rcnn、model-dense-detectors、model-semantic-panoptic、model-backbones、model-roi-heads、model-mask-head、model-keypoint-head、model-cascade-rcnn、model-proposal-generators | – | – |
| `recovered-test_roi_heads-2` | model-roi-heads | `test_rroi_heads` | AttributeError @ detectron2/layers/rotated_boxes.py:8 in pairwise_iou_rotated ×1 |
| `contract-eval_coco_c7511481-c52bn2-56` | eval-coco | `tests.nanolize_contracts.eval_coco_c7511481.test_cocoeval_opt` | ImportError @ detectron2/evaluation/fast_eval_api.py:7 in <module> ×1 |
| `scenario-eval_coco_c7511481-c52bn2-57` | eval-coco | `scenario_boxes_and_masks_three_images`、`scenario_boxes_official_implementation`、`scenario_boxes_three_images_two_categories`、`scenario_boxes_with_crowd_ground_truth`、`scenario_boxes_without_class_names`、`scenario_class_id_equal_to_class_count` 等 20 个 | – |
| `contract-model_rotated_rcnn_aa4471c0-c52bn2-103` | model-rotated-rcnn | `test_construct_from_cfg_inference_uses_cfg_thresholds`、`test_inference_applies_class_specific_deltas`、`test_inference_class_agnostic_deltas_and_transform_weights`、`test_inference_clips_nearly_horizontal_boxes_only`、`test_inference_drops_rows_with_non_finite_values`、`test_inference_multiple_images_split_by_proposal_count` 等 18 个 | AttributeError @ detectron2/layers/nms.py:21 in nms_rotated ×18 |
| `contract-model_rotated_rcnn_aa4471c0-c52bn2-104` | model-rotated-rcnn | `test_construct_from_explicit_arguments`、`test_forward_inference_with_fixed_weights`、`test_forward_training_losses_with_fixed_weights`、`test_label_and_sample_appends_ground_truth_by_default`、`test_label_and_sample_copies_only_boxes_and_classes_of_targets`、`test_label_and_sample_image_without_ground_truth` 等 11 个 | AttributeError @ detectron2/layers/rotated_boxes.py:8 in pairwise_iou_rotated ×10；AttributeError @ detectron2/layers/roi_align_rotated.py:20 in forward ×1 |
| `contract-model_zoo_b9ca42f9-c52bn2-114` | model-zoo | `test_config_file_holds_the_named_config`、`test_config_file_is_found_exactly_when_it_is_in_the_configs_directory`、`test_config_file_lookup_repeats`、`test_config_file_of_a_builtin_config[Base-RCNN-FPN.yaml]`、`test_config_file_of_a_builtin_config[COCO-Detection/faster_rcnn_R_50_FPN_1x.yaml]`、`test_config_file_of_a_builtin_config[Misc/scratch_mask_rcnn_R_50_FPN_3x_gn.yaml]` 等 22 个 | Failed @ verifier ×21；AssertionError @ verifier ×1 |
| `contract-model_zoo_b9ca42f9-c52bn2-115` | model-zoo | `test_each_call_builds_a_model_of_its_own`、`test_failure_does_not_stop_a_later_build`、`test_model_of_a_python_config`、`test_model_of_a_python_retinanet_config`、`test_model_of_a_yaml_config`、`test_model_of_a_yaml_config_with_defaults` 等 7 个 | Failed @ verifier ×6；AssertionError @ verifier ×1 |
| `contract-packaging-c52bn2-120` | packaging | `test_build_ships_builtin_projects_under_detectron2_projects` | AssertionError @ verifier ×1 |
| `contract-packaging-c52bn2-121` | packaging | `test_build_without_a_project_directory_fails` | Failed @ verifier ×1 |
| `contract-layers_roi_align_74ce8595-c52bn2-176` | layers-roi-align | `test_45_degree_values_follow_bilinear_interpolation`、`test_angle_is_in_degrees_counter_clockwise[-90-expected4]`、`test_angle_is_in_degrees_counter_clockwise[0-expected0]`、`test_angle_is_in_degrees_counter_clockwise[180-expected2]`、`test_angle_is_in_degrees_counter_clockwise[270-expected3]`、`test_angle_is_in_degrees_counter_clockwise[30-expected7]` 等 32 个 | AttributeError @ detectron2/layers/roi_align_rotated.py:20 in forward ×32 |

</details>

<details><summary>主②作业 `verification-17`（candidate-4，针对性对比，19:57:43）里没过的 2 条检查</summary>

| 检查 | 叶子 | 结果变了的用例 | 出错的类型和位置（次数） |
| --- | --- | --- | --- |
| `contract-packaging-c52bn2-120` | packaging | `test_build_ships_builtin_projects_under_detectron2_projects` | AssertionError @ verifier ×1 |
| `contract-packaging-c52bn2-121` | packaging | `test_build_without_a_project_directory_fails` | Failed @ verifier ×1 |

</details>

<details><summary>草稿②作业 `verification-11`（candidate-8，完整对比，10:10:20）里没过的 8 条检查</summary>

| 检查 | 叶子 | 结果变了的用例 | 出错的类型和位置（次数） |
| --- | --- | --- | --- |
| `tests-layers-test-deformable` | layers-deform-conv | `test_forward_output_on_cpu`、`test_repr` | ImportError @ detectron2/utils/develop.py:16 ×2 |
| `tests-layers-test-nms-rotated` | layers-nms、native-ops | `test_batched_nms_rotated_0_degree_cpu`、`test_nms_rotated_0_degree_cpu`、`test_nms_rotated_180_degrees_cpu`、`test_nms_rotated_90_degrees_cpu`、`test_scriptable_cpu` | AttributeError @ detectron2/layers/nms.py:21 in nms_rotated ×4；RuntimeError @ other ×1 |
| `tests-layers-test-roi-align-rotated` | layers-roi-align、native-ops | `test_empty_box`、`test_forward_output_0_90_180_270`、`test_resize`、`test_roi_align_rotated_gradcheck_cpu` | AttributeError @ detectron2/layers/roi_align_rotated.py:20 in forward ×4 |
| `tests-modeling-test-roi-pooler` | model-poolers | `test_roialignv2_roialignrotated_match_cpu` | AttributeError @ detectron2/layers/roi_align_rotated.py:20 in forward ×1 |
| `tests-modeling-test-rpn` | model-proposal-generators | `test_rrpn` | AttributeError @ detectron2/layers/rotated_boxes.py:8 in pairwise_iou_rotated ×1 |
| `tests-structures-test-rotated-boxes` | struct-rotated-boxes、native-ops | `test_iou_0_dim_cpu`、`test_iou_extreme`、`test_iou_half_overlap_cpu`、`test_iou_issue_2154`、`test_iou_issue_2167`、`test_iou_precision` 等 13 个 | AttributeError @ detectron2/layers/rotated_boxes.py:8 in pairwise_iou_rotated ×13 |
| `contract-model-parameters` | model-rcnn、model-dense-detectors、model-semantic-panoptic、model-backbones、model-roi-heads、model-mask-head、model-keypoint-head、model-cascade-rcnn、model-proposal-generators | – | – |
| `recovered-test_roi_heads-2` | model-roi-heads | `test_rroi_heads` | AttributeError @ detectron2/layers/rotated_boxes.py:8 in pairwise_iou_rotated ×1 |

</details>

安装检查（主作业②）：

| 开始 | 第几分钟 | 候选 | 秒 | 结果 | 通过的步数 |
| --- | --- | --- | --- | --- | --- |
| 18:54:39 | 837.1 | candidate-1 | 96 | passed | 2 / 2 |
| 19:36:10 | 878.6 | candidate-4 | 91 | passed | 2 / 2 |
| 20:19:06 | 921.5 | candidate-5 | 96 | passed | 2 / 2 |

controller 的每一轮（理由和它交给作者的指示是原文）：

**草稿①作业第 1 轮** · 05:43:15（第 45.7 分钟）· applied · 用时 170 秒 · 223,672 token（其中缓存 149,600）

- 它面对的建议：`{"action": "initial", "candidate": null, "reason": "no_candidate", "stop_reason": null}`
- 理由：Six scopes form a chain, so the mainline's layers would cost six sessions in a row while the main job freezes. Scopes 1-5 are written in one split group (the external contract fixes the module-qualified names they share), then scope-6 alone on the merged candidate as the integration call that writes the shared package-level files and checks cross-scope paths. The delegation then runs the first full comparison; if the group ends partial, it only starts the rerun and I am asked again.
- 它点的调用：

  1. `run_parallel_agents` {"group": "split", "reason": "First implementation: scopes 1-5 written side by side; scope-6 follows alone on the merged candidate as the integration call."}

     - 请求 1：`{"role": "implement", "scope": "scope-1"}`

       <details><summary>交给这个作者的指示</summary>

       ```
       Scopes 1 to 5 are written at the same time in separate workspaces and then merged; scope-6 is written after the merge, on top of all five, and writes every shared package-level file. So that the merge takes your work whole and it fits the others: (1) Write only the modules of your own scope's capabilities. Create no __init__.py for the top-level package, nor for any subpackage in which the external contract also places names of capabilities outside your scope, and no other file two scopes could both write (shared helper modules, setup or packaging files, top-level configuration). An __init__.py of a subpackage that only your scope's capabilities occupy is yours. (2) Put each public name in the module its module-qualified entry in the external contract states. Reach capabilities of other scopes only through the module-qualified names and signatures their external contracts list (the full module path, never a package-level re-export, which does not exist until scope-6 writes it). For what they do behind those names read the reference files you are lent; do not write another scope's capability yourself and do not rely on a private helper of another scope, whose author designs those freely: keep a small private helper in your own module where you need one. (3) The other scopes' modules are not in your workspace, so check your own modules in isolation (Python resolves submodules without __init__.py) and leave no stubs of foreign modules, scratch files or build products behind. Your scope note: you own the internal capability native-ops, the sources of the compiled extension detectron2._C. Later scopes (the fast COCO evaluation, the environment report, setup.py in scope-6) reach it as that extension module with the entry points the reference sources expose, so keep those entry points and the source location that the packaging capability's contract names (detectron2/layers/csrc); setup.py itself is scope-6's.
       ```

       </details>

     - 请求 2：`{"role": "implement", "scope": "scope-2"}`

       <details><summary>交给这个作者的指示</summary>

       ```
       Scopes 1 to 5 are written at the same time in separate workspaces and then merged; scope-6 is written after the merge, on top of all five, and writes every shared package-level file. So that the merge takes your work whole and it fits the others: (1) Write only the modules of your own scope's capabilities. Create no __init__.py for the top-level package, nor for any subpackage in which the external contract also places names of capabilities outside your scope, and no other file two scopes could both write (shared helper modules, setup or packaging files, top-level configuration). An __init__.py of a subpackage that only your scope's capabilities occupy is yours. (2) Put each public name in the module its module-qualified entry in the external contract states. Reach capabilities of other scopes only through the module-qualified names and signatures their external contracts list (the full module path, never a package-level re-export, which does not exist until scope-6 writes it). For what they do behind those names read the reference files you are lent; do not write another scope's capability yourself and do not rely on a private helper of another scope, whose author designs those freely: keep a small private helper in your own module where you need one. (3) The other scopes' modules are not in your workspace, so check your own modules in isolation (Python resolves submodules without __init__.py) and leave no stubs of foreign modules, scratch files or build products behind. Your scope note: you build on scope-1 (wrappers, boxes, ROI align, deformable convolution), which is being written beside you; the layers and structures packages are shared with it, so their __init__.py files are not yours.
       ```

       </details>

     - 请求 3：`{"role": "implement", "scope": "scope-3"}`

       <details><summary>交给这个作者的指示</summary>

       ```
       Scopes 1 to 5 are written at the same time in separate workspaces and then merged; scope-6 is written after the merge, on top of all five, and writes every shared package-level file. So that the merge takes your work whole and it fits the others: (1) Write only the modules of your own scope's capabilities. Create no __init__.py for the top-level package, nor for any subpackage in which the external contract also places names of capabilities outside your scope, and no other file two scopes could both write (shared helper modules, setup or packaging files, top-level configuration). An __init__.py of a subpackage that only your scope's capabilities occupy is yours. (2) Put each public name in the module its module-qualified entry in the external contract states. Reach capabilities of other scopes only through the module-qualified names and signatures their external contracts list (the full module path, never a package-level re-export, which does not exist until scope-6 writes it). For what they do behind those names read the reference files you are lent; do not write another scope's capability yourself and do not rely on a private helper of another scope, whose author designs those freely: keep a small private helper in your own module where you need one. (3) The other scopes' modules are not in your workspace, so check your own modules in isolation (Python resolves submodules without __init__.py) and leave no stubs of foreign modules, scratch files or build products behind. Your scope note: you build on scopes 1 and 2 (structures, transforms, yacs config, foundation utilities, distributed helpers), which are being written beside you; the data, modeling and utils packages are shared with other scopes, so their __init__.py files are not yours.
       ```

       </details>

     - 请求 4：`{"role": "implement", "scope": "scope-4"}`

       <details><summary>交给这个作者的指示</summary>

       ```
       Scopes 1 to 5 are written at the same time in separate workspaces and then merged; scope-6 is written after the merge, on top of all five, and writes every shared package-level file. So that the merge takes your work whole and it fits the others: (1) Write only the modules of your own scope's capabilities. Create no __init__.py for the top-level package, nor for any subpackage in which the external contract also places names of capabilities outside your scope, and no other file two scopes could both write (shared helper modules, setup or packaging files, top-level configuration). An __init__.py of a subpackage that only your scope's capabilities occupy is yours. (2) Put each public name in the module its module-qualified entry in the external contract states. Reach capabilities of other scopes only through the module-qualified names and signatures their external contracts list (the full module path, never a package-level re-export, which does not exist until scope-6 writes it). For what they do behind those names read the reference files you are lent; do not write another scope's capability yourself and do not rely on a private helper of another scope, whose author designs those freely: keep a small private helper in your own module where you need one. (3) The other scopes' modules are not in your workspace, so check your own modules in isolation (Python resolves submodules without __init__.py) and leave no stubs of foreign modules, scratch files or build products behind. Your scope note: you build on scopes 1 to 3, which are being written beside you. The internal capability native-ops (the compiled extension detectron2._C) is scope-1's: the fast COCO evaluation reaches its accumulator as that extension module, with the entry points the reference sources expose; do not write native code for it yourself.
       ```

       </details>

     - 请求 5：`{"role": "implement", "scope": "scope-5"}`

       <details><summary>交给这个作者的指示</summary>

       ```
       Scopes 1 to 5 are written at the same time in separate workspaces and then merged; scope-6 is written after the merge, on top of all five, and writes every shared package-level file. So that the merge takes your work whole and it fits the others: (1) Write only the modules of your own scope's capabilities. Create no __init__.py for the top-level package, nor for any subpackage in which the external contract also places names of capabilities outside your scope, and no other file two scopes could both write (shared helper modules, setup or packaging files, top-level configuration). An __init__.py of a subpackage that only your scope's capabilities occupy is yours. (2) Put each public name in the module its module-qualified entry in the external contract states. Reach capabilities of other scopes only through the module-qualified names and signatures their external contracts list (the full module path, never a package-level re-export, which does not exist until scope-6 writes it). For what they do behind those names read the reference files you are lent; do not write another scope's capability yourself and do not rely on a private helper of another scope, whose author designs those freely: keep a small private helper in your own module where you need one. (3) The other scopes' modules are not in your workspace, so check your own modules in isolation (Python resolves submodules without __init__.py) and leave no stubs of foreign modules, scratch files or build products behind. Your scope note: you build on scopes 1 to 4 (backbones, poolers, proposal generators, box regression, matcher and sampling, events, structures), which are being written beside you; the modeling package is shared with them, so its __init__.py is not yours, and registrations your capabilities need at import are completed by scope-6 from the external contract.
       ```

       </details>

  2. `run_agent` {"role": "implement", "scope": "scope-6"}（条件：{"call": 1, "outcome": ["done"]}）

     <details><summary>交给作者的指示</summary>

     ```
     Scopes 1 to 5 were written side by side by authors who did not see each other's code, and were merged into this workspace. You are the last scope, and this call is also the integration call. Besides your own capabilities: (1) Read what is in the workspace first and build on its names; write nothing a second time. (2) The earlier authors were told to leave out every package-level file that scopes share. Write them: the __init__.py of the top-level package and of each subpackage that lacks one or is incomplete, so that every package-level name the external contracts of all selected capabilities list (not only yours) resolves, and everything that has to happen at import (registry entries, builtin dataset registration and the like, as the knowledge records and reference files state) does happen; keep the imports free of cycles. (3) Check that the whole fits together: import every module, resolve the names of the external contracts, and exercise paths that cross scopes, such as building the standard model families from the carried configs with a small CPU forward pass, mapping and loading a small in-memory dataset, a short training loop with hooks and checkpoint save and load, and an evaluator run. Where two scopes disagree about a name, a signature or the place of something, or a module that one scope imports is missing, repair it in the file that departs from the external contract and the reference files. For such integration faults this overrides the brief's advice to leave other capabilities' files alone; do not redesign code of other scopes that works. (4) Packaging is yours and the sources of the native extension detectron2._C are scope-1's: have setup.py build the extension from the sources as they are in the workspace, and if a compiler is available confirm that it builds and that the modules using it import. Remove build products, scratch files and logs before finishing.
     ```

     </details>

  3. `save_candidate` {"reason": "First implementation complete: scopes 1-5 merged, scope-6 written with the shared package-level files and integration fixes."}（条件：{"call": 2, "outcome": ["completed"]}）

**草稿①作业第 2 轮** · 07:43:22（第 165.8 分钟）· applied · 用时 160 秒 · 416,646 token（其中缓存 312,096）

- 它面对的建议：`{"action": "behavior_repair", "behavior_accepted": false, "candidate": "candidate-7", "reason": "retrying_failed_checks", "restore": null, "stop_reason": null}`
- 理由：All failures but check-44 trace to detectron2._C not being importable or its rotated operators missing, and the candidate's environment was prepared (13:35) before any rewrite source existed (authors started 13:43). So first run the owner's preparation recipes on the candidate again, capture (reuse) the baseline and screen the nine failed checks: seconds instead of a 40-minute author call. A clear screen is followed by the full comparison; if failures remain after recipes that passed, one repair call with its save, screen and full comparison goes on in the same batch. If a recipe fails, nothing else triggers and the delegation only re-observes, so I can read the recipe result before spending a repair.
- 它点的调用：

  1. `prepare_environment` {"target": "candidate"}

  2. `capture_baseline` （条件：{"call": 1, "outcome": ["passed"]}）

  3. `compare_behavior` {"check_names": ["check-10", "check-14", "check-15", "check-23", "check-24", "check-30", "check-44", "check-45", "check-49"]}（条件：{"call": 2, "outcome": ["ready"]}）

  4. `compare_behavior` （条件：{"call": 3, "outcome": ["unverified"]}）

  5. `run_agent` {"capabilities": ["native-ops", "packaging", "layers-nms", "layers-roi-align", "layers-deform-conv", "struct-rotated-boxes", "utils-foundation", "config-yacs", "model-zoo", "model-poolers", "model-proposal-generators", "model-roi-heads", "model-rcnn", "model-dense-detectors", "model-semantic-panoptic", "model-backbones", "model-mask-head", "model-keypoint-head", "model-cascade-rcnn"], "issue_ids": ["verification-4d768b270d409f90f488e4a8ed6510acaa3b487bc026e84641252c6661086911", "verification-60fcb9655e2930f7ce2495e211db8f5096743d040c424a6c530627b1074ec2c2", "verification-675def6c1aafeddaa0dd05b3ff752f096ea38cf750d8f9f5aefb77fd975a9d98", "verification-a52ee61595da510de4e1a32207a124d714b92705f3f72e29abb1435cc6ca4c10", "verification-a126bfc9429f2d589b5e15dd4bc8de3f2984d5931d8f1bc1cf30fc58b54892af", "verification-1b434572383608720c74ad5eba929cd5e13b7c37e1705ab8a929ffe2ed628ef4", "verificatio …（条件：{"call": 3, "outcome": ["regressed"]}）

     <details><summary>交给作者的指示</summary>

     ```
     Repair the failures the comparison in your feedback lists. That comparison was made right before this call, after the owner's environment preparation recipes were run again on the job's worktree now that it holds the rewrite; the first full comparison ran on a worktree prepared before any of the rewrite existed. What the first full comparison showed (its error digests, confirmed): (a) check-10 (layers-deform-conv) and check-45 (the probe of the model families) ended with ImportError raised at detectron2/utils/develop.py:16, the placeholder that stands in when the compiled extension detectron2._C cannot be imported. (b) check-14 (layers-nms: 4 cases, and 1 case with a RuntimeError no frame placed), check-15 (layers-roi-align), check-23 (model-poolers), check-24 (model-proposal-generators), check-30 (struct-rotated-boxes, 13 cases) and check-49 (model-roi-heads) raised AttributeError from a library at detectron2/layers/nms.py:21 in nms_rotated, detectron2/layers/roi_align_rotated.py:18 in forward and detectron2/layers/rotated_boxes.py:7 in pairwise_iou_rotated: the three places that call the extension's rotated operators. (c) check-44 (config-yacs, model-zoo; an output comparison) exited 0 but printed other output than the original; your feedback has the first differing line.
     For (a) and (b), if they are still in your feedback: my hypothesis, not confirmed, is that the extension does not build from this candidate's sources with the candidate's setup.py, or builds but is not loaded or registered the way the Python callers reach it. You see neither the recipes nor the checks. Build the extension yourself from the workspace's sources with the candidate's setup.py, in the ways the original's setup and install files you are lent provide for (CPU-only is what the checks certainly need), read the compiler's and the importer's messages, and repair what stops it: setup.py's extension definition (module name, source discovery under detectron2/layers/csrc, include directories, flags), the C++ sources of native-ops, and the Python side (where _C is imported so that the operators exist before their first call, and the operator names and signatures the callers use against those the extension registers). Then exercise each operator through its Python entry on CPU and compare with what the reference files state: rotated NMS and batched rotated NMS, rotated ROIAlign, rotated pairwise IoU, deformable and modulated deformable convolution, the fast COCO evaluation accumulator, the compiler and CUDA version queries. If (a) and (b) are no longer in your feedback, the new preparation settled them: leave that code alone.
     For (c) and anything else the feedback lists (check-45 may show output differences once the import works; it covers model-backbones, model-proposal-generators, model-roi-heads, model-mask-head, model-keypoint-head, model-cascade-rcnn, model-rcnn, model-dense-detectors and model-semantic-panoptic): find the cause in the reference files and repair it in the module that departs from them. Do not special-case what a probe prints.
     Keep what passes: the 36 other checks passed and must stay so, among them those of struct-boxes, layers-wrappers, data-transforms, config-lazy, export-torchscript, utils-collect-env and engine-train-loop, which share modules with what you may touch. Make no error disappear by changing behavior: no pure-Python stand-in for a compiled operator where the original has none, no weakened validation, no removed capability. Remove build products (build/, *.so, *.egg-info), scratch files and logs before you finish. Retest first check-10, check-14, check-15 and check-30, then check-23, check-24, check-49, check-44 and check-45.
     ```

     </details>

  6. `save_candidate` {"reason": "Repair 1: failures left after the candidate's environment was prepared again (native extension, check-44 output, model probe)."}（条件：{"call": 5, "outcome": ["completed"]}）

  7. `compare_behavior` {"check_names": ["check-10", "check-14", "check-15", "check-23", "check-24", "check-30", "check-44", "check-45", "check-49"]}（条件：{"call": 6, "outcome": ["done"]}）

  8. `compare_behavior` （条件：{"call": 7, "outcome": ["unverified"]}）

**草稿①作业第 3 轮** · 07:56:36（第 179.0 分钟）· applied · 用时 131 秒 · 365,084 token（其中缓存 275,584）

- 它面对的建议：`{"action": "behavior_repair", "behavior_accepted": false, "candidate": "candidate-8", "reason": "retrying_failed_checks", "restore": null, "stop_reason": null}`
- 理由：Candidate-8 differs from candidate-7 in model_zoo.py alone, yet the seven extension checks that passed on candidate-7 right after the candidate's preparation fail again with the same import errors: the save left the worktree without the prepared extension, so that screen says nothing about the repair. Prepare the candidate again, reuse the baseline and screen the nine checks; a clear screen goes to the full comparison. If check-44 or check-45 still differ, one repair for those output differences follows, with its save, a new preparation (needed after every save here), screen and full comparison. The delegation only takes what the mainline does next without a repair.
- 它点的调用：

  1. `prepare_environment` {"target": "candidate"}

  2. `capture_baseline` （条件：{"call": 1, "outcome": ["passed"]}）

  3. `compare_behavior` {"check_names": ["check-10", "check-14", "check-15", "check-23", "check-24", "check-30", "check-44", "check-45", "check-49"]}（条件：{"call": 2, "outcome": ["ready"]}）

  4. `compare_behavior` （条件：{"call": 3, "outcome": ["unverified"]}）

  5. `run_agent` {"capabilities": ["config-yacs", "model-zoo", "model-backbones", "model-proposal-generators", "model-roi-heads", "model-mask-head", "model-keypoint-head", "model-cascade-rcnn", "model-rcnn", "model-dense-detectors", "model-semantic-panoptic"], "issue_ids": ["verification-bf636ea2347b38b1f1ed16da348f3ace723692445fc38c2636ace69ba227024c", "verification-aca1dd0e74c6032fb858588a7e5072f4f714d1000875b1d553c5f0d509d645d3"], "role": "repair"}（条件：{"call": 3, "outcome": ["regressed"]}）

     <details><summary>交给作者的指示</summary>

     ```
     Second repair. The comparison in your feedback was made right before this call on the candidate the first repair saved, after the owner's environment preparation ran on the job's worktree again. That preparation supplies the compiled extension detectron2._C; it is the owner's, and you neither see nor change it.
     Confirmed history. (1) On the candidate before the first repair, in a prepared worktree, the seven checks that need the extension passed (check-10, check-14, check-15, check-23, check-24, check-30, check-49) and two failed: check-44 (config-yacs, model-zoo) and check-45 (a probe of the model families: model-backbones, model-proposal-generators, model-roi-heads, model-mask-head, model-keypoint-head, model-cascade-rcnn, model-rcnn, model-dense-detectors, model-semantic-panoptic). Both are output comparisons that exited 0 and printed other output than the original. (2) The first repair changed one file, detectron2/model_zoo/model_zoo.py (get_config, get). (3) The comparison after its save ran in a worktree that had lost the extension again, so it says nothing reliable about that change: check-44 still printed other output there, and check-45 stopped at the extension's import.
     What to do. For every check your feedback lists as failed, start from the first differing output line it gives you, find in the reference files what the original computes and prints at that point, and repair the candidate module that departs from it. An output comparison reports only the first difference: after repairing it, go on through the same calls the probe makes and compare everything they would print with what the reference files produce, so that one call settles the whole output and not one line of it. My hypotheses, unconfirmed, on where such output can depart: for check-44 the config tree (defaults, key order, value types and formatting of a dumped config, version upgrade and downgrade, merging from files and lists) and the model zoo's table of config paths and URLs; for check-45 what building each model family from its config yields (class and submodule names and their order, each module's printed form, parameter and buffer names, shapes and counts, registry names, output keys and shapes of a forward pass). Check these against the reference; do not take them as given. Do not special-case what a probe prints.
     If your feedback still lists ImportError raised at detectron2/utils/develop.py:16 or AttributeError at detectron2/layers/nms.py, roi_align_rotated.py or rotated_boxes.py: these occurred although the preparation passed right before the comparison, and they did not occur on the previous candidate under the same preparation, from which only model_zoo.py differs. Look whether anything in the workspace explains it (setup.py's extension definition, the sources under detectron2/layers/csrc, where _C is imported) and repair only what you can confirm; write no pure-Python stand-in for a compiled operator where the original has none.
     Keep what passes: the 36 other checks of the first full comparison and the seven extension checks above. Make no difference disappear by removing behavior, weakening validation or dropping a capability.
     Cleaning up: delete only scratch files, logs and build products that you yourself created in this call. Never delete, move or overwrite a file you did not create; a compiled detectron2/_C*.so or a build directory you find in any tree is the owner's.
     Retest first check-44 and check-45; then the checks that share their modules: check-3 and check-43 (config-yacs), check-35 (model-zoo, zoo-lazy-configs), check-9 and check-17 (model-backbones), check-24 (model-proposal-generators), check-19 and check-49 (model-roi-heads), check-22 (model-rcnn, model-dense-detectors, model-semantic-panoptic).
     ```

     </details>

  6. `save_candidate` {"reason": "Repair 2: output differences of check-44 and check-45 left once the worktree holds the extension."}（条件：{"call": 5, "outcome": ["completed"]}）

  7. `prepare_environment` {"target": "candidate"}（条件：{"call": 6, "outcome": ["done"]}）

  8. `capture_baseline` （条件：{"call": 7, "outcome": ["passed"]}）

  9. `compare_behavior` {"check_names": ["check-10", "check-14", "check-15", "check-23", "check-24", "check-30", "check-44", "check-45", "check-49"]}（条件：{"call": 8, "outcome": ["ready"]}）

  10. `compare_behavior` （条件：{"call": 9, "outcome": ["unverified"]}）

**草稿①作业第 4 轮** · 08:18:25（第 200.9 分钟）· applied · 用时 140 秒 · 519,268 token（其中缓存 428,144）

- 它面对的建议：`{"action": "behavior_repair", "behavior_accepted": false, "candidate": "candidate-9", "reason": "retrying_failed_checks", "restore": null, "stop_reason": null}`
- 理由：check-44 and check-45 kept the same output mismatch through two single-author repairs that only touched model_zoo.py and detection_checkpoint.py. A third repair is one split group with one author per check, each told what the earlier repairs changed without effect, to reproduce the differing line before changing code, and where else output can differ (unconfirmed hypotheses). The merged candidate is prepared again (each save loses the extension here) and compared in full, since repair 2's checkpoint change was only screened on nine checks.
- 它点的调用：

  1. `run_parallel_agents` {"group": "split", "reason": "Third repair: check-44 and check-45 kept the same failure through two single-author repairs, so each output difference gets its own author and context."}

     - 请求 1：`{"capabilities": ["config-yacs", "model-zoo"], "issue_ids": ["verification-bf636ea2347b38b1f1ed16da348f3ace723692445fc38c2636ace69ba227024c"], "role": "repair"}`

       <details><summary>交给这个作者的指示</summary>

       ```
       Third repair of check-44, and this call is for check-44 alone. Another author repairs check-45 (the model families) beside you in a separate workspace, and the two results are merged file by file: keep to detectron2/config and detectron2/model_zoo unless you confirm that the cause lies elsewhere, and then change as little of other files as you can. Confirmed: check-44 (capabilities config-yacs and model-zoo) is an output comparison. The probe exits 0 on the candidate, and what it puts out differs from what it put out on the original; your feedback has the first differing line. It failed in every comparison, on three candidates. Two repair calls before you were given that same line. They changed detectron2/model_zoo/model_zoo.py (get_config and get, then get_config_file) and detectron2/checkpoint/detection_checkpoint.py, and the comparison after each failed the same way. So do not assume the cause is where they looked, and do not rework those functions again without proof. Method, in this order. (1) Reproduce before changing anything: from the differing line work out which call produces it, and run this workspace's code until it puts out the candidate's side of that line exactly. Only then have you found the place. (2) Read in the reference files what the original yields at that point, change the candidate, and run again until it puts out the original's side exactly. (3) A comparison reports only the first difference: go on through everything the same calls put out and settle all of it in this call. My hypotheses, unconfirmed (I see neither the probe nor its output; check them, do not take them as given). (a) The compared output may hold more than what the probe prints itself: warnings and log records too, on either stream. A warning or record that the original's code path emits and the candidate's does not, or the reverse, or with another text, category or count, would differ: compare, call by call, which library interfaces the original uses to locate the builtin config files, to read YAML, to build and merge the config and to convert versions, and what each emits when called, with what the candidate calls. If you cannot reproduce the candidate's side of the line by calling the config and model zoo functions, look here first. (b) The config tree itself: default keys, their order, value types and their formatting in a dump or a printed node, _BASE_ inheritance, merging from files and lists, version upgrade and downgrade and renamed keys, and the model zoo's table of config names and checkpoint URLs. (c) Messages of the errors for a name that is not in the zoo or a key that does not exist. Do not special-case what a probe prints, and make no difference disappear by removing behavior or weakening validation. Keep what passes: every other check passed on this code, among them check-3 and check-43 (config-yacs), check-35 (model-zoo, zoo-lazy-configs), check-1 and check-2 (config-lazy), check-50 (checkpointing) and check-31 (training loop). The worktree where the checks run holds the compiled extension detectron2._C from the owner's preparation; your workspace may not. If you need it, build it in place from the workspace's sources with the candidate's setup.py and remove exactly the products you built before you finish; never delete or overwrite a file you did not create. Retest first check-44, then check-3, check-43 and check-35.
       ```

       </details>

     - 请求 2：`{"capabilities": ["model-backbones", "model-proposal-generators", "model-roi-heads", "model-mask-head", "model-keypoint-head", "model-cascade-rcnn", "model-rcnn", "model-dense-detectors", "model-semantic-panoptic"], "issue_ids": ["verification-aca1dd0e74c6032fb858588a7e5072f4f714d1000875b1d553c5f0d509d645d3"], "role": "repair"}`

       <details><summary>交给这个作者的指示</summary>

       ```
       Third repair of check-45, and this call is for check-45 alone. Another author repairs check-44 (config-yacs and model-zoo) beside you in a separate workspace, and the two results are merged file by file: leave detectron2/config and detectron2/model_zoo to that author unless you confirm that the cause of your difference lies there, and then change as little of them as you can. Confirmed: check-45 is an output comparison, a probe of the model families (model-backbones, model-proposal-generators, model-roi-heads, model-mask-head, model-keypoint-head, model-cascade-rcnn, model-rcnn, model-dense-detectors, model-semantic-panoptic). With the compiled extension present it exits 0 on the candidate, and what it puts out differs from what it put out on the original; your feedback has the first differing line. It failed so in three comparisons. One repair call before you was given that same line together with check-44's. It changed detectron2/model_zoo/model_zoo.py (get_config, get, get_config_file) and detectron2/checkpoint/detection_checkpoint.py (load, _load_file, _load_model), and the comparison after it failed the same way. So do not assume the cause is where it looked. Method, in this order. (1) Reproduce before changing anything: from the differing line work out which model family and which call produce it, and run this workspace's code until it puts out the candidate's side of that line exactly. Only then have you found the place. (2) Read in the reference files what the original yields at that point, change the candidate module that departs from it, and run again until it puts out the original's side exactly. (3) A comparison reports only the first difference: go on through every model family the capabilities name (the carried configs give them: C4, DC5 and FPN R-CNN with box, mask and keypoint heads, cascade, RPN only, RetinaNet, FCOS, semantic and panoptic FPN) and settle the same kind of output for each in this call. My hypotheses, unconfirmed (I see neither the probe nor its output; check them, do not take them as given). (a) What building a model yields: class names, submodule names and their order, each module's printed form (extra_repr included), parameter and buffer names, their order, shapes, dtypes and counts, registry names, output_shape values. (b) Numbers: if the probe fixes the random seed, every value depends on which random draws construction and initialization make and in which order, layer by layer, and on the initializer of each layer; the same holds for sampling in training mode. Compare the order of construction and of initialization calls with the reference. (c) A forward pass: the keys and their order in the loss dict or in the results, field names of the instances, shapes, dtypes, and values in training and in inference mode. (d) The compared output may hold warnings and log records as well as what the probe prints: a record or warning that the original emits while building or running a model and the candidate does not, or the reverse, or with another text or count, would differ. Do not special-case what a probe prints, and make no difference disappear by removing behavior, weakening validation or writing a pure-Python stand-in for a compiled operator. Keep what passes: every other check passed on this code, among them check-9 and check-17 (backbones), check-24 (proposal generators), check-19 and check-49 (ROI heads), check-22 (model families), check-16, check-23, check-33, check-48 and check-50. The worktree where the checks run holds the compiled extension detectron2._C from the owner's preparation; your workspace may not. If you need it, build it in place from the workspace's sources with the candidate's setup.py and remove exactly the products you built before you finish; never delete or overwrite a file you did not create. Retest first check-45, then check-22, check-9, check-17, check-24, check-19 and check-49.
       ```

       </details>

  2. `prepare_environment` {"target": "candidate"}（条件：{"call": 1, "outcome": ["done", "partial"]}）

  3. `capture_baseline` （条件：{"call": 2, "outcome": ["passed"]}）

  4. `compare_behavior` （条件：{"call": 3, "outcome": ["ready"]}）

**草稿②作业第 1 轮** · 08:28:50（第 211.3 分钟）· applied · 用时 196 秒 · 235,389 token（其中缓存 151,099）

- 它面对的建议：`{"action": "initial", "candidate": null, "reason": "no_candidate", "stop_reason": null}`
- 理由：Draft job with a six-scope chain: speed before the main job seals matters, so all six scopes are written in one split group (4 sessions at once), each told to use other scopes only through external-contract names and to leave shared package files alone. If the group ends done, one implement call (no behavior repair spent) writes the shared package __init__ files and mends the seams, then save and the first full comparison. If it ends partial, follow lets the mainline write the lost requests again and stops before the comparison so I can integrate first.
- 它点的调用：

  1. `run_parallel_agents` {"group": "split", "reason": "First implementation: all six scopes in one split group instead of a six-layer chain, so the draft is written in about two session lengths"}

     - 请求 1：`{"role": "implement", "scope": "scope-1"}`

       <details><summary>交给这个作者的指示</summary>

       ```
       You write scope-1 of this selection while five other authors write the other scopes at the same time, each in a workspace of its own. None of you sees the others' files; the files are merged afterwards and one integration call follows. What makes the merge work: (1) Write only the capabilities of your scope. A capability of another scope that yours uses is written by its own author: write no second copy, stub or fallback of it. Use it only through its external contract, that is the dotted names and signatures its interface in contract.json lists (import the name from the package the contract places it under), never through a module path or helper name you assume for the other author's files: that author designs them freely and need not follow the layout of the lent original. Read the lent original of what you depend on only to learn how it behaves. (2) Create or change no package-level file that scopes share: an __init__.py of a package under which capabilities of other scopes also have external-contract names (detectron2/__init__.py and most subpackage __init__.py files are of that kind), or a repository-level file that is not your scope's. The integration call writes them with their re-exports after the merge. A package whose contract names all belong to your scope is yours to write whole, its __init__.py included. (3) Put each external-contract name of yours in a module of your own inside the package the contract names it under, and make it plain which module provides which contract names, for instance with __all__ holding exactly those names, so that the integration call can assemble the package files without guessing. (4) The shared __init__.py files do not exist while you write, so an import of another scope's name by its contract path does not resolve in your workspace; that is expected and no reason to work around it. Run your own modules as far as they go without them. If you make temporary stand-ins to try your code, remove them before you finish: leave nothing that is not your scope's deliverable. (5) Import cycles: the shared package files will import the modules of earlier scopes before those of later ones (the order is scope-1 to scope-6). A module of yours may therefore need a contract name of an earlier scope at import time, also from its own package; it must not need one of a later scope at import time: import that where it is used. (6) Everything else is as the contract says: every interface entry of your capabilities exactly as listed, validation, messages, warnings and logging kept, and the code your own. Your scope is the first layer and every other scope builds on it, so its contract names and signatures matter most. native-ops is internal and has no interface entry: it is in your scope alone, to implement where your capabilities need it, as its knowledge records state.
       ```

       </details>

     - 请求 2：`{"role": "implement", "scope": "scope-2"}`

       <details><summary>交给这个作者的指示</summary>

       ```
       You write scope-2 of this selection while five other authors write the other scopes at the same time, each in a workspace of its own. None of you sees the others' files; the files are merged afterwards and one integration call follows. What makes the merge work: (1) Write only the capabilities of your scope. A capability of another scope that yours uses is written by its own author: write no second copy, stub or fallback of it. Use it only through its external contract, that is the dotted names and signatures its interface in contract.json lists (import the name from the package the contract places it under), never through a module path or helper name you assume for the other author's files: that author designs them freely and need not follow the layout of the lent original. Read the lent original of what you depend on only to learn how it behaves. (2) Create or change no package-level file that scopes share: an __init__.py of a package under which capabilities of other scopes also have external-contract names (detectron2/__init__.py and most subpackage __init__.py files are of that kind), or a repository-level file that is not your scope's. The integration call writes them with their re-exports after the merge. A package whose contract names all belong to your scope is yours to write whole, its __init__.py included. (3) Put each external-contract name of yours in a module of your own inside the package the contract names it under, and make it plain which module provides which contract names, for instance with __all__ holding exactly those names, so that the integration call can assemble the package files without guessing. (4) The shared __init__.py files do not exist while you write, so an import of another scope's name by its contract path does not resolve in your workspace; that is expected and no reason to work around it. Run your own modules as far as they go without them. If you make temporary stand-ins to try your code, remove them before you finish: leave nothing that is not your scope's deliverable. (5) Import cycles: the shared package files will import the modules of earlier scopes before those of later ones (the order is scope-1 to scope-6). A module of yours may therefore need a contract name of an earlier scope at import time, also from its own package; it must not need one of a later scope at import time: import that where it is used. (6) Everything else is as the contract says: every interface entry of your capabilities exactly as listed, validation, messages, warnings and logging kept, and the code your own. Your scope builds on scope-1.
       ```

       </details>

     - 请求 3：`{"role": "implement", "scope": "scope-3"}`

       <details><summary>交给这个作者的指示</summary>

       ```
       You write scope-3 of this selection while five other authors write the other scopes at the same time, each in a workspace of its own. None of you sees the others' files; the files are merged afterwards and one integration call follows. What makes the merge work: (1) Write only the capabilities of your scope. A capability of another scope that yours uses is written by its own author: write no second copy, stub or fallback of it. Use it only through its external contract, that is the dotted names and signatures its interface in contract.json lists (import the name from the package the contract places it under), never through a module path or helper name you assume for the other author's files: that author designs them freely and need not follow the layout of the lent original. Read the lent original of what you depend on only to learn how it behaves. (2) Create or change no package-level file that scopes share: an __init__.py of a package under which capabilities of other scopes also have external-contract names (detectron2/__init__.py and most subpackage __init__.py files are of that kind), or a repository-level file that is not your scope's. The integration call writes them with their re-exports after the merge. A package whose contract names all belong to your scope is yours to write whole, its __init__.py included. (3) Put each external-contract name of yours in a module of your own inside the package the contract names it under, and make it plain which module provides which contract names, for instance with __all__ holding exactly those names, so that the integration call can assemble the package files without guessing. (4) The shared __init__.py files do not exist while you write, so an import of another scope's name by its contract path does not resolve in your workspace; that is expected and no reason to work around it. Run your own modules as far as they go without them. If you make temporary stand-ins to try your code, remove them before you finish: leave nothing that is not your scope's deliverable. (5) Import cycles: the shared package files will import the modules of earlier scopes before those of later ones (the order is scope-1 to scope-6). A module of yours may therefore need a contract name of an earlier scope at import time, also from its own package; it must not need one of a later scope at import time: import that where it is used. (6) Everything else is as the contract says: every interface entry of your capabilities exactly as listed, validation, messages, warnings and logging kept, and the code your own. Your scope builds on scope-1 and scope-2.
       ```

       </details>

     - 请求 4：`{"role": "implement", "scope": "scope-4"}`

       <details><summary>交给这个作者的指示</summary>

       ```
       You write scope-4 of this selection while five other authors write the other scopes at the same time, each in a workspace of its own. None of you sees the others' files; the files are merged afterwards and one integration call follows. What makes the merge work: (1) Write only the capabilities of your scope. A capability of another scope that yours uses is written by its own author: write no second copy, stub or fallback of it. Use it only through its external contract, that is the dotted names and signatures its interface in contract.json lists (import the name from the package the contract places it under), never through a module path or helper name you assume for the other author's files: that author designs them freely and need not follow the layout of the lent original. Read the lent original of what you depend on only to learn how it behaves. (2) Create or change no package-level file that scopes share: an __init__.py of a package under which capabilities of other scopes also have external-contract names (detectron2/__init__.py and most subpackage __init__.py files are of that kind), or a repository-level file that is not your scope's. The integration call writes them with their re-exports after the merge. A package whose contract names all belong to your scope is yours to write whole, its __init__.py included. (3) Put each external-contract name of yours in a module of your own inside the package the contract names it under, and make it plain which module provides which contract names, for instance with __all__ holding exactly those names, so that the integration call can assemble the package files without guessing. (4) The shared __init__.py files do not exist while you write, so an import of another scope's name by its contract path does not resolve in your workspace; that is expected and no reason to work around it. Run your own modules as far as they go without them. If you make temporary stand-ins to try your code, remove them before you finish: leave nothing that is not your scope's deliverable. (5) Import cycles: the shared package files will import the modules of earlier scopes before those of later ones (the order is scope-1 to scope-6). A module of yours may therefore need a contract name of an earlier scope at import time, also from its own package; it must not need one of a later scope at import time: import that where it is used. (6) Everything else is as the contract says: every interface entry of your capabilities exactly as listed, validation, messages, warnings and logging kept, and the code your own. Your scope builds on scope-1 to scope-3.
       ```

       </details>

     - 请求 5：`{"role": "implement", "scope": "scope-5"}`

       <details><summary>交给这个作者的指示</summary>

       ```
       You write scope-5 of this selection while five other authors write the other scopes at the same time, each in a workspace of its own. None of you sees the others' files; the files are merged afterwards and one integration call follows. What makes the merge work: (1) Write only the capabilities of your scope. A capability of another scope that yours uses is written by its own author: write no second copy, stub or fallback of it. Use it only through its external contract, that is the dotted names and signatures its interface in contract.json lists (import the name from the package the contract places it under), never through a module path or helper name you assume for the other author's files: that author designs them freely and need not follow the layout of the lent original. Read the lent original of what you depend on only to learn how it behaves. (2) Create or change no package-level file that scopes share: an __init__.py of a package under which capabilities of other scopes also have external-contract names (detectron2/__init__.py and most subpackage __init__.py files are of that kind), or a repository-level file that is not your scope's. The integration call writes them with their re-exports after the merge. A package whose contract names all belong to your scope is yours to write whole, its __init__.py included. (3) Put each external-contract name of yours in a module of your own inside the package the contract names it under, and make it plain which module provides which contract names, for instance with __all__ holding exactly those names, so that the integration call can assemble the package files without guessing. (4) The shared __init__.py files do not exist while you write, so an import of another scope's name by its contract path does not resolve in your workspace; that is expected and no reason to work around it. Run your own modules as far as they go without them. If you make temporary stand-ins to try your code, remove them before you finish: leave nothing that is not your scope's deliverable. (5) Import cycles: the shared package files will import the modules of earlier scopes before those of later ones (the order is scope-1 to scope-6). A module of yours may therefore need a contract name of an earlier scope at import time, also from its own package; it must not need one of a later scope at import time: import that where it is used. (6) Everything else is as the contract says: every interface entry of your capabilities exactly as listed, validation, messages, warnings and logging kept, and the code your own. Your scope builds on scope-1 to scope-4.
       ```

       </details>

     - 请求 6：`{"role": "implement", "scope": "scope-6"}`

       <details><summary>交给这个作者的指示</summary>

       ```
       You write scope-6 of this selection while five other authors write the other scopes at the same time, each in a workspace of its own. None of you sees the others' files; the files are merged afterwards and one integration call follows. What makes the merge work: (1) Write only the capabilities of your scope. A capability of another scope that yours uses is written by its own author: write no second copy, stub or fallback of it. Use it only through its external contract, that is the dotted names and signatures its interface in contract.json lists (import the name from the package the contract places it under), never through a module path or helper name you assume for the other author's files: that author designs them freely and need not follow the layout of the lent original. Read the lent original of what you depend on only to learn how it behaves. (2) Create or change no package-level file that scopes share: an __init__.py of a package under which capabilities of other scopes also have external-contract names (detectron2/__init__.py and most subpackage __init__.py files are of that kind), or a repository-level file that is not your scope's. The integration call writes them with their re-exports after the merge. A package whose contract names all belong to your scope is yours to write whole, its __init__.py included. (3) Put each external-contract name of yours in a module of your own inside the package the contract names it under, and make it plain which module provides which contract names, for instance with __all__ holding exactly those names, so that the integration call can assemble the package files without guessing. (4) The shared __init__.py files do not exist while you write, so an import of another scope's name by its contract path does not resolve in your workspace; that is expected and no reason to work around it. Run your own modules as far as they go without them. If you make temporary stand-ins to try your code, remove them before you finish: leave nothing that is not your scope's deliverable. (5) Import cycles: the shared package files will import the modules of earlier scopes before those of later ones (the order is scope-1 to scope-6). A module of yours may therefore need a contract name of an earlier scope at import time, also from its own package; it must not need one of a later scope at import time: import that where it is used. (6) Everything else is as the contract says: every interface entry of your capabilities exactly as listed, validation, messages, warnings and logging kept, and the code your own. Your scope builds on scope-1 to scope-5. packaging is in your scope: the repository-level files its records describe are yours to write.
       ```

       </details>

  2. `run_agent` {"role": "implement"}（条件：{"call": 1, "outcome": ["done"]}）

     <details><summary>交给作者的指示</summary>

     ```
     The six scopes of the selection were written side by side by authors who did not see each other's files, and their files are merged in this workspace. They were told to write no package-level file that scopes share, to use another scope's capability only through its external-contract names, and to mark in each module which contract names it provides (for instance with __all__). This call integrates what they wrote. It does not write the capabilities again. (1) Write every package-level file that is missing or incomplete: the __init__.py of detectron2 and of each subpackage, so that every dotted name the interface entries of contract.json list resolves under the package the contract names, with the listed signature, re-exported from the module that provides it. Give these files whatever else the capabilities' knowledge records state about them (a version name, what importing a package does); read the records, and the lent original where they leave it open, without copying it. Import the modules of earlier scopes before those of later ones and resolve any import cycle by that order or by moving an import to where the name is used. (2) Mend the seams between scopes. Find every import or use that does not resolve: a module path or helper one author assumed and another named differently or did not write, a capability two scopes each wrote a copy of, a caller and a provider that disagree about a signature, a return value or a registered name. Change the side that departs from the external contract and the knowledge records; where two copies exist keep one and have every user call it. (3) Check by running, not by reading: in a fresh interpreter import detectron2, every subpackage and every module; resolve every dotted external-contract name of contract.json; then exercise the paths that cross scopes as the knowledge records describe them, as far as this environment allows, and repair what fails. Whatever the native-ops and packaging records require for code to run from this worktree must hold too. (4) Leave capability code that works as it is: no renaming, reformatting or size work, and no behavior, validation, message or log removed. Remove stand-ins, scratch scripts and any file that is no deliverable, yours included. If a scope left a capability unwritten or half written, write what is needed for the packages to import and the contract names to resolve, and say in your report which capability it is and what is still missing.
     ```

     </details>

  3. `save_candidate` {"reason": "Merged six scopes plus the integration call's package-level files and seam fixes"}（条件：{"call": 2, "outcome": ["completed"]}）

  4. `compare_behavior` （条件：{"call": 3, "outcome": ["done"]}）

**草稿②作业第 2 轮** · 10:11:29（第 313.9 分钟）· applied · 用时 68 秒 · 304,766 token（其中缓存 215,536）

- 它面对的建议：`{"action": "behavior_repair", "behavior_accepted": false, "candidate": "candidate-8", "reason": "retrying_failed_checks", "restore": null, "stop_reason": null}`
- 理由：Seven of the eight failed checks fail because the compiled extension detectron2._C is not importable in the candidate worktree (ImportError from the missing-extension stand-in, AttributeError on the native rotated ops). The csrc sources are carried files, and the candidate's preparation recipes ran at 16:22, before any setup.py or package existed there. My hypothesis is that the extension was simply never built for the candidate, so I run the owner's recipes on the candidate again, take the baseline (reused) and compare in full before spending a behavior repair. If the recipes fail or checks still fail, the next round writes a targeted repair from that evidence; follow stops before any repair.
- 它点的调用：

  1. `prepare_environment` {"target": "candidate"}

  2. `capture_baseline` （条件：{"call": 1, "outcome": ["passed"]}）

  3. `compare_behavior` （条件：{"call": 1, "outcome": ["passed"]}）

**主②作业第 1 轮** · 18:49:50（第 832.3 分钟）· applied · 用时 133 秒 · 496,608 token（其中缓存 398,030）

- 它面对的建议：`{"action": "verify", "candidate": "candidate-1", "missing": ["installation"], "reason": "evidence_missing", "screen": null, "stop_reason": null}`
- 理由：About 14 of the 27 failed checks share one signature: the compiled extension detectron2._C is not importable where the candidate's checks run (ImportError at fast_eval_api.py:7 and develop.py:16, AttributeError in nms_rotated, roi_align_rotated and pairwise_iou_rotated). The candidate's worktree was prepared only once, before the draft's files were imported, so this may be the environment and not the code; an author cannot fix that and might write needless fallbacks. Re-running the owner's recipes on the candidate, re-binding the baseline and comparing in full separates environment failures from code failures without spending a behavior repair. The installation check is the mainline's next step and shows whether the candidate's setup.py builds the extension, which the packaging repair needs. I will write the per-scope repair group next round from that evidence.
- 它点的调用：

  1. `prepare_environment` {"target": "candidate"}

  2. `capture_baseline` 

  3. `compare_behavior` 

  4. `check_installation` 

**主②作业第 2 轮** · 19:11:54（第 854.3 分钟）· unavailable · 用时 0 秒 · 0 token（其中缓存 0）

- 它面对的建议：`null`
- 理由：
- 它点的调用：

- 被拒或丢掉的：`{"errors": ["the round was interrupted"], "dropped": null}`

**主②作业第 3 轮** · 19:14:04（第 856.5 分钟）· applied · 用时 129 秒 · 472,142 token（其中缓存 383,624）

- 它面对的建议：`{"action": "behavior_repair", "behavior_accepted": false, "candidate": "candidate-1", "reason": "retrying_failed_checks", "restore": null, "stop_reason": null}`
- 理由：The second comparison, made after the candidate's environment was prepared, left 10 failed checks, and none is an environment failure. Two share a ModuleNotFoundError raised in the candidate's coco.py and two more share one in meta_arch/rcnn.py. These may be the same missing module, so I give those five issues to one author instead of splitting them between scope-4 and scope-5, where two authors could write the same file differently. The five scope-6 issues (train loop, model zoo, lazy configs, packaging) go to a second author, since model zoo and packaging may share a package-data cause. Both run in one split group, which costs one behavior repair. A screen of the 10 checks follows, then the full comparison, then the mainline (installation, performance, selection, delivery) by delegation; a failed screen or comparison comes back to me.
- 它点的调用：

  1. `run_parallel_agents` {"group": "split", "reason": "First behavior repair: the ten checks that still fail in the full comparison verification-8, as two disjoint repairs written at the same time"}

     - 请求 1：`{"capabilities": ["datasets-coco", "datasets-cityscapes", "datasets-lvis", "model-rcnn", "model-dense-detectors"], "issue_ids": ["verification-ef195aa3fb29ea544db405dd6eb8cd1a8e95576bdc0a1d9ac282d2cac791cebe", "verification-505c20e2b39d03a6a079a36cfe043e228f9e97f34b2b4ea5253c352a6423ea85", "verification-407b7ec6b8b81f18a7280a6694078796e57dd3ad2f40a049cb3eeb72ec63d816", "verification-2fb719692dab6156126426fe937617d45a47e5e9fa799cd979ad4a4c8d102958", "verification-efc48a1428ab7b6aabaf17d90cd42d818 …`

       <details><summary>交给这个作者的指示</summary>

       ```
       Repair the behavior failures that the full comparison of the current candidate (candidate-1, artifact verification-8) found in the dataset loaders and the meta-architectures. The compiled extension was built in the candidate's environment for that comparison, so none of these is an environment failure.
       
       Confirmed by the comparison:
       - check-62 (datasets-cityscapes) and check-66 (datasets-lvis): in each, 4 cases end in a ModuleNotFoundError raised by the candidate's own code at detectron2/data/datasets/coco.py:339. check-62 also has 2 failed assertion cases; check-66 has 1 failed assertion case and 1 FileNotFoundError raised inside the check. The compared values of the assertion cases are in your feedback.
       - check-67 (datasets-lvis, an output comparison): the program exits 0, but 1 case that passes on the original fails on the candidate.
       - check-113 (model-rcnn, 2 cases) and check-101 (model-dense-detectors, 1 case): ModuleNotFoundError raised by the candidate's own code at detectron2/modeling/meta_arch/rcnn.py:64.
       
       What to do: at each of the two places, find which module the candidate imports and why it cannot be imported. Then read in the lent original how the same public behavior obtains what it needs there: which module, imported where and when, and whether that module is part of the package or a third-party dependency. Make the candidate behave as the original does. Do not swallow the error, do not stub the functionality and do not add a fallback the original does not have. After the import errors are gone, run through the remaining assertion cases and the FileNotFoundError of check-66 with the values in your feedback: they may be consequences of the same error or separate defects of the cityscapes and lvis loaders, so check each.
       
       My hypothesis, not confirmed by any check: both places import the same module, which the candidate lacks or names otherwise. If that is so, provide it once and have both places use it.
       
       These passed in the same comparison and must keep passing: check-4 (datasets-coco), check-5, check-46, check-60, check-61, check-63, check-64, check-65, check-68, check-69, check-70, check-22, check-45, check-99, check-100, check-102, check-111, check-112, check-114, check-115, check-119 to check-122. Retest first: check-62, check-66, check-67, check-101, check-113.
       
       Another author repairs engine-train-loop, model-zoo, zoo-lazy-configs and packaging at the same time in a separate workspace, and the two results are merged by path. Leave setup.py, the packaging files, the config files, detectron2/model_zoo, detectron2/engine and existing package-level __init__ files alone unless the missing import cannot be mended without them; if you must change one, change as little as possible and say so in your report.
       ```

       </details>

     - 请求 2：`{"issue_ids": ["verification-d29b495eb3f5394426dea8c6fed9320e31182d6e272cff891f7bf2b83d8737d3", "verification-f92e4e7afd9aa39cc28b9decf5206ea45a153a9f687d28228a60c35d29581f35", "verification-272e0b8cf120fc5f75096cd1775d39bd55981f8a8205b522327f4625bf30f061", "verification-369841bcc7b892c769335e5eaa1f5218e19b06904e9352822a4fa9ad740d7553", "verification-9ff20aa4f71132bc19b291d2fabaefee81112d8ddaa50cc1bbab4676b945de3f"], "role": "repair", "scope": "scope-6"}`

       <details><summary>交给这个作者的指示</summary>

       ```
       Repair the behavior failures that the full comparison of the current candidate (candidate-1, artifact verification-8) found in engine-train-loop, model-zoo, zoo-lazy-configs and packaging.
       
       Confirmed by the comparison:
       - check-78 (engine-train-loop): 1 failed assertion case; its compared values are in your feedback.
       - check-126 (model-zoo, an output comparison): the program exits 0, but 5 cases that pass on the original fail on the candidate; values in your feedback.
       - check-160 (zoo-lazy-configs, an output comparison): exits 0, 1 case that passes on the original fails; values in your feedback.
       - check-128 (packaging): 4 failed assertion cases; values in your feedback.
       - check-129 (packaging): 1 case that the test itself ended with an explicit failure (pytest Failed), with no compared values.
       
       Also confirmed: the owner's installation checks passed on this candidate (2 of 2), and the compiled extension was built in the candidate's environment for this comparison. check-124 and check-125 of model-zoo failed only in an earlier comparison made before the extension was built and pass now, so what remains is not an environment failure. Keep the installation and the build of the extension working.
       
       For each failure, read in the lent original what the public behavior of the capability is at the point the compared values name, and make the candidate do the same. Do not special-case a test, and do not remove or weaken anything.
       
       My hypothesis, not confirmed by any check: the model-zoo, zoo-lazy-configs and packaging failures may share a cause in how the config files and other package data are found, enumerated or shipped, by the packaging and by the model zoo. Check that before you treat them as separate defects; check-78 is most likely unrelated to them.
       
       These passed in the same comparison and must keep passing: check-31, check-35, check-44, check-48, check-51, check-71 to check-74, check-79 to check-82, check-123, check-124, check-125, check-127, check-142 to check-148, check-158. Retest first: check-78, check-126, check-128, check-129, check-160.
       
       Another author repairs the dataset loaders (detectron2/data/datasets) and detectron2/modeling/meta_arch at the same time in a separate workspace, and the two results are merged by path: leave detectron2/data and detectron2/modeling alone, and add no new shared helper module under detectron2/utils unless one of your failures cannot be repaired without it; if you must, say so in your report.
       ```

       </details>

  2. `compare_behavior` {"check_names": ["check-62", "check-66", "check-67", "check-78", "check-101", "check-113", "check-126", "check-128", "check-129", "check-160"]}（条件：{"call": 1, "outcome": ["done", "partial"]}）

  3. `compare_behavior` （条件：{"call": 2, "outcome": ["unverified"]}）

**主②作业第 4 轮** · 19:40:28（第 882.9 分钟）· applied · 用时 164 秒 · 539,134 token（其中缓存 427,856）

- 它面对的建议：`{"action": "behavior_repair", "behavior_accepted": false, "candidate": "candidate-4", "reason": "retrying_failed_checks", "restore": null, "stop_reason": null}`
- 理由：Candidate-4 has only a ten-check screen: check-128 and check-129 (packaging) still fail, and the other 148 checks were never run on the merged code. A full comparison takes about five minutes and a repair is one of five left, so I compare in full first; the repair author then gets every failure of this code in its feedback. The repair names no capability, so that a regression from the merge can be mended in the same call; its instructions centre on packaging, say what the last repair changed without reaching check-129, and list the interface entries to compare with the original. Then save, a full comparison of the new candidate, and the mainline by delegation (installation, performance, selection, delivery); a failed comparison comes back to me.
- 它点的调用：

  1. `compare_behavior` 

  2. `run_agent` {"role": "repair"}（条件：{"call": 1, "outcome": ["regressed"]}）

     <details><summary>交给作者的指示</summary>

     ```
     Repair what still fails on the current candidate (candidate-4), which is the merge of two repairs written side by side. A full comparison of it has just run; its failed checks are in your feedback.
     
     Confirmed before that comparison (screen verification-12 of candidate-4), capability packaging:
     - check-128: 1 failed assertion case; its compared values are in your feedback. Before the last repair 4 assertion cases of this check failed, so that repair mended three and left one.
     - check-129: 1 case that the test itself ended with an explicit failure (pytest Failed), with no compared values. It failed in exactly this way on candidate-1 in two comparisons and still fails after the last repair, which changed setup.py, docker/Dockerfile and docker/deploy.Dockerfile and added config files under configs/. So what that repair changed did not reach its cause (a clue, not a proof).
     - check-127 (packaging) and the owner's two installation checks pass, and the extension detectron2._C builds: keep that.
     
     What to do for packaging: no values tell you what check-129 saw, so do not stop at the one assertion of check-128. Read the original's setup.py and every file it reads or refers to in the lent source, and compare with the candidate, entry by entry, everything the packaging interface states: what setup.py --name and --version print, with and without D2_VERSION_SUFFIX and BUILD_NIGHTLY; python_requires, the install_requires list and the extras all and dev, string for string; the packages and their package directories, including the builtin projects as detectron2.projects.*; the extension detectron2._C: its sources under detectron2/layers/csrc, which of them are taken with CUDA, without it and with FORCE_CUDA, and its other build arguments; how the files of configs/ are found and shipped inside the package as detectron2/model_zoo/configs, which files that covers (the candidate now has more config files than before), and what running setup.py leaves in the tree; and what setup.py does when a precondition it checks, if it has one, does not hold. Compare in each of those environments, not only the default one, and compare what an installation or a built distribution then contains. Wherever the candidate differs from the original in something a user of setup.py or of the installed package can observe, make it do as the original does. Do not special-case a test, do not stub anything, and do not weaken or remove behavior.
     
     Any other failed check in your feedback: the screen before covered only ten checks, so a check of another capability that fails now is most likely a regression that the last two repairs or their merge introduced. Those repairs changed detectron2/data/datasets (coco.py, cityscapes.py, lvis.py, coco_panoptic.py), detectron2/modeling/meta_arch/rcnn.py, detectron2/engine/train_loop.py, detectron2/evaluation/__init__.py and configs/common/data/coco_panoptic_separated.py, and added detectron2/utils/visualizer.py and config files. Repair each such failure in this same call, from its compared values and the original, without undoing what those repairs mended. If packaging is the only capability with failed checks, change nothing outside packaging.
     
     Must keep passing (they passed on candidate-4 in the screen): check-62, check-66, check-67, check-78, check-101, check-113, check-126, check-160; also check-35, check-44, check-123 to check-125, check-127 and the installation checks. Retest first: check-128, check-129, check-127.
     
     In your report, say for check-129 which observable difference you found and changed, or that you found none.
     ```

     </details>

  3. `save_candidate` {"reason": "Second behavior repair: packaging (check-128, check-129) and whatever else the full comparison of candidate-4 showed to fail"}（条件：{"call": 2, "outcome": ["completed"]}）

  4. `compare_behavior` （条件：{"call": 3, "outcome": ["done"]}）

**主②作业第 5 轮** · 19:54:31（第 897.0 分钟）· applied · 用时 117 秒 · 258,990 token（其中缓存 159,882）

- 它面对的建议：`{"action": "behavior_repair", "behavior_accepted": false, "candidate": "candidate-4", "reason": "retrying_failed_checks", "restore": null, "stop_reason": null}`
- 理由：15 of the 17 failed checks on candidate-4 carry the signature of a missing compiled extension (ImportError at develop.py and fast_eval_api.py, AttributeError in nms_rotated, roi_align_rotated, pairwise_iou_rotated), the same checks that passed on candidate-1 only after its environment was prepared; candidate-4 was never prepared, and its installation check passes. So I prepare the candidate again, re-bind the baseline and screen those 15 plus the 3 incomplete checks, without spending a repair on what is most likely the environment. If that screen shows no failure, a second screen confirms the packaging checks, and one repair restricted to packaging (check-128, check-129) follows; the new candidate is prepared again before its screen and full comparison, since a new candidate loses the built extension. A failed first screen leaves everything else not triggered for my next round.
- 它点的调用：

  1. `prepare_environment` {"target": "candidate"}

  2. `capture_baseline` （条件：{"call": 1, "outcome": ["passed"]}）

  3. `compare_behavior` {"check_names": ["check-10", "check-14", "check-15", "check-23", "check-24", "check-30", "check-45", "check-49", "check-84", "check-85", "check-116", "check-117", "check-124", "check-125", "check-151", "check-63", "check-118", "check-153"]}（条件：{"call": 2, "outcome": ["ready"]}）

  4. `compare_behavior` {"check_names": ["check-127", "check-128", "check-129"]}（条件：{"call": 3, "outcome": ["unverified"]}）

  5. `run_agent` {"capabilities": ["packaging"], "issue_ids": ["verification-272e0b8cf120fc5f75096cd1775d39bd55981f8a8205b522327f4625bf30f061", "verification-369841bcc7b892c769335e5eaa1f5218e19b06904e9352822a4fa9ad740d7553"], "role": "repair"}（条件：{"call": 4, "outcome": ["regressed"]}）

     <details><summary>交给作者的指示</summary>

     ```
     Repair the two packaging checks that still fail on the current candidate (candidate-4). Change nothing outside the packaging capability (setup.py and the files it reads, ships or refers to).
     
     Confirmed by four comparisons (two of candidate-1, two of candidate-4):
     - check-128 (packaging): 1 failed assertion case; its compared values are in your feedback. Before the last repair 4 assertion cases of this check failed, so that repair mended three and left one.
     - check-129 (packaging): 1 case that the test itself ended with an explicit failure (pytest Failed), with no compared values. It failed in exactly this way on candidate-1 and still fails after the last repair, which changed setup.py, docker/Dockerfile and docker/deploy.Dockerfile and added config files under configs/. So what that repair changed did not reach its cause (a clue, not a proof).
     - check-127 (packaging) and the owner's two installation checks pass, and the extension detectron2._C builds: keep that.
     
     What to do: no values tell you what check-129 saw, so do not stop at the one assertion of check-128. Read the original's setup.py and every file it reads or refers to in the lent source, and compare with the candidate, entry by entry, everything the packaging interface states: what setup.py --name and --version print, with and without D2_VERSION_SUFFIX and BUILD_NIGHTLY; python_requires, the install_requires list and the extras all and dev, string for string; the packages and their package directories, including the builtin projects as detectron2.projects.*; the extension detectron2._C: its sources under detectron2/layers/csrc, which of them are taken with CUDA, without it and with FORCE_CUDA, and its other build arguments; how the files of configs/ are found and shipped inside the package as detectron2/model_zoo/configs, which files that covers (the candidate now has more config files than before), and what running setup.py leaves in the tree; and what setup.py does when a precondition it checks, if it has one, does not hold. Compare in each of those environments, not only the default one, and compare what an installation or a built distribution then contains. Wherever the candidate differs from the original in something a user of setup.py or of the installed package can observe, make it do as the original does. Do not special-case a test, do not stub anything, and do not weaken or remove behavior.
     
     About the compiled extension: checks that need detectron2._C failed in an earlier comparison only because the extension was not present in the place where the checks ran; that is the environment's, not the code's. Write no fallback, substitute or guard for a missing detectron2._C anywhere, and do not change how or where the extension is built unless the original's setup.py does it differently.
     
     Must keep passing: check-127, the installation checks, and the model zoo and config checks that depend on the shipped config files (check-35, check-44, check-123 to check-126, check-160). Retest first: check-128, check-129, check-127.
     
     In your report, say for check-129 which observable difference you found and changed, or that you found none.
     ```

     </details>

  6. `save_candidate` {"reason": "Second behavior repair: packaging (check-128, check-129)"}（条件：{"call": 5, "outcome": ["completed"]}）

  7. `prepare_environment` {"target": "candidate"}（条件：{"call": 6, "outcome": ["done"]}）

  8. `capture_baseline` （条件：{"call": 7, "outcome": ["passed"]}）

  9. `compare_behavior` {"check_names": ["check-127", "check-128", "check-129"]}（条件：{"call": 8, "outcome": ["ready"]}）

  10. `compare_behavior` （条件：{"call": 9, "outcome": ["unverified"]}）

**主②作业第 6 轮** · 21:51:26（第 1013.9 分钟）· applied · 用时 79 秒 · 163,339 token（其中缓存 78,673）

- 它面对的建议：`{"action": "performance_repair", "behavior_accepted": true, "candidate": "candidate-5", "reason": "retrying_performance", "restore": null, "stop_reason": null}`
- 理由：Candidate-5 is behavior accepted (full comparison passed, installation passed) and its performance measurement failed 5 of 582 benchmarks, in five capabilities with separate files (layers-deform-conv 114.7% slower, datasets-coco, layers-mask-ops, data-detection-utils, engine-distributed). Two performance repairs are left and a split group costs one however many authors it has, so one focused author per capability repairs them side by side; three of the five are close to their allowance, so those authors are told to change nothing if the source shows no extra work. The merged candidate loses the built extension, so I prepare the candidate's environment and re-bind the baseline before the full comparison, then installation and the performance measurement, each only after the one before passed. The mainline then selects and delivers by delegation; a broken behavior check or a failed measurement comes back to me (restore candidate-5 or the second repair).
- 它点的调用：

  1. `run_parallel_agents` {"group": "split", "reason": "First performance repair: the five benchmarks that candidate-5 failed in performance-23 lie in five capabilities with separate files, so one split group repairs them side by side"}

     - 请求 1：`{"capabilities": ["layers-deform-conv"], "role": "repair"}`

       <details><summary>交给这个作者的指示</summary>

       ```
       Performance repair for layers-deform-conv on the current candidate (candidate-5), which passes every behavior check. Measured (artifact performance-23): timed benchmark perf-352 ran 114.7 percent slower than the original by wall clock, where 20 percent is allowed. This is the largest slowdown of the job and well outside noise. Your feedback says what the benchmark measures. Read the candidate's deformable convolution code (layer classes, functions and the path to the compiled extension) beside the lent original and find where the candidate does more work per call for the same inputs: which implementation each one dispatches to, what is computed or copied per call or per batch chunk, argument checks, conversions and device or dtype handling. My hypothesis, not confirmed by any measurement: the candidate takes a different execution path from the original for the same call (for example another backend or a different chunking of the batch). Verify it in the source before acting on it. Make the candidate do the same amount of work as the original with the same observable behavior: same results, shapes, dtypes, errors and messages, on every input and not only on the benchmark's. Do not special-case a workload, do not remove validation or functionality, add no caching the original lacks. check-10 must keep passing, and so must the checks of code that uses these layers (check-9, check-45). Four other authors repair datasets-coco, layers-mask-ops, data-detection-utils and engine-distributed at the same time in separate workspaces and the results are merged by path: change only the files of layers-deform-conv and no package-level file such as an __init__.py, setup.py or a shared helper, unless the slowdown cannot be removed without it; then change as little as possible and say so in your report.
       ```

       </details>

     - 请求 2：`{"capabilities": ["datasets-coco"], "role": "repair"}`

       <details><summary>交给这个作者的指示</summary>

       ```
       Performance repair for datasets-coco on the current candidate (candidate-5), which passes every behavior check. Measured (artifact performance-23): timed benchmark perf-332 used 56.8 percent more processor time than the original, where 55 percent was allowed (the allowance was widened because this benchmark was noisy on the original itself). So the excess over the limit is small, but the candidate was still measured about one and a half times as slow. Your feedback says what the benchmark measures. Read the candidate's COCO dataset code (loading the json annotations into dataset dicts, the conversion to COCO json, registration and metadata) beside the lent original and find where the candidate does more work for the same input: repeated passes over images or annotations, per-record lookups that the original does once, repeated construction of maps or objects, extra copies, validation or logging evaluated per item, imports made inside loops. Make the candidate do the same amount of work as the original with the same observable behavior: the same dicts, field order, values, warnings, log messages and errors. Do not special-case a workload, do not remove validation, add no caching the original lacks. If after reading both you find no place where the candidate does more work, change nothing and say so in your report instead of making cosmetic changes. These must keep passing: check-4, check-5, check-46, and the loaders that build on coco.py: check-60 to check-67. Four other authors repair layers-deform-conv, layers-mask-ops, data-detection-utils and engine-distributed at the same time in separate workspaces and the results are merged by path: change only the files of datasets-coco and no package-level file such as an __init__.py, setup.py or a shared helper, unless the slowdown cannot be removed without it; then change as little as possible and say so in your report.
       ```

       </details>

     - 请求 3：`{"capabilities": ["layers-mask-ops"], "role": "repair"}`

       <details><summary>交给这个作者的指示</summary>

       ```
       Performance repair for layers-mask-ops on the current candidate (candidate-5), which passes every behavior check. Measured (artifact performance-23): timed benchmark perf-232 ran 41.8 percent slower than the original by wall clock, where 31 percent was allowed (widened for noise). Your feedback says what the benchmark measures. Read the candidate's mask operations (pasting masks into images, the chunking and the choice between the whole-image and the per-box path, grid sampling, thresholding, and the helpers around them) beside the lent original and find where the candidate does more work for the same inputs: a different choice of path or chunk size, tensors built per mask instead of per chunk, extra copies or dtype and device conversions, work done before a skip condition instead of after it. Make the candidate do the same amount of work as the original with the same observable behavior: the same outputs, dtypes, shapes, thresholds, memory limits and errors on every input, not only the benchmark's. Do not special-case a workload, do not remove validation, add no caching the original lacks. These must keep passing: check-12, check-92, check-93, check-94, check-159, and the users of these operations: check-29, check-45, check-107 to check-110. Four other authors repair layers-deform-conv, datasets-coco, data-detection-utils and engine-distributed at the same time in separate workspaces and the results are merged by path: change only the files of layers-mask-ops and no package-level file such as an __init__.py, setup.py or a shared helper, unless the slowdown cannot be removed without it; then change as little as possible and say so in your report.
       ```

       </details>

     - 请求 4：`{"capabilities": ["data-detection-utils"], "role": "repair"}`

       <details><summary>交给这个作者的指示</summary>

       ```
       Performance repair for data-detection-utils on the current candidate (candidate-5), which passes every behavior check. Measured (artifact performance-23): timed benchmark perf-302 ran 26.7 percent slower than the original by wall clock, where 20 percent is allowed. Your feedback says what the benchmark measures. Read the candidate's detection utilities (reading and converting images, transforming annotations, boxes, polygons, masks and keypoints, building Instances from annotations, filtering empty instances, the size and format checks) beside the lent original and find where the candidate does more work for the same inputs: per-annotation work the original does once per image or in one array operation, extra array or tensor copies and conversions, objects built repeatedly, checks evaluated more often. Make the candidate do the same amount of work as the original with the same observable behavior: the same values, dtypes, formats, errors and messages on every input, not only the benchmark's. Do not special-case a workload, do not remove validation, add no caching the original lacks. If after reading both you find no place where the candidate does more work, change nothing and say so in your report instead of making cosmetic changes. These must keep passing: check-6, and the users of these utilities: check-5, check-7, check-8, check-47. Four other authors repair layers-deform-conv, datasets-coco, layers-mask-ops and engine-distributed at the same time in separate workspaces and the results are merged by path: change only the files of data-detection-utils and no package-level file such as an __init__.py, setup.py or a shared helper, unless the slowdown cannot be removed without it; then change as little as possible and say so in your report.
       ```

       </details>

     - 请求 5：`{"capabilities": ["engine-distributed"], "role": "repair"}`

       <details><summary>交给这个作者的指示</summary>

       ```
       Performance repair for engine-distributed on the current candidate (candidate-5), which passes every behavior check. Measured (artifact performance-23): timed benchmark perf-211 ran 24.1 percent slower than the original by wall clock, where 20 percent is allowed. Your feedback says what the benchmark measures. Read the candidate's distributed code (the communication helpers for rank, world size, synchronize, gather and reduce, and the multi-process launcher) beside the lent original and find where the candidate does more work or waits longer for the same call: checks or queries of the distributed state repeated where the original returns early, serialization or copies in the single-process path, extra synchronization, imports executed inside functions on every call, process start or teardown steps the original does not take. Make the candidate do the same amount of work as the original with the same observable behavior: the same return values, early exits, ordering, logging, errors and messages. Do not special-case a workload, do not remove validation, add no caching the original lacks. If after reading both you find no place where the candidate does more work, change nothing and say so in your report instead of making cosmetic changes. These must keep passing: check-75, check-76, check-77, and the users of these helpers: check-31, check-78 to check-82, check-86 to check-91. Four other authors repair layers-deform-conv, datasets-coco, layers-mask-ops and data-detection-utils at the same time in separate workspaces and the results are merged by path: change only the files of engine-distributed and no package-level file such as an __init__.py, setup.py or a shared helper, unless the slowdown cannot be removed without it; then change as little as possible and say so in your report.
       ```

       </details>

  2. `prepare_environment` {"target": "candidate"}（条件：{"call": 1, "outcome": ["done", "partial"]}）

  3. `capture_baseline` （条件：{"call": 2, "outcome": ["passed"]}）

  4. `compare_behavior` （条件：{"call": 3, "outcome": ["ready"]}）

  5. `check_installation` （条件：{"call": 4, "outcome": ["checks_passed"]}）

  6. `compare_performance` （条件：{"call": 5, "outcome": ["passed"]}）

主作业②里相邻两个被对比过的候选之间改了什么：

candidate-1 → candidate-4：

```
 .../mask_rcnn_regnetx_4gf_dds_fpn_1x.py            |  31 +++
 .../mask_rcnn_regnety_4gf_dds_fpn_1x.py            |   7 +
 configs/Misc/mmdet_mask_rcnn_R_50_FPN_1x.py        | 133 ++++++++++
 configs/Misc/torchvision_imagenet_R_50.py          | 119 +++++++++
 configs/common/README.md                           |  11 +
 configs/common/data/coco_panoptic_separated.py     |  10 +-
 configs/common/models/mask_rcnn_vitdet.py          |  47 ++++
 .../new_baselines/mask_rcnn_R_101_FPN_100ep_LSJ.py |   3 +
 .../new_baselines/mask_rcnn_R_101_FPN_200ep_LSJ.py |   3 +
 .../new_baselines/mask_rcnn_R_101_FPN_400ep_LSJ.py |   3 +
 .../new_baselines/mask_rcnn_R_50_FPN_100ep_LSJ.py  |  68 +++++
 .../new_baselines/mask_rcnn_R_50_FPN_200ep_LSJ.py  |  10 +
 .../new_baselines/mask_rcnn_R_50_FPN_400ep_LSJ.py  |  10 +
 .../new_baselines/mask_rcnn_R_50_FPN_50ep_LSJ.py   |  10 +
 .../mask_rcnn_regnetx_4gf_dds_FPN_100ep_LSJ.py     |  22 ++
 .../mask_rcnn_regnetx_4gf_dds_FPN_200ep_LSJ.py     |  10 +
 .../mask_rcnn_regnetx_4gf_dds_FPN_400ep_LSJ.py     |  10 +
 .../mask_rcnn_regnety_4gf_dds_FPN_100ep_LSJ.py     |  10 +
 .../mask_rcnn_regnety_4gf_dds_FPN_200ep_LSJ.py     |  10 +
 .../mask_rcnn_regnety_4gf_dds_FPN_400ep_LSJ.py     |  10 +
 detectron2/data/datasets/cityscapes.py             |  30 +--
 detectron2/data/datasets/coco.py                   |   9 +-
 detectron2/data/datasets/coco_panoptic.py          |   5 +-
 detectron2/data/datasets/lvis.py                   |   4 +-
 detectron2/engine/train_loop.py                    |   6 +-
 detectron2/evaluation/__init__.py                  |  13 +
 detectron2/modeling/meta_arch/rcnn.py              |   3 +-
 detectron2/utils/visualizer.py                     | 275 +++++++++++++++++++++
 docker/Dockerfile                                  |  15 +-
 docker/deploy.Dockerfile                           |   4 +-
 setup.py                                           |   9 +-
 31 files changed, 865 insertions(+), 45 deletions(-)
```

candidate-4 → candidate-5：

```
 docker/Dockerfile                                      |  2 +-
 projects/DeepLab/deeplab/__init__.py                   |  2 ++
 projects/Panoptic-DeepLab/panoptic_deeplab/__init__.py |  2 ++
 projects/PointRend/point_rend/__init__.py              |  2 ++
 setup.py                                               | 14 +++++---------
 5 files changed, 12 insertions(+), 10 deletions(-)
```

## 10. 节点申请

主作业的检查和性能测量发到计算节点上跑（草稿作业的检查在它自己所在的机器上跑，不要节点）。下面是运行期间每 10 秒抓一次得到的：每个分配接下的请求，时间是第一次看到的时间（`_run_checks` 是一批检查，`knockouts` 是敲除，`measure` 是性能测量或基准试跑，带 `refused` 的是节点拒收：这个分配剩下的时间不够，作业会另申请一个）。批处理作业到时之后有十几分钟没有抽样。

| 分配（作业/分配，各前 8 位） | 作业 | 第一条请求 | 最后一条请求 | 接下的请求，按先后（时间） |
| --- | --- | --- | --- | --- |
| 15926218/5e1b07b0 | 主① | 05:37:05 | 05:42:05 | `_run_checks`（05:37:05）、`knockouts`（05:42:05） |
| 15926218/3d65cbd2 | 主① | 06:03:15 | 19:11:11 | `_run_checks`（06:03:15）、`knockouts`（06:52:37）、`measure refused`（06:59:07）、`_run_checks`（19:11:11）、`knockouts`（19:11:11）、`measure refused`（19:11:11） |
| 15926218/f6c3d9db | 主① | 06:59:07 | 19:11:11 | `measure`（06:59:07）、`measure`（19:11:11） |
| c52b52e8/624dfe8f | 主② | 08:23:49 | 08:27:59 | `_run_checks`（08:23:49）、`knockouts`（08:27:59） |
| c52b52e8/d426a001 | 主② | 08:48:49 | 09:39:21 | `_run_checks`（08:48:49）、`knockouts`（09:32:31）、`measure refused`（09:39:21） |
| c52b52e8/8d9654e0 | 主② | 09:39:21 | 12:19:57 | `measure`（09:39:21）、`_run_checks`（12:17:07）、`knockouts`（12:19:07）、`measure`（12:19:57） |
| c52b52e8/f80d0588 | 主② | 12:50:58 | 19:11:11 | `_run_checks`（12:50:58）、`knockouts`（12:53:28）、`measure`（12:54:18）、`_run_checks refused`（12:59:48）、`_run_checks`（19:11:11）、`knockouts`（19:11:11）、`measure`（19:11:11）、`_run_checks refused`（19:11:11） |
| c52b52e8/29efca77 | 主② | 13:19:19 | 14:00:11 | `_run_checks`（13:19:19）、`knockouts`（13:53:30）、`measure refused`（14:00:11） |
| c52b52e8/e18cccb2 | 主② | 14:00:11 | 16:49:17 | `measure`（14:00:11）、`_run_checks`（16:47:47）、`knockouts`（16:49:17） |
| c52b52e8/318b4b83 | 主② | 19:11:11 | 19:11:11 | `_run_checks`（19:11:11）、`knockouts`（19:11:11）、`_run_checks`（19:11:11）、`_run_checks`（19:11:11） |
| c52b52e8/640968cc | 主② | 19:35:02 | 19:41:02 | `_run_checks`（19:35:02）、`_run_checks refused`（19:41:02） |
| c52b52e8/16c6cca3 | 主② | 19:41:02 | 19:56:53 | `_run_checks`（19:41:02）、`_run_checks`（19:55:23）、`_run_checks`（19:56:53） |
| c52b52e8/3c58929e | 主② | 20:12:43 | 20:20:54 | `_run_checks`（20:12:43）、`_run_checks refused`（20:13:53）、`measure refused`（20:20:54） |
| c52b52e8/bc4f24a6 | 主② | 20:14:33 | 20:20:44 | `_run_checks`（20:14:33）、`measure refused`（20:20:44） |
| c52b52e8/16dfab66 | 主② | 20:21:24 | 20:21:24 | `measure`（20:21:24） |

调度器记账里这次运行的批处理作业（`d2m-*` 是整次运行所在的作业，`nanolize-checks-*` 是作业申请的检查节点；时间是 PST）：

| 名字 | 开始 | 结束 | 用时 | 状态 |
| --- | --- | --- | --- | --- |
| d2m-prep | 11-22 04:54:54 | 11-22 04:57:10 | 00:02:16 | COMPLETED |
| d2m-r2 | 11-22 04:57:27 | 11-22 18:57:50 | 14:00:23 | TIMEOUT |
| nanolize-checks-d763191b | 11-22 05:35:47 | 11-22 05:35:50 | 00:00:03 | COMPLETED |
| nanolize-checks-5e1b07b0 | 11-22 05:36:53 | 11-22 06:01:42 | 00:24:49 | COMPLETED |
| nanolize-checks-3d65cbd2 | 11-22 06:03:09 | 11-22 07:14:02 | 01:10:53 | COMPLETED |
| nanolize-checks-f6c3d9db | 11-22 06:59:01 | 11-22 08:19:49 | 01:20:48 | CANCELLED |
| nanolize-checks-c2459032 | 11-22 08:23:01 | 11-22 08:23:03 | 00:00:02 | COMPLETED |
| nanolize-checks-624dfe8f | 11-22 08:23:43 | 11-22 08:47:06 | 00:23:23 | COMPLETED |
| nanolize-checks-d426a001 | 11-22 08:48:47 | 11-22 09:54:15 | 01:05:28 | COMPLETED |
| nanolize-checks-8d9654e0 | 11-22 09:39:17 | 11-22 12:49:51 | 03:10:34 | COMPLETED |
| nanolize-checks-f80d0588 | 11-22 12:50:47 | 11-22 13:00:30 | 00:09:43 | CANCELLED |
| nanolize-checks-0e436014 | 11-22 13:00:30 | 11-22 13:15:36 | 00:15:06 | COMPLETED |
| nanolize-checks-29efca77 | 11-22 13:19:10 | 11-22 14:15:05 | 00:55:55 | COMPLETED |
| nanolize-checks-e18cccb2 | 11-22 14:00:04 | 11-22 17:28:58 | 03:28:54 | COMPLETED |
| nanolize-checks-0ac9aac0 | 11-22 17:13:58 | 11-22 18:21:43 | 01:07:45 | COMPLETED |
| nanolize-checks-318b4b83 | 11-22 18:06:45 | 11-22 18:59:40 | 00:52:55 | CANCELLED |
| d2m-r2-resume | 11-22 19:10:54 | （还在跑） | 03:07:54 | RUNNING |
| nanolize-checks-640968cc | 11-22 19:34:55 | 11-22 19:56:01 | 00:21:06 | COMPLETED |
| nanolize-checks-16c6cca3 | 11-22 19:41:00 | 11-22 20:12:16 | 00:31:16 | COMPLETED |
| nanolize-checks-3c58929e | 11-22 20:12:35 | 11-22 20:35:49 | 00:23:14 | COMPLETED |
| nanolize-checks-bc4f24a6 | 11-22 20:14:23 | 11-22 20:35:47 | 00:21:24 | COMPLETED |
| nanolize-checks-16dfab66 | 11-22 20:21:10 | 11-22 22:05:06 | 01:43:56 | COMPLETED |

## 11. 导出时的状态

- 主①作业 `15926218`：`cancelled`（阶段 `cancelled`），17 条事件，最后一条 08:20:00：Owned computation stopped; candidate and evidence were retained.

- 草稿①作业 `c49d4cee`：`cancelled`（阶段 `cancelled`），44 条事件，最后一条 08:20:00：Owned computation stopped; candidate and evidence were retained.

- 主②作业 `c52b52e8`：`running`（阶段 `workspace_agents`），81 条事件，最后一条 21:54:18：A parallel group (split) of 5 author sessions in implementation workspaces, 4 at a time.

- 草稿②作业 `757d930c`：`draft_ready`（阶段 `draft_ready`），22 条事件，最后一条 10:12:32：The first implementation is written and saved (candidate-8, 132 files in 6 scopes). This draft job ends here: its main job imports the candidate, verifies it and delivers.

- 还没有发生的：性能修复（上限 2 次）和之后的再次测量、选定候选、交付、交付后回放原测试；所以这份文件没有“收尾”一节，体积和验收的最终数字以运行结束后的记录为准。

- 原仓库里主持会话提交的恢复测试：`d9e4e20 Add the test files nanolize recovered`。

- 测试环境的指纹：启动时、批处理作业到时后、续跑开始时都是 `604659d50561e108`。

<details><summary>主持会话第一段的最后一条消息（原文）</summary>

```
运行还没有结束：主作业仍在冻结阶段，尚未封存契约，也没有任何交付结果。我在这里停止观察，因为我所在的调度器分配约在 18:57（PST）到时；我没有取消或挂起任何作业。

## 标识

- **run_id**：`6567125f76004fcd964e88f0d2a00fdf`
- **review_id**：`3e9636ff8b60422b880261ce0b92860c`
- **作业**：
  - 主作业 `c52b52e8068a41f9962c8fd761d3f11f`：运行中，阶段 `baseline`，正带着 158 个检查重新捕获原始基线。
  - 草稿作业 `757d930c5a934fdc91ffc9b14360d051`：`draft_ready`，第一版实现（candidate-8，132 个文件）已保存，等主作业封存后导入。
- **工作根目录**：`<工作根>`
- **恢复测试的提交**：`d9e4e207b736d87b230f4f249002268e0251d4c4`，分支 `main`，提交身份是仓库所有者（Git 按用户名和主机名自动得到，我没有设置身份）。包含 6 个文件、19 个测试：
  - `tests/data/test_nanolize_recovered_test_sampler.py`
  - `tests/modeling/test_nanolize_recovered_test_roi_heads_1.py`
  - `tests/modeling/test_nanolize_recovered_test_roi_heads_2.py`
  - `tests/test_nanolize_recovered_test_checkpoint.py`
  - `tests/test_nanolize_recovered_test_packaging.py`
  - `tests/test_nanolize_recovered_test_solver.py`
- **运行页面**：`http://127.0.0.1:<端口>/?key=<已隐去>`
- **终端视图**：`nanolize run-watch --state-root <工作根目录>/state`

## 已取消的第一对作业

第一次提交（评审 `b8c7b847afd9469db4d21ba891daa9ab`，主作业 `1592621820424593aaf15fa9ee7296c8`，草稿作业 `c49d4cee2cf54af8987b5981f54cc088`）被我取消并重新提交，约 2 小时 45 分钟的运行作废。

原因是我清单里的两个输出对比检查（`contract-model-zoo-configs`、`contract-model-parameters`）任何候选都过不了。候选的 stdout 与原始逐字节相同，但 stderr 里有一条带工作树绝对路径的警告，而输出对比把 stderr 也算在内。

我让 4 个输出检查在程序开头关闭 stderr，只比较 stdout。被比较的 stdout 内容没有变化，所以没有放宽验收标准。修正后，新草稿作业的第一版在全量对比中没有失败的检查。

## 当前这对作业的进展

- **范围**：按 `scope=core` 提交，保留 64 个能力（161 个文件，约 29.7 万 tokens），移除 47 个，没有增减任何能力。
- **检查**：45 个保留检查在原始代码上全部通过，另有 7 个随移除的能力退役。
- **测试设计**：已接受 82 个设计的测试（24 个叶子）和 27 个场景文件（725 个用例）。13 个待改写的原始测试中 12 个已改写，1 个仍未验证。
- **性能验收**：已在原始代码上提交 111 个性能文件，其中 37 个是计数文件。尚未测量任何候选。
- **检查运行位置**：计算节点，account `<账户>`、partition `<队列>`、qos `normal`，三项都是你给定的，我没有另找。准备配方和安装检查在本机运行。

## 需要你知道的几点

- **准备配方多了一步**：除了复制 `_C.*.so`，还建了链接 `detectron2/model_zoo/configs -> ../../configs`。没有它，约 30 个原始测试会报 "not available in Model Zoo"。
- **加了安装检查**：在新 venv 里构建安装并做一次冒烟导入，在原始代码上约 70 秒通过。因此 `setup.py` 被划入核心。
- **携带了 113 个文件**：LVIS 类别表、`builtin_meta.py`、C++/CUDA 源码和 `configs/` 下的 YAML。候选原样保留它们，两边的大小比较都不计入。
- **一次暂停代价很大**：主作业在 13:00（PST）因 `sbatch` 命令超时暂停，我原样恢复。但测试设计那一步从头重做，又花了约 5 小时。
- **7 个保留检查不算任何叶子的有效测试**：它们在原始提交的纯净导出里不能复现（我判断是缺配置链接）。它们仍参与原始与候选的对比，对应叶子由设计的测试补上。
- **在原始代码上本就过不了的测试已排除**：缺数据集文件、无网络、未装 onnx/caffe2 的那些，包括整个 `test_coco_evaluation.py`。清单见 `issues.md` 第 2 条。
- **作业能否跑完我不确定**：两个作业的工作进程在这台计算节点上，属于同一个分配。分配到时后它们是否继续，由外部记录进程说明。

`issues.md` 共 12 条，在工作根目录下，按步骤记录了每个问题的原文、原因、改动和结果。

运行结束后，`$nanolize stop` 会停掉本机上你名下 nanolize 留下的所有东西，不只是这次运行的。只想停这次运行的页面和评审，用 `stop_run_dashboard` 和 `stop_execution_review`。
```

</details>
