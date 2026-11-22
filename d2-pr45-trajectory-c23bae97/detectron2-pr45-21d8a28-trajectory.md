# detectron2 压缩实验的轨迹：PR #45 版本，nanolize main `21d8a28`

这份文件按时间顺序记录这次实验里发生的每一步：运行是怎么启动的、两个作业的每条事件和每个操作、每个模型会话、controller 的每一轮、每个候选和它的对比、每个节点申请。内容全部取自这次运行自己的记录（作业的事件和操作记录、各次模型调用的记录、启动记录、运行期间对节点请求的抽样），由脚本生成；事件和工具返回的原文是英文，照原样保留。时间都是 UTC，“第几分钟”从主作业的第一条事件算起。本机的路径、账户名、队列名、节点名和调度器作业编号已经换成占位符。章节的排法和 2026-11-20 那三份 tqdm 轨迹相同。

## 1. 配置和结果

| 项目 | 内容 |
| --- | --- |
| 实验 | 用 nanolize 压缩 detectron2（`main` @ `02881c8`），给定功能图（85 项能力、62 条检查），选核心能力：选中 28 项，排除 57 项，留下 46 条检查 |
| nanolize 代码 | GitHub main `21d8a28`（PR #45 的合并提交；比 PR #43 多 PR #44、PR #45），版本 0.8.0；对照的另一组用 PR #43 的合并提交 `af5b2c7` |
| 选项 | `unattended=on scope=core effort=high pair=on`，并行关（没有传 parallel），不做性能验收；检查经 nanolize 自己的执行器上计算节点 |
| 启动 | 没有主持会话：脚本直接调用 `start_execution_review` 并提交选择，参数和 main 的主持会话传的相同（第 3 节）；2026-11-21 00:43:19 UTC 启动；Claude Code 2.1.327，Fable 5.2 |
| 两个作业 | 主作业 `c7e2eea8`（冻结契约、验证、交付），草稿作业 `0adb2ea9`（同时写第一版） |
| 主作业起止 | 00:44:06 – 04:46:35，实际 242.5 分钟；事件里记下的等节点 1.6 分钟，扣掉之后 240.9 分钟 |
| 结束状态 | `completed_with_gaps`；缺口：`original_checks_not_verified` |
| 花费 | $170.16（31 次调用），另有试调 $0.15（3 次） |
| 体积 | 641,353 → 143,801 token，22.42%（目标 50%） |
| 行为验收 | 最后一次完整对比 96 条检查全部通过；行为修复 2 轮；controller 4 轮 |
| 安装检查 | 3 / 3 步通过 |
| 原测试的迁移 | 给了 10 条，迁移成 8 条；没能验证的原测试函数 2 个 |
| 交付后回放原测试 | 保留的 9 个测试里 9 个在交付版本上通过，退步 0 个；和内部名字绑在一起的 10 个里 6 个通过 |

## 2. 阶段

| 阶段 | 开始 | 结束 | 实际（分钟） | 其中等节点 | 扣掉等节点 |
| --- | --- | --- | --- | --- | --- |
| 冻结（作业开始到封存） | 00:44:06 | 03:00:42 | 136.6 | 1.6 | 135.0 |
| 第一版（封存到第一次完整对比开始；第一版由草稿作业在冻结期间写好） | 03:00:42 | 03:01:46 | 1.1 | 0.0 | 1.1 |
| 对比与修复（到选定候选） | 03:01:46 | 04:43:59 | 102.2 | 0.0 | 102.2 |
| 交付 | 04:43:59 | 04:46:35 | 2.6 | 0.0 | 2.6 |
| 草稿作业（和冻结同时进行） | 00:44:06 | 03:01:14 | 137.1 | 0.0 | 137.1 |

等节点只算了主作业事件里记下的那几次申请（探测和两次基线）；对比阶段另外两个分配的申请没有留下事件，等了多久查不到（第 8 节）。

## 3. 这次运行是怎么启动的

这次运行没有主持会话（tqdm 那三份轨迹的第 3 节是主持会话的每一步）。启动它的是一个脚本：在一个计算节点上还原 detectron2 的克隆和工作根（功能图、选择和测试环境用的是此前一次已交付的 detectron2 运行里主持会话写好并评审过的那一份），用这一组的 nanolize 代码调用 `start_execution_review`，提交选择，然后只等两个作业结束，中途不介入。下面是启动记录和传给 `start_execution_review` 的参数。

<details><summary>启动记录</summary>

```
arm=b host=<节点> slurm_job=<调度作业> started=2026-11-20T16:43:19-08:00 runtime=<nanolize 代码> nanolize_commit=21d8a28e dirty=0
python=<共享盘路径> nanolize=<nanolize 代码>/src/nanolize/__init__.py
folder=<原仓库> commit=02881c887f663ee157efd508e907634876b0680c branch=main
claude=2.1.327 (Claude Code) pip_config=/dev/null sbatch=<调度器命令>
settings: claude-fable-5-2 high manifest=notes/contract-manifest-4.json
runtime 8d82ff671e55331e python <共享盘路径>
review {'review_id': '7e0a5fd12f58440a914fe83d208ed37e', 'status': 'ready', 'unattended': True, 'api_only': False}
wait exit=0 at 2026-11-20T20:46:40-08:00
```

</details>

<details><summary>传给 start_execution_review 的参数</summary>

```json
{
 "path": "<原仓库>",
 "manifest_path": "<工作根>/notes/contract-manifest-4.json",
 "state_root": "<工作根>/state",
 "allow_execution": true,
 "public": false,
 "scope_preset": "core",
 "unattended": true,
 "pair": "on",
 "runner_argv": [
  "<共享盘路径>",
  "-P",
  "-m",
  "nanolize.runners.claude_author",
  "--settings",
  "<工作根>/claude-runners.json"
 ],
 "controller_policy": {
  "runner_argv": [
   "<共享盘路径>",
   "-P",
   "-m",
   "nanolize.runners.claude_controller",
   "--settings",
   "<工作根>/claude-runners.json",
   "{result_path}",
   "{schema_path}"
  ]
 },
 "check_validation": {
  "runner_argv": [
   "<共享盘路径>",
   "-P",
   "-m",
   "nanolize.runners.claude_role",
   "--settings",
   "<工作根>/claude-runners.json",
   "{result_path}",
   "{schema_path}"
  ]
 },
 "task_effort": {
  "enabled": false
 },
 "check_executor": {
  "kind": "auto",
  "account": "<账户>",
  "partition": "<队列>",
  "qos": "normal",
  "queue_timeout": 1800,
  "python": "<共享盘路径>"
 },
 "prepare_checks": [
  {
   "name": "copy-built-extension",
   "argv": [
    "/bin/sh",
    "-c",
    "mkdir -p detectron2 && cp -f <共享盘路径> detectron2/"
   ],
   "compare": "exit",
   "timeout": 300,
   "sandbox": "none"
  },
  {
   "name": "link-model-zoo-configs",
   "argv": [
    "/bin/sh",
    "-c",
    "mkdir -p detectron2/model_zoo && ln -sfn ../../configs detectron2/model_zoo/configs"
   ],
   "compare": "exit",
   "timeout": 120
  }
 ],
 "installation_checks": [
  {
   "name": "share-test-dependencies",
   "argv": [
    "{python}",
    "-c",
    "import pathlib, sysconfig; pathlib.Path(sysconfig.get_paths()['purelib'], 'nanolize_test_dependencies.pth').write_text('<共享盘路径>' + chr(10))"
   ],
   "timeout": 120
  },
  {
   "name": "install-package",
   "argv": [
    "{python}",
    "-m",
    "pip",
    "install",
    "--no-deps",
    "--no-build-isolation",
    "--no-index",
    "--disable-pip-version-check",
    "{repo}"
   ],
   "timeout": 2400,
   "env": {
    "PIP_CONFIG_FILE": "/dev/null",
    "OMP_NUM_THREADS": "1",
    "MKL_NUM_THREADS": "1"
   }
  },
  {
   "name": "installed-smoke",
   "argv": [
    "{python}",
    "-I",
    "-c",
    "import torch\nimport detectron2\nfrom detectron2 import _C, model_zoo\nfrom detectron2.engine import DefaultPredictor\nfrom detectron2.layers import nms_rotated\nfrom detectron2.modeling import build_model\nprint(\"version\", detectron2.__version__)\ncfg = model_zoo.get_config(\"COCO-Detection/faster_rcnn_R_50_FPN_3x.yaml\")\ncfg.MODEL.DEVICE = \"cpu\"\nmodel = build_model(cfg).eval()\nwith torch.no_grad():\n    out = model([{\"image\": torch.zeros(3, 64, 96)}])\nassert \"instances\" in out[0], out\nkeep = nms_rotated(torch.tensor([[10.0, 10.0, 8.0, 4.0, 0.0], [10.0, 10.0, 8.0, 4.0, 5.0]]), torch.tensor([0.9, 0.8]), 0.5)\nassert keep.tolist() == [0], keep\nprint(\"installed package works\")\n"
   ],
   "runtime": {
    "python": true,
    "modules": [
     "detectron2"
    ],
    "allowed_roots": [
     "{environment}"
    ]
   },
   "timeout": 900,
   "env": {
    "OMP_NUM_THREADS": "1",
    "MKL_NUM_THREADS": "1"
   }
  }
 ],
 "installation_python": "<共享盘路径>"
}
```

</details>

## 4. 两个作业的事件和操作（按时间）

“事件”是作业写给人看的进度消息；“操作”是作业执行的一步（工具名、结果、用时）；“controller”是 controller 的一轮决定。主作业和草稿作业的记录合在一起按时间排。

| 时间 | 第几分钟 | 作业 | 类型 | 内容 |
| --- | --- | --- | --- | --- |
| 00:44:06 | 0.0 | 主 | 事件 | Selection accepted; waiting for an execution slot. |
| 00:44:06 | 0.0 | 主 | 事件 | `pair_started` This run is two jobs: this one freezes the contract and verifies, and a draft job (0adb2ea948fe41108ca0d403fdadbd73) writes the first implementation meanwhile on a second clone. This job imports it after its seal. |
| 00:44:06 | 0.0 | 草稿 | 事件 | `pair_started` The draft job of a pair: it writes the first implementation on a second clone while its main job (c7e2eea869914813acd5e29c9716ee2e) freezes the contract, and stops. It designs no test, compares nothing and delivers nothing. |
| 00:44:07 | 0.0 | 主 | 事件 | Trying the job's runners with one small call each before anything is prepared: the author's runner, the controller's runner, the test designers' runner. |
| 00:44:07 | 0.0 | 草稿 | 事件 | `draft_job` The controller is not asked (draft job); the job follows the advice from create_workspace. |
| 00:44:07 | 0.0 | 草稿 | 操作 | `create_workspace` → created（15 秒） |
| 00:44:14 | 0.1 | 草稿 | 事件 | Creating isolated original and candidate worktrees. |
| 00:44:16 | 0.2 | 主 | 事件 | The author's runner passed its trial call (9 s). |
| 00:44:22 | 0.3 | 草稿 | 操作 | `prepare_environment` → passed（3 秒） |
| 00:44:23 | 0.3 | 草稿 | 事件 | Running the owner's preparation recipes in the original's worktree. |
| 00:44:23 | 0.3 | 主 | 事件 | The controller's runner passed its trial call (7 s). |
| 00:44:25 | 0.3 | 草稿 | 操作 | `prepare_environment` → passed（2 秒） |
| 00:44:26 | 0.3 | 草稿 | 事件 | Running the owner's preparation recipes in the candidate's worktree. |
| 00:44:27 | 0.4 | 草稿 | 操作 | `capture_baseline` → ready（261 秒） |
| 00:44:27 | 0.4 | 草稿 | 事件 | Capturing the original baseline in the original's worktree, unless a saved one still observes it. |
| 00:44:35 | 0.5 | 主 | 事件 | The test designers' runner passed its trial call (11 s). |
| 00:44:55 | 0.8 | 主 | 事件 | `batch_queued` The probe (an empty batch that settles where the job's checks run) waits for a compute node as scheduler job <调度作业>. It asked for 7 minutes, 1 CPU and 32768 MB of memory in partition <队列>, and may wait 1800 s in the queue. |
| 00:45:02 | 0.9 | 主 | 事件 | `batch_started` Scheduler job <调度作业> (the probe (an empty batch that settles where the job's checks run)) was seen started on a compute node about 27 s after it was submitted. |
| 00:45:07 | 1.0 | 主 | 事件 | The job's checks run on a compute node (Slurm, partition <队列>). Installation checks and preparation recipes run on this machine. |
| 00:45:07 | 1.0 | 主 | 事件 | `before_first_comparison` The controller is not asked (before first comparison); the job follows the advice from create_workspace. |
| 00:45:07 | 1.0 | 主 | 操作 | `create_workspace` → created（16 秒） |
| 00:45:15 | 1.1 | 主 | 事件 | Creating isolated original and candidate worktrees. |
| 00:45:23 | 1.3 | 主 | 操作 | `prepare_environment` → passed（3 秒） |
| 00:45:24 | 1.3 | 主 | 事件 | Running the owner's preparation recipes in the original's worktree. |
| 00:45:25 | 1.3 | 主 | 操作 | `prepare_environment` → passed（2 秒） |
| 00:45:26 | 1.3 | 主 | 事件 | Running the owner's preparation recipes in the candidate's worktree. |
| 00:45:27 | 1.4 | 主 | 操作 | `capture_baseline` → ready（1526 秒） |
| 00:45:27 | 1.4 | 主 | 事件 | Capturing the original baseline in the original's worktree, unless a saved one still observes it. Validating leaf tests with repeated runs and leaf knockouts. |
| 00:46:01 | 1.9 | 主 | 事件 | `batch_queued` A batch of 46 checks waits for a compute node as scheduler job <调度作业>. It asked for 240 minutes, 4 CPUs and 32768 MB of memory in partition <队列>, and may wait 18000 s in the queue. |
| 00:46:18 | 2.2 | 主 | 事件 | `batch_started` Scheduler job <调度作业> (a batch of 46 checks) was seen started on a compute node about 38 s after it was submitted. |
| 00:48:52 | 4.8 | 草稿 | 操作 | `seal_contract` → done（17 秒） |
| 00:49:09 | 5.0 | 草稿 | 事件 | `contract_sealed` The contract is sealed: 209 verifier-owned files; the verification bundle is exported. |
| 00:49:09 | 5.1 | 草稿 | 操作 | `run_agent` → completed（1562 秒） |
| 00:49:11 | 5.1 | 草稿 | 事件 | The configured agent is writing its own implementation of the selected graph. |
| 01:10:53 | 26.8 | 主 | 事件 | `checks_not_reproduced_in_export` 7 of 46 retained checks pass on the original but not in a pristine export of its commit (what such a check needs beyond the committed files is missing there, or no export could be made): no knockout of them was tried, so they are a valid test of no leaf. The baseline record names each under validity.issues (check_not_reproduced_in_export), with the last line it printed. |
| 01:10:53 | 26.8 | 主 | 操作 | `design_leaf_tests` → done（4195 秒） |
| 01:10:54 | 26.8 | 主 | 事件 | Designing tests for 4 selected leaves without a valid test. 10 original tests that could not stay as written are given to the designers of 6 leaves to migrate. |
| 01:15:11 | 31.1 | 草稿 | 操作 | `save_candidate` → done（12 秒） |
| 01:15:24 | 31.3 | 草稿 | 事件 | `candidate_saved` The drafts are saved as candidate-1. |
| 01:15:24 | 31.3 | 草稿 | 操作 | `run_agent` → completed（1202 秒），候选 candidate-1 |
| 01:15:25 | 31.3 | 草稿 | 事件 | The configured agent is writing its own implementation of the selected graph. |
| 01:35:26 | 51.3 | 草稿 | 操作 | `save_candidate` → done（10 秒），候选 candidate-1 |
| 01:35:36 | 51.5 | 草稿 | 事件 | `candidate_saved` The drafts are saved as candidate-2. |
| 01:35:36 | 51.5 | 草稿 | 操作 | `run_agent` → completed（1605 秒），候选 candidate-2 |
| 01:35:37 | 51.5 | 草稿 | 事件 | The configured agent is writing its own implementation of the selected graph. |
| 02:02:21 | 78.2 | 草稿 | 操作 | `save_candidate` → done（11 秒），候选 candidate-2 |
| 02:02:32 | 78.4 | 草稿 | 事件 | `candidate_saved` The drafts are saved as candidate-3. |
| 02:02:32 | 78.4 | 草稿 | 操作 | `run_agent` → completed（2505 秒），候选 candidate-3 |
| 02:02:33 | 78.4 | 草稿 | 事件 | The configured agent is writing its own implementation of the selected graph. |
| 02:20:41 | 96.6 | 主 | 事件 | Accepted 37 designed tests for 9 leaves; 8 proposals rejected. Accepted 13 scenario files with 412 cases for 9 leaves; 1 scenario files rejected. What each case shows on the original is what a candidate must show. Of 10 original tests to migrate, 8 are migrated, 0 left out with a reason and 2 stay unverified; of those, 2 could not be checked where a designer runs. 5 of the refused files, holding 98 tests and scenario functions, were not given back to a designer: nothing checks what they checked. |
| 02:20:47 | 96.7 | 主 | 事件 | `designed_tests_baseline` Committed 50 designed files on the original. The original baseline is captured again with them by the job's next step: 96 checks, validating leaf tests with repeated runs and leaf knockouts. |
| 02:20:48 | 96.7 | 主 | 操作 | `capture_baseline` → ready（2365 秒） |
| 02:20:48 | 96.7 | 主 | 事件 | Capturing the original baseline in the original's worktree, unless a saved one still observes it. Validating leaf tests with repeated runs and leaf knockouts. |
| 02:21:33 | 97.4 | 主 | 事件 | `batch_queued` A batch of 96 checks waits for a compute node as scheduler job <调度作业>. It asked for 240 minutes, 4 CPUs and 32768 MB of memory in partition <队列>, and may wait 18000 s in the queue. |
| 02:21:45 | 97.6 | 主 | 事件 | `batch_started` Scheduler job <调度作业> (a batch of 96 checks) was seen started on a compute node about 31 s after it was submitted. |
| 02:44:17 | 120.2 | 草稿 | 操作 | `save_candidate` → done（14 秒），候选 candidate-3 |
| 02:44:31 | 120.4 | 草稿 | 事件 | `candidate_saved` The drafts are saved as candidate-4. |
| 02:44:31 | 120.4 | 草稿 | 操作 | `run_agent` → completed（983 秒），候选 candidate-4 |
| 02:44:33 | 120.4 | 草稿 | 事件 | The configured agent is writing its own implementation of the selected graph. |
| 03:00:13 | 136.1 | 主 | 事件 | `checks_not_reproduced_in_export` 7 of 96 retained checks pass on the original but not in a pristine export of its commit (what such a check needs beyond the committed files is missing there, or no export could be made): no knockout of them was tried, so they are a valid test of no leaf. The baseline record names each under validity.issues (check_not_reproduced_in_export), with the last line it printed. |
| 03:00:13 | 136.1 | 主 | 事件 | `designed_tests_baseline` The original baseline with the designed tests is captured (ready): 0 selected leaves are still without a valid test. |
| 03:00:20 | 136.2 | 主 | 操作 | `seal_contract` → done（22 秒） |
| 03:00:42 | 136.6 | 主 | 事件 | `contract_sealed` The contract is sealed: 259 verifier-owned files; the verification bundle is exported. |
| 03:00:42 | 136.6 | 主 | 操作 | `import_draft` → imported（56 秒） |
| 03:00:42 | 136.6 | 主 | 事件 | `draft_awaited` The contract is sealed. Waiting for the draft job (0adb2ea948fe41108ca0d403fdadbd73) to finish the first implementation. |
| 03:00:54 | 136.8 | 草稿 | 操作 | `save_candidate` → done（11 秒），候选 candidate-4 |
| 03:01:05 | 137.0 | 草稿 | 事件 | `candidate_saved` The drafts are saved as candidate-5. |
| 03:01:05 | 137.0 | 草稿 | 操作 | `finish_draft` → ready（9 秒），候选 candidate-5 |
| 03:01:14 | 137.1 | 草稿 | 事件 | The first implementation is written and saved (candidate-5, 83 files in 5 scopes). This draft job ends here: its main job imports the candidate, verifies it and delivers. |
| 03:01:16 | 137.2 | 主 | 事件 | Importing the draft job's first implementation (83 files), without invoking an author. |
| 03:01:30 | 137.4 | 主 | 事件 | `draft_imported` The draft job's first implementation is this job's candidate-1 (83 files, 0 left out where the verifier provides its own). It is compared next. |
| 03:01:46 | 137.7 | 主 | 操作 | `compare_behavior` → regressed（407 秒），候选 candidate-1 |
| 03:01:46 | 137.7 | 主 | 事件 | Comparing this candidate with the original frozen checks and source budget. |
| 03:08:33 | 144.4 | 主 | 事件 | `comparison_regressed` The full comparison of candidate-1 found 27 failed checks, in backbone-resnet-fpn, checkpoint, config-lazy, config-yacs, data-catalog and others (regressed). |
| 03:08:34 | 144.5 | 主 | 事件 | Controller round 1: choosing the next tool calls. |
| 03:09:50 | 145.7 | 主 | controller | 第 1 轮（applied，75 秒，4 个调用：`prepare_environment`、`capture_baseline`、`compare_behavior`、`check_installation`）：The candidate's worktree was prepared at 00:45, before the draft was imported at 03:00, so the owner's recipes ran before any candidate file existed. Most of the 27 failures fit an unprepared tree rather than wrong code: the rotated operators are missing from the library (AttributeError in nms_rotated, roi_align_rotated and pairwise_iou_rotated), develop.py raises its placeholder ImportError, and model_zoo raises RuntimeError at one line across ten checks. That is a hypothesis, not confirmed. Preparing the candidate again, reusing the baseline and comparing in full tests it without spending an author attempt; check_installation adds the missing installation evidence. I will write the repair call from what still fails. |
| 03:09:50 | 145.7 | 主 | 事件 | `applied` Controller round 1: prepare_environment, capture_baseline, compare_behavior, check_installation. |
| 03:09:50 | 145.7 | 主 | 操作 | `prepare_environment` → passed（1 秒），候选 candidate-1，第 1 轮的第 1 个调用 |
| 03:09:50 | 145.7 | 主 | 事件 | Running the owner's preparation recipes in the candidate's worktree. |
| 03:09:51 | 145.7 | 主 | 操作 | `capture_baseline` → ready（7 秒），候选 candidate-1，第 1 轮的第 2 个调用 |
| 03:09:51 | 145.7 | 主 | 事件 | Capturing the original baseline in the original's worktree, unless a saved one still observes it. Validating leaf tests with repeated runs and leaf knockouts. |
| 03:09:57 | 145.9 | 主 | 操作 | `compare_behavior` → regressed（423 秒），候选 candidate-1，第 1 轮的第 3 个调用 |
| 03:09:57 | 145.9 | 主 | 事件 | Comparing this candidate with the original frozen checks and source budget. |
| 03:17:00 | 152.9 | 主 | 事件 | `comparison_regressed` The full comparison of candidate-1 found 11 failed checks, in data-catalog, data-transforms, detection-utils, layers, model-zoo and others (regressed). |
| 03:17:00 | 152.9 | 主 | 操作 | `check_installation` → passed（88 秒），候选 candidate-1，第 1 轮的第 4 个调用 |
| 03:17:01 | 152.9 | 主 | 事件 | Building and checking this candidate in a fresh isolated Python environment. |
| 03:18:29 | 154.4 | 主 | 事件 | `installation_passed` The installation check of candidate-1 ended passed: 3 of 3 steps passed. |
| 03:18:30 | 154.4 | 主 | 事件 | Controller round 2: choosing the next tool calls. |
| 03:20:30 | 156.4 | 主 | controller | 第 2 轮（applied，120 秒，9 个调用：`run_agent`、`save_candidate`、`prepare_environment`、`capture_baseline`、`compare_behavior`、`compare_behavior`、`check_installation`、`select_candidate`、`deliver`）：Preparing the candidate after the import cleared 16 of the 27 failed checks without an author call, and the installation checks pass 3/3. The 11 that remain have four separate causes by their evidence (catalog.py:74 AttributeError, setup.py assertions, a missing layers member, model_zoo RuntimeError at line 114 for names only the leaf tests use), so one repair call names all 11 issues, since their feedback is bound to this candidate. The save is followed by preparing the candidate again (the repair may touch setup.py and what the recipes build or link), the reused baseline, a screen of the 11 checks, the full comparison, installation, then selection and a best_reachable delivery, each only when the step before succeeded. |
| 03:20:30 | 156.4 | 主 | 事件 | `applied` Controller round 2: run_agent, save_candidate, prepare_environment, capture_baseline, compare_behavior, compare_behavior and 3 more. |
| 03:20:30 | 156.4 | 主 | 操作 | `run_agent` → completed（2152 秒），候选 candidate-1，第 2 轮的第 1 个调用 |
| 03:20:32 | 156.4 | 主 | 事件 | The configured agent is repairing its implementation of the selected graph. |
| 03:56:21 | 192.3 | 主 | 操作 | `save_candidate` → done（20 秒），候选 candidate-1，第 2 轮的第 2 个调用 |
| 03:56:41 | 192.6 | 主 | 事件 | `candidate_saved` The drafts are saved as candidate-2. |
| 03:56:42 | 192.6 | 主 | 操作 | `prepare_environment` → passed（2 秒），候选 candidate-2，第 2 轮的第 3 个调用 |
| 03:56:42 | 192.6 | 主 | 事件 | Running the owner's preparation recipes in the candidate's worktree. |
| 03:56:44 | 192.6 | 主 | 操作 | `capture_baseline` → ready（8 秒），候选 candidate-2，第 2 轮的第 4 个调用 |
| 03:56:44 | 192.6 | 主 | 事件 | Capturing the original baseline in the original's worktree, unless a saved one still observes it. Validating leaf tests with repeated runs and leaf knockouts. |
| 03:56:52 | 192.8 | 主 | 操作 | `compare_behavior` → regressed（123 秒），候选 candidate-2，第 2 轮的第 5 个调用 |
| 03:56:52 | 192.8 | 主 | 事件 | Comparing this candidate with the original frozen checks and source budget. |
| 03:58:56 | 194.8 | 主 | 事件 | `comparison_regressed` The targeted comparison of candidate-2 found 3 failed checks, in layers, model-zoo; 85 checks were not run (regressed). |
| 03:58:56 | 194.8 | 主 | 操作 | `compare_behavior` → not_triggered（没有执行），第 2 轮的第 6 个调用：Its condition was not met: call 5 ended regressed, and it runs only after unverified |
| 03:58:56 | 194.8 | 主 | 操作 | `check_installation` → not_triggered（没有执行），第 2 轮的第 7 个调用：Its condition was not met: call 6 ended not_triggered, and it runs only after checks_passed |
| 03:58:56 | 194.8 | 主 | 操作 | `select_candidate` → not_triggered（没有执行），第 2 轮的第 8 个调用：Its condition was not met: call 7 ended not_triggered, and it runs only after passed |
| 03:58:56 | 194.8 | 主 | 操作 | `deliver` → not_triggered（没有执行），第 2 轮的第 9 个调用：Its condition was not met: call 8 ended not_triggered, and it runs only after selected or done |
| 03:58:57 | 194.8 | 主 | 事件 | Controller round 3: choosing the next tool calls. |
| 03:59:55 | 195.8 | 主 | controller | 第 3 轮（applied，58 秒，2 个调用：`compare_behavior`、`check_installation`）：Repair 1 cleared 8 of the 11 failed checks; check-101, check-110 and check-111 still fail, and check-110 now fails differently (ImportError at utils/registry.py:32 in locate instead of the model_zoo RuntimeError). That repair added 49 files and modified 8, and the 85 other checks have not been compared on candidate-2, nor has installation been checked since setup.py was repaired. A full comparison (about 7 minutes) and the installation check (about 90 seconds) cost no author attempt. They show whether the repair regressed anything before I write the second repair call, whose feedback is bound to this candidate, so it can name every failure at once instead of only the three the screen saw. |
| 03:59:55 | 195.8 | 主 | 事件 | `applied` Controller round 3: compare_behavior, check_installation. |
| 03:59:55 | 195.8 | 主 | 操作 | `compare_behavior` → regressed（517 秒），候选 candidate-2，第 3 轮的第 1 个调用 |
| 03:59:55 | 195.8 | 主 | 事件 | Comparing this candidate with the original frozen checks and source budget. |
| 04:08:32 | 204.4 | 主 | 事件 | `comparison_regressed` The full comparison of candidate-2 found 3 failed checks, in layers, model-zoo (regressed). |
| 04:08:33 | 204.4 | 主 | 操作 | `check_installation` → passed（90 秒），候选 candidate-2，第 3 轮的第 2 个调用 |
| 04:08:33 | 204.4 | 主 | 事件 | Building and checking this candidate in a fresh isolated Python environment. |
| 04:10:02 | 205.9 | 主 | 事件 | `installation_passed` The installation check of candidate-2 ended passed: 3 of 3 steps passed. |
| 04:10:04 | 206.0 | 主 | 事件 | Controller round 4: choosing the next tool calls. |
| 04:11:49 | 207.7 | 主 | 事件 | `answer_correction` Controller round 4: the answer was refused before any call ran; asking once for a corrected one. |
| 04:12:36 | 208.5 | 主 | controller | 第 4 轮（applied，151 秒，9 个调用：`run_agent`、`save_candidate`、`prepare_environment`、`capture_baseline`、`compare_behavior`、`compare_behavior`、`check_installation`、`select_candidate`、`deliver`）：The full comparison of candidate-2 shows exactly three failed checks (check-101 layers, check-110 and check-111 model-zoo), no regression among the other 91, and installation passes 3/3. All three failed on both candidates, so one repair call names the three issues with their confirmed evidence (AttributeError in the check's own code; ImportError at utils/registry.py:32 in locate, which replaced the earlier model_zoo RuntimeError; four baseline cases not passing) and leaves the diagnosis to the author, with my hypotheses marked as such. The save is followed by preparing the candidate again, the reused baseline, a screen of the three checks, the full comparison, installation, selection and a best_reachable delivery, each only when the step before succeeded. |
| 04:12:36 | 208.5 | 主 | 事件 | `applied` Controller round 4: run_agent, save_candidate, prepare_environment, capture_baseline, compare_behavior, compare_behavior and 3 more. |
| 04:12:36 | 208.5 | 主 | 操作 | `run_agent` → completed（1229 秒），候选 candidate-2，第 4 轮的第 1 个调用 |
| 04:12:38 | 208.5 | 主 | 事件 | The configured agent is repairing its implementation of the selected graph. |
| 04:33:05 | 229.0 | 主 | 操作 | `save_candidate` → done（26 秒），候选 candidate-2，第 4 轮的第 2 个调用 |
| 04:33:31 | 229.4 | 主 | 事件 | `candidate_saved` The drafts are saved as candidate-3. |
| 04:33:31 | 229.4 | 主 | 操作 | `prepare_environment` → passed（2 秒），候选 candidate-3，第 4 轮的第 3 个调用 |
| 04:33:31 | 229.4 | 主 | 事件 | Running the owner's preparation recipes in the candidate's worktree. |
| 04:33:33 | 229.5 | 主 | 操作 | `capture_baseline` → ready（8 秒），候选 candidate-3，第 4 轮的第 4 个调用 |
| 04:33:33 | 229.5 | 主 | 事件 | Capturing the original baseline in the original's worktree, unless a saved one still observes it. Validating leaf tests with repeated runs and leaf knockouts. |
| 04:33:42 | 229.6 | 主 | 操作 | `compare_behavior` → unverified（71 秒），候选 candidate-3，第 4 轮的第 5 个调用 |
| 04:33:42 | 229.6 | 主 | 事件 | Comparing this candidate with the original frozen checks and source budget. |
| 04:34:53 | 230.8 | 主 | 事件 | `comparison_unverified` The targeted comparison of candidate-3 found no failed check; 93 checks were not run (unverified). |
| 04:34:53 | 230.8 | 主 | 操作 | `compare_behavior` → checks_passed（443 秒），候选 candidate-3，第 4 轮的第 6 个调用 |
| 04:34:53 | 230.8 | 主 | 事件 | Comparing this candidate with the original frozen checks and source budget. |
| 04:42:16 | 238.2 | 主 | 事件 | `comparison_checks_passed` The full comparison of candidate-3 found no failed check (checks_passed). |
| 04:42:17 | 238.2 | 主 | 操作 | `check_installation` → passed（91 秒），候选 candidate-3，第 4 轮的第 7 个调用 |
| 04:42:17 | 238.2 | 主 | 事件 | Building and checking this candidate in a fresh isolated Python environment. |
| 04:43:48 | 239.7 | 主 | 事件 | `installation_passed` The installation check of candidate-3 ended passed: 3 of 3 steps passed. |
| 04:43:49 | 239.7 | 主 | 操作 | `select_candidate` → selected（10 秒），候选 candidate-3，第 4 轮的第 8 个调用 |
| 04:44:00 | 239.9 | 主 | 操作 | `deliver` → completed_with_gaps（156 秒），候选 candidate-3，第 4 轮的第 9 个调用 |
| 04:44:14 | 240.1 | 主 | 事件 | Replaying the original tests that the conversion left out of acceptance on the delivered code. The result is reported; it changes no status. |
| 04:46:35 | 242.5 | 主 | 事件 | Delivered with gaps (original checks not verified: 2 test functions of 8 original checks left acceptance at conversion, 0 of them use only the public interface); no full preservation claim is made. |

## 5. 模型会话（每次调用）

“位置”是这次调用在作业目录里的位置：`design/round-N/<叶子>` 是第 N 轮的测试设计者，`design/review…` 是评审者，`authoring` 是作者，`controller/NNNN` 是 controller 的第 N 轮。

| 开始 | 结束 | 第几分钟 | 作业 | 角色 | 位置 | 秒 | 轮数 | 美元 | 输入 token（含缓存） | 输出 token |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 00:44:08 | 00:44:16 | 0.0 | – | 试调：作者 | 试调用的临时目录 | 8 | 2 | 0.03 | 14,190 | 151 |
| 00:44:16 | 00:44:23 | 0.2 | – | 试调：controller | 试调用的临时目录 | 7 | 1 | 0.03 | 6,601 | 270 |
| 00:44:24 | 00:44:35 | 0.3 | – | 试调：测试设计者 | 试调用的临时目录 | 11 | 2 | 0.09 | 13,971 | 410 |
| 00:49:12 | 01:14:58 | 5.1 | 草稿 | 作者 | authoring | 1546 | 63 | 14.46 | 11,194,294 | 157,288 |
| 01:11:06 | 01:23:14 | 27.0 | 主 | 测试设计者 | design/round-1/layers | 728 | 21 | 6.04 | 1,657,903 | 72,993 |
| 01:11:11 | 01:19:22 | 27.1 | 主 | 测试设计者 | design/round-1/data_catalog_4b9d42d1 | 491 | 15 | 3.10 | 670,600 | 39,923 |
| 01:11:12 | 01:19:42 | 27.1 | 主 | 测试设计者 | design/round-1/runtime_utils_6c9046d5 | 510 | 19 | 3.94 | 1,092,338 | 46,879 |
| 01:11:12 | 01:19:23 | 27.1 | 主 | 测试设计者 | design/round-1/packaging | 490 | 12 | 3.42 | 567,123 | 44,873 |
| 01:11:13 | 01:23:13 | 27.1 | 主 | 测试设计者 | design/round-1/data_transforms_8967f4a5 | 720 | 25 | 6.33 | 2,253,314 | 68,949 |
| 01:11:14 | 01:19:00 | 27.1 | 主 | 测试设计者 | design/round-1/predictor | 466 | 19 | 3.14 | 758,432 | 38,903 |
| 01:11:15 | 01:23:43 | 27.2 | 主 | 测试设计者 | design/round-1/generalized_rcnn_71859e83 | 748 | 22 | 5.54 | 1,566,193 | 69,165 |
| 01:11:16 | 01:19:46 | 27.2 | 主 | 测试设计者 | design/round-1/export_torchscript_ceee9d66 | 511 | 19 | 4.01 | 1,126,946 | 47,031 |
| 01:11:20 | 01:20:43 | 27.2 | 主 | 测试设计者 | design/round-1/model_zoo_b9ca42f9 | 563 | 17 | 3.86 | 931,363 | 47,195 |
| 01:15:26 | 01:35:16 | 31.3 | 草稿 | 作者 | authoring | 1190 | 55 | 11.37 | 8,673,598 | 114,825 |
| 01:35:38 | 02:02:11 | 51.5 | 草稿 | 作者 | authoring | 1593 | 61 | 15.15 | 11,244,136 | 157,607 |
| 01:42:08 | 01:43:31 | 58.0 | 主 | 测试评审者 | design/review/7 | 83 | 6 | 0.82 | 104,333 | 8,281 |
| 01:42:09 | 01:45:23 | 58.0 | 主 | 测试评审者 | design/review/1 | 194 | 16 | 2.54 | 652,713 | 17,207 |
| 01:42:10 | 01:49:44 | 58.1 | 主 | 测试评审者 | design/review/2 | 454 | 17 | 3.78 | 747,163 | 39,866 |
| 01:42:11 | 01:46:08 | 58.1 | 主 | 测试评审者 | design/review/5 | 237 | 18 | 2.91 | 875,789 | 21,544 |
| 01:42:11 | 01:44:41 | 58.1 | 主 | 测试评审者 | design/review/3 | 150 | 15 | 1.67 | 360,738 | 13,130 |
| 01:42:13 | 01:45:06 | 58.1 | 主 | 测试评审者 | design/review/4 | 174 | 14 | 2.02 | 562,934 | 14,945 |
| 01:42:14 | 01:45:45 | 58.1 | 主 | 测试评审者 | design/review/6 | 211 | 17 | 2.83 | 852,274 | 19,055 |
| 01:49:50 | 01:55:18 | 65.7 | 主 | 测试设计者 | design/round-3/model_zoo_b9ca42f9 | 328 | 16 | 2.51 | 641,396 | 25,251 |
| 01:49:50 | 01:50:33 | 65.7 | 主 | 测试设计者 | design/round-3/layers | 42 | 6 | 0.51 | 129,015 | 2,194 |
| 01:58:59 | 02:01:32 | 74.9 | 主 | 测试评审者 | design/review-2 | 153 | 9 | 1.60 | 280,722 | 13,278 |
| 02:02:34 | 02:44:03 | 78.5 | 草稿 | 作者 | authoring | 2489 | 83 | 21.43 | 19,775,134 | 227,280 |
| 02:44:34 | 03:00:44 | 120.5 | 草稿 | 作者 | authoring | 969 | 53 | 8.81 | 7,129,868 | 83,341 |
| 03:08:35 | 03:09:49 | 144.5 | 主 | controller | controller/0001 | 74 | 6 | 1.78 | 430,690 | 5,877 |
| 03:18:31 | 03:20:29 | 154.4 | 主 | controller | controller/0002 | 118 | 6 | 1.96 | 431,695 | 11,338 |
| 03:20:33 | 03:56:10 | 156.5 | 主 | 作者 | authoring | 2137 | 80 | 18.81 | 16,450,302 | 204,459 |
| 03:58:58 | 03:59:55 | 194.9 | 主 | controller | controller/0003 | 56 | 5 | 1.52 | 285,291 | 4,653 |
| 04:10:05 | 04:11:41 | 206.0 | 主 | controller | controller/0004 | 96 | 5 | 1.62 | 331,138 | 8,688 |
| 04:11:54 | 04:12:35 | 207.8 | 主 | controller | controller/0004 | 41 | 2 | 1.12 | 116,939 | 3,708 |
| 04:12:48 | 04:32:53 | 208.7 | 主 | 作者 | authoring | 1205 | 62 | 11.56 | 10,060,983 | 109,550 |

| 角色 | 调用次数 | 美元 | 会话时间合计（分钟） | 输出 token |
| --- | --- | --- | --- | --- |
| 作者 | 7 | 101.59 | 185.5 | 1,054,350 |
| 测试设计者 | 11 | 42.40 | 93.3 | 503,356 |
| 测试评审者 | 8 | 18.17 | 27.6 | 147,306 |
| controller | 5 | 8.01 | 6.4 | 34,264 |
| 合计（不含试调） | 31 | 170.16 | 312.8 | 1,739,276 |

## 6. 测试设计和评审

| 项目 | 数量 |
| --- | --- |
| 设计者会话 / 评审者会话 | 11 / 8 |
| 作业记下的会话数（原样） | `{"completed": 19, "failed": {}, "started": 19}` |
| 提交到原版上的设计文件 | 37 个测试文件 + 13 个场景文件（性能文件 0 个） |
| 通过的文件 | 50 |
| 被拒的文件（按原因） | outside_external_contract 5、reviewer_veto 4 |
| 没有按评审意见改完的文件 | 5 |
| 原测试的迁移 | 给了 10 条，迁移成 8 条，没法验证 2 条 |
| 第二次基线的检查数 | 96 |
| 封存时校验方持有的文件 | 259 |

每个叶子的结果：

| 叶子 | 通过的测试文件 | 通过的场景文件 | 被拒的测试（按原因） | 被拒的场景（按原因） | 原测试迁移 / 没验证 |
| --- | --- | --- | --- | --- | --- |
| data-catalog | 6 | 2 | – | – | 0 / 1 |
| data-transforms | 1 | 2 | outside_external_contract 4 | – | 1 / 0 |
| export-torchscript | 6 | 1 | – | – | 0 / 1 |
| generalized-rcnn | 4 | 2 | – | – | 1 / 0 |
| layers | 6 | 1 | reviewer_veto 1 | – | 1 / 0 |
| model-zoo | 4 | 2 | reviewer_veto 2 | reviewer_veto 1 | – / – |
| packaging | 2 | 1 | outside_external_contract 1 | – | – / – |
| predictor | 3 | 1 | – | – | – / – |
| runtime-utils | 5 | 1 | – | – | 5 / 0 |

被拒的文件和理由（原文的开头）：

| 叶子 | 轮 | 文件 | 理由 |
| --- | --- | --- | --- |
| packaging | 1 | `tests/nanolize_contracts/packaging/test_setup_distribution.py` | outside_external_contract；not in the external contract: detectron2.projects |
| data-transforms | 1 | `tests/nanolize_contracts/data_transforms_8967f4a5/test_transform_classes.py` | outside_external_contract；not in the external contract: detectron2.data.transforms.(dynamic attribute), detectron2.data.transforms.transform.(dynamic attribute) |
| data-transforms | 1 | `tests/nanolize_contracts/data_transforms_8967f4a5/test_augmentation_core.py` | outside_external_contract；not in the external contract: detectron2.data.transforms.(dynamic attribute), detectron2.data.transforms.augmentation.(dynamic attribute) |
| data-transforms | 1 | `tests/nanolize_contracts/data_transforms_8967f4a5/test_augmentation_geometry.py` | outside_external_contract；not in the external contract: detectron2.data.transforms.(dynamic attribute), detectron2.data.transforms.augmentation_impl.(dynamic attribute) |
| data-transforms | 1 | `tests/nanolize_contracts/data_transforms_8967f4a5/test_augmentation_crop_color.py` | outside_external_contract；not in the external contract: detectron2.data.transforms.(dynamic attribute) |
| model-zoo | review | `tests/nanolize_contracts/model_zoo_b9ca42f9/test_get_config.py` | reviewer_veto；Every test starts with `if configs_missing(...): return`, and configs_missing() asks the project itself (model_zoo.get_config_file) whether the configs are there. When detectron2/model_zoo/configs is absent (it is absent in this repository tree: the directory is only created when setup.py runs) or when the zoo wrongly finds no config, each of test_yaml_config_is_a_cfgnode_with_the_file_merged, test_yaml … |
| model-zoo | review | `tests/nanolize_contracts/model_zoo_b9ca42f9/test_get_model.py` | reviewer_veto；Every test starts with `if configs_missing(...): return`, and configs_missing() asks the project itself (model_zoo.get_config_file) whether the configs are there. When detectron2/model_zoo/configs is absent (it is absent in this repository tree: the directory is only created when setup.py runs) or when the zoo wrongly finds no config, each of test_yaml_config_builds_the_model_in_training_mode, test_devi … |
| model-zoo | review | `tests/nanolize_contracts/model_zoo_b9ca42f9/scenario_zoo_configs.py` | reviewer_veto；What every function shows depends on the state of the checkout rather than on its input: all of them (the scenario_file_*, scenario_cfg_* and scenario_model_* functions) look up real config names, which exist only if detectron2/model_zoo/configs has been linked by a setup.py run. That link is an untracked build artifact, it is absent in this repository tree, and the in-place packaging tests of this suit … |
| layers | review | `tests/nanolize_contracts/layers/test_batch_norm.py` | reviewer_veto；At fault: test_get_norm_layer_norm_normalizes_over_channels. The object that get_norm("LN", 3) returns belongs to a class (LayerNorm in detectron2/layers/batch_norm.py) that is not on the external names list and is not exported from detectron2.layers, so its own attributes are internal. The test asserts type(ln).__name__ == "LayerNorm", ln.eps == 1e-6 and ln.normalized_shape == (3,). normalized_shape in … |

没有迁移成的原测试：

| 原测试 | 叶子 | 状态 | 设计者给的理由 |
| --- | --- | --- | --- |
| `tests/data/test_coco.py::TestConvertCOCO::test_convert_to_coco` | data-catalog | unverifiable | Its only checked behavior is that detectron2.data.datasets.coco.convert_to_coco_dict runs on a rotated-box dataset, and that import is outside the external contract; the register/set/get/pop part is checked in test_dataset_and_metadata_together.py. |
| `tests/modeling/test_roi_heads.py::ROIHeadsTest::test_PointRend_mask_head_tracing` | export-torchscript | unverifiable | It needs detectron2.projects.point_rend (PointRendMaskHead, add_pointrend_config), an import outside the external contract; the patch_builtin_len tracing part is checked with the contract's mask, keypoint and box heads in test_patch_builtin_len_tracing.py. |

## 7. 候选、对比和修复

作者的每次调用（草稿作业写第一版，一个范围一次；主作业做修复）：

| 开始 | 第几分钟 | 作业 | 做什么 | 范围或叶子 | 分钟 | 轮数 | 美元 | 文件（加 / 改 / 删） | 退出码 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 00:49:09 | 5.1 | 草稿 | 第一版 | scope-1 | 26.0 | 63 | 14.46 | +26 / 改 0 / 删 0 | 0 |
| 01:15:24 | 31.3 | 草稿 | 第一版 | scope-2 | 20.0 | 55 | 11.37 | +13 / 改 2 / 删 0 | 0 |
| 01:35:36 | 51.5 | 草稿 | 第一版 | scope-3 | 26.7 | 61 | 15.15 | +20 / 改 2 / 删 0 | 0 |
| 02:02:32 | 78.4 | 草稿 | 第一版 | scope-4 | 41.7 | 83 | 21.43 | +15 / 改 4 / 删 0 | 0 |
| 02:44:31 | 120.4 | 草稿 | 第一版 | scope-5 | 16.4 | 53 | 8.81 | +9 / 改 1 / 删 0 | 0 |
| 03:20:30 | 156.4 | 主 | 行为修复 | data-catalog、detection-utils、data-transforms、packaging、layers、model-zoo | 35.9 | 80 | 18.81 | +49 / 改 8 / 删 0 | 0 |
| 04:12:36 | 208.5 | 主 | 行为修复 | layers、model-zoo | 20.5 | 62 | 11.56 | +9 / 改 11 / 删 0 | 0 |

行为对比：

| 开始 | 第几分钟 | 范围 | 候选 | 分钟 | 结果 | 失败的检查 | 没有运行的检查 | 体积 | 记录 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 03:01:46 | 137.7 | 完整 | candidate-1 | 6.8 | regressed | 27 | 0 | 16.18% | `verification-6` |
| 03:09:57 | 145.9 | 完整 | candidate-1 | 7.0 | regressed | 11 | 0 | 16.18% | `verification-8` |
| 03:56:52 | 192.8 | 针对性 | candidate-2 | 2.1 | regressed | 3 | 85 | 20.14% | `verification-12` |
| 03:59:55 | 195.8 | 完整 | candidate-2 | 8.6 | regressed | 3 | 0 | 20.14% | `verification-13` |
| 04:33:42 | 229.6 | 针对性 | candidate-3 | 1.2 | unverified | 0 | 93 | 22.42% | `verification-17` |
| 04:34:53 | 230.8 | 完整 | candidate-3 | 7.4 | checks_passed | 0 | 0 | 22.42% | `verification-18` |

`verification-6`（candidate-1，完整对比）里没过的检查：

| 检查 | 叶子 | 测试文件 | 结果变了的用例 |
| --- | --- | --- | --- |
| `config-yacs` | config-yacs、generalized-rcnn、layers、model-zoo | `tests/config/test_yacs_config.py::TestConfigVersioning::test_auto_upgrade`、`tests/config/test_yacs_config.py::TestConfigVersioning::test_guess_v1` | `testOmegaConf` |
| `layers-nms-rotated` | layers、rotated-box-ops、testing-helpers | `tests/layers/test_nms_rotated.py::TestNMSRotated::test_batched_nms_rotated_0_degree_cpu`、`tests/layers/test_nms_rotated.py::TestNMSRotated::test_batched_nms_rotated_0_degree_cuda` | `test_batched_nms_rotated_0_degree_cpu`、`test_nms_rotated_0_degree_cpu`、`test_nms_rotated_180_degrees_cpu`、`test_nms_rotated_90_degrees_cpu`、`test_scriptable_cpu` |
| `layers-roi-align-rotated` | layers、rotated-box-ops | `tests/layers/test_roi_align_rotated.py::ROIAlignRotatedTest::test_empty_box`、`tests/layers/test_roi_align_rotated.py::ROIAlignRotatedTest::test_forward_output_0_90_180_270` | `test_empty_box`、`test_forward_output_0_90_180_270`、`test_resize`、`test_roi_align_rotated_gradcheck_cpu` |
| `modeling-backbone` | backbone-resnet-fpn、config-yacs、export-torchscript、layers、model-zoo | `tests/modeling/test_backbone.py::TestBackBone::test_fpn_scriptability`、`tests/modeling/test_backbone.py::TestBackBone::test_resnet_scriptability` | `test_fpn_scriptability` |
| `modeling-e2e-mask-rcnn` | backbone-resnet-fpn、events、generalized-rcnn、model-zoo、proposal-generation、roi-heads、structures、testing-helpers | `tests/modeling/test_model_e2e.py::MaskRCNNE2ETest::test_autocast`、`tests/modeling/test_model_e2e.py::MaskRCNNE2ETest::test_empty_data` | `test_empty_data`、`test_half_empty_data`、`test_roiheads_inf_nan_data` |
| `modeling-roi-pooler` | roi-heads、rotated-box-ops、structures、testing-helpers | `tests/modeling/test_roi_pooler.py::TestROIPooler::test_no_images`、`tests/modeling/test_roi_pooler.py::TestROIPooler::test_roi_pooler_tracing` | `test_roialignv2_roialignrotated_match_cpu` |
| `modeling-rpn` | backbone-resnet-fpn、config-yacs、events、export-torchscript、layers、proposal-generation、rotated-box-ops、rotated-rcnn、structures | `tests/modeling/test_rpn.py::RPNTest::test_append_gt_to_proposal`、`tests/modeling/test_rpn.py::RPNTest::test_find_rpn_proposals_inf` | `test_rrpn` |
| `structures-rotated-boxes` | rotated-box-ops、structures、testing-helpers | `tests/structures/test_rotated_boxes.py::TestRotatedBoxesLayer::test_iou_0_dim_cpu`、`tests/structures/test_rotated_boxes.py::TestRotatedBoxesLayer::test_iou_0_dim_cuda` | `test_iou_0_dim_cpu`、`test_iou_extreme`、`test_iou_half_overlap_cpu`、`test_iou_issue_2154`、`test_iou_issue_2167`、`test_iou_precision`、`test_pairwise_iou_0_degree`、`test_pairwise_iou_45_degrees` 等 13 个 |
| `model-zoo-yaml` | backbone-resnet-fpn、config-lazy、generalized-rcnn、model-zoo | `tests/test_model_zoo.py::TestModelZoo::test_get_invalid_model`、`tests/test_model_zoo.py::TestModelZoo::test_get_returns_model` | `test_get_returns_model` |
| `contract-model-zoo-lookup` | config-yacs、model-zoo |  | – |
| `contract-model-parameter-names` | backbone-resnet-fpn、generalized-rcnn、model-zoo、proposal-generation、roi-heads |  | – |
| `contract-default-predictor` | checkpoint、data-catalog、data-transforms、generalized-rcnn、model-zoo、predictor |  | – |
| `recovered-test_detection_utils-1` | data-transforms、detection-utils | `tests/data/test_nanolize_recovered_test_detection_utils_1.py` | `test_flip_keypoints` |
| `recovered-test_detection_utils-2` | detection-utils | `tests/data/test_nanolize_recovered_test_detection_utils_2.py` | `test_read_sem_seg` |
| `recovered-test_roi_heads-2` | roi-heads | `tests/modeling/test_nanolize_recovered_test_roi_heads_2.py` | `test_rroi_heads` |
| `layers-deformable` | deformable-conv、runtime-utils | `tests/layers/test_deformable.py::DeformableTest::test_forward_output`、`tests/layers/test_deformable.py::DeformableTest::test_forward_output_on_cpu` | `test_forward_output_on_cpu`、`test_repr` |
| `data-detection-utils` | data-catalog、data-transforms、detection-utils、rotated-box-ops、runtime-utils、structures | `tests/data/test_detection_utils.py::TestTransformAnnotations::test_crop`、`tests/data/test_detection_utils.py::TestTransformAnnotations::test_flip_keypoints` | `test_flip_keypoints`、`test_read_sem_seg` |
| `contract-packaging-c7e2ee-13` | packaging | `tests/nanolize_contracts/packaging/test_setup_program.py` | `test_configs_are_linked_into_model_zoo_each_run`、`test_egg_info_sources_list_extension_and_configs` |
| `contract-packaging-c7e2ee-14` | packaging | `tests/nanolize_contracts/packaging/test_setup_sandbox.py` | `test_build_py_packages_projects_and_configs` |
| `scenario-packaging-c7e2ee-15` | packaging | `tests/nanolize_contracts/packaging/scenario_setup_program.py` | `scenario_described_model_zoo_package_data`、`scenario_described_project_packages_and_directories` |
| `scenario-data_catalog_4b9d42d1-c7e2ee-27` | data-catalog | `tests/nanolize_contracts/data_catalog_4b9d42d1/scenario_catalogs.py` | `scenario_dataset_str_end_after_two_registrations`、`scenario_metadata_str_end_after_two_names` |
| `contract-layers-c7e2ee-42` | layers | `tests/nanolize_contracts/layers/test_losses_nms.py` | `test_batched_nms_rotated_0_degree_equals_batched_nms`、`test_batched_nms_rotated_categories`、`test_batched_nms_rotated_negative_coordinates_half_and_edges`、`test_nms_rotated_0_degree_equals_horizontal_nms`、`test_nms_rotated_edges`、`test_nms_rotated_thresholds` |
| `contract-layers-c7e2ee-43` | layers | `tests/nanolize_contracts/layers/test_roi_align_mask_shape.py` | `test_shape_spec_with_layers` |
| `scenario-layers-c7e2ee-44` | layers | `tests/nanolize_contracts/layers/scenario_layers.py` | `scenario_batched_nms_rotated_two_categories`、`scenario_nms_rotated_angles`、`scenario_nms_rotated_empty` |
| `contract-model_zoo_b9ca42f9-c7e2ee-51` | model-zoo | `tests/nanolize_contracts/model_zoo_b9ca42f9/test_get_config.py` | `test_python_config_is_a_lazy_config`、`test_python_config_trained_sets_init_checkpoint`、`test_python_new_baseline_config_trained`、`test_python_schedule_config_keys`、`test_trained_config_without_released_checkpoint_raises[common/models/mask_rcnn_fpn.py]`、`test_trained_config_without_released_checkpoint_raises[new_baselines/mask_rcnn_R_50_FPN_50ep_LSJ.py]` |
| `contract-model_zoo_b9ca42f9-c7e2ee-52` | model-zoo | `tests/nanolize_contracts/model_zoo_b9ca42f9/test_get_model.py` | `test_other_architectures[common/models/keypoint_rcnn_fpn.py-GeneralizedRCNN-59133158]`、`test_other_architectures[common/models/panoptic_fpn.py-PanopticFPN-45973990]`、`test_other_architectures[common/models/retinanet.py-RetinaNet-37915572]`、`test_python_c4_config_builds_a_resnet_backbone`、`test_python_config_builds_the_model`、`test_trained_model_without_released_checkpoint_raises[common/models/mask_rcnn_fpn.py]`、`test_unknown_model_after_a_built_one` |
| `scenario-model_zoo_b9ca42f9-c7e2ee-53` | model-zoo | `tests/nanolize_contracts/model_zoo_b9ca42f9/scenario_zoo_configs.py` | `scenario_cfg_lazy_50ep_py_trained_has_no_checkpoint`、`scenario_cfg_lazy_keypoint_rcnn_py_trained`、`scenario_cfg_lazy_mask_rcnn_r50_fpn_1x_py`、`scenario_cfg_lazy_mask_rcnn_r50_fpn_1x_py_trained`、`scenario_cfg_lazy_model_only_py_keys`、`scenario_cfg_lazy_model_only_py_trained_has_no_checkpoint`、`scenario_cfg_lazy_new_baseline_200ep_py`、`scenario_cfg_lazy_new_baseline_400ep_py_trained` 等 17 个 |

`verification-8`（candidate-1，完整对比）里没过的检查：

| 检查 | 叶子 | 测试文件 | 结果变了的用例 |
| --- | --- | --- | --- |
| `recovered-test_detection_utils-1` | data-transforms、detection-utils | `tests/data/test_nanolize_recovered_test_detection_utils_1.py` | `test_flip_keypoints` |
| `recovered-test_detection_utils-2` | detection-utils | `tests/data/test_nanolize_recovered_test_detection_utils_2.py` | `test_read_sem_seg` |
| `data-detection-utils` | data-catalog、data-transforms、detection-utils、rotated-box-ops、runtime-utils、structures | `tests/data/test_detection_utils.py::TestTransformAnnotations::test_crop`、`tests/data/test_detection_utils.py::TestTransformAnnotations::test_flip_keypoints` | `test_flip_keypoints`、`test_read_sem_seg` |
| `contract-packaging-c7e2ee-13` | packaging | `tests/nanolize_contracts/packaging/test_setup_program.py` | `test_configs_are_linked_into_model_zoo_each_run`、`test_egg_info_sources_list_extension_and_configs` |
| `contract-packaging-c7e2ee-14` | packaging | `tests/nanolize_contracts/packaging/test_setup_sandbox.py` | `test_build_py_packages_projects_and_configs` |
| `scenario-packaging-c7e2ee-15` | packaging | `tests/nanolize_contracts/packaging/scenario_setup_program.py` | `scenario_described_model_zoo_package_data`、`scenario_described_project_packages_and_directories` |
| `scenario-data_catalog_4b9d42d1-c7e2ee-27` | data-catalog | `tests/nanolize_contracts/data_catalog_4b9d42d1/scenario_catalogs.py` | `scenario_dataset_str_end_after_two_registrations`、`scenario_metadata_str_end_after_two_names` |
| `contract-layers-c7e2ee-43` | layers | `tests/nanolize_contracts/layers/test_roi_align_mask_shape.py` | `test_shape_spec_with_layers` |
| `contract-model_zoo_b9ca42f9-c7e2ee-51` | model-zoo | `tests/nanolize_contracts/model_zoo_b9ca42f9/test_get_config.py` | `test_python_config_is_a_lazy_config`、`test_python_config_trained_sets_init_checkpoint`、`test_python_new_baseline_config_trained`、`test_python_schedule_config_keys`、`test_trained_config_without_released_checkpoint_raises[common/models/mask_rcnn_fpn.py]`、`test_trained_config_without_released_checkpoint_raises[new_baselines/mask_rcnn_R_50_FPN_50ep_LSJ.py]` |
| `contract-model_zoo_b9ca42f9-c7e2ee-52` | model-zoo | `tests/nanolize_contracts/model_zoo_b9ca42f9/test_get_model.py` | `test_other_architectures[common/models/keypoint_rcnn_fpn.py-GeneralizedRCNN-59133158]`、`test_other_architectures[common/models/panoptic_fpn.py-PanopticFPN-45973990]`、`test_other_architectures[common/models/retinanet.py-RetinaNet-37915572]`、`test_python_c4_config_builds_a_resnet_backbone`、`test_python_config_builds_the_model`、`test_trained_model_without_released_checkpoint_raises[common/models/mask_rcnn_fpn.py]`、`test_unknown_model_after_a_built_one` |
| `scenario-model_zoo_b9ca42f9-c7e2ee-53` | model-zoo | `tests/nanolize_contracts/model_zoo_b9ca42f9/scenario_zoo_configs.py` | `scenario_cfg_lazy_50ep_py_trained_has_no_checkpoint`、`scenario_cfg_lazy_keypoint_rcnn_py_trained`、`scenario_cfg_lazy_mask_rcnn_r50_fpn_1x_py`、`scenario_cfg_lazy_mask_rcnn_r50_fpn_1x_py_trained`、`scenario_cfg_lazy_model_only_py_keys`、`scenario_cfg_lazy_model_only_py_trained_has_no_checkpoint`、`scenario_cfg_lazy_new_baseline_200ep_py`、`scenario_cfg_lazy_new_baseline_400ep_py_trained` 等 17 个 |

`verification-12`（candidate-2，针对性对比）里没过的检查：

| 检查 | 叶子 | 测试文件 | 结果变了的用例 |
| --- | --- | --- | --- |
| `contract-layers-c7e2ee-43` | layers | `tests/nanolize_contracts/layers/test_roi_align_mask_shape.py` | `test_shape_spec_with_layers` |
| `contract-model_zoo_b9ca42f9-c7e2ee-52` | model-zoo | `tests/nanolize_contracts/model_zoo_b9ca42f9/test_get_model.py` | `test_other_architectures[common/models/panoptic_fpn.py-PanopticFPN-45973990]`、`test_other_architectures[common/models/retinanet.py-RetinaNet-37915572]` |
| `scenario-model_zoo_b9ca42f9-c7e2ee-53` | model-zoo | `tests/nanolize_contracts/model_zoo_b9ca42f9/scenario_zoo_configs.py` | `scenario_cfg_readme_is_neither_yaml_nor_py`、`scenario_file_of_readme`、`scenario_model_lazy_fcos_py_on_cpu`、`scenario_model_lazy_retinanet_py_built_twice` |

`verification-13`（candidate-2，完整对比）里没过的检查：

| 检查 | 叶子 | 测试文件 | 结果变了的用例 |
| --- | --- | --- | --- |
| `contract-layers-c7e2ee-43` | layers | `tests/nanolize_contracts/layers/test_roi_align_mask_shape.py` | `test_shape_spec_with_layers` |
| `contract-model_zoo_b9ca42f9-c7e2ee-52` | model-zoo | `tests/nanolize_contracts/model_zoo_b9ca42f9/test_get_model.py` | `test_other_architectures[common/models/panoptic_fpn.py-PanopticFPN-45973990]`、`test_other_architectures[common/models/retinanet.py-RetinaNet-37915572]` |
| `scenario-model_zoo_b9ca42f9-c7e2ee-53` | model-zoo | `tests/nanolize_contracts/model_zoo_b9ca42f9/scenario_zoo_configs.py` | `scenario_cfg_readme_is_neither_yaml_nor_py`、`scenario_file_of_readme`、`scenario_model_lazy_fcos_py_on_cpu`、`scenario_model_lazy_retinanet_py_built_twice` |

安装检查：

| 开始 | 第几分钟 | 候选 | 秒 | 结果 | 通过的步数 |
| --- | --- | --- | --- | --- | --- |
| 03:17:00 | 152.9 | candidate-1 | 88 | passed | 3 / 3 |
| 04:08:33 | 204.4 | candidate-2 | 90 | passed | 3 / 3 |
| 04:42:17 | 238.2 | candidate-3 | 91 | passed | 3 / 3 |

controller 的每一轮（理由和它交给作者的指示是原文）：

**第 1 轮** · 03:09:50（第 145.7 分钟）· applied · 用时 75 秒 · 436,567 token（其中缓存 348,454）

- 它面对的建议：`{"action": "verify", "candidate": "candidate-1", "missing": ["installation"], "reason": "evidence_missing", "screen": null, "stop_reason": null}`
- 理由：The candidate's worktree was prepared at 00:45, before the draft was imported at 03:00, so the owner's recipes ran before any candidate file existed. Most of the 27 failures fit an unprepared tree rather than wrong code: the rotated operators are missing from the library (AttributeError in nms_rotated, roi_align_rotated and pairwise_iou_rotated), develop.py raises its placeholder ImportError, and model_zoo raises RuntimeError at one line across ten checks. That is a hypothesis, not confirmed. Preparing the candidate again, reusing the baseline and comparing in full tests it without spending an author attempt; check_installation adds the missing installation evidence. I will write the repair call from what still fails.
- 它点的调用：

  1. `prepare_environment` {"target": "candidate"}

  2. `capture_baseline` 

  3. `compare_behavior` 

  4. `check_installation` 

**第 2 轮** · 03:20:30（第 156.4 分钟）· applied · 用时 120 秒 · 443,033 token（其中缓存 352,899）

- 它面对的建议：`{"action": "behavior_repair", "behavior_accepted": false, "candidate": "candidate-1", "reason": "retrying_failed_checks", "restore": null, "stop_reason": null}`
- 理由：Preparing the candidate after the import cleared 16 of the 27 failed checks without an author call, and the installation checks pass 3/3. The 11 that remain have four separate causes by their evidence (catalog.py:74 AttributeError, setup.py assertions, a missing layers member, model_zoo RuntimeError at line 114 for names only the leaf tests use), so one repair call names all 11 issues, since their feedback is bound to this candidate. The save is followed by preparing the candidate again (the repair may touch setup.py and what the recipes build or link), the reused baseline, a screen of the 11 checks, the full comparison, installation, then selection and a best_reachable delivery, each only when the step before succeeded.
- 它点的调用：

  1. `run_agent` {"capabilities": ["data-catalog", "detection-utils", "data-transforms", "packaging", "layers", "model-zoo"], "issue_ids": ["verification-5e13e6a6a500e17b602133a58129ce1647c564ca0c39acfb9172b0a5f9b3fd33", "verification-c4a0485032bd33603232a32322bb78b167588616398f969e265e47b6d2126b57", "verification-21d3bcb1d3e748f5691ace8ae5aa8acac73e85bece08bc0cc76ddb2395c4624d", "verification-dd08d9d2bf8ac0cc1d7e926003e515a8570a14d516bbe88b29beea6b5695634b", "verification-6ce29be3679e1855218f6a22514d042d46f3030 …

     <details><summary>交给作者的指示</summary>

     ```
     Repair candidate-1. Its full comparison (verification-8) passes 85 of 96 checks; 11 regressed, in four separate groups. Your feedback holds each issue's errors and the compared values of the failed assertion cases: start from those, read the lent original for each group before changing code, and treat my notes as pointers, not diagnoses.
     
     A. data-catalog / detection-utils / data-transforms. check-46 and check-62 (upstream tests) each have 1 case ending in an AttributeError raised by your own code at detectron2/data/catalog.py:74. check-47 (detection-utils, upstream test) exits 1 with no error digest recorded. check-86 (data-catalog scenario, output comparison) exits 0 but 2 cases that pass on the original fail. Whether 47 and 86 share the cause of 46/62 is not established: examine each. Compare with the original: Metadata attribute access, set/get/as_dict and the renamed-key guidance, DatasetCatalog/MetadataCatalog register/get/list/remove with their exception types and messages, and what the detection utilities read from metadata.
     
     B. packaging. check-72 (2 failed assertion cases), check-73 (1), check-74 (output comparison: exit 0, 2 baseline cases fail). They observe setup.py. The contract: version read from detectron2/__init__.py with D2_VERSION_SUFFIX and BUILD_NIGHTLY handling; the detectron2 packages plus detectron2.projects.* mapped to their project directories; extension detectron2._C from detectron2/layers/csrc (CUDA sources and flags when available or FORCE_CUDA=1); on every run setup.py removes whatever is at detectron2/model_zoo/configs (link or directory) and links or copies configs/ there again; python_requires, install_requires and the extras all and dev exactly as the knowledge lists them. The installation checks pass 3/3 on candidate-1 and must keep passing.
     
     C. layers. check-101 (leaf test): 1 case raises AttributeError in the test's own code, not in yours, so a name, member or attribute it reaches through the layers interface is absent on what you return or export. Walk every layers interface entry of the contract against the original's layers exports and classes (members, attributes, return types) and supply what is missing with the original's semantics.
     
     D. model-zoo. check-109: 4 cases raise RuntimeError at detectron2/model_zoo/__init__.py:114, plus 2 failed assertion cases. check-110: 6 cases with the same RuntimeError, plus 1 assertion case. check-111 (output comparison): exit 0, 5 baseline cases fail. Other checks that go through model_zoo pass (check-3, 12, 16, 29, 39, 42, 43), so line 114 refuses names or paths that only these three use. Confirmed: the worktree is prepared (the detectron2/model_zoo/configs link and the built _C exist); the files under configs/ are carried and protected, do not edit them. Compare with the original: the complete table of config names and checkpoint URL suffixes, how yaml and Python (.py) config names resolve, get_config_file, get_config(config_path, trained), get_checkpoint_url, get(config_path, trained, device), and exactly which inputs raise RuntimeError with which message.
     
     Rules. Keep all 85 passing checks passing: change only what these groups need, and keep public names, signatures, validation, messages and output intact elsewhere. Fix behavior in the implementation; never special-case a test, stub a function or drop a capability. Write your own code; do not copy bodies from the lent files. Do not create or alter tests or protected files. Growth in size is fine. The 11 checks above are compared first after your call, then all 96 and the installation checks. In your final note, state per group what the cause was and which files you changed.
     ```

     </details>

  2. `save_candidate` {"reason": "Repair of the 11 checks that failed in verification-8 (data-catalog, packaging, layers, model-zoo)"}（条件：{"call": 1, "outcome": ["completed"]}）

  3. `prepare_environment` {"target": "candidate"}（条件：{"call": 2, "outcome": ["done"]}）

  4. `capture_baseline` （条件：{"call": 3, "outcome": ["passed"]}）

  5. `compare_behavior` {"check_names": ["check-46", "check-47", "check-62", "check-72", "check-73", "check-74", "check-86", "check-101", "check-109", "check-110", "check-111"]}（条件：{"call": 4, "outcome": ["ready"]}）

  6. `compare_behavior` （条件：{"call": 5, "outcome": ["unverified"]}）

  7. `check_installation` （条件：{"call": 6, "outcome": ["checks_passed"]}）

  8. `select_candidate` {"candidate_id": "$2.candidate_id", "reason": "Full comparison and installation checks passed on the repaired candidate"}（条件：{"call": 7, "outcome": ["passed"]}）

  9. `deliver` {"reason": "Repaired candidate passed the full comparison with the frozen baseline and the installation checks; the only remaining gap is the sealed cap original_checks_not_verified.", "require": "best_reachable"}（条件：{"call": 8, "outcome": ["selected", "done"]}）

**第 3 轮** · 03:59:55（第 195.8 分钟）· applied · 用时 58 秒 · 289,944 token（其中缓存 213,109）

- 它面对的建议：`{"action": "verify", "candidate": "candidate-2", "missing": ["installation"], "reason": "evidence_missing", "screen": ["check-1", "check-2", "check-3", "check-4", "check-5", "check-6", "check-7", "check-8", "check-9", "check-10", "check-11", "check-12", "check-13", "check-14", "check-15", "check-16", "check-20", "check-21", "check-22", "check-23", "check-24", "check-25", "check-26", "check-28", "c …`
- 理由：Repair 1 cleared 8 of the 11 failed checks; check-101, check-110 and check-111 still fail, and check-110 now fails differently (ImportError at utils/registry.py:32 in locate instead of the model_zoo RuntimeError). That repair added 49 files and modified 8, and the 85 other checks have not been compared on candidate-2, nor has installation been checked since setup.py was repaired. A full comparison (about 7 minutes) and the installation check (about 90 seconds) cost no author attempt. They show whether the repair regressed anything before I write the second repair call, whose feedback is bound to this candidate, so it can name every failure at once instead of only the three the screen saw.
- 它点的调用：

  1. `compare_behavior` 

  2. `check_installation` 

**第 4 轮** · 04:12:36（第 208.5 分钟）· applied · 用时 151 秒 · 460,473 token（其中缓存 327,150）

- 它面对的建议：`{"action": "behavior_repair", "behavior_accepted": false, "candidate": "candidate-2", "reason": "retrying_failed_checks", "restore": null, "stop_reason": null}`
- 理由：The full comparison of candidate-2 shows exactly three failed checks (check-101 layers, check-110 and check-111 model-zoo), no regression among the other 91, and installation passes 3/3. All three failed on both candidates, so one repair call names the three issues with their confirmed evidence (AttributeError in the check's own code; ImportError at utils/registry.py:32 in locate, which replaced the earlier model_zoo RuntimeError; four baseline cases not passing) and leaves the diagnosis to the author, with my hypotheses marked as such. The save is followed by preparing the candidate again, the reused baseline, a screen of the three checks, the full comparison, installation, selection and a best_reachable delivery, each only when the step before succeeded.
- 它点的调用：

  1. `run_agent` {"capabilities": ["layers", "model-zoo"], "issue_ids": ["verification-c38784ef68e9b9f370bd4dd879487db3f4fbe044401b178ee972d18e5382e67c", "verification-75b8adefec59fe79271b4985012fa6084f75e6adf7a2b379c473ee0b11c92af7", "verification-9cfac6992485c399afbc9f8011c43024927f6c68c530ad113a45bbc9611743d8"], "role": "repair"}

     <details><summary>交给作者的指示</summary>

     ```
     Second repair of candidate-2. A full comparison passes 91 of 94 checks and installation passes 3 of 3. Three leaf tests still fail, each on both candidates so far; the first repair did not clear them. Read your feedback for each issue and the original source of the capability before changing anything; the diagnosis is yours, I cannot see the code.
     
     1) check-101, capability layers (leaf test, compared by exit status). Confirmed evidence: exit code 1, one case, an AttributeError raised in the check's own code, not inside the candidate. So the test reaches for an attribute that the original's layers capability provides and the candidate does not: a public name of the layers package or of one of its modules, or a member of a class or object it exposes. My hypothesis only: a public layers name or member was left out or is bound differently. Compare everything the original's layers package and its modules export and bind (functions, classes, their attributes, methods, properties, module-level constants and aliases) with the candidate, and supply what is missing with the original's behavior, not a stub.
     
     2) check-110, capability model-zoo (leaf test, compared by exit status). Confirmed evidence: exit code 1, two cases, an ImportError raised at detectron2/utils/registry.py:32 in locate. Before the first repair this check failed with a RuntimeError at detectron2/model_zoo/__init__.py:114, so that repair moved the failure further along the same path. My hypothesis only: a model-zoo configuration that the test loads or instantiates names a dotted target (a module, class or function) that the candidate cannot import, or locate resolves names differently from the original. Find which names are asked for along the model-zoo paths the original supports (yaml and lazy python configs, get_config, get_config_file, get, get_checkpoint_url) and make every target those configs reference importable and behave as in the original. If the target belongs to a selected capability, implement it there; do not catch or hide the ImportError and do not change what locate reports for names that truly do not exist.
     
     3) check-111, capability model-zoo (leaf test, compared by output). Confirmed evidence: the check exits 0, but four cases that pass on the original do not pass on the candidate; your feedback carries the compared values of those four assertion cases. It likely shares its cause with check-110, which is not confirmed: treat it on its own evidence.
     
     Must keep passing: every other check, in particular the model-zoo checks repaired last time (check-3, check-12, check-16, check-29, check-39, check-42, check-43, check-69, check-70, check-71, check-109), the layers checks (check-1, check-6 to check-11, check-59, check-97 to check-100, check-102, check-112), the rotated operators, and the packaging checks check-72 to check-74 with the installation. Change setup.py or build inputs only if one of these three failures requires it.
     
     Retest first: check-101, check-110, check-111, then the model-zoo and layers checks named above.
     
     Rules: preserve selected functionality, input validation, error types and messages, logs and observable output. Do not special-case tests, do not weaken behavior, do not add placeholder shells. Write your own implementation; do not copy the original's code.
     ```

     </details>

  2. `save_candidate` {"reason": "Second behavior repair: check-101 (layers), check-110 and check-111 (model-zoo)"}（条件：{"call": 1, "outcome": ["completed"]}）

  3. `prepare_environment` {"target": "candidate"}（条件：{"call": 2, "outcome": ["done"]}）

  4. `capture_baseline` （条件：{"call": 3, "outcome": ["passed"]}）

  5. `compare_behavior` {"check_names": ["check-101", "check-110", "check-111"]}（条件：{"call": 4, "outcome": ["ready"]}）

  6. `compare_behavior` （条件：{"call": 5, "outcome": ["unverified"]}）

  7. `check_installation` （条件：{"call": 6, "outcome": ["checks_passed"]}）

  8. `select_candidate` {"candidate_id": "$2.candidate_id", "reason": "Full comparison passed and installation checks passed on this candidate"}（条件：{"call": 7, "outcome": ["passed"]}）

  9. `deliver` {"reason": "Full comparison and installation checks passed on the selected candidate; the only remaining gap is the cap original_checks_not_verified, which no tool can close", "require": "best_reachable"}（条件：{"call": 8, "outcome": ["selected"]}）

相邻两个候选之间改了什么（比较主作业保存的两个候选）：

candidate-1 → candidate-2：

```
 configs/COCO-Detection/fcos_R_50_FPN_1x.py         |  11 +
 configs/COCO-Detection/retinanet_R_50_FPN_1x.py    |  11 +
 .../mask_rcnn_R_50_C4_1x.py                        |   8 +
 .../mask_rcnn_R_50_FPN_1x.py                       |   8 +
 .../mask_rcnn_regnetx_4gf_dds_fpn_1x.py            |  32 +
 .../mask_rcnn_regnety_4gf_dds_fpn_1x.py            |  33 ++
 .../COCO-Keypoints/keypoint_rcnn_R_50_FPN_1x.py    |   8 +
 .../panoptic_fpn_R_50_1x.py                        |   8 +
 configs/Misc/mmdet_mask_rcnn_R_50_FPN_1x.py        | 146 +++++
 configs/Misc/torchvision_imagenet_R_50.py          | 140 +++++
 configs/common/coco_schedule.py                    |  31 +
 configs/common/data/coco.py                        |  44 ++
 configs/common/data/coco_keypoint.py               |  13 +
 configs/common/data/coco_panoptic_separated.py     |  12 +
 configs/common/data/constants.py                   |   8 +
 configs/common/models/cascade_rcnn.py              |  41 ++
 configs/common/models/fcos.py                      |  20 +
 configs/common/models/keypoint_rcnn_fpn.py         |  32 +
 configs/common/models/mask_rcnn_c4.py              |  90 +++
 configs/common/models/mask_rcnn_fpn.py             |  95 +++
 configs/common/models/mask_rcnn_vitdet.py          |  51 ++
 configs/common/models/panoptic_fpn.py              |  18 +
 configs/common/models/retinanet.py                 |  51 ++
 configs/common/optim.py                            |  22 +
 configs/common/train.py                            |  16 +
 .../new_baselines/mask_rcnn_R_101_FPN_100ep_LSJ.py |   9 +
 .../new_baselines/mask_rcnn_R_101_FPN_200ep_LSJ.py |  14 +
 .../new_baselines/mask_rcnn_R_101_FPN_400ep_LSJ.py |  14 +
 .../new_baselines/mask_rcnn_R_50_FPN_100ep_LSJ.py  |  64 ++
 .../new_baselines/mask_rcnn_R_50_FPN_200ep_LSJ.py  |  14 +
 .../new_baselines/mask_rcnn_R_50_FPN_400ep_LSJ.py  |  14 +
 .../new_baselines/mask_rcnn_R_50_FPN_50ep_LSJ.py   |  14 +
 .../mask_rcnn_regnetx_4gf_dds_FPN_100ep_LSJ.py     |  27 +
 .../mask_rcnn_regnetx_4gf_dds_FPN_200ep_LSJ.py     |  14 +
 .../mask_rcnn_regnetx_4gf_dds_FPN_400ep_LSJ.py     |  14 +
 .../mask_rcnn_regnety_4gf_dds_FPN_100ep_LSJ.py     |  28 +
 .../mask_rcnn_regnety_4gf_dds_FPN_200ep_LSJ.py     |  14 +
 .../mask_rcnn_regnety_4gf_dds_FPN_400ep_LSJ.py     |  14 +
 detectron2/config/lazy.py                          |   4 +-
 detectron2/data/__init__.py                        |   3 +
 detectron2/data/datasets/__init__.py               |  15 +
 detectron2/data/datasets/builtin.py                | 238 ++++++++
 detectron2/data/datasets/builtin_meta.py           | 292 ++++++++++
 detectron2/data/datasets/formats.py                | 641 +++++++++++++++++++++
 detectron2/data/detection_utils.py                 |   9 +-
 detectron2/layers/__init__.py                      |   5 +-
 detectron2/layers/aspp.py                          |  93 +++
 detectron2/layers/blocks.py                        |  87 ---
 detectron2/layers/shape_spec.py                    |  10 +
 detectron2/layers/wrappers.py                      |   9 -
 detectron2/projects/__init__.py                    |  29 +
 detectron2/solver/__init__.py                      | 117 ++++
 projects/DeepLab/deeplab/__init__.py               |   1 +
 .../Panoptic-DeepLab/panoptic_deeplab/__init__.py  |   1 +
 projects/PointRend/point_rend/__init__.py          |   1 +
 setup.py                                           |  13 +-
 56 files changed, 2659 insertions(+), 112 deletions(-)
```

candidate-2 → candidate-3：

```
 .../mask_rcnn_regnetx_4gf_dds_fpn_1x.py            |   9 +-
 .../mask_rcnn_regnety_4gf_dds_fpn_1x.py            |   9 +-
 configs/Detectron1-Comparisons/README.md           |   3 +
 configs/common/README.md                           |   3 +
 configs/common/models/fcos.py                      |   6 +-
 configs/common/models/panoptic_fpn.py              |   6 +-
 configs/common/models/retinanet.py                 |   6 +-
 .../mask_rcnn_regnetx_4gf_dds_FPN_100ep_LSJ.py     |   9 +-
 .../mask_rcnn_regnety_4gf_dds_FPN_100ep_LSJ.py     |   9 +-
 configs/quick_schedules/README.md                  |   5 +
 detectron2/modeling/__init__.py                    |  23 +-
 detectron2/modeling/backbone/__init__.py           |   1 +
 detectron2/modeling/backbone/regnet.py             | 384 +++++++++++++++++++++
 detectron2/modeling/meta_arch/__init__.py          |   7 +
 detectron2/modeling/meta_arch/dense_detector.py    | 212 ++++++++++++
 detectron2/modeling/meta_arch/fcos.py              | 252 ++++++++++++++
 detectron2/modeling/meta_arch/panoptic_fpn.py      | 210 +++++++++++
 detectron2/modeling/meta_arch/retinanet.py         | 303 ++++++++++++++++
 detectron2/modeling/meta_arch/semantic_seg.py      | 213 ++++++++++++
 19 files changed, 1646 insertions(+), 24 deletions(-)
```

## 8. 节点申请

主作业事件里记下的节点申请（草稿作业的检查在它自己所在的机器上跑，不要节点）。对比阶段另外两个分配的申请没有留下事件，只能在下面第二张表里看到它们接下的请求：

| 提交 | 第几分钟 | 是什么 | 申请时长（分钟） | 核 | 内存（MB） | 等待（秒） |
| --- | --- | --- | --- | --- | --- | --- |
| 00:44:55 | 0.8 | The probe (an empty batch that settles where the job's checks run) | 7 | 1 | 32768 | 27 |
| 00:46:01 | 1.9 | A batch of 46 checks | 240 | 4 | 32768 | 38 |
| 02:21:33 | 97.4 | A batch of 96 checks | 240 | 4 | 32768 | 31 |

每个分配接下和拒收的请求（运行期间每 10 秒抓一次，时间是第一次看到的时间；`_run_checks` 是一批检查，`knockouts` 是敲除，`run_each` 是交付后回放原测试，带 `refused` 的是节点拒收）：

| 分配（作业/分配，各前 8 位） | 第一条请求 | 最后一条请求 | 接下和拒收的请求，按先后 |
| --- | --- | --- | --- |
| c7e2eea8/8b1f5c24 | 00:46:43（第 2.6 分钟） | 02:21:14（第 97.1 分钟） | `_run_checks`、`knockouts`、`_run_checks`、`knockouts`、`_run_checks`、`knockouts`、`_run_checks`、`knockouts`、`_run_checks refused` |
| c7e2eea8/d029c4ae | 02:21:54（第 97.8 分钟） | 03:10:15（第 146.1 分钟） | `_run_checks`、`knockouts`、`_run_checks`、`_run_checks` |
| c7e2eea8/a728aa47 | 03:57:25（第 193.3 分钟） | 04:00:15（第 196.1 分钟） | `_run_checks`、`_run_checks` |
| c7e2eea8/1b9fd3e3 | 04:34:05（第 230.0 分钟） | 04:46:26（第 242.3 分钟） | `_run_checks`、`_run_checks`、`run_each`、`run_each`、`run_each`、`run_each`、`run_each`、`run_each`、`run_each`、`run_each`、`run_each`、`run_each` |

## 9. 收尾

- 结束状态 `completed_with_gaps`：Delivered with gaps (original checks not verified: 2 test functions of 8 original checks left acceptance at conversion, 0 of them use only the public interface); no full preservation claim is made.

- 选定并交付的候选：`candidate-3`；行为验收 `passed`，体积验收 `met`；主作业的作者尝试 3 次（导入的第一版算 1 次，其中修复 2 次）。

- 体积：原版 641,353 token（71,975 行），交付 143,801 token（21,055 行，157 个源文件），保留 22.42%。

- 交付后回放原测试：保留的 9 个测试里 9 个在原版上通过、9 个在交付版本上通过，退步 0 个；和内部名字绑在一起的 10 个里原版通过 10 个、交付版本通过 6 个。

- 草稿作业：结束状态 `draft_ready`，137.1 分钟写完 5 个范围。

- 作业自己写的限制（原文）：Passing checks is not proof of semantic equivalence.

- 作业自己写的限制（原文）：The report lists gaps; it does not choose the next action.
