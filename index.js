// ==UserScript==
// @name         HKU-New-Moodle-Helper
// @include      http://moodle.hku.hk/*
// @include      https://moodle.hku.hk/*
// @include      https://moodle.hku.hk/
// @match        https://moodle.hku.hk/my/courses.php
// @run-at 	 	 document-end
// @version      2024-08-23
// @description  course helper for HKU Moodle with new design
// @author       ShandenLunaire
// @resource     mystyle https://cdn.jsdelivr.net/gh/AENeuro/HKU-Moodle-Helper@ede423d/myStyle.css
// @resource     fontawesome https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css
// @icon         https://www.google.com/s2/favicons?sz=64&domain=hku.hk
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
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
        newButton.classList.add("btn-primary");
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
        if (url == "https://moodle.hku.hk") renderMainPage();
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
    var currentCourse = {
      courseId: currentCourseId,
      courseInfoPack: parseCourseInfo(currentCourseId),
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
  }
  /* #endregion */

  // 解析 my/courses.php 界面的课程信息
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

          // Summary
          var courseSummary = courseInfo.children[3];
          ret.courseSummary = courseSummary.outerHTML;

          console.log(ret);

          return ret;
        }
      }
    }
  }

  function createCard(courseInfo) {
    let card = document.createElement("div");
    card.classList.add("moodle-helper-card");
    card.classList.add("coursebox");
    card.classList.add("list");
    card.classList.add("clearfix");
    card.courseId = courseInfo.courseId;
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
    // summary
    let summary = document.createElement("div");
    summary.classList.add("summary");
    let h3 = document.createElement("h3");
    h3.classList.add("coursename");
    let h3a = document.createElement("a");
    h3a.innerHTML = courseInfo.courseInfoPack.courseName;
    h3.appendChild(h3a);
    summary.appendChild(h3);

    // enter course
    let enterCourse = document.createElement("div");
    enterCourse.classList.add("course-btn");
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
})();
