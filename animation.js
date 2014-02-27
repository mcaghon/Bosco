/* global CanvasLoader:true, defaultCurrentChannelName:true  */

var ArticlesState = {
    currentChannel: defaultCurrentChannelName
};

function setDefaultState() {
    ArticlesState.lastOpenedArticle = null;
    ArticlesState.lastArticleWidth = 0;
    ArticlesState.lastArticleHeight = 0;
    ArticlesState.articleIsOpened = false;
    ArticlesState.changeArticleInProgress = false;
    ArticlesState.scrollingActive = false;
    ArticlesState.lastHScrollPos = 0;
    ArticlesState.articlesWidth = null;
    ArticlesState.articlesCount = 0;
    ArticlesState.articlesLoading = false;
    ArticlesState.articleController = null;
    ArticlesState.allArticlesLoaded = false;
    ArticlesState.jsSwitchedOff = false;
    ArticlesState.offset = 25;
    ArticlesState.animationSpeed = 500;
    ArticlesState.lastZIndex = 200;
    ArticlesState.articleNavigation = 0;
    ArticlesState.articleLoader = null;
    ArticlesState.arrowLoader = null;
    ArticlesState.filterOpened = false;
    ArticlesState.articles = [];
}

var ArticleController = function() {

};

ArticleController.prototype = {

    bindActions: function () {
        $(document).keydown(function (event) {
            if (ArticlesState.articleIsOpened && !ArticlesState.changeArticleInProgress) {
                switch (event.keyCode) {
                    case 27:
                        $("#article_navigation .close-button").click();
                        break;
                    case 37:
                        $(".arrows .left-arrow").click();
                        break;
                    case 39:
                        $(".arrows .right-arrow").click();
                        break;
                }
            }
        });


        this.removeBrokenArticles();
        this.setIndex();
        this.setArticleOpenAction();
        this.calcArticlesWidth();

        $("#hangline").width(ArticlesState.articlesWidth);

        if ($(window).scrollLeft() > 0) {
            $(".arrows .left-arrow").removeClass("disabled");
        }
        $("#article_navigation .close-button").click(function (event) {
            event.preventDefault();
            ArticlesState.articleIsOpened = false;
            ArticlesState.articleController.closeArticle();
        });
        $(".arrows .left-arrow").click(this.prevArticle);
        $(".arrows .right-arrow").click(this.nextArticle);

        ArticlesState.jsSwitchedOff = false;
    },

    unbindActions: function () {
        $(document).unbind();
        $('#hangline article').unbind();
        //init mouse wheel

        //$("#hangline").width(ArticlesState.articlesWidth);


        $("#article_navigation .close-button").unbind();
        $(".arrows .left-arrow").unbind();
        $(".arrows .right-arrow").unbind();

        ArticlesState.jsSwitchedOff = true;
    },

    hoverArticle: function(e) {
        $(this).prevAll().addClass('left');
        $(this).nextAll().addClass('right');
    },

    unhoverArticle: function(e) {
        $(this).prevAll().removeClass('left');
        $(this).nextAll().removeClass('right');
    },

    openArticle: function(currentArticle) {
        $('#hangline').stop();
        ArticlesState.scrollingActive = false;
        var correction = 0;

        if (!ArticlesState.articleIsOpened) {
            ArticlesState.articleIsOpened = true;
            $(".shadow_cover").show();
        }

        if (!ArticlesState.allArticlesLoaded && !currentArticle.next().length) {
            this.loadNewArticles();
        }
        if (ArticlesState.lastOpenedArticle !== null) {
            if (currentArticle.position().left > ArticlesState.lastOpenedArticle.position().left) {
                correction = 720 - ArticlesState.lastArticleWidth + 68;
            } else {
                correction = 10;
            }
            //if (ArticlesState.articleNavigation == 2) correction -= 40;
            this.closeArticle();
        }
        else {
            ArticlesState.lastHScrollPos = $(window).scrollLeft();
            $("#hangline").css("margin-left", -ArticlesState.lastHScrollPos + "px");
            $("#hangline").width($("#hangline").width() + 1000);
            $("#hangline").css('position', "fixed");
        }

        ArticlesState.lastOpenedArticle = currentArticle;
        ArticlesState.lastArticleWidth = currentArticle.width();
        ArticlesState.lastArticleHeight = currentArticle.height();

        currentArticle.width(ArticlesState.lastArticleWidth);
        currentArticle.height(ArticlesState.lastArticleHeight);

        var backColor = "#FFF";
        if ((currentArticle).hasClass("photo")) {
            backColor = "#222";
        } else if ((currentArticle).hasClass("gallery")) {
            backColor = "#222";
        } else if ((currentArticle).hasClass("video")) {
            backColor = "#222";
        } else if ((currentArticle).hasClass("snipit")) {
            backColor = "#7190D6";
        } else if ((currentArticle).hasClass("status")) {
            backColor = "#7190D6";
        }

        $(".openedArticleBox").css("background-color", backColor);

        if (backColor === "#FFF") {
            ArticlesState.articleLoader.setColor('#7195d6');
        } else {
            ArticlesState.articleLoader.setColor('#FFFFFF');
        }

        currentArticle.animate({
            width: 720, // TODO: add constant
            marginRight: 20
            }, ArticlesState.animationSpeed, this.initOpenedArticle);
        currentArticle.parent().animate({
            marginLeft: -currentArticle.position().left + $(window).width()/2 - 360 + correction
        }, ArticlesState.animationSpeed, function () {currentArticle.addClass('full');});

        if (!currentArticle.prev().length) {
            $(".arrows .left-arrow").addClass("disabled");
        } else {
            $(".arrows .left-arrow").removeClass("disabled");
        }

        if (ArticlesState.allArticlesLoaded) {
            if (!currentArticle.next().length) {
                $(".arrows .right-arrow").addClass("disabled");
            } else {
                $(".arrows .right-arrow").removeClass("disabled");
            }
        }
    },

    initOpenedArticle: function() {
        // show new loader
        $("#canvasloader-container").css('left', $(window).width() / 2 - 300);
        $("#canvasloader-container").css('top', "180px");
        ArticlesState.articleLoader.show();
        $(".openedArticleBox").width(720);
        $(".openedArticleBox").css("min-height", $(window).height());
        $("body").addClass("open");
        $("#article_navigation").css('display', "block");
        $(".openedArticleBox").css('opacity', "100");
        $(".openedArticleBox").css('left', $(window).width() / 2 - 360);

        ArticlesState.changeArticleInProgress = false;
        var tmplName = $("a", ArticlesState.lastOpenedArticle).attr("href");

        var tmplBuffer =  tmplName.split("/");
        var b = "";
        for(var i = 0; i < tmplBuffer.length;i++){
            if(i === tmplBuffer.length-2){
                b += tmplBuffer[i] + "_ajax/";
            }else{
                b += tmplBuffer[i] + "/";
            }
        }
        tmplName = b;

        $.get(tmplName, function(data){
                if (ArticlesState.articleIsOpened && !ArticlesState.changeArticleInProgress){
                    $(".close-button").css("left", "50%");
                    $(".close-button").css("opacity", "100");
                    $("#article_content").html(data);
                    $(".openedArticleBox").css('left', $(window).width() / 2 - 360);
                    //animate img in
                    $(".wrap-img").css('opacity', "100");
                    $(".wrap-img").width(720);
                    $(".wrap-img img").css('opacity', "100");
                    // hide loader (is this the right spot?)
                    $(".detail_ajax").css("min-height", $(window).height());
                    ArticlesState.articleLoader.hide();
                }
        });

        setTimeout(function(){
            $(".close-button").css("left", "50%");
            $(".close-button").css("opacity", "100");
        }, 1000);


    },

    closeArticle: function() {
        if (!ArticlesState.changeArticleInProgress) {
            ArticlesState.articleLoader.hide();
            $(window).scrollTop(0);

            var currentMargin = parseInt( $("#hangline").css("margin-left"), 10 );
            // animate OUT?
            $(".wrap-img").css('opacity', "0");
            $(".wrap-img").width(0);
            $(".wrap-img img").css('opacity', "0");
            // end OUT?
            $("#article_content").html('');

            if (!ArticlesState.articleIsOpened){
                $("body").removeClass("open").removeClass("click-next");
                $("#article_navigation").css('display', "none");
                $("#hangline").css('position', "");
                $(".close-button").css('left', "35%");
                $(".close-button").css('opacity', "0");
                $(".openedArticleBox").width(0);
                $(".openedArticleBox").css("min-height", $(window).height());
                $(".openedArticleBox").css('opacity', "0");
                $(".openedArticleBox").css("background-color", "#fff");
                ArticlesState.articleNavigation = 0;
            }

            ArticlesState.lastOpenedArticle.animate({
                    width: ArticlesState.lastArticleWidth,
                    height: ArticlesState.lastArticleHeight,
                    marginRight: 0
                }, ArticlesState.animationSpeed, function () {
                    $(this).removeClass("full box").css({width: "", height: ""}).css("margin-right", "");//.children().show()
                    $(".tooltip").show();
                    if (!ArticlesState.articleIsOpened) {
                        $('.shadow_cover').hide();
                    }
                });

            if (!ArticlesState.articleIsOpened) {
                var fixMargin = null;
                ArticlesState.articleController.calcArticlesWidth();

                if (currentMargin > 0) {
                    fixMargin = 0;
                } else if (currentMargin < $(window).width() - ArticlesState.articlesWidth) {
                    fixMargin = -(ArticlesState.articlesWidth - $(document).width());
                }

                if (fixMargin === null) {
                    fixMargin = currentMargin;
                }

                ArticlesState.lastOpenedArticle.parent().animate({
                    marginLeft: fixMargin
                }, ArticlesState.animationSpeed, function () {
                    $("#hangline").width($("#hangline").width() - 1000).css("margin-left", "0px");
                    $(window).scrollLeft(-currentMargin);
                    $("#hangline").css('margin-left', "");
                });

                if ($(window).scrollLeft() > 0) {
                    $(".arrows .left-arrow").removeClass("disabled");
                } else {
                    $(".arrows .left-arrow").addClass("disabled");
                }

                if (ArticlesState.allArticlesLoaded) {
                    if ($(window).scrollLeft() < $(document).width()-$(window).width()) {
                        $(".arrows .right-arrow").removeClass("disabled");
                    } else {
                        $(".arrows .right-arrow").addClass("disabled");
                    }
                }
            }
            ArticlesState.lastOpenedArticle = null;
        }
    },

    nextArticle: function(event) {
        event.preventDefault();
        if (!ArticlesState.changeArticleInProgress) {
            if (ArticlesState.articleIsOpened) {
                $("body").addClass("click-next");
                ArticlesState.lastOpenedArticle.next().click();
                ArticlesState.articleNavigation = 2;
            } else {
                $("html, body").animate({scrollLeft: $(document).scrollLeft() + $(window).width()/2}, 400);
            }
        }
    },

    prevArticle:function(event) {
        event.preventDefault();
        if (!ArticlesState.changeArticleInProgress) {
            if (ArticlesState.articleIsOpened) {
                $("body").removeClass("click-next");
                ArticlesState.lastOpenedArticle.prev().click();
                ArticlesState.articleNavigation = 1;
            } else {
                $("html, body").animate({scrollLeft: $(document).scrollLeft() - $(window).width()/2}, 400);
            }
        }
    },

    onMouseWhell: function (event) {
        if (!ArticlesState.filterOpened && ArticlesState.lastOpenedArticle === null && !ArticlesState.jsSwitchedOff) {

            if (!event) /* For IE. */ {
                event = window.event;
            }

            var delta = 0;
            if (!event) {
                event = window.event;
            }

            if (event.wheelDelta) {
                delta = event.wheelDelta/120;
                if (window.opera) {
                    delta = -delta;
                }
            } else if (event.detail) {
                delta = -event.detail/3;
            }

            if (delta) /*scroll speed can be changed here:*/ {
                $(window).scrollLeft($(window).scrollLeft() - delta*30);
            }

            if (event.preventDefault) {
                event.preventDefault();
                event.returnValue = false;
            }

        }
    },

    loadNewArticles: function () {
        if (!ArticlesState.articlesLoading && !ArticlesState.allArticlesLoaded){
            $(".arrows .right-arrow").addClass("preload");
            ArticlesState.arrowLoader.show();
            ArticlesState.articlesLoading = true;
            $.post("/blog/articles_ajax/",{offset: ArticlesState.offset, channel: ArticlesState.currentChannel}, function (data) {
                if ($.trim(data) !== '') {
                    $("#hangline").width($("#hangline").width() + 5000);
                    $('#hangline article').unbind();
                    var div = document.createElement('div');
                    div.innerHTML = data;
                    $(div.childNodes).appendTo("#hangline");

                    ArticlesState.articleController.removeBrokenArticles();
                    ArticlesState.articleController.setIndex();
                    ArticlesState.articleController.setArticleOpenAction();
                    ArticlesState.articleController.calcArticlesWidth();

                    $("#hangline").width(ArticlesState.articlesWidth);
                    ArticlesState.offset += 15;
                }
                else {
                    ArticlesState.allArticlesLoaded = true;
                    if (ArticlesState.articleIsOpened) {
                        if (!ArticlesState.lastOpenedArticle.next().length) {
                            $(".arrows .right-arrow").addClass("disabled");
                        } else {
                            $(".arrows .right-arrow").removeClass("disabled");
                        }
                    } else {
                        if ($(window).scrollLeft() < $(document).width()-$(window).width()) {
                            $(".arrows .right-arrow").removeClass("disabled");
                        } else {
                            $(".arrows .right-arrow").addClass("disabled");
                        }
                    }
                }

                $(".arrows .right-arrow").removeClass("preload");
                ArticlesState.arrowLoader.hide();
                ArticlesState.articlesLoading = false;
            });
        }
    },

    calcArticlesWidth: function () {
        var totalCalc = 0;
           var totalWidth = 0;
            $("#hangline > article").each(function() {
                if ($(this).width()) {
                    totalWidth += $(this).width() - 40;
                }
                totalCalc++;
               });
           ArticlesState.articlesWidth = totalWidth;
           ArticlesState.articlesCount = totalCalc;
    },

    removeBrokenArticles: function() {
        $('#hangline article').each(function(ind) {
            if (!$("a", $(this)).length) {
                $(this).remove();
            }
        });
    },

    setArticleOpenAction: function () {
        $('#hangline article').each(function(ind) {
            $(this).mouseover(ArticlesState.articleController.hoverArticle);
            $(this).mouseout(ArticlesState.articleController.unhoverArticle);
            ArticlesState.articles.push($(this));
            $(this).click(function (event) {
                event.preventDefault();
                ArticlesState.articleController.openArticle($(this));
                ArticlesState.changeArticleInProgress = true;
            });
        });
    },

    onResize: function (event) {
        if (ArticlesState.jsSwitchedOff) {
            if ($(window).width() >= 960) {
                ArticlesState.jsSwitchedOff = false;
                ArticlesState.articleController.bindActions();
            }
        }
        else {
            if ($(window).width() >= 960) {
                if (ArticlesState.articleIsOpened) {
                    var diff = parseInt( $(".openedArticleBox").css('left'), 10 );
                    $(".openedArticleBox").css("-webkit-transition", "none").
                        css("-moz-transition", "none").
                        css("-o-transition", "none").
                        css("-ms-transition", "none").
                        css("transition", "none");
                    $(".openedArticleBox").css('left', $(window).width() / 2 - 360);
                    $(".openedArticleBox").css("-webkit-transition", "").
                        css("-moz-transition", "").
                        css("-o-transition", "").
                        css("-ms-transition", "").
                        css("transition", "");
                    diff -= $(window).width() / 2 - 360;
                    diff /= 2;
                    $("#hangline").css("margin-left", parseInt( $("#hangline").css("margin-left"), 10 ) - diff + "px");
                }
            }
            else {
                if (ArticlesState.articleIsOpened) {
                    var tmp_speed = ArticlesState.animationSpeed;
                    ArticlesState.animationSpeed = 0;
                    $("#article_navigation .close-button").click();
                    ArticlesState.animationSpeed = tmp_speed;
                }
                ArticlesState.articleController.unbindActions();
            }
        }
    },

    setIndex: function () {
        ArticlesState.lastZIndex = 200;
        $('#hangline article').each(
            function(index){
                $(this).css({
                    'z-index': ArticlesState.lastZIndex--
                });
                if (ArticlesState.lastZIndex === 0) {
                    ArticlesState.lastZIndex = 200;
                }
            }
        );
    }

};

function initBlog() {
    setDefaultState();
    ArticlesState.articleController = new ArticleController();
        $(window).mousedown(function(){
                if (ArticlesState.jsSwitchedOff && $(window).width() >= 960) {
                                ArticlesState.articleController.onResize();
                }
        });

        //init mouse wheel
        if (window.addEventListener) {
            window.addEventListener('DOMMouseScroll', ArticlesState.articleController.onMouseWhell, false);
            window.onmousewheel = document.onmousewheel = ArticlesState.articleController.onMouseWhell;
        }

        $(window).scroll(function(){
                if (ArticlesState.jsSwitchedOff && $(window).width() >= 960) {
                        ArticlesState.articleController.onResize();
                }
        if (!ArticlesState.articleIsOpened && !ArticlesState.jsSwitchedOff) {
                if ($(window).scrollLeft() > 0) {
                    $(".arrows .left-arrow").removeClass("disabled");
                } else {
                    $(".arrows .left-arrow").addClass("disabled");
                }

                if (ArticlesState.allArticlesLoaded) {
                    if ($(window).scrollLeft() < $(document).width()-$(window).width()) {
                        $(".arrows .right-arrow").removeClass("disabled");
                    } else {
                        $(".arrows .right-arrow").addClass("disabled");
                    }
                } else if ($(window).scrollLeft() + $(window).width()/4 > $(document).width()-$(window).width()) {
                    ArticlesState.articleController.loadNewArticles();
                }
        }
    });

        if ($(window).width() >= 960) {
            ArticlesState.articleController.bindActions();
        } else {
            ArticlesState.jsSwitchedOff = true;
        }

        //Loaders
        ArticlesState.articleLoader = new CanvasLoader('canvasloader-container');
        ArticlesState.articleLoader.setColor('#7195d6');
        ArticlesState.articleLoader.setShape('square');
        ArticlesState.articleLoader.setDiameter(600);
        ArticlesState.articleLoader.setDensity(400);
        ArticlesState.articleLoader.setRange(0.6);
        if ($.browser.msie && parseInt($.browser.version, 10) < 9) {
            ArticlesState.articleLoader.setSpeed(2);
        } else {
            ArticlesState.articleLoader.setSpeed(9);
        }
        ArticlesState.articleLoader.setFPS(36);

        ArticlesState.arrowLoader = new CanvasLoader('arrow-loader');
        ArticlesState.arrowLoader.setColor('#ffffff');
        ArticlesState.arrowLoader.setShape('square');
        ArticlesState.arrowLoader.setDiameter(24);
        ArticlesState.arrowLoader.setDensity(500);
        ArticlesState.arrowLoader.setRange(0.6);
        if ($.browser.msie && parseInt($.browser.version, 10) < 9) {
            ArticlesState.arrowLoader.setSpeed(2);
        } else {
            ArticlesState.arrowLoader.setSpeed(9);
        }

        ArticlesState.arrowLoader.setFPS(36);

        $(window).resize(ArticlesState.articleController.onResize);
}

$(document).ready(function() {
    initBlog();

        // filter
    $(".filter-bt").click(function(){
        $("body").addClass("body-filter-show");
                ArticlesState.filterOpened = true;
        return false;
    });
    $(".filter-close").click(function(){
        $("body").removeClass("body-filter-show");
                ArticlesState.filterOpened = false;
    });

    $("body").get(0).addEventListener('touchmove', function(e){
        if ($("body").hasClass("body-filter-show")) {
            if ($(e.target).closest(".meta").length) {
                e.preventDefault();
            }
        }
        if (!$(e.target).closest(".meta").length && !$(e.target).closest(".filter").length) {
            e.preventDefault();
        }
    });

    $(".filter").each(function(){
        var par = $(this),
            items = $(".filter-i LI", this),
            header = $("H1.header-title").wrapInner("<span class='header-title-base'></span>"),
            header_type = $("<span class='header-title-type'></span>").appendTo(header),
            header_subtitle = $(".header-subtitle");

        items.click(function(){
            if (!$(this).hasClass("filter-i-cur")) {
                $(this).addClass("filter-i-cur").siblings().removeClass("filter-i-cur");

                if ($(this).text() !== "All") {
                    header_type.text(" " + $(this).text());
                    $("body").addClass("body-filter-on");
                }
                else {
                    header_type.text("");
                    $("body").removeClass("body-filter-on");
                }

                header_subtitle.text($(this).attr("data-txt"));
                $("body").removeClass("body-filter-show");
                //$(".meta").css("height", "auto");
                $("body").addClass("body-filter-working");
                ArticlesState.currentChannel = $(this).attr("data-value");
                    var current_filter = $(this).attr("data-link").toLowerCase();

                    if (current_filter === 'all') {
                        current_filter = '';
                    }

                    if (window.history && window.history.pushState) {
                        window.history.pushState(null, null, window.location.protocol + "//" + window.location.host + "/blog/" + current_filter);
                    }

                    $.post("/blog/index_ajax", {channel: ArticlesState.currentChannel}, function (data) {
                        $(".left-arrow").addClass("disabled");
                        $(".right-arrow").removeClass("preload").removeClass("disabled");
                        $("#content").html(data);
                    if ((navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i))) {

                    $(window).scrollTop(0);
                    //$(".meta").css("height", "99.99%");
                    }
                    initBlog();
                    $("body").removeClass("body-filter-working");
                });
            }
            ArticlesState.filterOpened = false;
        });
    });
});
