# HKU New Moodle Helper

[中文 Readme](./README_cn.md)

Course manager for HKU moodle with new design

Other extensions/scripts only support adding and removing courses at `moodle.hku.hk`. However, not all courses enrolled in this semester will be display at main page and only `my/courses.php` can check them out. This script handles this problem by injecting interactive buttons at both sites.

## Download

1. Install `Tampermonkey` extension in your browser
2. Install [this script](https://greasyfork.org/en/scripts/505210-hku-new-moodle-helper)
3. Add courses by clicking the button at `my/courses.php` or main page
4. Check out your courses at `moodle.hku.hk`

## Known Issues

- [ ] No buttons are displayed in `Cards` view
- [ ] Buttons disappear when switching from `Cards` view to `List` or `Summary` view at `my/courses.php`
    > Currently, you can solve this by switching to `List` or `Summary` view and refresh the website.

## To-do list

- [x] Display more information about the course
    > **2024-08-26**. Support academic year and course summary (if any).
- [x] Improve buttons at `my/courses.php`
    > This is partially handle in the **2024-08-26** version. But there's some problem with the css.
- [x] Buttons at main page and `search.php`
    > **2024-08-26**. Added buttons for main page.
- [ ] Buttons for `Cards` view at `my/courses.php`

## References and Thanks

Thanks to [AENeuro/HKU-Moodle-Helper](https://github.com/AENeuro/HKU-Moodle-Helper) and [Corresponding script](https://greasyfork.org/en/scripts/431982-hku-moodle-helper/code).