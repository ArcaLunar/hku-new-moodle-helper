// ==UserScript==
// @name         HKU-New-Moodle-Helper
// @include      http://moodle.hku.hk/*
// @include      https://moodle.hku.hk/*
// @include      https://moodle.hku.hk/
// @match        https://moodle.hku.hk/my/courses.php
// @run-at 	 document-end
// @version      2024-08-23
// @description  course helper for HKU Moodle with new design
// @author       ArcaLunar
// @resource     mystyle https://cdn.jsdelivr.net/gh/ArcaLunar/hku-new-moodle-helper/website.css
// @resource     fontawesome https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css
// @icon         https://www.google.com/s2/favicons?sz=64&domain=hku.hk
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @namespace    https://github.com/ArcaLunar/hku-new-moodle-helper
// @license      CC BY-NC 4.0
// ==/UserScript==

//  #region 检查是否有本地数据，没有则初始化
(() => {
  if (
    !(
      GM_getValue("selectedCoursesList", { src: undefined }).src instanceof
      Array
    )
  ) {
    GM_setValue("selectedCoursesList", { src: [] });
  }
})();
GM_setValue("selectedCoursesList", { src: [] });
// #endregion

const request = (obj) => {
  return new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest();
    xhr.open(obj.method || "GET", obj.url);
    if (obj.headers) {
      Object.keys(obj.headers).forEach((key) => {
        xhr.setRequestHeader(key, obj.headers[key]);
      });
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response);
      } else {
        reject(xhr.statusText);
      }
    };
    xhr.onerror = () => reject(xhr.statusText);
    xhr.send(JSON.stringify(obj.body));
  });
};

(function () {
  // 加载样式
  GM_addStyle(GM_getResourceText("mystyle"));
  //   var url = window.location.href;
  // =====================
  // #region 监听 my/courses 页面变化
  const targetNode = document.getElementById("page-content");
  const config = { attributes: true, childList: true, subtree: true };

  const url = window.location.href;

  const callback = function (mutationsList, observer) {
    var viewPage = document.getElementsByClassName(
      "paged-content-page-container"
    );
    if (viewPage.length > 0) {
      console.log("View Page Detected");
      console.log(viewPage[0]);

      var coursePageList = viewPage[0].children;
      console.log("Course Page List Detected");
      console.log(coursePageList);

      // 检查是否加载完成
      if (coursePageList.length > 0) {
        var containsDivOnly = true;
        for (var i = 0; i < coursePageList.length; i++) {
          if (coursePageList[i].tagName != "DIV") {
            containsDivOnly = false;
            break;
          }
        }
        if (containsDivOnly) {
          console.log("Contains Div");
          initButton(coursePageList); // 初始化按钮
          initButtonAction(coursePageList); // 初始化按钮事件
        }
      }
    }
  };

  const observer = new MutationObserver(callback);
  observer.observe(targetNode, config);

  window.addEventListener("load", function () {
    const url = window.location.href;
    if (url == "https://moodle.hku.hk/") {
      console.log("rendering");
      renderMainPage();

    }
  });
  // #endregion

  // =====================
  // #region 添加按钮
  // coursePageList: 分页的课程列表
  function initButton(coursePageList) {
    observer.disconnect(); // 不观测，防止递归
    // 提取已选课程列表
    let selectedCoursesList = GM_getValue("selectedCoursesList", {
      src: [],
    }).src;
    console.log("Selected Courses List: ");
    console.log(selectedCoursesList);

    // 删掉所有 Button
    (() => {
      let allButtons = document.getElementsByClassName("moodle-helper");
      for (let i = allButtons.length - 1; i >= 0; i--) {
        allButtons[i].remove();
      }
    })();

    // 在哪一页
    var activeIndex = (() => {
      if (url.includes("my/courses.php")) {
        for (let i = 0; i < coursePageList.length; i++) {
          if (!coursePageList[i].classList.contains("hidden")) {
            return i;
          }
        }
      }
    })();

    console.log("Active Index: " + activeIndex);

    // 遍历当前页面的课程
    if (activeIndex != undefined && activeIndex != null) {
      var currentPage = coursePageList[activeIndex].children[0].children; // 课程 HTML 代码
      console.log("Current Page: ");
      console.log(currentPage);

      for (var i = 0; i < currentPage.length; i++) {
        let hasBeenAdded = false;
        var currentCourseId = currentPage[i].dataset.courseId;
        console.log(currentCourseId);

        // 检查是否已添加
        for (var j = 0; j < selectedCoursesList.length; j++) {
          if (currentCourseId == selectedCoursesList[j].courseId) {
            hasBeenAdded = true;
            break;
          }
        }

        let displayedInfo = currentPage[i].children[0].children[1]; // div.row // flex-column

        // 新增的按钮
        // 检查按钮是否已被添加
        var getButton = document.getElementById(`course${currentCourseId}`);
        // 判断是 remove 还是 add
        var initState = getButton == null || getButton == undefined;

        // 初始化按钮
        let newButton = document.createElement("button");
        newButton.id = `course${currentCourseId}`;
        newButton.classList.add("moodle-helper");
        newButton.classList.add("btn");
        newButton.relatedCourseId = currentCourseId;

        if (initState) {
          if (hasBeenAdded) {
            newButton.textContent = "Remove from this semester";
            newButton.action = "to-remove";
            newButton.classList.add("helper-remove-button");
            displayedInfo.appendChild(newButton);
          } else {
            newButton.textContent = "Add to this semester";
            newButton.action = "to-add";
            newButton.classList.add("helper-add-button");
            displayedInfo.appendChild(newButton);
          }
          currentPage[i].initComplete = true;
        }
      }
    }

    console.log("Button Init Complete");

    observer.observe(targetNode, config); // 重新激活
  }
  // #endregion

  /* #region 初始化按钮监听 */
  function initButtonAction(coursePageList) {
    observer.disconnect(); // 不观测，防止递归
    // 获取所有按钮
    let allButtons = document.getElementsByClassName("moodle-helper");
    let selectedCoursesList = GM_getValue("selectedCoursesList", {
      src: [],
    }).src;

    for (let i = 0; i < allButtons.length; i++) {
      allButtons[i].addEventListener("click", function () {
        if (this.action == "to-add") {
          addToSemester(this.relatedCourseId, selectedCoursesList);
          this.classList.remove("helper-add-button");
          this.classList.add("helper-remove-button");
          this.textContent = "Remove from this semester";
          this.action = "to-remove";
        } else if (this.action == "to-remove") {
          removeFromSem(this.relatedCourseId, selectedCoursesList);
          this.classList.remove("helper-remove-button");
          this.classList.add("helper-add-button");
          this.textContent = "Add to this semester";
          this.action = "to-add";
        }

        // 重新刷新
        let url = window.location.href;
        if (url == "https://moodle.hku.hk/") renderMainPage();
      });
    }

    observer.observe(targetNode, config); // 重新激活
  }
  /* #endregion */

  function removeFromSem(currentCourseId, selectedCoursesList) {
    console.log("removed");
    // 从课表删除
    var filteredList = [];
    for (var i = 0; i < selectedCoursesList.length; i++) {
      if (selectedCoursesList[i].courseId != currentCourseId) {
        filteredList.push(selectedCoursesList[i]);
      }
    }
    GM_setValue("selectedCoursesList", { src: filteredList });
  }

  function addToSemester(currentCourseId, selectedCoursesList) {
    console.log("added");
    // 添加到课表
    var info;
    if (window.location.href == "https://moodle.hku.hk/my/courses.php") {
      info = parseCourseInfo(currentCourseId);
    } else if (window.location.href == "https://moodle.hku.hk/") {
      info = parseCourseInfoMainPage(currentCourseId);
    }

    var currentCourse = {
      courseId: currentCourseId,
      courseInfoPack: info,
    };
    selectedCoursesList.push(currentCourse);
    GM_setValue("selectedCoursesList", { src: selectedCoursesList });
  }

  /* #region  主页渲染 */
  function renderMainPage() {
    const selectedCoursesList = GM_getValue("selectedCoursesList", {
      src: [],
    }).src;

    // 先全部清除
    (() => {
      let allCards = document.getElementsByClassName("moodle-helper-card");
      for (let i = allCards.length - 1; i >= 0; i--) {
        allCards[i].remove();
      }
    })();

    let mainPage = document.getElementById("frontpage-course-list");
    let checkCourseOfSemWrapper = document.getElementById(
      "course-of-sem-wrapper"
    );
    if (checkCourseOfSemWrapper != null) {
      checkCourseOfSemWrapper.remove();
    }
    // 插入 H2 标题
    let courseOfSemWrapper = document.createElement("div");
    courseOfSemWrapper.classList.add("course-of-sem-wrapper");
    courseOfSemWrapper.id = "course-of-sem-wrapper";
    let courseOfSemTitle = document.createElement("h2");
    courseOfSemTitle.textContent = "Courses of the Semester";
    courseOfSemTitle.id = "course-of-sem-title";
    courseOfSemWrapper.appendChild(courseOfSemTitle);

    // 插入选择的课程
    for (let i = 0; i < selectedCoursesList.length; i++) {
      let course = createCard(selectedCoursesList[i]);
      courseOfSemWrapper.appendChild(course);
    }

    // 插入到主页
    mainPage.insertBefore(courseOfSemWrapper, mainPage.firstChild);
    
    injectMainPageButton();
  }
  /* #endregion */

  /* #region  解析 my/courses.php 界面的课程信息 */
  function parseCourseInfo(courseId) {
    var viewPage = document.getElementsByClassName(
      "paged-content-page-container"
    );
    var coursePageList = viewPage[0].children;
    for (let i = 0; i < coursePageList.length; i++) {
      // 第一级
      for (let c = 0; c < coursePageList[i].children[0].children.length; c++) {
        // 第二级
        let currentCourse = coursePageList[i].children[0].children[c];
        if (currentCourse.dataset.courseId == courseId) {
          let ret = {};
          let row = currentCourse.children[0];
          // Image
          var courseImg =
            row.children[0].children[0].children[0].attributes["style"].value;
          ret.courseImg = courseImg;

          // Info
          let courseInfo = row.children[1];
          // Course Name
          var courseName = courseInfo.children[0];
          ret.courseName = courseName.outerHTML;

          // Category
          ret.courseCategory = courseInfo.children[1].outerHTML;
          ret.courseYear = courseInfo.children[2].outerHTML;

          // Summary
          var courseSummary = courseInfo.children[3];
          ret.courseSummary = courseSummary.outerHTML;

          console.log(ret);

          return ret;
        }
      }
    }
  }
  function parseCourseInfoMainPage(courseId) {
    let page = document.getElementsByClassName(
      "frontpage-course-list-enrolled"
    )[0];
    let courses = page.getElementsByClassName("coursebox");

    console.log(courses);

    for (let i = 0; i < courses.length; i++) {
      if (courseId == courses[i].dataset.courseid) {
        let course = courses[i];
        let ret = {};

        // class name
        let courseName = course.getElementsByClassName("coursename")[0];
        ret.courseName = courseName.outerHTML;

        // Image
        let courseImg =
          'background-image: url("' +
          course.getElementsByClassName("courseimage")[0].dataset.src +
          '");';
        ret.courseImg = courseImg;

        // Category
        let coursecat = course.getElementsByClassName("coursecat")[0].children;
        let category = coursecat[0].outerHTML;
        let year = coursecat[1].outerHTML;
        ret.courseCategory = category;
        ret.courseYear = year;

        // summary
        let summary = course.getElementsByClassName("no-overflow")[0];
        if (summary) {
          summary.classList.remove("no-overflow");
          summary.classList.add("summary");
        } else {
          summary = document.createElement("div");
        }
        ret.courseSummary = summary.outerHTML;

        console.log(ret);

        return ret;
      }
    }
  }
  /* #endregion */

  /* #region  主页的课程卡片 */
  function createCard(courseInfo) {
    let card = document.createElement("div");
    card.classList.add("moodle-helper-card");
    card.classList.add("coursebox");
    card.classList.add("list");
    card.classList.add("clearfix");
    card.courseId = courseInfo.courseId;
    card.id = `courseCard${courseInfo.courseId}`;
    card.type = "1";

    let content = document.createElement("div");
    content.classList.add("content");
    // 缩略图
    let alink = document.createElement("a");
    alink.href = `https://moodle.hku.hk/course/view.php?id=${courseInfo.courseId}`;
    let img = document.createElement("div");
    img.classList.add("courseimage");
    img.setAttribute("style", courseInfo.courseInfoPack.courseImg);
    img.dataset.src = courseInfo.courseInfoPack.courseImg
      .replace('background-image: url("', "")
      .replace('");', "");
    alink.appendChild(img);

    // Summary 部分
    let summary = document.createElement("div");
    summary.classList.add("summary");
    // 课程名称
    let h3 = document.createElement("h3");
    h3.classList.add("coursename");
    let h3a = document.createElement("a");
    h3a.innerHTML = courseInfo.courseInfoPack.courseName;
    h3.appendChild(h3a);
    // Category
    let category = document.createElement("div");
    category.classList.add("coursecat");
    category.classList.add("text-muted");
    let csp1 = document.createElement("span");
    csp1.innerHTML = courseInfo.courseInfoPack.courseCategory;
    category.appendChild(csp1);
    let csp2 = document.createElement("span");
    csp2.innerHTML = courseInfo.courseInfoPack.courseYear;
    category.appendChild(csp2);
    // CourseSummary
    let courseSummary = document.createElement("div");
    courseSummary.innerHTML = courseInfo.courseInfoPack.courseSummary;
    summary.appendChild(h3);
    summary.appendChild(category);
    summary.appendChild(courseSummary);

    // 移除课程
    let removeCourse = document.createElement("button");
    removeCourse.classList.add("btn");
    removeCourse.classList.add("moodle-helper");
    removeCourse.classList.add("helper-remove-button");
    removeCourse.textContent = "Remove from this semester";
    removeCourse.action = "to-remove";
    removeCourse.relatedCourseId = courseInfo.courseId;
    removeCourse.addEventListener("click", function () {
      removeFromSem(
        this.relatedCourseId,
        GM_getValue("selectedCoursesList", { src: [] }).src
      );
      let thiscard = document.getElementById(
        `courseCard${this.relatedCourseId}`
      );
      thiscard.remove();
      renderMainPage();
    });

    // enter course
    let enterCourse = document.createElement("div");
    enterCourse.classList.add("course-btn");
    let p1 = document.createElement("p");
    p1.appendChild(removeCourse);
    enterCourse.appendChild(p1);
    let p = document.createElement("p");
    let pa = document.createElement("a");
    pa.classList.add("btn");
    pa.classList.add("btn-primary");
    pa.href = `https://moodle.hku.hk/course/view.php?id=${courseInfo.courseId}`;
    pa.textContent = "Click to enter this course";
    p.appendChild(pa);
    enterCourse.appendChild(p);

    content.appendChild(alink);
    content.appendChild(summary);
    content.appendChild(enterCourse);

    card.appendChild(content);
    return card;
  }
  /* #endregion */

  /* #region 在主页插入按钮 */
  function injectMainPageButton() {
    let courseBoxes = document.getElementsByClassName("coursebox");
    let selectedCoursesList = GM_getValue("selectedCoursesList", {
      src: [],
    }).src;

    for (let i = 0; i < courseBoxes.length; i++) {
      if (courseBoxes[i].classList.contains("moodle-helper-card")) continue;
      let courseId = courseBoxes[i].dataset.courseid;
      let courseButton = courseBoxes[i].getElementsByClassName("course-btn")[0];

      // 移除已有按钮
      let buttonElement = courseBoxes[i].getElementsByClassName("moodle-helper");
      for (let j = buttonElement.length - 1; j >= 0; j--) {
        buttonElement[j].remove();
      }

      // 检查是否已添加
      var hasBeenAdded = false;
      for (let j = 0; j < selectedCoursesList.length; j++) {
        if (selectedCoursesList[j].courseId == courseId) {
          hasBeenAdded = true;
          break;
        }
      }

      // 如果已添加
      if (hasBeenAdded) {
        let removeButton = document.createElement("button");
        removeButton.classList.add("btn");
        removeButton.classList.add("moodle-helper");
        removeButton.classList.add("helper-remove-button");
        removeButton.textContent = "Remove from this semester";
        removeButton.action = "to-remove";
        removeButton.relatedCourseId = courseId;
        removeButton.addEventListener("click", function () {
          if (this.action == "to-add") {
            addToSemester(this.relatedCourseId, selectedCoursesList);
            this.classList.remove("helper-add-button");
            this.classList.add("helper-remove-button");
            this.textContent = "Remove from this semester";
            this.action = "to-remove";
          } else if (this.action == "to-remove") {
            removeFromSem(this.relatedCourseId, selectedCoursesList);
            this.classList.remove("helper-remove-button");
            this.classList.add("helper-add-button");
            this.textContent = "Add to this semester";
            this.action = "to-add";
          }

          // 重新刷新
          let url = window.location.href;
          if (url == "https://moodle.hku.hk/") renderMainPage();
        });
        courseButton.insertBefore(removeButton, courseButton.firstChild);
      } else {
        let addButton = document.createElement("button");
        addButton.classList.add("btn");
        addButton.classList.add("moodle-helper");
        addButton.classList.add("helper-add-button");
        addButton.textContent = "Add to this semester";
        addButton.action = "to-add";
        addButton.relatedCourseId = courseId;
        addButton.addEventListener("click", function () {
          if (this.action == "to-add") {
            addToSemester(this.relatedCourseId, selectedCoursesList);
            this.classList.remove("helper-add-button");
            this.classList.add("helper-remove-button");
            this.textContent = "Remove from this semester";
            this.action = "to-remove";
          } else if (this.action == "to-remove") {
            removeFromSem(this.relatedCourseId, selectedCoursesList);
            this.classList.remove("helper-remove-button");
            this.classList.add("helper-add-button");
            this.textContent = "Add to this semester";
            this.action = "to-add";
          }

          // 重新刷新
          let url = window.location.href;
          if (url == "https://moodle.hku.hk/") renderMainPage();
        });
        courseButton.insertBefore(addButton, courseButton.firstChild);
      }
    }
  }
  /* #endregion */
})();
