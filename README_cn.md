# HKU New Moodle Helper

Course manager for HKU moodle with new design

有的时候新学期的课不在主页，但是侧栏也没有课显示。而 Moodle 的 my/courses.php 界面一直没有适配，所以写了这个脚本填补这个空当

## 下载方式

1. 浏览器安装 Tampermonkey 插件
2. 从 greasyfork.org 安装[此脚本](https://greasyfork.org/en/scripts/505210-hku-new-moodle-helper)
3. 在 `my/courses.php` 或者主页里添加课程
4. 回到 `moodle.hku.hk` 查看添加的课程

## Known Issues

- [x] `Card` 视图里没有按钮
    > **2024-08-26.04**. 已添加
- [x] `my/courses.php` 界面里，切换到 `Cards` 视图再切换回 `Summary` 或 `List` 视图会出现按钮消失的情况
    > **2024-08-26.04**. 已修复

## To-do list

- [x] 主页的课程信息显示更多内容
    > **2024-08-26**. 添加年份、summary（如有）等信息
- [x] 改进 `/my/courses.php` 的按钮
    > **2024-08-26**. 改进了大小，但是 css 还是有一点问题
- [ ] 添加**主页**和**`search.php`**的 add/remove 按钮
    > **2024-08-26**. 为主页添加按钮
- [x] 添加 `my/courses.php` 里 `Cards` 视图的按钮
    > **2024-08-26.04**. 已添加
- [ ] 重构屎山
    > 咕

## 致谢

借鉴了 [AENeuro/HKU-Moodle-Helper](https://github.com/AENeuro/HKU-Moodle-Helper) 和 [对应油猴脚本](https://greasyfork.org/en/scripts/431982-hku-moodle-helper/code) 的源码，在此表示感谢