var languageId;
var languageData;
var currentServiceVisited;
var currentServiceId;
var suspendDataList = [];
var currentVideoId;
var milestoneFlag = true;

$(document).ready(function() {
    $('#bikeSound')[0].pause();
    $('#introVideo1').on("ended", firstVideoEnd);
    $(".goButton").on("click", goButtonClicked);
    $(".mileSton").on("click", mileStoneClicked);
    $(".milestoneText").on("click", mileStoneClicked);
    $(".videoLink").on("click", onVideoClicked);
    $("#translator").on("ended", lastVideoEnd);
    $("#lastVideoEndExit").on("click", onExitVideo);
    $(".exit").on("click", openConfirmBox);

    /******* Test Mob******************
    $(".exit-window").on("click", openDetailBox);
    $(".windowClose").on("click", onWindowCloseOkClicked);
    /******* Test Mob*******************/

    $(".yesButtonConfirm").on("click", onExitVideo);
    $(".noButtonConfirm").on("click", playVideo);
    $(".backButton").on("click", backButtonClicked);
    $(".congratsOk").on("click", onCongratsOkClicked);
    $(".yesButton").on("click", onResume);
    $(".noButton").on("click", onRestart);

});

/******* Test Mob*******************/
function openDetailBox(event){
    $('.popup-overlay-window-close').removeClass('display-none');
    var suspendData =  setSuspendDataForAllServices();
    SCORM_SetSuspendData(suspendData.toString());

}

function onWindowCloseOkClicked(){
    $('.popup-overlay-window-close').addClass('display-none');
    window.close();
}
/******* Test Mob*******************/


function firstVideoEnd(event) {
    $(".initialvideo").addClass('display-none');
    var introVideo = $("#introVideo1")[0];
    introVideo.pause();
    $(".languageSelect").removeClass('display-none');
}

function goButtonClicked() {
    //alert("Go buttton clicked..");
    /*$(".initialvideo").addClass('display-none');
    languageId = $('#listBox1').find("option:selected").val();*/
    languageId = 'En';
    if (languageId == undefined || languageId == "select") {
        alert("Please select language.");
        return;
    }
    setLanguageData();
    //parent.SCORM_SetLanguage(languageId);
    setVideos();
    setMileStoneText();
    $("#initialPage").addClass('display-none');
    $(".mileStones").removeClass('display-none');
    document.getElementById('bikeSound').play();
}

function setLanguageData() {
    $.each(Data, function(index, item) {
        if (item.language == languageId) {
            languageData = item;
        }
    });
}

function setMileStoneText() {
    var services = languageData.services;
    for (var i = 0; i < services.length; i++) {
        var j = i + 1;
        var service = services[i].text;
        $(".milesText0" + j).append("<p>" + service + "</p>");
    }

    $(".instructionText").append(languageData.milestoneText);
}

function setVideos() {
    var strips = languageData.strips;
    var j = 1;

    for (var i = 0; i < strips.length; i++) {
        var j = i + 1;
        $("#video" + j).find('.videoText').html(strips[i].text);
    }
    $(".instructionText01").html(languageData.procedureText);
    $(".backButton").html(languageData.backButton);
    var popupOverlay = $(".popup-overlay");
    popupOverlay.find("h4").html(languageData.exitButtonHeader);
    popupOverlay.find("button").html(languageData.exitButton);
    popupOverlay.find(".close-text").html(languageData.exitButtonFooter);
}

function onResume() {
    $(".popup-overlay-suspend").addClass("display-none");
    var getSuspendData = fnGetSuspendData();
    if (getSuspendData == "" || getSuspendData == undefined || getSuspendData == null) {
        $(".introVideo").removeClass('display-none');
    } else {
        addDataToModel(getSuspendData);
    }
}

function onRestart() {
    $(".popup-overlay-suspend").addClass("display-none");
    SCORM_SetSuspendData("");
    $(".introVideo").removeClass('display-none');
}


function mileStoneClicked(event) {
    if (milestoneFlag == false) return;
    var animNum = $(event.currentTarget).attr("data-id");
    milestoneFlag = false;
    $(".Bike-anim").addClass('bikeMoves' + animNum);
    $(".milesText0" + animNum).addClass("mileTextVisited");

    addGrayText(animNum);
    $('#bikeSound')[0].play();
    showTheServiceTicks(animNum);
    setTimeout(function() {
        $(".mileStones").addClass('display-none');
        setVideos();
        showTheAppropriatVideo();
    }, 3000);
}

function showTheAppropriatVideo() {
    var videoShow = languageData.services[currentServiceId].videoShown;
    $(".videoLink").removeClass('display-none');
    for (var i = 1; i <= languageData.strips.length; i++) {
        if ($.inArray(i, videoShow) == -1) {
            $("#video" + i).addClass('display-none');
        }
    }
    setAlternateStripColor(videoShow);

    $(".videosLinks").removeClass('display-none');
}

function setAlternateStripColor(videoShow) {
    var i = 1;
    $("#video" + videoShow[0]).find("button").addClass("striplink");
    var flag = true
    while (i <= videoShow.length) {
        if (flag == true) {
            $("#video" + videoShow[i]).find("button").addClass("striplink02");
            $("#video" + videoShow[i + 1]).find("button").addClass("striplink02");
            flag = false;
        } else {
            $("#video" + videoShow[i]).find("button").addClass("striplink");
            $("#video" + videoShow[i + 1]).find("button").addClass("striplink");
            flag = true;
        }
        i = i + 2;
    }
}

function showTheServiceTicks(serviceNum) {
    $('.tick').empty();
    $(".videoLink").removeClass('visited');
    var serviceVisited = languageData.services[serviceNum - 1].visitedItemList;
    for (var i = 0; i < serviceVisited.length; i++) {
        addTickToVisited(serviceVisited[i]);
    }
}

function addGrayText(serviceId) {
    var services = languageData.services;
    var servicesNum = parseInt(serviceId) - 1;
    var service = services[servicesNum].text;
    currentServiceVisited = services[servicesNum].visitedItemList;
    currentServiceId = servicesNum;
    var getMileText = service.split("<br>");
    var textGray = '<div class="textGray' + serviceId + ' textGray"><strong><p>' + getMileText[0] + getMileText[1] + getMileText[2] + '</p></strong></div>';
    $(".textGrayContainer").append(textGray);
}

function isTextClicked(event) {
    var $text = $(event);
    if ($text.parent().hasClass('milesText')) {
        $text.addClass("mileTextVisited");
    }
}

function onVideoClicked(event) {
    var currentVideo = $(event.currentTarget).attr("id");
    var num = currentVideo.split("video")[1];
    $(".videosLinks").addClass('display-none');
    currentVideoId = num;
    $.each(languageData.strips, function(index, item) {
        if (item.id == num) {
            $("#translator").attr("src", item.url);
            $(".navigation").append("<span class='nav-text'>" + item.text + "</span>");
        }
    });

    $(".translator").removeClass('display-none');
    $('.navigation').addClass('navigation-video');
    var vid = $("#translator")[0];
    vid.play();
}

function videoTimeUpdate(event) {
    var vid = $("#translator")[0];
    vid.setAttribute("controls", "controls");
}

function addTickToVisited(num) {
    var currentVideo = $("#video" + num);
    var flag = false;
    var videoToBeShown = languageData.services[currentServiceId].videoShown;
    var visitedLength = currentServiceVisited.length;
    flag = true;
    if ($.inArray(num, currentServiceVisited) == -1) {
        currentServiceVisited.push(num);
    }
    if (flag == true) {
        var tick = currentVideo.find(".tick");
        $(tick).html("&#10004;");
        currentVideo.addClass('visited');
        checkForFinalCompletion(videoToBeShown);
    }
}

function checkForFinalCompletion(videoToBeShown) {
    var services = languageData.services;
    var completedCount = 0;
    $.each(services, function(index, item) {
        if (item.videoShown.length == item.visitedItemList.length) {
            completedCount++;
        }
    });
    
    if (completedCount == services.length) {
        SCORM_SetScore(100);
    }
}

function checkIfAllVideosVisited() {
    if(languageData.services[currentServiceId].completedOnce) return;
    var videoToBeShown = languageData.services[currentServiceId].videoShown;
    var popupCongratsOverlay = $(".popup-overlay-congrats");
    var isIdentical = checkIfArraySimilar(videoToBeShown);
    if (isIdentical == true) {
        console.log("All strips visited...");
        languageData.services[currentServiceId].isComplete = true;
        if ($.inArray(currentServiceId + 1, languageData.servicesCompleted) == -1) {
            languageData.servicesCompleted.push(currentServiceId + 1);
            var mileStoneText = languageData.services[currentServiceId].text;
            var wholeSentence = mileStoneText.split("<br>");
            if (!popupCongratsOverlay.find(".Popup-wrap .congratulations_text").length) {
                popupCongratsOverlay.find(".Popup-wrap").prepend("<h4 class='congratulations_text'>Congratulations! <br> You have completed " + wholeSentence[0] + wholeSentence[1] + wholeSentence[2] + " milestone.</h4>");

            } else {
                popupCongratsOverlay.find(".Popup-wrap .congratulations_text").html("Congratulations! <br> You have completed " + wholeSentence[0] + wholeSentence[1] + wholeSentence[2] + " milestone.");
            }
            popupCongratsOverlay.removeClass('display-none');
        }
    }
}

function checkIfArraySimilar(videoToBeShown) {
    var isIdentical = videoToBeShown.length == currentServiceVisited.length;
    return isIdentical;
}

function enableService(nextMileStone) {
    $("#mileStone" + nextMileStone).removeClass("mileStonDisable").css("cursor", "pointer");
    $(".milesText0" + nextMileStone).removeClass("mileStonDisable").css("cursor", "pointer");

}

function onCongratsOkClicked() {
    $(".popup-overlay-congrats").addClass('display-none');
}

function backButtonClicked() {
    milestoneFlag = true;
    $(".videosLinks").addClass('display-none');
    $(".milesText").children().removeClass('mileTextVisited');
    $(".mileStones").removeClass('display-none');
    $('.navigation').removeClass('navigation-video');
    $(".videoLink").find("button").removeClass('striplink').removeClass('striplink02');

    var i = 1;
    while (i <= languageData.services.length) {
        if ($(".Bike-anim").hasClass('bikeMoves' + i)) {
            $(".Bike-anim").removeClass('bikeMoves' + i);
        }
        i++;
    }
    $(".textGrayContainer").empty();
    document.getElementById('bikeSound').play();
    checkIfAllVideosVisited();
}

function lastVideoEnd() {
    addTickToVisited(currentVideoId);
    $(".popup-overlay").removeClass('display-none');
}

function onExitVideo() {
    $("#translator").attr("src", "");
    $(".translator").addClass('display-none');
    $(".videosLinks").removeClass('display-none');
    $(".popup-overlay").addClass('display-none');
    $('.navigation').removeClass('navigation-video');
    $(".popup-overlay-confirm").addClass('display-none');
    $(".nav-text").remove();
}

function openConfirmBox() {
    var vid = $("#translator")[0];
    vid.pause();
    $(".popup-overlay-confirm").removeClass('display-none');
}

function playVideo() {
    $(".popup-overlay-confirm").addClass('display-none');
    var vid = $("#translator")[0];
    vid.play();
}

function setSuspendDataForAllServices() {
    if (suspendDataList.length == 0) {
        suspendDataList.push(languageData.language);
        var services = languageData.services;
        $.each(services, function(index, item) {
            console.log(item.visitedItemList);
            console.log(item.videoShown);
            if (item.isComplete || item.visitedItemList.length == item.videoShown.length) {
                suspendDataList.push(true);
                suspendDataList.push(index);
            }
        });
        $.each(services, function(index, item) {
            {
                if (item.visitedItemList.length != 0 && item.isComplete != true) {
                    suspendDataList.push("---");
                    suspendDataList.push(index);
                    $.merge(suspendDataList, item.visitedItemList);
                }
            }
        });
    }
    suspendDataList.push(currentServiceId);
    return suspendDataList;
}

function addDataToModel(suspendData) {
    var arrayData = suspendData.split(",");
    languageId = arrayData[0];
    setLanguageData();
    var services = languageData.services;
    var suspendDataLength = arrayData.length;
    var suspendIndex;
    $(".videoLink").removeClass('visited');

    if (suspendDataLength != 1) {
        for (var i = 1; i <= suspendDataLength; i++) {
            if (arrayData[i] === "true") {
                var next = i + 1;
                var j = arrayData[next];
                var serviceNumber = parseInt(j) + 1;
                $(".mileStone" + serviceNumber).removeClass('mileStonDisable');
                services[j].isComplete = true;
                languageData.servicesCompleted.push(serviceNumber);
                services[j].visitedItemList = services[j].videoShown;
                services[j].completedOnce = true;
            } 
        }
        currentServiceId = arrayData[suspendDataLength - 1];
        currentServiceVisited = services[currentServiceId].visitedItemList;
        reloadPage();
        addAllTheTicks(arrayData);
        currentServiceId = arrayData[suspendDataLength - 1];
        currentServiceVisited = services[currentServiceId].visitedItemList;
        var currentMileStone = parseInt(currentServiceId) + 1;
        showTheServiceTicks(currentMileStone);

    } else {
        setVideos();
        showTheAppropriatVideo();
        setMileStoneText();
        $("#initialPage").addClass('display-none');
        $(".videosLinks").addClass('display-none');
        $(".mileStones").removeClass('display-none');
    }
}


function reloadPage() {
    $(".textGrayContainer").empty();
    setVideos();
    showTheAppropriatVideo();
    setMileStoneText();
    var currentMileStone = parseInt(currentServiceId) + 1;
    addGrayText(currentMileStone);
    $("#initialPage").addClass('display-none');
    $(".mileStones").addClass('display-none');
}

function addTicksToSpecific(suspendIndex, arrayData) {
    var arrayDataLength = arrayData.length - 2;
    if (suspendIndex <= arrayData.length && arrayData[suspendIndex] != "---") {
        for (var i = suspendIndex; i <= arrayDataLength; i++) {
            if (arrayData[i] == "---") {
                break;
            }
            if (arrayData[i] != "" && arrayData[i] != undefined) {
                addTickToVisited(parseInt(arrayData[i]));
            }
        }
    }
}

function addAllTheTicks(arrayData) {
    var arrayDataLength = arrayData.length - 1;
    for (var i = 1; i < arrayDataLength; i++) {
        if (arrayData[i] == "---") {
            currentServiceId = arrayData[i + 1];
            currentServiceVisited = languageData.services[currentServiceId].visitedItemList;
            suspendIndex = i + 2;
            addTicksToSpecific(suspendIndex, arrayData);
        }
    }
}