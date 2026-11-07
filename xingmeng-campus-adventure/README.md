# 星梦校园 · 成长探险 / Xingmeng Campus Adventure

> 开源 3D 校园探索与儿童学习游戏。当前正式学习内容适配 **小学二年级上学期**，不是自动评价学生能力的正式教学或考试系统。

**版本：v0.6.0（2026-11-07）** | 游戏语言：简体中文 | 运行方式：浏览器、静态网页、离线单文件

![二年级22班实机预览](docs/class22-preview.png)

## 立即游玩

本项目发布在个人站点的 `xingmeng-campus-adventure/` 子目录。若该站点从 `main` 分支根目录发布，在线地址为 <https://stephenpan.github.io/xingmeng-campus-adventure/>。

双击根目录的 `index.html`，用 Chrome 或 Edge 打开。电脑使用 WASD / 方向键移动、鼠标拖动旋转、滚轮缩放、E 键互动；手机使用屏幕方向键。

如果浏览器限制本地 `file://` 存储，可运行 `python3 -m http.server 8000` 后访问 `http://localhost:8000`。正式发布推荐 GitHub Pages。

## 玩法

- 一座可以实时旋转和行走的程序化 3D 校园，**22 个教室**及老师、虚构同学角色；深入探索机场、游艇、轻轨、汽车、图书馆和科学馆。
- 第一次进入及之后每隔 60 分钟进行 **12 道语文/数学题**（各 6 道）；老师为每班提供 **8 道挑战题**（语文 3、数学 3、科学兴趣 2）。答错可以看提示并重试，不会扣分或损失存档。
- 学习题目限制在当前学段内，初始从基础开始，根据最近答题正确率分别调整语文、数学和科学的难度，最多在**基础 → 标准 → 轻度拓展**间调整，不按游戏时长直接跳升年级。
- 二年级22班有独立**元素探索图鉴**，目前有 8 张元素卡片；不需要化学操作，且不是语数强制通关项目。
- 4/9/15/22班有温和版角石怪和救援关；22班后有黑影、雾影、机械守卫、Boss 谜题，不使用血腥画面或伤害展示。可开启温和模式放慢石怪速度。
- 游戏进度、错题、各学科答题数据保存在本机浏览器；通过「学习设置」和「成长档案」可导出 JSON 存档，用于新版本或新设备迁移。**没有云端学习记录同步**。

## 项目结构

| 位置 | 用途 |
| --- | --- |
| `index.html` | 已构建的可独立运行游戏，包括网页、3D 代码和学习题库 |
| `src/game-template.html` | 旧版场景、人物、任务、音效等基础 3D 游戏模板 |
| `src/learning-engine.js` | 当前二上固定题库、程序化数学题和自适应算法源代码 |
| `scripts/upgrade.py` | 用模板和学习引擎构建当前 `index.html`，保留兼容性补丁 |
| `tests/learning.test.js` | 题库结构、关卡比例和难度进退逻辑测试 |
| `docs/` | 学习内容依据、版本路线、隐私及家长说明 |
| `.github/workflows/pages.yml` | 独立仓库的 GitHub Pages 工作流模板，在本站子目录内不会运行 |

### 开发与验证

需要 Python 3 和 Node.js（建议 Node 22+），**游戏本身不需要 Node 或 Python**。

```bash
python3 scripts/upgrade.py
node tests/learning.test.js
```

修改题目时，应从 `src/learning-engine.js` 追加题目、解释和难度标记，然后运行构建及测试。场景代码仍在单文件模板内，后续计划拆为可维护的模块。

## 持续成长，不等于无限加难

当前只实现二年级上学期题库和该学段内的温和自适应。未来会将二年级下、三至六年级、初中、高中和成人版本拆成独立可选题包；每次大跨度的年龄或学段切换应由玩家/家长主动选择，**不会根据在线时长自动提升到更高学段**。详见 [`docs/ROADMAP.md`](docs/ROADMAP.md)。

## 作为独立仓库发布到 GitHub

仓库建议命名：`xingmeng-campus-adventure`。先创建 Public 仓库，上传所有文件（包含 `.github/` 隐藏目录）并推送到 `main`，再在 **Settings → Pages → Build and deployment → Source** 中选择 **GitHub Actions**。提交新的题库/代码后，工作流将重新测试、构建和部署网页。具体步骤参考 [GitHub 官方 GitHub Pages 文档](https://docs.github.com/en/get-started/start-your-journey/deploying-your-website-automatically)。

**注意：** 仓库发布的是公共代码和虚构角色内容，不包含儿童答题记录。不要将导出的 `*存档*.json`、真实学生名单、姓名、照片、学校信息或其他身份信息提交进公共仓库。

## 许可与免责声明

源码（包括原创题库文字）采用 [MIT License](LICENSE)。游戏中的原创概念视觉素材参见 [CONTENT_LICENSE.md](CONTENT_LICENSE.md)。不隶属于任何真实学校或商业游戏，角色均属虚构，游戏中的立体画面是轻量级程序化 3D，不是电影级写实渲染。

欢迎提 Issue 改进题目、交互和玩法；请避免公布儿童个人学习数据。
